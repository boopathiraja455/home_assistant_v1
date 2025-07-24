// Food and Menu Types
export interface Ingredients {
  [key: string]: string;
}

export interface Nutrition {
  protein: number;
  fiber: number;
}

export interface Dish {
  name: string;
  ingredients: Ingredients;
  nutrition: Nutrition;
}

export interface FoodMenu {
  breakfast: Dish[];
  addons: Dish[];
  lunch: Dish[];
  dinner: Dish[];
  snacks: Dish[];
}

// Stock Types
export interface StockItem {
  unit: string;
  quantity: number;
  threshold?: number;
}

export interface Stock {
  groceries: { [key: string]: StockItem };
  vegetables: { [key: string]: StockItem };
}

export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock';

// Task Types
export type TaskType = 'todo' | 'shopping';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'completed';

export interface Task {
  id: string;
  type: TaskType;
  task: string;
  due_date: string;
  due_time: string;
  priority: TaskPriority;
  status: TaskStatus;
  created_at: string;
}

// Reminder Types
export type ReminderFrequency = 'daily' | 'weekly' | 'monthly';
export type ReminderCategory = 'home' | 'health' | 'work' | 'personal';

export interface Reminder {
  id: string;
  task: string;
  category: ReminderCategory;
  frequency: ReminderFrequency;
  due_time: string;
  next_due: string;
  created_at: string;
}

// Settings Types
export interface NutritionGoals {
  user_protein: number;
  user_fiber: number;
  spouse_protein: number;
  spouse_fiber: number;
}

export interface UserInfo {
  user_weight: number;
  spouse_weight: number;
  user_name: string;
  spouse_name: string;
}

export interface VoiceSettings {
  enabled: boolean;
  schedules: VoiceSchedule[];
}

export interface VoiceSchedule {
  id: string;
  name: string;
  time: string;
  enabled: boolean;
  content_types: string[];
}

export interface TelegramSettings {
  bot_token: string;
  chat_id: string;
  enabled: boolean;
  schedules: TelegramSchedule[];
}

export interface TelegramSchedule {
  id: string;
  name: string;
  time: string;
  enabled: boolean;
  content_types: string[];
}

export interface GitLabSettings {
  token: string;
  project_id: string;
  branch: string;
  enabled: boolean;
  auto_sync_interval: number;
  last_sync: string;
}

export interface Settings {
  nutrition_goals: NutritionGoals;
  user_info: UserInfo;
  voice: VoiceSettings;
  telegram: TelegramSettings;
  gitlab: GitLabSettings;
}

// Menu Planning Types
export interface DailyMenu {
  date: string;
  breakfast: string;
  addons: string;
  lunch: string;
  dinner: string;
  snacks: string;
}

export interface MenuSuggestion {
  meal_type: keyof FoodMenu;
  dishes: string[];
  missing_ingredients: string[];
  nutrition_score: number;
}

// Voice Announcement Types
export interface VoiceContent {
  greeting: string;
  menu_today: string;
  menu_tomorrow: string;
  tasks: string;
  low_stock: string;
  reminders: string;
}

// GitLab Sync Types
export interface SyncData {
  timestamp: string;
  food_menu: FoodMenu;
  stock: Stock;
  tasks: Task[];
  reminders: Reminder[];
  settings: Settings;
  daily_menus: DailyMenu[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}