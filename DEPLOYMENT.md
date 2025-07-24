# Smart Assistant PWA - Deployment Guide

This guide will help you deploy your Smart Assistant PWA to GitLab Pages with CI/CD automation.

## 🚀 Quick Deployment Steps

### 1. Repository Setup
1. Create a new GitLab repository or use an existing one
2. Push your Smart Assistant PWA code to the repository
3. Ensure your repository has the `.gitlab-ci.yml` file in the root

### 2. GitLab Pages Configuration
1. Go to your GitLab project → **Settings** → **Pages**
2. The deployment will happen automatically after the first successful pipeline
3. Your app will be available at: `https://[username].gitlab.io/[project-name]`

### 3. Configure Your App
1. **Edit Configuration Files**: Update the JSON files in `public/config/`:
   - `telegram.json` - Add your Telegram bot token and chat ID
   - `gitlab.json` - Add your GitLab personal access token and project ID
   - `voice.json` - Configure voice announcement schedules

2. **GitLab Personal Access Token**:
   - Go to GitLab → **User Settings** → **Access Tokens**
   - Create token with `api`, `read_repository`, `write_repository` scopes
   - Add the token to `public/config/gitlab.json`

3. **Telegram Bot Setup**:
   - Message @BotFather on Telegram
   - Create a new bot with `/newbot`
   - Get your bot token and chat ID
   - Add them to `public/config/telegram.json`

## 📁 Folder Structure After Deployment

```
public/
├── index.html                 # Main app entry point
├── assets/                    # Built JS/CSS files
├── data/                      # App data files
│   ├── food_menu.json
│   ├── stock.json
│   ├── daily_todo.json
│   └── reminder.json
├── config/                    # Configuration files
│   ├── telegram.json
│   ├── gitlab.json
│   └── voice.json
├── backup/                    # GitLab sync backups
└── pwa-*.png                  # PWA icons
```

## 🔧 CI/CD Pipeline Details

### Pipeline Stages
1. **Build Stage**: 
   - Installs dependencies
   - Builds the production app
   - Copies data and config files
   - Creates backup directory structure

2. **Deploy Stage**: 
   - Deploys to GitLab Pages
   - Sets up proper folder structure
   - Configures PWA settings

### Pipeline Variables
- `NODE_VERSION`: Node.js version (default: 18)
- `PUBLIC_URL`: Your app's public URL (auto-generated)

## 🔐 Security & Configuration

### Configuration Files
All sensitive data is stored in separate JSON files:

```json
// public/config/telegram.json
{
  "bot_token": "YOUR_BOT_TOKEN",
  "chat_id": "YOUR_CHAT_ID",
  "enabled": true
}

// public/config/gitlab.json
{
  "token": "YOUR_GITLAB_TOKEN",
  "project_id": "YOUR_PROJECT_ID",
  "branch": "main",
  "enabled": true,
  "auto_sync_interval": 5
}

// public/config/voice.json
{
  "enabled": true,
  "schedules": [...]
}
```

### Data Persistence
- **Local Storage**: Primary data storage in browser
- **JSON Files**: Fallback data when localStorage is empty
- **GitLab Sync**: Cloud backup every 5 minutes (configurable)

## 🌐 Accessing Your Deployed App

### URL Format
- **Production**: `https://[username].gitlab.io/[project-name]`
- **Staging**: Manual deployment for feature branches

### PWA Installation
1. Visit your deployed URL
2. Look for browser prompt to "Install App"
3. Or use browser menu → "Install [App Name]"
4. App will work offline after installation

## 🔄 Data Sync & Backup

### Automatic Backup
- Data automatically syncs to GitLab every 5 minutes
- Backups stored in `backup/` directory
- Old backups cleaned up after 60 days

### Manual Sync
- **Push**: Manually backup current data to GitLab
- **Pull**: Restore data from latest GitLab backup
- Access via Settings → GitLab Sync section

### Backup File Format
```json
{
  "timestamp": "2024-01-28T10:30:00.000Z",
  "version": "1.0.0",
  "data": {
    "stock": {...},
    "tasks": [...],
    "reminders": [...],
    "daily_menus": [...],
    "food_menu": {...},
    "settings": {...}
  }
}
```

## 🛠️ Troubleshooting

### Pipeline Fails
1. Check `.gitlab-ci.yml` syntax
2. Verify Node.js version compatibility
3. Check build logs for specific errors

### App Won't Load
1. Check browser console for errors
2. Verify all JSON files are valid
3. Check GitLab Pages settings

### Data Not Syncing
1. Verify GitLab token has correct permissions
2. Check project ID is correct
3. Ensure GitLab repository exists and is accessible

### Telegram Not Working
1. Verify bot token is correct
2. Check chat ID is valid
3. Ensure bot is started (send `/start` command)

## 📱 Mobile Usage

### PWA Features
- ✅ Install as native app
- ✅ Offline functionality
- ✅ Push notifications ready
- ✅ Background sync
- ✅ Full-screen experience

### Installation Steps
1. Open app URL in mobile browser
2. Tap browser menu (⋮)
3. Select "Add to Home Screen" or "Install App"
4. App icon will appear on home screen

## 🔄 Updates & Maintenance

### Automatic Updates
- PWA updates automatically when new version deployed
- Service worker handles update notifications
- Users prompted to reload for latest version

### Manual Updates
1. Push changes to GitLab repository
2. CI/CD pipeline runs automatically
3. New version deployed to GitLab Pages
4. Users see update prompt on next visit

## 📊 Monitoring & Analytics

### Built-in Monitoring
- Console logs for all operations
- Error tracking for failed operations
- Sync status indicators in Settings

### Usage Tracking
- No external analytics (privacy-focused)
- Local usage data only
- All data stays on user's device

## 🚀 Advanced Configuration

### Custom Domain
1. Go to GitLab project → **Settings** → **Pages**
2. Add your custom domain
3. Configure DNS CNAME record
4. Enable HTTPS (automatic with Let's Encrypt)

### Environment Variables
Set in GitLab CI/CD variables:
- `NODE_VERSION`: Node.js version
- `BUILD_FLAGS`: Additional build flags
- `DEPLOY_ENV`: Deployment environment

### Branch-based Deployments
- `main/master`: Production deployment
- `develop`: Staging deployment (manual)
- `feature/*`: Feature branch deployment (manual)

---

## 🎉 You're All Set!

Your Smart Assistant PWA is now deployed and accessible from anywhere! The app will:

- ✅ Work offline after first visit
- ✅ Send voice announcements on schedule
- ✅ Send Telegram notifications
- ✅ Automatically backup data to GitLab
- ✅ Update automatically when you push changes
- ✅ Be installable as a native app

Visit your deployed URL and start managing your daily tasks, nutrition, and inventory with ease! 🍽️📱✨