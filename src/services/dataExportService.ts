import { Stock, Task, Reminder, FoodMenu, Settings, DailyMenu } from '../types';

export class DataExportService {
  // Export all data as a single JSON file
  exportAllData(): void {
    const allData = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      data: {
        stock: JSON.parse(localStorage.getItem('stock') || '{"groceries":{},"vegetables":{}}'),
        tasks: JSON.parse(localStorage.getItem('tasks') || '[]'),
        reminders: JSON.parse(localStorage.getItem('reminders') || '[]'),
        food_menu: JSON.parse(localStorage.getItem('food_menu') || '{"breakfast":[],"addons":[],"lunch":[],"dinner":[],"snacks":[]}'),
        daily_menus: JSON.parse(localStorage.getItem('daily_menus') || '[]'),
        settings: JSON.parse(localStorage.getItem('settings') || '{}')
      }
    };

    this.downloadJSON(allData, `smart-assistant-backup-${new Date().toISOString().split('T')[0]}.json`);
  }

  // Export individual data types
  exportStock(): void {
    const stock = JSON.parse(localStorage.getItem('stock') || '{"groceries":{},"vegetables":{}}');
    this.downloadJSON(stock, 'stock.json');
  }

  exportTasks(): void {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    this.downloadJSON(tasks, 'daily_todo.json');
  }

  exportReminders(): void {
    const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
    this.downloadJSON(reminders, 'reminder.json');
  }

  exportFoodMenu(): void {
    const foodMenu = JSON.parse(localStorage.getItem('food_menu') || '{"breakfast":[],"addons":[],"lunch":[],"dinner":[],"snacks":[]}');
    this.downloadJSON(foodMenu, 'food_menu.json');
  }

  // Import data from file
  importData(file: File, dataType: 'all' | 'stock' | 'tasks' | 'reminders' | 'food_menu'): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          
          if (dataType === 'all') {
            // Import complete backup
            if (data.data) {
              Object.entries(data.data).forEach(([key, value]) => {
                localStorage.setItem(key, JSON.stringify(value));
              });
              console.log('All data imported successfully');
            } else {
              throw new Error('Invalid backup file format');
            }
          } else {
            // Import specific data type
            localStorage.setItem(dataType === 'tasks' ? 'tasks' : dataType, JSON.stringify(data));
            console.log(`${dataType} data imported successfully`);
          }
          
          resolve(true);
        } catch (error) {
          console.error('Error importing data:', error);
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsText(file);
    });
  }

  // Save current localStorage data to root data folder structure
  async saveToDataFolder(): Promise<void> {
    try {
      // Get all data from localStorage
      const stock = JSON.parse(localStorage.getItem('stock') || '{"groceries":{},"vegetables":{}}');
      const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
      const foodMenu = JSON.parse(localStorage.getItem('food_menu') || '{"breakfast":[],"addons":[],"lunch":[],"dinner":[],"snacks":[]}');

      // Create downloadable files for manual saving
      const files = [
        { name: 'stock.json', data: stock },
        { name: 'daily_todo.json', data: tasks },
        { name: 'reminder.json', data: reminders },
        { name: 'food_menu.json', data: foodMenu }
      ];

      // Download all files
      files.forEach(file => {
        this.downloadJSON(file.data, file.name);
      });

      console.log('Data files generated for manual saving to data folder');
    } catch (error) {
      console.error('Error saving to data folder:', error);
      throw error;
    }
  }

  // Load data from the root data folder (via fetch)
  async loadFromDataFolder(): Promise<boolean> {
    try {
      const dataTypes = [
        { key: 'stock', file: 'stock.json' },
        { key: 'tasks', file: 'daily_todo.json' },
        { key: 'reminders', file: 'reminder.json' },
        { key: 'food_menu', file: 'food_menu.json' }
      ];

      const promises = dataTypes.map(async ({ key, file }) => {
        try {
          const response = await fetch(`/data/${file}`);
          if (response.ok) {
            const data = await response.json();
            localStorage.setItem(key, JSON.stringify(data));
            return { key, success: true };
          } else {
            console.warn(`Could not load ${file}`);
            return { key, success: false };
          }
        } catch (error) {
          console.error(`Error loading ${file}:`, error);
          return { key, success: false };
        }
      });

      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.success).length;
      
      console.log(`Loaded ${successCount}/${results.length} data files from data folder`);
      return successCount > 0;
    } catch (error) {
      console.error('Error loading from data folder:', error);
      return false;
    }
  }

  // Utility method to download JSON data as file
  private downloadJSON(data: any, filename: string): void {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  // Get data summary for display
  getDataSummary(): { [key: string]: any } {
    return {
      stock: {
        groceries: Object.keys(JSON.parse(localStorage.getItem('stock') || '{"groceries":{},"vegetables":{}}').groceries).length,
        vegetables: Object.keys(JSON.parse(localStorage.getItem('stock') || '{"groceries":{},"vegetables":{}}').vegetables).length
      },
      tasks: JSON.parse(localStorage.getItem('tasks') || '[]').length,
      reminders: JSON.parse(localStorage.getItem('reminders') || '[]').length,
      food_menu: {
        breakfast: JSON.parse(localStorage.getItem('food_menu') || '{"breakfast":[],"addons":[],"lunch":[],"dinner":[],"snacks":[]}').breakfast.length,
        lunch: JSON.parse(localStorage.getItem('food_menu') || '{"breakfast":[],"addons":[],"lunch":[],"dinner":[],"snacks":[]}').lunch.length,
        dinner: JSON.parse(localStorage.getItem('food_menu') || '{"breakfast":[],"addons":[],"lunch":[],"dinner":[],"snacks":[]}').dinner.length
      },
      lastUpdated: new Date().toISOString()
    };
  }
}

export const dataExportService = new DataExportService();