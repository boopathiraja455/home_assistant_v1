import React, { useState, useEffect } from 'react';
import { AppState } from '../types/wifi-monitor';
import { wifiMonitorService } from '../services/wifi-monitor-service';
import { 
  Wifi, 
  WifiOff, 
  Clock, 
  Calendar, 
  Settings, 
  Play, 
  Pause, 
  RotateCcw,
  Bell,
  BellOff 
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [state, setState] = useState<AppState>(wifiMonitorService.getState());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [manualTimeInput, setManualTimeInput] = useState('');

  useEffect(() => {
    // Subscribe to state changes
    const handleStateChange = (newState: AppState) => {
      setState(newState);
    };

    wifiMonitorService.addEventListener(handleStateChange);

    // Update current time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      wifiMonitorService.removeEventListener(handleStateChange);
      clearInterval(timeInterval);
    };
  }, []);

  const formatTime = (timestamp: number | null): string => {
    if (!timestamp) return 'Not set';
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getTimeUntilTrigger = (triggerTime: number | null): string => {
    if (!triggerTime) return 'Not scheduled';
    
    const now = Date.now();
    const diff = triggerTime - now;
    
    if (diff <= 0) return 'Triggered';
    
    return formatDuration(diff);
  };

  const handleManualTimeSet = () => {
    if (!manualTimeInput) return;
    
    try {
      const timestamp = new Date(manualTimeInput).getTime();
      if (isNaN(timestamp)) {
        alert('Invalid date format');
        return;
      }
      
      wifiMonitorService.setFirstConnectionTime(timestamp);
      setManualTimeInput('');
    } catch (error) {
      alert('Invalid date format');
    }
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all daily data? This will reset timers.')) {
      wifiMonitorService.clearDailyData();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">WiFi Monitor Dashboard</h1>
          <p className="text-gray-400">
            Monitoring connections to: <span className="text-blue-400 font-mono">
              {state.config?.targetSSID || 'Not configured'}
            </span>
          </p>
        </div>

        {/* Current Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Connection Status */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Connection Status</h3>
              {state.isConnected ? (
                <Wifi className="w-6 h-6 text-green-400" />
              ) : (
                <WifiOff className="w-6 h-6 text-red-400" />
              )}
            </div>
            <p className={`text-2xl font-bold ${state.isConnected ? 'text-green-400' : 'text-red-400'}`}>
              {state.isConnected ? 'Connected' : 'Disconnected'}
            </p>
            {state.currentSSID && (
              <p className="text-sm text-gray-400 mt-2">
                SSID: {state.currentSSID}
              </p>
            )}
          </div>

          {/* First Connection Today */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">First Connection</h3>
              <Calendar className="w-6 h-6 text-blue-400" />
            </div>
            <p className="text-sm text-gray-400 mb-2">Today</p>
            <p className="text-sm font-mono">
              {formatTime(state.firstConnectionToday)}
            </p>
          </div>

          {/* Current Time */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Current Time</h3>
              <Clock className="w-6 h-6 text-purple-400" />
            </div>
            <p className="text-xl font-mono">
              {currentTime.toLocaleTimeString()}
            </p>
            <p className="text-sm text-gray-400">
              {currentTime.toLocaleDateString()}
            </p>
          </div>

          {/* Notifications */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Notifications</h3>
              {state.config?.notifications.enabled ? (
                <Bell className="w-6 h-6 text-yellow-400" />
              ) : (
                <BellOff className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <p className={`text-sm ${state.config?.notifications.enabled ? 'text-green-400' : 'text-red-400'}`}>
              {state.config?.notifications.enabled ? 'Enabled' : 'Disabled'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Sound: {state.config?.notifications.sound ? 'On' : 'Off'}
            </p>
          </div>
        </div>

        {/* Timer Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Timer 1 */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Timer 1</h3>
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                <span className="text-sm text-gray-400">
                  {state.config?.timer1Duration} {state.config?.durationUnit}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className={`font-semibold ${
                  state.timers.timer1.triggered ? 'text-green-400' :
                  state.timers.timer1.active ? 'text-yellow-400' : 'text-gray-400'
                }`}>
                  {state.timers.timer1.triggered ? 'Triggered' :
                   state.timers.timer1.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Trigger Time:</span>
                <span className="text-sm font-mono">
                  {formatTime(state.timers.timer1.triggerTime)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Time Remaining:</span>
                <span className="text-sm font-mono">
                  {getTimeUntilTrigger(state.timers.timer1.triggerTime)}
                </span>
              </div>
            </div>
          </div>

          {/* Timer 2 */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Timer 2</h3>
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-red-400" />
                <span className="text-sm text-gray-400">
                  {state.config?.timer2Duration} {state.config?.durationUnit}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className={`font-semibold ${
                  state.timers.timer2.triggered ? 'text-green-400' :
                  state.timers.timer2.active ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {state.timers.timer2.triggered ? 'Triggered' :
                   state.timers.timer2.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Trigger Time:</span>
                <span className="text-sm font-mono">
                  {formatTime(state.timers.timer2.triggerTime)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Time Remaining:</span>
                <span className="text-sm font-mono">
                  {getTimeUntilTrigger(state.timers.timer2.triggerTime)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
          <h3 className="text-xl font-semibold mb-6">Manual Controls</h3>
          
          <div className="space-y-6">
            {/* Manual Time Override */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Override First Connection Time
              </label>
              <div className="flex space-x-3">
                <input
                  type="datetime-local"
                  value={manualTimeInput}
                  onChange={(e) => setManualTimeInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleManualTimeSet}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Set Time
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                This will reset and restart both timers from the specified time
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {state.config?.debug.mockMode && (
                <>
                  <button
                    onClick={() => wifiMonitorService.simulateConnection()}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    <span>Simulate Connection</span>
                  </button>
                  
                  <button
                    onClick={() => wifiMonitorService.simulateDisconnection()}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Simulate Disconnect</span>
                  </button>
                </>
              )}
              
              <button
                onClick={handleClearData}
                className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Clear Daily Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Configuration Display */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center space-x-2 mb-4">
            <Settings className="w-5 h-5 text-gray-400" />
            <h3 className="text-xl font-semibold">Configuration</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Target SSID:</span>
              <span className="ml-2 font-mono text-blue-400">
                {state.config?.targetSSID}
              </span>
            </div>
            
            <div>
              <span className="text-gray-400">Timer Durations:</span>
              <span className="ml-2">
                {state.config?.timer1Duration}/{state.config?.timer2Duration} {state.config?.durationUnit}
              </span>
            </div>
            
            <div>
              <span className="text-gray-400">Mock Mode:</span>
              <span className={`ml-2 ${state.config?.debug.mockMode ? 'text-yellow-400' : 'text-gray-400'}`}>
                {state.config?.debug.mockMode ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            
            <div>
              <span className="text-gray-400">Theme:</span>
              <span className="ml-2 capitalize">
                {state.config?.ui.theme}
              </span>
            </div>
          </div>
          
          <p className="text-xs text-gray-500 mt-4">
            Configuration is loaded from /config.json and cannot be modified through the UI
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;