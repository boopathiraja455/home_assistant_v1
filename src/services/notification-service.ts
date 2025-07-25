import { NotificationOptions } from '../types/wifi-monitor';
import { configService } from './config-service';

class NotificationService {
  private audio: HTMLAudioElement | null = null;

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async showNotification(options: NotificationOptions): Promise<void> {
    const config = configService.getConfig();
    if (!config?.notifications.enabled) {
      return;
    }

    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/vite.svg',
        tag: options.tag || 'wifi-monitor',
        requireInteraction: options.requireInteraction || true,
        silent: false
      });

      // Auto-close after 10 seconds if not requiring interaction
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 10000);
      }

      // Play sound if enabled
      if (config.notifications.sound) {
        this.playNotificationSound();
      }

    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  private playNotificationSound(): void {
    const config = configService.getConfig();
    if (!config?.notifications.sound) {
      return;
    }

    try {
      // If audio instance doesn't exist or src changed, create new one
      if (!this.audio || this.audio.src !== config.notifications.soundFile) {
        this.audio = new Audio(config.notifications.soundFile);
        this.audio.volume = 0.7;
      }

      // Reset and play
      this.audio.currentTime = 0;
      this.audio.play().catch(error => {
        console.warn('Failed to play notification sound:', error);
        // Fallback to system beep or default sound
        this.playSystemBeep();
      });
    } catch (error) {
      console.error('Error setting up audio:', error);
      this.playSystemBeep();
    }
  }

  private playSystemBeep(): void {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // 800 Hz tone
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Failed to play system beep:', error);
    }
  }

  async showTimer1Notification(): Promise<void> {
    await this.showNotification({
      title: 'WiFi Monitor - Timer 1',
      body: '7 hours have passed since your first WiFi connection today!',
      tag: 'timer1',
      requireInteraction: true
    });
  }

  async showTimer2Notification(): Promise<void> {
    await this.showNotification({
      title: 'WiFi Monitor - Timer 2',
      body: '8 hours have passed since your first WiFi connection today!',
      tag: 'timer2',
      requireInteraction: true
    });
  }

  async showConnectionNotification(ssid: string): Promise<void> {
    await this.showNotification({
      title: 'WiFi Connected',
      body: `Connected to ${ssid}. Timers started!`,
      tag: 'connection',
      requireInteraction: false
    });
  }

  // Service Worker notification (for background notifications)
  async sendServiceWorkerNotification(options: NotificationOptions): Promise<void> {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        payload: options
      });
    }
  }

  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }
}

export const notificationService = new NotificationService();