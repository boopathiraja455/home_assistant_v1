# Smart Assistant PWA 🤖

A comprehensive Progressive Web App for managing daily nutrition, tasks, inventory, and automation with voice announcements, Telegram alerts, and GitLab synchronization.

## 🌟 Features Overview

### 📱 **5 Main Pages**

#### 1. **Dashboard** (Landing Page)
- **Real-time clock** with current date and time
- **Today's & Tomorrow's Menu** in compact tile layout (5 columns: Breakfast, Add-ons, Lunch, Dinner, Snacks)
- **Menu switching** - Click rotate button to cycle through available dishes based on stock
- **Mark as Cooked** - Automatically reduces ingredients from stock when meals are prepared
- **Today's Tasks** - Shows pending todos, shopping items, and reminders
- **Add Task** button for quick task creation
- **Optimized for display viewing** - Multi-tile layout that fits in one screen

#### 2. **Stock Manager**
- **Two sections**: Vegetables (top) and Groceries (bottom)
- **Multi-column grid layout** (6-7 columns) for easy viewing
- **Edit quantities** - Click edit icon to update stock levels and threshold for low stock alerts
- **Stock status indicators** - Color-coded (Green: In Stock, Amber: Low Stock, Red: Out of Stock)
- **Real-time updates** - Changes reflect immediately across the app

#### 3. **Menu Planner**
- **Categorized meal lists** - All dishes grouped by meal type
- **Availability indicators** - Dishes fade when ingredients are insufficient
- **Detailed dish view** - Click any dish to see ingredients and nutrition
- **Add new meals** - Create custom dishes with ingredients and nutrition values
- **Smart suggestions** - Auto-recommends meal combinations based on stock

#### 4. **Task Manager**
- **Task Management** - Add, edit, delete todos and shopping items with due dates/times
- **Priority levels** - High, Medium, Low with color coding
- **Due dates and times** - Full scheduling capability
- **Task types** - Todo (blue) and Shopping (purple) with distinct styling
- **Recurring Reminders** - Separate section for repeating tasks
- **Status tracking** - Mark tasks as completed

#### 5. **Settings**
- **Nutrition Goals** - Set daily protein and fiber targets for user and spouse
- **User Information** - Weight settings and names for nutrition calculations
- **Voice Announcements** - Enable/disable with custom scheduling
- **Telegram Integration** - Bot token and chat ID configuration
- **GitLab Sync** - Repository settings for data backup with timestamps

---

## 🎯 **Core Functionality**

### 🍽️ **Smart Nutrition Management**
- **Auto meal suggestions** based on available stock and nutrition goals
- **Protein & fiber tracking** for user (71kg) and spouse (55kg)
- **Stock-aware planning** - Only suggests meals with available ingredients
- **Automatic shopping lists** - Adds missing ingredients to shopping tasks

### 📦 **Intelligent Stock Tracking**
- **Real-time inventory** with quantity tracking
- **Low stock alerts** - Automatic notifications when items run low
- **Cooking integration** - Stock reduces when meals are marked as cooked
- **Multi-unit support** - kg, grams, pieces, bundles, ml and customizable units

### 🔊 **Voice Announcements**
**Customizable Schedule (4-5 times daily):**
- **Morning Update**: Greeting + Today's menu + Pending tasks
- **Lunch Reminder**: Meal notification
- **Evening Update**: Tomorrow's menu + Low stock alerts + Tasks
- **Custom Times**: Add your own scheduled announcements

**Content Includes:**
- Personalized voice greetings
- Today's complete menu
- Pending todos, shopping, and reminders
- Low stock warnings
- Tomorrow's meal plan

### 📱 **Telegram Integration**
**Automated Alerts:**
- **Low stock notifications** with complete item lists
- **Voice announcement content** sent as messages
- **Daily updates** synchronized with voice schedules
- **Shopping reminders** for missing ingredients

**Interactive Bot Commands:**
- `/due` - Show today's due tasks and reminders
- `/menu` - Show today's and tomorrow's menu
- `/stocks` - Show current stock levels for all items
- `/lowstocks` - Show items running low or out of stock
- `/nutrition` - Show today's nutrition summary
- `/status` - Complete daily status overview
- `/help` - Show all available commands

**Setup Instructions:**
1. Create bot with @BotFather on Telegram
2. Get bot token from BotFather
3. Start chat with your bot
4. Get chat ID from @userinfobot
5. Enter both in Settings page
6. Enable Telegram integration
7. Start sending commands to get real-time updates!

### 🔄 **GitLab Synchronization**
**Auto-Sync Features:**
- **Automatic backup** when data changes
- **Timestamped commits** for all updates
- **Branch management** with configurable target branch
- **Manual controls** for push/pull operations

---

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+ installed
- Modern web browser with PWA support
- (Optional) Telegram account for notifications
- (Optional) GitLab account for data sync

