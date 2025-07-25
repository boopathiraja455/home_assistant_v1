import { AppState, ConnectionEvent } from '../types/wifi-monitor';

class StorageService {
  private readonly STORAGE_KEYS = {
    APP_STATE: 'wifi-monitor-state',
    FIRST_CONNECTION_TODAY: 'wifi-monitor-first-connection',
    CONNECTION_HISTORY: 'wifi-monitor-history'
  };

  // LocalStorage methods
  saveAppState(state: Partial<AppState>): void {
    try {
      const currentState = this.getAppState();
      const newState = { ...currentState, ...state };
      localStorage.setItem(this.STORAGE_KEYS.APP_STATE, JSON.stringify(newState));
    } catch (error) {
      console.error('Failed to save app state:', error);
    }
  }

  getAppState(): Partial<AppState> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.APP_STATE);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to get app state:', error);
      return {};
    }
  }

  saveFirstConnectionToday(timestamp: number): void {
    try {
      const today = this.getTodayString();
      const data = { date: today, timestamp };
      localStorage.setItem(this.STORAGE_KEYS.FIRST_CONNECTION_TODAY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save first connection:', error);
    }
  }

  getFirstConnectionToday(): number | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.FIRST_CONNECTION_TODAY);
      if (!stored) return null;

      const data = JSON.parse(stored);
      const today = this.getTodayString();
      
      // Check if the stored date is today
      if (data.date === today) {
        return data.timestamp;
      }
      
      // Clear old data if it's from a different day
      localStorage.removeItem(this.STORAGE_KEYS.FIRST_CONNECTION_TODAY);
      return null;
    } catch (error) {
      console.error('Failed to get first connection:', error);
      return null;
    }
  }

  clearDailyData(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEYS.FIRST_CONNECTION_TODAY);
      // Reset timers in app state
      const currentState = this.getAppState();
      this.saveAppState({
        ...currentState,
        firstConnectionToday: null,
        timers: {
          timer1: { active: false, triggerTime: null, triggered: false },
          timer2: { active: false, triggerTime: null, triggered: false }
        }
      });
    } catch (error) {
      console.error('Failed to clear daily data:', error);
    }
  }

  // IndexedDB methods for connection history
  async saveConnectionEvent(event: ConnectionEvent): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('WiFiMonitorDB', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['connections'], 'readwrite');
        const store = transaction.objectStore('connections');
        
        store.add({
          ...event,
          id: Date.now() // Simple ID generation
        });
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        const store = db.createObjectStore('connections', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('ssid', 'ssid', { unique: false });
      };
    });
  }

  async getConnectionHistory(days: number = 7): Promise<ConnectionEvent[]> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('WiFiMonitorDB', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['connections'], 'readonly');
        const store = transaction.objectStore('connections');
        const index = store.index('timestamp');
        
        const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
        const range = IDBKeyRange.lowerBound(cutoffTime);
        
        const results: ConnectionEvent[] = [];
        const cursor = index.openCursor(range);
        
        cursor.onsuccess = () => {
          const result = cursor.result;
          if (result) {
            results.push(result.value);
            result.continue();
          } else {
            resolve(results);
          }
        };
        
        cursor.onerror = () => reject(cursor.error);
      };
    });
  }

  private getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Cleanup old data
  async cleanupOldData(daysToKeep: number = 30): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('WiFiMonitorDB', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['connections'], 'readwrite');
        const store = transaction.objectStore('connections');
        const index = store.index('timestamp');
        
        const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
        const range = IDBKeyRange.upperBound(cutoffTime);
        
        const cursor = index.openCursor(range);
        
        cursor.onsuccess = () => {
          const result = cursor.result;
          if (result) {
            result.delete();
            result.continue();
          } else {
            resolve();
          }
        };
        
        cursor.onerror = () => reject(cursor.error);
      };
    });
  }
}

export const storageService = new StorageService();