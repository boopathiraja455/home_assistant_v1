import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { TimerModal } from './components/TimerModal';
import { wifiMonitorService } from './services/wifi-monitor-service';
import { ModalState } from './types/wifi-monitor';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  useEffect(() => {
    let mounted = true;

    const initializeApp = async () => {
      try {
        // Register service worker
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered:', registration);
            
            // Listen for service worker messages
                         navigator.serviceWorker.addEventListener('message', (event) => {
               const { type } = event.data;
               
               if (type === 'BACKGROUND_WIFI_CHECK') {
                 // Handle background WiFi check request
                 console.log('Background WiFi check requested');
               }
             });
          } catch (error) {
            console.error('Service Worker registration failed:', error);
          }
        }

        // Initialize WiFi monitor service
        await wifiMonitorService.initialize();

        if (mounted) {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to initialize app:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error occurred');
          setIsLoading(false);
        }
      }
    };

    // Listen for timer modal events
    const handleTimerModal = (event: CustomEvent) => {
      const { type, message } = event.detail;
      
      setModal({
        isOpen: true,
        title: type === 'timer1' ? 'Timer 1 Alert' : 'Timer 2 Alert',
        message,
        type
      });
    };

    // Listen for visibility change to handle app focus
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // App became visible, refresh state
        console.log('App became visible, refreshing state');
      }
    };

    // Listen for online/offline events
    const handleOnline = () => {
      console.log('App came online');
    };

    const handleOffline = () => {
      console.log('App went offline');
    };

    // Add event listeners
    window.addEventListener('show-timer-modal', handleTimerModal as EventListener);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initialize the app
    initializeApp();

    // Cleanup
    return () => {
      mounted = false;
      window.removeEventListener('show-timer-modal', handleTimerModal as EventListener);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle app cleanup on unmount
  useEffect(() => {
    return () => {
      wifiMonitorService.destroy();
    };
  }, []);

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-lg">Initializing WiFi Monitor...</p>
          <p className="text-sm text-gray-400 mt-2">Loading configuration and setting up services</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">Initialization Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <Dashboard />
      
      <TimerModal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={closeModal}
      />

      {/* PWA Install Prompt */}
      <InstallPrompt />
    </div>
  );
}

// Component for PWA install prompt
const InstallPrompt: React.FC = () => {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      setInstallPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;

    const result = await installPrompt.prompt();
    console.log('Install prompt result:', result);
    
    setInstallPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setInstallPrompt(null);
  };

  if (!showPrompt || !installPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-lg max-w-sm z-40">
      <div className="flex items-start space-x-3">
        <div className="text-2xl">📱</div>
        <div className="flex-1">
          <h4 className="text-white font-semibold mb-1">Install WiFi Monitor</h4>
          <p className="text-gray-300 text-sm mb-3">
            Install this app for better performance and offline access.
          </p>
          <div className="flex space-x-2">
            <button
              onClick={handleInstall}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
            >
              Not Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;