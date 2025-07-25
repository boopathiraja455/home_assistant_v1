import { AppState, ConnectionEvent } from '../types/wifi-monitor';
import { configService } from './config-service';
import { storageService } from './storage-service';
import { notificationService } from './notification-service';

class WiFiMonitorService {
  private state: AppState = {
    isConnected: false,
    currentSSID: null,
    lastConnectionTime: null,
    firstConnectionToday: null,
    timers: {
      timer1: { active: false, triggerTime: null, triggered: false },
      timer2: { active: false, triggerTime: null, triggered: false }
    },
    config: null
  };

  private intervalId: number | null = null;
  private timer1TimeoutId: number | null = null;
  private timer2TimeoutId: number | null = null;
  private mockConnectionToggleId: number | null = null;
  
  private eventListeners: ((state: AppState) => void)[] = [];

  async initialize(): Promise<void> {
    try {
      // Load configuration
      this.state.config = await configService.loadConfig();
      
      // Restore state from storage
      const storedState = storageService.getAppState();
      const firstConnectionToday = storageService.getFirstConnectionToday();
      
      this.state = {
        ...this.state,
        ...storedState,
        firstConnectionToday,
        config: this.state.config
      };

      // Request notification permission
      await notificationService.requestPermission();

      // Start monitoring
      this.startMonitoring();

      // Setup mock mode if enabled
      if (this.state.config?.debug.mockMode) {
        this.setupMockMode();
      }

      // Restore timers if there's a first connection today
      if (this.state.firstConnectionToday) {
        this.setupTimers(this.state.firstConnectionToday);
      }

      console.log('WiFi Monitor initialized', this.state);
    } catch (error) {
      console.error('Failed to initialize WiFi Monitor:', error);
    }
  }

  private startMonitoring(): void {
    // In a real implementation, this would use navigator.connection or other APIs
    // For now, we'll use mock data or manual triggers
    this.intervalId = window.setInterval(() => {
      this.checkWiFiStatus();
    }, 5000); // Check every 5 seconds
  }

  private async checkWiFiStatus(): Promise<void> {
    if (!this.state.config) return;

    // Mock WiFi detection - in reality, browsers have limited access to WiFi info
    // This would need to be implemented with native apps or browser extensions
    
    if (this.state.config.debug.mockMode) {
      // Mock mode - randomly simulate connections/disconnections
      return;
    }

    // Real implementation would check network connection
    // For now, we'll rely on manual triggers or service worker messages
    try {
      // Check if online
      const isOnline = navigator.onLine;
      
      if (isOnline && !this.state.isConnected) {
        // Simulate connection to target SSID
        await this.handleWiFiConnection(this.state.config.targetSSID);
      } else if (!isOnline && this.state.isConnected) {
        this.handleWiFiDisconnection();
      }
    } catch (error) {
      console.error('Error checking WiFi status:', error);
    }
  }

