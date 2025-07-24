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
    // Parse amount more carefully - extract number and handle different units
    const match = amount.match(/(\d+(?:\.\d+)?)/);
    let numericAmount = match ? parseFloat(match[1]) : 0.1;
    
    // Convert to base units if needed
    if (amount.includes('tbsp')) {
      numericAmount = numericAmount * 15; // tbsp to ml/grams
    } else if (amount.includes('tsp')) {
      numericAmount = numericAmount * 5; // tsp to ml/grams
    } else if (amount.includes('cup')) {
      numericAmount = numericAmount * 250; // cup to ml/grams
    } else if (amount.includes('small')) {
      numericAmount = numericAmount * 0.05; // small onion ~50g
    } else if (amount.includes('medium')) {
      numericAmount = numericAmount * 0.1; // medium onion ~100g
    } else if (amount.includes('large')) {
      numericAmount = numericAmount * 0.15; // large onion ~150g
    } else if (amount.includes('inch')) {
      numericAmount = numericAmount * 0.01; // inch of ginger ~10g
    } else if (amount.includes('pieces')) {
      numericAmount = numericAmount * 0.01; // pieces ~10g each
    } else if (amount.includes('g')) {
      numericAmount = numericAmount / 1000; // convert grams to kg for vegetables
    }
    
    const groceryItem = stock.groceries[ingredient];
    const vegetableItem = stock.vegetables[ingredient];
    
    if (groceryItem) {
      const unit = groceryItem.unit;
      let requiredAmount = numericAmount;
      
      // Convert required amount to match stock unit
      if (unit === 'grams' && numericAmount < 1) {
        requiredAmount = numericAmount * 1000; // kg to grams
      }
      
      if (groceryItem.quantity < requiredAmount) {
        return false;
      }
    } else if (vegetableItem) {
      const unit = vegetableItem.unit;
      let requiredAmount = numericAmount;
      
      // Convert required amount to match stock unit
      if (unit === 'grams' && numericAmount < 1) {
        requiredAmount = numericAmount * 1000; // kg to grams
      }
      
      if (vegetableItem.quantity < requiredAmount) {
        return false;
      }
    } else {
      // Ingredient not found in stock
      return false;
    }
  }
  return true;
};

