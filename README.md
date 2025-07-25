# WiFi Monitor - Connection Timer App

A Progressive Web App (PWA) that monitors WiFi connections and triggers timed notifications. The app detects when you connect to a specific WiFi network, captures the first connection time of the day, and sets up configurable timers to remind you after specified durations.

## Features

### Core Functionality
- **WiFi Connection Monitoring**: Detects connections to a specific SSID
- **Daily First Connection Tracking**: Only captures the first connection per day
- **Dual Timer System**: Configurable Timer 1 (7 hours) and Timer 2 (8 hours)
- **Smart Notifications**: Browser desktop notifications with sound alerts
- **Fullscreen Modal Alerts**: Prominent visual alerts when timers trigger
- **Persistent Storage**: Uses localStorage and IndexedDB for data persistence

### PWA Features
- **Offline Capability**: Works without internet connection
- **Installable**: Can be installed as a desktop/mobile app
- **Background Processing**: Service worker for background functionality
- **Auto-start**: Attempts to run on system startup (browser limitations apply)

### Configuration
- **JSON-based Settings**: All settings stored in `config.json`
- **Configurable Timers**: Adjust timer durations and units
- **Sound Control**: Enable/disable notification sounds
- **Debug Mode**: Mock WiFi connections for testing

## Installation & Setup

### Prerequisites
- Node.js 16+ and npm
- Modern web browser with PWA support
- HTTPS connection (required for notifications and service workers)

### Quick Start
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Configuration
Edit `public/config.json` to customize the app:

```json
{
  "targetSSID": "YourWiFiNetwork",
  "timer1Duration": 7,
  "timer2Duration": 8,
  "durationUnit": "hours",
  "notifications": {
    "enabled": true,
    "sound": true,
    "soundFile": "/sounds/notification.mp3"
  },
  "ui": {
    "theme": "dark",
    "showDashboard": true
  },
  "debug": {
    "mockMode": true,
    "logLevel": "info"
  }
}
```

### Sound Files
Place notification sound files in `public/sounds/`. Supported formats: MP3, WAV, OGG.

## Usage

### Dashboard Overview
The main dashboard displays:
- **Connection Status**: Current WiFi connection state
- **First Connection Today**: Timestamp of first daily connection
- **Timer Status**: Active timers with countdown displays
- **Manual Controls**: Override connection time and test functions

### Manual Override
You can manually set the first connection time using the datetime input in the dashboard. This is useful for:
- Testing the timer functionality
- Correcting missed connections
- Setting up timers retroactively

### Mock Mode
Enable `mockMode` in config.json for testing:
- Simulates random WiFi connections/disconnections
- Allows testing without actual WiFi changes
- Provides manual simulation controls in the dashboard

## Technical Architecture

### Core Services
- **ConfigService**: Loads and manages configuration
- **StorageService**: Handles localStorage and IndexedDB operations
- **NotificationService**: Manages browser notifications and sounds
- **WiFiMonitorService**: Main orchestrator for WiFi monitoring and timers

### Data Storage
- **localStorage**: App state and daily connection data
- **IndexedDB**: Connection history and events
- **Automatic Cleanup**: Old data is automatically purged

### PWA Implementation
- **Service Worker**: Background processing and caching
- **Web App Manifest**: Installation and display configuration
- **Offline Support**: Cached resources for offline functionality

## Browser Limitations & Workarounds

### WiFi Detection
Browsers have limited access to WiFi information for security reasons. The app uses:
- **Online/Offline Events**: Detects network connectivity changes
- **Mock Mode**: Simulates WiFi connections for testing
- **Manual Triggers**: Allows manual connection simulation

### Background Processing
Service workers have limited background execution time:
- **Foreground Focus**: App works best when browser tab is active
- **Periodic Sync**: Limited background sync capabilities
- **Notification Persistence**: Notifications can trigger even when app is closed

### Auto-Start Limitations
Web browsers cannot truly auto-start applications:
- **PWA Installation**: Installing as PWA improves startup behavior
- **Browser Bookmarks**: Pin to taskbar/home screen for easy access
- **Manual Launch**: Users need to manually open the app after system restart

## Development

### Project Structure
```
src/
├── components/          # React components
│   ├── Dashboard.tsx    # Main dashboard interface
│   └── TimerModal.tsx   # Fullscreen alert modal
├── services/           # Core business logic
│   ├── config-service.ts
│   ├── storage-service.ts
│   ├── notification-service.ts
│   └── wifi-monitor-service.ts
├── types/              # TypeScript interfaces
└── App.tsx            # Main application component

public/
├── config.json        # App configuration
├── sw.js             # Service worker
├── manifest.json     # PWA manifest
└── sounds/           # Notification sound files
```

### Key Technologies
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Vite**: Build tool and dev server
- **Lucide React**: Icons
- **Service Workers**: Background processing
- **Web APIs**: Notifications, Storage, Audio

### Testing
The app includes comprehensive testing features:
- **Mock Mode**: Simulates WiFi connections
- **Manual Controls**: Test timer functionality
- **Debug Logging**: Detailed console output
- **Configuration Override**: Easy testing with different settings

## Deployment

### Production Build
```bash
npm run build
```

### HTTPS Requirement
The app requires HTTPS for:
- Service worker registration
- Notification permissions
- PWA installation

### Hosting Recommendations
- **Netlify**: Automatic HTTPS and PWA support
- **Vercel**: Easy deployment with edge functions
- **GitHub Pages**: Free hosting with custom domains
- **Self-hosted**: Nginx/Apache with SSL certificates

## Troubleshooting

### Common Issues

**Notifications not working:**
- Check browser notification permissions
- Ensure HTTPS connection
- Verify service worker registration

**Timers not triggering:**
- Check browser tab is not suspended
- Verify localStorage permissions
- Review configuration settings

**PWA not installing:**
- Confirm HTTPS connection
- Check manifest.json validity
- Verify service worker registration

**Mock mode not working:**
- Enable debug.mockMode in config.json
- Check browser console for errors
- Verify service initialization

### Browser Support
- **Chrome/Edge**: Full support
- **Firefox**: Good support (limited PWA features)
- **Safari**: Basic support (no background sync)
- **Mobile browsers**: Good support with PWA installation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Disclaimer

This app has inherent limitations due to browser security restrictions:
- Cannot directly access WiFi SSID information
- Background processing is limited
- Auto-start functionality is restricted
- Requires user interaction for full functionality

For production use in enterprise environments, consider developing a native application or browser extension with appropriate permissions.