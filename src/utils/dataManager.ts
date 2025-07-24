import { 
  FoodMenu, 
  Stock, 
  Task, 
  Reminder, 
  Settings, 
  DailyMenu,
  StockStatus,
  Dish,
  StockItem
} from '../types';

// Default Settings
const defaultSettings: Settings = {
  nutrition_goals: {
    user_protein: 60,
    user_fiber: 25,
    spouse_protein: 45,
    spouse_fiber: 20
  },
  user_info: {
    user_weight: 71,
    spouse_weight: 55,
    user_name: "User",
    spouse_name: "Spouse"
  },
  voice: {
    enabled: true,
    schedules: [
      {
        id: "morning",
        name: "Morning Update",
        time: "07:00",
        enabled: true,
        content_types: ["greeting", "menu_today", "tasks", "reminders"]
      },
      {
        id: "lunch",
        name: "Lunch Reminder",
        time: "12:30",
        enabled: true,
        content_types: ["menu_today"]
      },
      {
        id: "evening",
        name: "Evening Update",
        time: "18:00",
        enabled: true,
        content_types: ["menu_tomorrow", "low_stock", "tasks"]
      }
    ]
  },
  telegram: {
    bot_token: "",
    chat_id: "",
    enabled: false,
    schedules: [
      {
        id: "daily_update",
        name: "Daily Update",
        time: "08:00",
        enabled: false,
        content_types: ["menu_today", "tasks", "low_stock"]
      }
    ]
  },
  gitlab: {
    token: "",
    project_id: "",
    branch: "main",
    enabled: false,
    auto_sync_interval: 5,
    last_sync: ""
  }
};

// Data Loading Functions
export const loadFoodMenu = async (): Promise<FoodMenu> => {
  const stored = localStorage.getItem('food_menu');
  if (stored) {
    return JSON.parse(stored);
  }
  
  try {
    const response = await fetch('/data/food_menu.json');
    const data = await response.json();
    localStorage.setItem('food_menu', JSON.stringify(data));
    return data;
  } catch (error) {
    console.error('Error loading food menu:', error);
    return { breakfast: [], addons: [], lunch: [], dinner: [], snacks: [] };
  }
};

export const loadStock = async (): Promise<Stock> => {
  const stored = localStorage.getItem('stock');
  if (stored) {
    return JSON.parse(stored);
  }
  
  try {
    const response = await fetch('/data/stock.json');
    const data = await response.json();
    localStorage.setItem('stock', JSON.stringify(data));
    return data;
  } catch (error) {
    console.error('Error loading stock:', error);
    return { groceries: {}, vegetables: {} };
  }
};

export const loadTasks = async (): Promise<Task[]> => {
  const stored = localStorage.getItem('tasks');
  if (stored) {
    return JSON.parse(stored);
  }
  
  try {
    const response = await fetch('/data/daily_todo.json');
    const data = await response.json();
    localStorage.setItem('tasks', JSON.stringify(data));
    return data;
  } catch (error) {
    console.error('Error loading tasks:', error);
    return [];
  }
};

export const loadReminders = async (): Promise<Reminder[]> => {
  const stored = localStorage.getItem('reminders');
  if (stored) {
    return JSON.parse(stored);
  }
  
  try {
    const response = await fetch('/data/reminder.json');
    const data = await response.json();
    localStorage.setItem('reminders', JSON.stringify(data));
    return data;
  } catch (error) {
    console.error('Error loading reminders:', error);
    return [];
  }
};

export const loadSettings = (): Settings => {
  const stored = localStorage.getItem('settings');
  if (stored) {
    return { ...defaultSettings, ...JSON.parse(stored) };
  }
  
  localStorage.setItem('settings', JSON.stringify(defaultSettings));
  return defaultSettings;
};

export const loadDailyMenus = (): DailyMenu[] => {
  const stored = localStorage.getItem('daily_menus');
  if (stored) {
    return JSON.parse(stored);
  }
  
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  
  const defaultMenus: DailyMenu[] = [
    {
      date: today,
      breakfast: "Wheat Dosa",
      addons: "Coconut Chutney",
      lunch: "Rice & Dal",
      dinner: "Light Rice & Dal",
      snacks: "Tea & Biscuits"
    },
    {
      date: tomorrow,
      breakfast: "Poha",
      addons: "Pickle",
      lunch: "Chapati & Sabzi",
      dinner: "Chapati & Light Curry",
      snacks: "Fruits"
    }
  ];
  
  localStorage.setItem('daily_menus', JSON.stringify(defaultMenus));
  return defaultMenus;
};

