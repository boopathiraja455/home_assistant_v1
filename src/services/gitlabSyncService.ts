import { Stock, Task, Reminder, DailyMenu, FoodMenu, Settings } from '../types';

interface GitLabConfig {
  token: string;
  project_id: string;
  branch: string;
  enabled: boolean;
  auto_sync_interval: number;
  last_sync: string;
  backup_retention_days: number;
}

interface SyncData {
  timestamp: string;
  version: string;
  data: {
    stock: Stock;
    tasks: Task[];
    reminders: Reminder[];
    daily_menus: DailyMenu[];
    food_menu: FoodMenu;
    settings: Settings;
  };
}

export class GitLabSyncService {
  private config: GitLabConfig | null = null;
  private syncInterval: NodeJS.Timeout | null = null;

  async loadConfig(): Promise<GitLabConfig> {
    try {
      const response = await fetch('/config/gitlab.json');
      const config = await response.json();
      this.config = config;
      return config;
    } catch (error) {
      console.error('Error loading GitLab config:', error);
      return {
        token: '',
        project_id: '',
        branch: 'main',
        enabled: false,
        auto_sync_interval: 5,
        last_sync: '',
        backup_retention_days: 60
      };
    }
  }

  async updateConfig(config: GitLabConfig): Promise<void> {
    this.config = config;
    // In a real implementation, you'd save this to the config file
    // For now, we'll just update the in-memory config
    
    if (config.enabled && config.auto_sync_interval > 0) {
      this.startAutoSync();
    } else {
      this.stopAutoSync();
    }
  }

  private startAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    if (!this.config?.enabled) return;

    const intervalMs = this.config.auto_sync_interval * 60 * 1000; // Convert minutes to milliseconds
    
    this.syncInterval = setInterval(async () => {
      try {
        await this.pushData();
        console.log('Auto-sync completed successfully');
      } catch (error) {
        console.error('Auto-sync failed:', error);
      }
    }, intervalMs);