### **Installation**
```bash
# Clone or download the project
cd smart-assistant-pwa

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

### **Initial Setup**
1. **Configure Nutrition Goals** - Set protein/fiber targets in Settings
2. **Setup Telegram** (Recommended) - Add bot token and chat ID
3. **Configure GitLab** (Optional) - Add token and project details
4. **Enable Voice** (Recommended) - Set announcement schedules
5. **Update Stock** - Edit quantities in Stock Manager
6. **Plan Meals** - Use Menu Planner or let auto-suggestions work

---

## 📊 **Data Structure**

### 🍳 **Food Menu** (`public/data/food_menu.json`)
```json
{
  "breakfast": [
    {
      "name": "Wheat Dosa",
      "ingredients": {
        "wheat_flour": "100g",
        "onion": "1 small",
        "green_chilli": "1"
      },
      "nutrition": {
        "protein": 6,
        "fiber": 3
      }
    }
  ]
}
```

### 📦 **Stock Data** (`public/data/stock.json`)
```json
{
  "groceries": {
    "rice": { "unit": "kg", "quantity": 2.5, "threshold": 0.5 }
  },
  "vegetables": {
    "onion": { "unit": "kg", "quantity": 1.2, "threshold": 0.3 }
  }
}
```

### ✅ **Tasks** (`public/data/daily_todo.json`)
```json
[
  {
    "id": "task-1",
    "type": "todo",
    "task": "Check water tank level",
    "due_date": "2025-01-28",
    "due_time": "07:30",
    "priority": "high",
    "status": "pending"
  }
]
```

---

## 🎨 **Design Philosophy**

### **Dark Theme**
- **Primary**: Slate-900 (#0f172a) background
- **Secondary**: Slate-800 (#1e293b) cards
- **Accent**: Emerald-500 (#10b981) highlights
- **Warning**: Amber-500 (#f59e0b) alerts
- **Error**: Red-500 (#ef4444) critical items

### **User Experience**
- **Minimal scrolling** - Everything fits in viewport
- **Touch-friendly** - Large tap targets for mobile
- **Visual feedback** - Hover states and transitions
- **Intuitive navigation** - Bottom tab bar for easy access
- **Clear hierarchy** - Typography and spacing for readability

---

## 🔧 **Advanced Features**

### **PWA Capabilities**
- **Offline functionality** with service worker caching
- **Install as app** on mobile/desktop
- **Background sync** when connection restored
- **Push notifications** support ready

### **Data Persistence**
- **localStorage** for immediate data persistence
- **JSON file fallbacks** for initial data
- **GitLab sync** for cloud backup
- **Cross-device synchronization** via GitLab

### **Automation**
- **Smart meal planning** based on available stock
- **Automatic shopping lists** for missing ingredients
- **Scheduled voice announcements** with custom timing
- **Low stock monitoring** with proactive alerts
- **Nutrition goal tracking** with progress indicators

---

## 🛠️ **Technical Stack**

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS with custom dark theme
- **Icons**: Lucide React
- **PWA**: Service Worker + Web App Manifest
- **Build**: Vite
- **Storage**: localStorage + JSON files
- **APIs**: Telegram Bot API, GitLab API
- **Voice**: Web Speech API

---

## 📱 **PWA Installation**

### **Desktop (Chrome/Edge)**
1. Open the app in your browser
2. Look for the install icon in the address bar
3. Click "Install Smart Assistant"
4. The app will be added to your applications

### **Mobile (Android)**
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Select "Add to Home screen"
4. Confirm installation

### **Mobile (iOS)**
1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. Confirm installation

---

## 🔐 **Privacy & Security**

- **Local-first** - All data stored locally by default
- **Optional cloud sync** - GitLab integration is opt-in
- **No tracking** - No analytics or user tracking
- **Secure communications** - HTTPS for all external APIs
- **Token security** - Sensitive data stored locally only

---

## 🤝 **Contributing**

This is a personal assistant app designed for individual/family use. Feel free to fork and customize for your specific needs!

### **Customization Ideas**
- Add more meal categories (beverages, desserts)
- Integrate with other APIs (weather, calendar)
- Add more reminder frequencies
- Customize voice announcements
- Add nutrition tracking charts

---

## 📞 **Support**

For issues or questions:
1. Check the Settings page for configuration help
2. Verify JSON data format matches examples
3. Test voice/Telegram features with provided setup guides
4. Use GitLab sync for data backup and recovery

---

## 🚀 **Deployment**

### **Build for Production**
```bash
npm run build
```

### **Deploy to Static Hosting**
The built files in `dist/` can be deployed to:
- Netlify
- Vercel
- GitHub Pages
- Any static file hosting service

### **Self-Hosting**
```bash
npm run preview
```

---

## 📝 **License**

This project is open source and available under the [MIT License](LICENSE).

---

**Built with ❤️ for smart home automation and personal productivity**