// Data Saving Functions
export const saveData = (key: string, data: any): void => {
  localStorage.setItem(key, JSON.stringify(data));
  
  // Trigger auto-sync if enabled
  const settings = loadSettings();
  if (settings.gitlab.enabled) {
    // Auto-sync will be handled by a separate service
    console.log('Auto-sync triggered for:', key);
  }
};

export const saveFoodMenu = (menu: FoodMenu): void => saveData('food_menu', menu);
export const saveStock = (stock: Stock): void => saveData('stock', stock);
export const saveTasks = (tasks: Task[]): void => saveData('tasks', tasks);
export const saveReminders = (reminders: Reminder[]): void => saveData('reminders', reminders);
export const saveSettings = (settings: Settings): void => saveData('settings', settings);
export const saveDailyMenus = (menus: DailyMenu[]): void => saveData('daily_menus', menus);

// Stock Management Functions
export const getStockStatus = (item: StockItem): StockStatus => {
  if (item.quantity === 0) return 'out-of-stock';
  if (item.threshold && item.quantity <= item.threshold) return 'low-stock';
  return 'in-stock';
};

export const getLowStockItems = (stock: Stock): string[] => {
  const lowItems: string[] = [];
  
  Object.entries(stock.groceries).forEach(([name, item]) => {
    if (getStockStatus(item) === 'low-stock' || getStockStatus(item) === 'out-of-stock') {
      lowItems.push(name);
    }
  });
  
  Object.entries(stock.vegetables).forEach(([name, item]) => {
    if (getStockStatus(item) === 'low-stock' || getStockStatus(item) === 'out-of-stock') {
      lowItems.push(name);
    }
  });
  
  return lowItems;
};

export const checkDishAvailability = (dish: Dish, stock: Stock): boolean => {
  for (const [ingredient, amount] of Object.entries(dish.ingredients)) {
    const stockItem = stock.groceries[ingredient] || stock.vegetables[ingredient];
    if (!stockItem || stockItem.quantity === 0) {
      return false;
    }
  }
  return true;
};

export const reduceStock = (stock: Stock, dish: Dish): Stock => {
  const newStock = JSON.parse(JSON.stringify(stock));
  
  for (const [ingredient, amount] of Object.entries(dish.ingredients)) {
    const numericAmount = parseFloat(amount.replace(/[^\d.]/g, '')) || 0.1;
    
    if (newStock.groceries[ingredient]) {
      newStock.groceries[ingredient].quantity = Math.max(0, 
        newStock.groceries[ingredient].quantity - numericAmount
      );
    } else if (newStock.vegetables[ingredient]) {
      newStock.vegetables[ingredient].quantity = Math.max(0, 
        newStock.vegetables[ingredient].quantity - numericAmount
      );
    }
  }
  
  return newStock;
};

// Menu Planning Functions
export const getAvailableDishes = (foodMenu: FoodMenu, stock: Stock, mealType: keyof FoodMenu): string[] => {
  return foodMenu[mealType]
    .filter(dish => checkDishAvailability(dish, stock))
    .map(dish => dish.name);
};

export const rotateMeal = (
  currentMeal: string, 
  foodMenu: FoodMenu, 
  stock: Stock, 
  mealType: keyof FoodMenu
): string => {
  const availableDishes = getAvailableDishes(foodMenu, stock, mealType);
  
  if (availableDishes.length === 0) {
    return currentMeal; // No alternatives available
  }
  
  const currentIndex = availableDishes.indexOf(currentMeal);
  const nextIndex = (currentIndex + 1) % availableDishes.length;
  return availableDishes[nextIndex];
};

// Task Management Functions
export const generateTaskId = (): string => {
  return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const generateReminderId = (): string => {
  return `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const getPendingTasks = (tasks: Task[]): Task[] => {
  return tasks.filter(task => task.status === 'pending');
};

export const getTodaysTasks = (tasks: Task[]): Task[] => {
  const today = new Date().toISOString().split('T')[0];
  return tasks.filter(task => task.due_date === today && task.status === 'pending');
};

export const getTodaysReminders = (reminders: Reminder[]): Reminder[] => {
  const today = new Date().toISOString().split('T')[0];
  return reminders.filter(reminder => 
    reminder.next_due.startsWith(today)
  );
};

// Utility Functions
export const formatTime = (time: string): string => {
  return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

export const getCurrentTime = (): string => {
  return new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

export const getCurrentDate = (): string => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};