  private setupMockMode(): void {
    console.log('Setting up mock mode for WiFi monitoring');
    
    // Simulate periodic connections/disconnections for testing
    this.mockConnectionToggleId = window.setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance of connection change
        if (this.state.isConnected) {
          this.handleWiFiDisconnection();
        } else {
          this.handleWiFiConnection(this.state.config!.targetSSID);
        }
      }
    }, 10000); // Check every 10 seconds in mock mode
  }

  async handleWiFiConnection(ssid: string): Promise<void> {
    if (!this.state.config || ssid !== this.state.config.targetSSID) {
      return;
    }

    const now = Date.now();
    const isFirstConnectionToday = !this.state.firstConnectionToday;

    this.state.isConnected = true;
    this.state.currentSSID = ssid;
    this.state.lastConnectionTime = now;

    // Only capture first connection of the day
    if (isFirstConnectionToday) {
      this.state.firstConnectionToday = now;
      storageService.saveFirstConnectionToday(now);
      
      // Setup timers
      this.setupTimers(now);
      
      // Show connection notification
      await notificationService.showConnectionNotification(ssid);
      
      // Save connection event to history
      const event: ConnectionEvent = {
        timestamp: now,
        ssid,
        isFirstOfDay: true
      };
      
      try {
        await storageService.saveConnectionEvent(event);
      } catch (error) {
        console.error('Failed to save connection event:', error);
      }
    }

    // Update storage and notify listeners
    this.saveStateAndNotify();
    
    console.log(`Connected to ${ssid}`, { isFirstConnectionToday, timestamp: now });
  }

  private handleWiFiDisconnection(): void {
    this.state.isConnected = false;
    this.state.currentSSID = null;
    this.state.lastConnectionTime = null;
    
    this.saveStateAndNotify();
    
    console.log('WiFi disconnected');
  }

  private setupTimers(firstConnectionTime: number): void {
    if (!this.state.config) return;

    const timer1Duration = configService.getDurationInMs(
      this.state.config.timer1Duration,
      this.state.config.durationUnit
    );
    
    const timer2Duration = configService.getDurationInMs(
      this.state.config.timer2Duration,
      this.state.config.durationUnit
    );

    const timer1TriggerTime = firstConnectionTime + timer1Duration;
    const timer2TriggerTime = firstConnectionTime + timer2Duration;
    
    const now = Date.now();

    // Setup Timer 1
    if (!this.state.timers.timer1.triggered && timer1TriggerTime > now) {
      this.state.timers.timer1.active = true;
      this.state.timers.timer1.triggerTime = timer1TriggerTime;
      
      const delay = timer1TriggerTime - now;
      this.timer1TimeoutId = window.setTimeout(() => {
        this.triggerTimer1();
      }, delay);
    }

    // Setup Timer 2
    if (!this.state.timers.timer2.triggered && timer2TriggerTime > now) {
      this.state.timers.timer2.active = true;
      this.state.timers.timer2.triggerTime = timer2TriggerTime;
      
      const delay = timer2TriggerTime - now;
      this.timer2TimeoutId = window.setTimeout(() => {
        this.triggerTimer2();
      }, delay);
    }

    console.log('Timers setup:', {
      timer1: { triggerTime: new Date(timer1TriggerTime), delay: timer1Duration },
      timer2: { triggerTime: new Date(timer2TriggerTime), delay: timer2Duration }
    });
  }

  private async triggerTimer1(): Promise<void> {
    this.state.timers.timer1.triggered = true;
    this.state.timers.timer1.active = false;
    
    await notificationService.showTimer1Notification();
    
    // Trigger modal via event
    this.notifyListeners();
    
    // Send message to show modal
    window.dispatchEvent(new CustomEvent('show-timer-modal', {
      detail: { type: 'timer1', message: '7 hours have passed since your first WiFi connection today!' }
    }));
    
    this.saveStateAndNotify();
    
    console.log('Timer 1 triggered');
  }

  private async triggerTimer2(): Promise<void> {
    this.state.timers.timer2.triggered = true;
    this.state.timers.timer2.active = false;
    
    await notificationService.showTimer2Notification();
    
    // Trigger modal via event
    this.notifyListeners();
    
    // Send message to show modal
    window.dispatchEvent(new CustomEvent('show-timer-modal', {
      detail: { type: 'timer2', message: '8 hours have passed since your first WiFi connection today!' }
    }));
    
    this.saveStateAndNotify();
    
    console.log('Timer 2 triggered');
  }

  // Manual override methods
  setFirstConnectionTime(timestamp: number): void {
    this.state.firstConnectionToday = timestamp;
    storageService.saveFirstConnectionToday(timestamp);
    
    // Clear existing timers
    this.clearTimers();
    
    // Reset timer states
    this.state.timers = {
      timer1: { active: false, triggerTime: null, triggered: false },
      timer2: { active: false, triggerTime: null, triggered: false }
    };
    
    // Setup new timers
    this.setupTimers(timestamp);
    
    this.saveStateAndNotify();
    
    console.log('First connection time manually set to:', new Date(timestamp));
  }

  clearDailyData(): void {
    storageService.clearDailyData();
    this.clearTimers();
    
    this.state.firstConnectionToday = null;
    this.state.timers = {
      timer1: { active: false, triggerTime: null, triggered: false },
      timer2: { active: false, triggerTime: null, triggered: false }
    };
    
    this.saveStateAndNotify();
    
    console.log('Daily data cleared');
  }

  private clearTimers(): void {
    if (this.timer1TimeoutId) {
      clearTimeout(this.timer1TimeoutId);
      this.timer1TimeoutId = null;
    }
    
    if (this.timer2TimeoutId) {
      clearTimeout(this.timer2TimeoutId);
      this.timer2TimeoutId = null;
    }
  }

  private saveStateAndNotify(): void {
    storageService.saveAppState(this.state);
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }

  // Public methods
  getState(): AppState {
    return { ...this.state };
  }

  addEventListener(listener: (state: AppState) => void): void {
    this.eventListeners.push(listener);
  }

  removeEventListener(listener: (state: AppState) => void): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  // Test methods for mock mode
  simulateConnection(): void {
    if (this.state.config) {
      this.handleWiFiConnection(this.state.config.targetSSID);
    }
  }

  simulateDisconnection(): void {
    this.handleWiFiDisconnection();
  }

  // Cleanup
  destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    if (this.mockConnectionToggleId) {
      clearInterval(this.mockConnectionToggleId);
    }
    
    this.clearTimers();
    this.eventListeners = [];
  }
}

export const wifiMonitorService = new WiFiMonitorService();