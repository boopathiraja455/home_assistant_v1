import { Config } from '../types/wifi-monitor';

class ConfigService {
  private config: Config | null = null;

  async loadConfig(): Promise<Config> {
    if (this.config) {
      return this.config;
    }

    try {
      const response = await fetch('/config.json');
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.statusText}`);
      }
      this.config = await response.json();
      return this.config!;
    } catch (error) {
      console.error('Failed to load config:', error);
      // Return default config
      this.config = this.getDefaultConfig();
      return this.config;
    }
  }

  getConfig(): Config {
    return this.config || this.getDefaultConfig();
  }

  private getDefaultConfig(): Config {
    return {
      targetSSID: 'DefaultWiFi',
      timer1Duration: 7,
      timer2Duration: 8,
      durationUnit: 'hours',
      notifications: {
        enabled: true,
        sound: true,
        soundFile: '/sounds/notification.mp3'
      },
      ui: {
        theme: 'dark',
        showDashboard: true
      },
      debug: {
        mockMode: true,
        logLevel: 'info'
      }
    };
  }

  getDurationInMs(duration: number, unit: string): number {
    switch (unit) {
      case 'seconds':
        return duration * 1000;
      case 'minutes':
        return duration * 60 * 1000;
      case 'hours':
        return duration * 60 * 60 * 1000;
      default:
        return duration * 60 * 60 * 1000; // Default to hours
    }
  }
}

export const configService = new ConfigService();