export const reduceStock = (stock: Stock, dish: Dish): Stock => {
  const newStock = JSON.parse(JSON.stringify(stock));
  
  for (const [ingredient, amount] of Object.entries(dish.ingredients)) {
    // Parse amount more carefully - extract number and handle different units
    const match = amount.match(/(\d+(?:\.\d+)?)/);
    let numericAmount = match ? parseFloat(match[1]) : 0.1;
    
    // Convert to base units if needed
    if (amount.includes('tbsp')) {
      numericAmount = numericAmount * 15; // tbsp to ml/grams
    } else if (amount.includes('tsp')) {
      numericAmount = numericAmount * 5; // tsp to ml/grams
    } else if (amount.includes('cup')) {
      numericAmount = numericAmount * 250; // cup to ml/grams
    } else if (amount.includes('small')) {
      numericAmount = numericAmount * 0.05; // small onion ~50g
    } else if (amount.includes('medium')) {
      numericAmount = numericAmount * 0.1; // medium onion ~100g
    } else if (amount.includes('large')) {
      numericAmount = numericAmount * 0.15; // large onion ~150g
    } else if (amount.includes('inch')) {
      numericAmount = numericAmount * 0.01; // inch of ginger ~10g
    } else if (amount.includes('pieces')) {
      numericAmount = numericAmount * 0.01; // pieces ~10g each
    } else if (amount.includes('g')) {
      numericAmount = numericAmount / 1000; // convert grams to kg for vegetables
    }
    
    // Apply reduction to stock
    if (newStock.groceries[ingredient]) {
      const currentQty = newStock.groceries[ingredient].quantity;
      const unit = newStock.groceries[ingredient].unit;
      
      // Convert reduction amount to match stock unit
      let reductionAmount = numericAmount;
      if (unit === 'grams' && numericAmount < 1) {
        reductionAmount = numericAmount * 1000; // kg to grams
      }
      
      newStock.groceries[ingredient].quantity = Math.max(0, currentQty - reductionAmount);
    } else if (newStock.vegetables[ingredient]) {
      const currentQty = newStock.vegetables[ingredient].quantity;
      const unit = newStock.vegetables[ingredient].unit;
      
      // Convert reduction amount to match stock unit
      let reductionAmount = numericAmount;
      if (unit === 'grams' && numericAmount < 1) {
        reductionAmount = numericAmount * 1000; // kg to grams
      }
      
      newStock.vegetables[ingredient].quantity = Math.max(0, currentQty - reductionAmount);
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

// Get missing ingredients for a dish
export const getMissingIngredients = (dish: Dish, stock: Stock): string[] => {
  const missing: string[] = [];
  
  for (const [ingredient, amount] of Object.entries(dish.ingredients)) {
    // Parse amount more carefully
    const match = amount.match(/(\d+(?:\.\d+)?)/);
    let numericAmount = match ? parseFloat(match[1]) : 0.1;
    
    // Convert to base units if needed
    if (amount.includes('tbsp')) {
      numericAmount = numericAmount * 15;
    } else if (amount.includes('tsp')) {
      numericAmount = numericAmount * 5;
    } else if (amount.includes('cup')) {
      numericAmount = numericAmount * 250;
    } else if (amount.includes('small')) {
      numericAmount = numericAmount * 0.05;
    } else if (amount.includes('medium')) {
      numericAmount = numericAmount * 0.1;
    } else if (amount.includes('large')) {
      numericAmount = numericAmount * 0.15;
    } else if (amount.includes('inch')) {
      numericAmount = numericAmount * 0.01;
    } else if (amount.includes('pieces')) {
      numericAmount = numericAmount * 0.01;
    } else if (amount.includes('g')) {
      numericAmount = numericAmount / 1000;
    }
    
    const groceryItem = stock.groceries[ingredient];
    const vegetableItem = stock.vegetables[ingredient];
    
    if (groceryItem) {
      const unit = groceryItem.unit;
      let requiredAmount = numericAmount;
      
      if (unit === 'grams' && numericAmount < 1) {
        requiredAmount = numericAmount * 1000;
      }
      
      if (groceryItem.quantity < requiredAmount) {
        const shortfall = requiredAmount - groceryItem.quantity;
        missing.push(`${ingredient} (need ${shortfall.toFixed(2)} ${unit} more)`);
      }
    } else if (vegetableItem) {
      const unit = vegetableItem.unit;
      let requiredAmount = numericAmount;
      
      if (unit === 'grams' && numericAmount < 1) {
        requiredAmount = numericAmount * 1000;
      }
      
      if (vegetableItem.quantity < requiredAmount) {
        const shortfall = requiredAmount - vegetableItem.quantity;
        missing.push(`${ingredient} (need ${shortfall.toFixed(2)} ${unit} more)`);
      }
    } else {
      missing.push(`${ingredient} (not in stock)`);
    }
  }
  
  return missing;
};

// Get all missing ingredients across all meal types
export const getAllMissingIngredients = (foodMenu: FoodMenu, stock: Stock): { [mealType: string]: { dish: string; missing: string[] }[] } => {
  const result: { [mealType: string]: { dish: string; missing: string[] }[] } = {};
  
  Object.entries(foodMenu).forEach(([mealType, dishes]) => {
    result[mealType] = [];
    
    dishes.forEach(dish => {
      const missing = getMissingIngredients(dish, stock);
      if (missing.length > 0) {
        result[mealType].push({
          dish: dish.name,
          missing
        });
      }
    });
  });
  
  return result;
};

// Check if any meals are possible
export const hasAvailableMeals = (foodMenu: FoodMenu, stock: Stock): boolean => {
  for (const [mealType, dishes] of Object.entries(foodMenu)) {
    const availableDishes = dishes.filter(dish => checkDishAvailability(dish, stock));
    if (availableDishes.length > 0) {
      return true;
    }
  }
  return false;
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