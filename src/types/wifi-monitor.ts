export interface Config {
  targetSSID: string;
  timer1Duration: number;
  timer2Duration: number;
  durationUnit: 'hours' | 'minutes' | 'seconds';
  notifications: {
    enabled: boolean;
    sound: boolean;
    soundFile: string;
  };
  ui: {
    theme: 'light' | 'dark';
    showDashboard: boolean;
  };
  debug: {
    mockMode: boolean;
    logLevel: 'info' | 'debug' | 'error';
  };
}

export interface ConnectionEvent {
  timestamp: number;
  ssid: string;
  isFirstOfDay: boolean;
}

export interface TimerState {
  timer1: {
    active: boolean;
    triggerTime: number | null;
    triggered: boolean;
  };
  timer2: {
    active: boolean;
    triggerTime: number | null;
    triggered: boolean;
  };
}

export interface AppState {
  isConnected: boolean;
  currentSSID: string | null;
  lastConnectionTime: number | null;
  firstConnectionToday: number | null;
  timers: TimerState;
  config: Config | null;
}

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
}

export interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'timer1' | 'timer2' | 'info';
}