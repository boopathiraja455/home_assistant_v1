// Service Worker for WiFi Monitor PWA
const CACHE_NAME = 'wifi-monitor-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/config.json',
  '/sounds/notification.mp3',
  '/vite.svg'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Claim control of all clients
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Background sync for WiFi monitoring
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'wifi-check') {
    event.waitUntil(checkWiFiStatus());
  }
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SHOW_NOTIFICATION':
      showNotification(payload);
      break;
    case 'REGISTER_SYNC':
      registerBackgroundSync();
      break;
    case 'UPDATE_CONFIG':
      updateConfig(payload);
      break;
    default:
      console.log('Unknown message type:', type);
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  // Focus or open the app window
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url === self.location.origin && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Otherwise, open new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Push event handler (for future push notifications)
self.addEventListener('push', (event) => {
  console.log('Push message received:', event);
  
  if (event.data) {
    const data = event.data.json();
    
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/vite.svg',
        badge: '/vite.svg',
        tag: data.tag || 'wifi-monitor',
        requireInteraction: true,
        actions: [
          {
            action: 'acknowledge',
            title: 'Acknowledge'
          },
          {
            action: 'snooze',
            title: 'Snooze 5min'
          }
        ]
      })
    );
  }
});

// Helper functions
async function showNotification(options) {
  try {
    await self.registration.showNotification(options.title, {
      body: options.body,
      icon: options.icon || '/vite.svg',
      badge: '/vite.svg',
      tag: options.tag || 'wifi-monitor',
      requireInteraction: options.requireInteraction || false,
      silent: false,
      actions: [
        {
          action: 'acknowledge',
          title: 'OK'
        }
      ]
    });
  } catch (error) {
    console.error('Failed to show notification:', error);
  }
}

async function checkWiFiStatus() {
  try {
    // In a real implementation, this would check network status
    // For now, we'll send a message to the main thread to handle WiFi checking
    const clients = await self.clients.matchAll();
    
    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_WIFI_CHECK',
        timestamp: Date.now()
      });
    });
    
  } catch (error) {
    console.error('Error in background WiFi check:', error);
  }
}

function registerBackgroundSync() {
  // Register for background sync when network is available
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    self.registration.sync.register('wifi-check');
  }
}

let config = null;

function updateConfig(newConfig) {
  config = newConfig;
  console.log('Service Worker config updated:', config);
}

// Periodic background tasks (limited by browser)
let backgroundInterval;

function startBackgroundTasks() {
  // Note: This has limited functionality in browsers due to background execution limits
  backgroundInterval = setInterval(() => {
    checkWiFiStatus();
  }, 60000); // Check every minute when possible
}

function stopBackgroundTasks() {
  if (backgroundInterval) {
    clearInterval(backgroundInterval);
    backgroundInterval = null;
  }
}

// Start background tasks when service worker becomes active
self.addEventListener('activate', () => {
  startBackgroundTasks();
});

// Cleanup on termination
self.addEventListener('beforeunload', () => {
  stopBackgroundTasks();
});

console.log('WiFi Monitor Service Worker loaded');