    console.log(`Auto-sync started with ${this.config.auto_sync_interval} minute interval`);
  }

  private stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Auto-sync stopped');
    }
  }

  async pushData(): Promise<boolean> {
    if (!this.config?.enabled || !this.config.token || !this.config.project_id) {
      throw new Error('GitLab sync not configured');
    }

    try {
      // Collect all app data
      const syncData: SyncData = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        data: {
          stock: JSON.parse(localStorage.getItem('stock') || '{"groceries":{},"vegetables":{}}'),
          tasks: JSON.parse(localStorage.getItem('tasks') || '[]'),
          reminders: JSON.parse(localStorage.getItem('reminders') || '[]'),
          daily_menus: JSON.parse(localStorage.getItem('daily_menus') || '[]'),
          food_menu: JSON.parse(localStorage.getItem('food_menu') || '{"breakfast":[],"addons":[],"lunch":[],"dinner":[],"snacks":[]}'),
          settings: JSON.parse(localStorage.getItem('settings') || '{}')
        }
      };

      const fileName = `backup/smart-assistant-backup-${syncData.timestamp.replace(/[:.]/g, '-')}.json`;
      const content = JSON.stringify(syncData, null, 2);
      const encodedContent = btoa(unescape(encodeURIComponent(content)));

      // Check if file already exists
      const existingFile = await this.getFile(fileName);
      
      const apiUrl = `https://gitlab.com/api/v4/projects/${this.config.project_id}/repository/files/${encodeURIComponent(fileName)}`;
      
      const requestBody = {
        branch: this.config.branch,
        content: encodedContent,
        commit_message: `📱 Smart Assistant Data Backup - ${new Date().toLocaleString()}`,
        encoding: 'base64'
      };

      const method = existingFile ? 'PUT' : 'POST';
      
      const response = await fetch(apiUrl, {
        method,
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GitLab API error: ${response.status} - ${errorText}`);
      }

      // Update last sync time
      this.config.last_sync = syncData.timestamp;
      
      // Clean up old backups
      await this.cleanupOldBackups();

      console.log(`Data pushed to GitLab successfully: ${fileName}`);
      return true;

    } catch (error) {
      console.error('Error pushing data to GitLab:', error);
      throw error;
    }
  }

  async pullData(): Promise<SyncData | null> {
    if (!this.config?.enabled || !this.config.token || !this.config.project_id) {
      throw new Error('GitLab sync not configured');
    }

    try {
      // Get list of backup files
      const backupFiles = await this.getBackupFiles();
      
      if (backupFiles.length === 0) {
        console.log('No backup files found');
        return null;
      }

      // Sort by timestamp and get the latest
      const latestFile = backupFiles.sort((a, b) => 
        new Date(b.name.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/)?.[1] || '').getTime() - 
        new Date(a.name.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/)?.[1] || '').getTime()
      )[0];

      // Get the file content
      const fileContent = await this.getFile(latestFile.name);
      
      if (!fileContent) {
        throw new Error('Failed to retrieve backup file content');
      }

      const syncData: SyncData = JSON.parse(atob(fileContent.content));
      
      // Confirm with user before restoring
      const confirmRestore = window.confirm(
        `Restore data from backup created on ${new Date(syncData.timestamp).toLocaleString()}?\n\n` +
        `This will overwrite all current local data!`
      );

      if (confirmRestore) {
        // Restore data to localStorage
        localStorage.setItem('stock', JSON.stringify(syncData.data.stock));
        localStorage.setItem('tasks', JSON.stringify(syncData.data.tasks));
        localStorage.setItem('reminders', JSON.stringify(syncData.data.reminders));
        localStorage.setItem('daily_menus', JSON.stringify(syncData.data.daily_menus));
        localStorage.setItem('food_menu', JSON.stringify(syncData.data.food_menu));
        localStorage.setItem('settings', JSON.stringify(syncData.data.settings));

        console.log('Data restored from GitLab successfully');
        
        // Reload the page to reflect changes
        window.location.reload();
        
        return syncData;
      }

      return null;

    } catch (error) {
      console.error('Error pulling data from GitLab:', error);
      throw error;
    }
  }

  private async getBackupFiles(): Promise<any[]> {
    if (!this.config) return [];

    try {
      const apiUrl = `https://gitlab.com/api/v4/projects/${this.config.project_id}/repository/tree?path=backup&ref=${this.config.branch}`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${this.config.token}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return []; // Backup directory doesn't exist yet
        }
        throw new Error(`Failed to get backup files: ${response.status}`);
      }

      const files = await response.json();
      return files.filter((file: any) => file.name.includes('smart-assistant-backup-'));

    } catch (error) {
      console.error('Error getting backup files:', error);
      return [];
    }
  }

  private async getFile(filePath: string): Promise<any> {
    if (!this.config) return null;

    try {
      const apiUrl = `https://gitlab.com/api/v4/projects/${this.config.project_id}/repository/files/${encodeURIComponent(filePath)}?ref=${this.config.branch}`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${this.config.token}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // File doesn't exist
        }
        throw new Error(`Failed to get file: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Error getting file:', error);
      return null;
    }
  }

  private async cleanupOldBackups(): Promise<void> {
    if (!this.config) return;

    try {
      const backupFiles = await this.getBackupFiles();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.backup_retention_days);

      const filesToDelete = backupFiles.filter(file => {
        const timestampMatch = file.name.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
        if (!timestampMatch) return false;
        
        const fileDate = new Date(timestampMatch[1].replace(/-/g, ':').replace('T', ' '));
        return fileDate < cutoffDate;
      });

      for (const file of filesToDelete) {
        await this.deleteFile(file.name);
        console.log(`Deleted old backup: ${file.name}`);
      }

    } catch (error) {
      console.error('Error cleaning up old backups:', error);
    }
  }

  private async deleteFile(filePath: string): Promise<void> {
    if (!this.config) return;

    try {
      const apiUrl = `https://gitlab.com/api/v4/projects/${this.config.project_id}/repository/files/${encodeURIComponent(filePath)}`;
      
      await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          branch: this.config.branch,
          commit_message: `🗑️ Cleanup old backup: ${filePath}`
        })
      });

    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.config?.token || !this.config.project_id) {
      return false;
    }

    try {
      const apiUrl = `https://gitlab.com/api/v4/projects/${this.config.project_id}`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${this.config.token}`
        }
      });

      return response.ok;

    } catch (error) {
      console.error('Error testing GitLab connection:', error);
      return false;
    }
  }

  getStatus(): { enabled: boolean; lastSync: string; nextSync?: string } {
    return {
      enabled: this.config?.enabled || false,
      lastSync: this.config?.last_sync || 'Never',
      nextSync: this.config?.enabled ? 
        `Every ${this.config.auto_sync_interval} minutes` : undefined
    };
  }

  // Cleanup when service is destroyed
  destroy(): void {
    this.stopAutoSync();
  }
}

export const gitlabSyncService = new GitLabSyncService();