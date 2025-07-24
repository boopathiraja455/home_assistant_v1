import { Settings, DailyMenu, Task, Reminder, Stock, FoodMenu } from '../types';
import { getLowStockItems, getTodaysTasks, getTodaysReminders, hasAvailableMeals, getAllMissingIngredients } from '../utils/dataManager';

export class VoiceService {
  private synthesis: SpeechSynthesis | null = null;
  private isSupported: boolean = false;

  constructor() {
    this.isSupported = 'speechSynthesis' in window;
    if (this.isSupported) {
      this.synthesis = window.speechSynthesis;
    }
  }

  isVoiceSupported(): boolean {
    return this.isSupported;
  }

  speak(text: string, options?: { rate?: number; pitch?: number; volume?: number }): void {
    if (!this.synthesis || !this.isSupported) {
      console.warn('Speech synthesis not supported');
      return;
    }

    // Cancel any ongoing speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options?.rate || 0.9;
    utterance.pitch = options?.pitch || 1;
    utterance.volume = options?.volume || 1;

    // Use a clear, natural voice if available
    const voices = this.synthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.lang.startsWith('en') && 
      (voice.name.includes('Google') || voice.name.includes('Natural'))
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    this.synthesis.speak(utterance);
  }

  generateGreeting(userName: string): string {
    const hour = new Date().getHours();
    let timeOfDay = '';
    
    if (hour < 12) {
      timeOfDay = 'Good morning';
    } else if (hour < 17) {
      timeOfDay = 'Good afternoon';
    } else {
      timeOfDay = 'Good evening';
    }

    return `${timeOfDay}, ${userName}!`;
  }

  generateMenuAnnouncement(menu: DailyMenu, isToday: boolean = true): string {
    const dayText = isToday ? "today's" : "tomorrow's";
    
    return `Here's ${dayText} menu. For breakfast: ${menu.breakfast}, with ${menu.addons}. ` +
           `For lunch: ${menu.lunch}. For dinner: ${menu.dinner}. ` +
           `And for snacks: ${menu.snacks}.`;
  }

  generateTasksAnnouncement(tasks: Task[]): string {
    if (tasks.length === 0) {
      return "You have no pending tasks for today. Great job staying organized!";
    }

    const todoTasks = tasks.filter(task => task.type === 'todo');
    const shoppingTasks = tasks.filter(task => task.type === 'shopping');
    
    let announcement = `You have ${tasks.length} pending task${tasks.length > 1 ? 's' : ''} for today. `;
    
    if (todoTasks.length > 0) {
      announcement += `${todoTasks.length} todo item${todoTasks.length > 1 ? 's' : ''}: `;
      announcement += todoTasks.slice(0, 3).map(task => task.task).join(', ');
      if (todoTasks.length > 3) {
        announcement += ` and ${todoTasks.length - 3} more`;
      }
      announcement += '. ';
    }
    
    if (shoppingTasks.length > 0) {
      announcement += `${shoppingTasks.length} shopping item${shoppingTasks.length > 1 ? 's' : ''}: `;
      announcement += shoppingTasks.slice(0, 3).map(task => task.task).join(', ');
      if (shoppingTasks.length > 3) {
        announcement += ` and ${shoppingTasks.length - 3} more`;
      }
      announcement += '. ';
    }

    return announcement;
  }

  generateRemindersAnnouncement(reminders: Reminder[]): string {
    if (reminders.length === 0) {
      return "No reminders for today.";
    }

    let announcement = `You have ${reminders.length} reminder${reminders.length > 1 ? 's' : ''} today: `;
    announcement += reminders.slice(0, 3).map(reminder => reminder.task).join(', ');
    
    if (reminders.length > 3) {
      announcement += ` and ${reminders.length - 3} more`;
    }

    return announcement;
  }

  generateLowStockAnnouncement(stock: Stock): string {
    const lowStockItems = getLowStockItems(stock);
    
    if (lowStockItems.length === 0) {
      return "All items are well stocked.";
    }

    let announcement = `Attention! You have ${lowStockItems.length} item${lowStockItems.length > 1 ? 's' : ''} running low: `;
    announcement += lowStockItems.slice(0, 5).map(item => 
      item.replace(/_/g, ' ')
    ).join(', ');
    
    if (lowStockItems.length > 5) {
      announcement += ` and ${lowStockItems.length - 5} more items`;
    }
    
    announcement += '. Please consider restocking soon.';

    return announcement;
  }

  generateRestockAlert(
    foodMenu: FoodMenu,
    stock: Stock
  ): string {
    const hasAvailable = hasAvailableMeals(foodMenu, stock);
    
    if (!hasAvailable) {
      const missingIngredients = getAllMissingIngredients(foodMenu, stock);
      const allMissing: string[] = [];
      
      Object.values(missingIngredients).forEach(mealTypeMissing => {
        mealTypeMissing.forEach(dishInfo => {
          dishInfo.missing.forEach(item => {
            const itemName = item.split(' (')[0];
            if (!allMissing.includes(itemName)) {
              allMissing.push(itemName);
            }
          });
        });
      });

      return `Critical alert! No meals can be prepared with current stock. Please restock the following items immediately: ${allMissing.join(', ')}. I've added these to your shopping list.`;
    }

    const lowStockItems = getLowStockItems(stock);
    if (lowStockItems.length > 0) {
      const itemNames = lowStockItems.map(item => item.name);
      return `Stock alert: The following items are running low: ${itemNames.join(', ')}. Consider restocking soon.`;
    }

    return '';
  }

  generateFullAnnouncement(
    settings: Settings,
    currentMenu: DailyMenu,
    tomorrowMenu: DailyMenu,
    tasks: Task[],
    reminders: Reminder[],
    stock: Stock,
    foodMenu: FoodMenu,
    contentTypes: string[]
  ): string {
    let fullAnnouncement = '';

    if (contentTypes.includes('greeting')) {
      fullAnnouncement += this.generateGreeting(settings.user_info.user_name) + ' ';
    }

    if (contentTypes.includes('menu_today')) {
      fullAnnouncement += this.generateMenuAnnouncement(currentMenu, true) + ' ';
    }

    if (contentTypes.includes('menu_tomorrow')) {
      fullAnnouncement += this.generateMenuAnnouncement(tomorrowMenu, false) + ' ';
    }

    if (contentTypes.includes('tasks')) {
      const todaysTasks = getTodaysTasks(tasks);
      fullAnnouncement += this.generateTasksAnnouncement(todaysTasks) + ' ';
    }

    if (contentTypes.includes('reminders')) {
      const todaysReminders = getTodaysReminders(reminders);
      fullAnnouncement += this.generateRemindersAnnouncement(todaysReminders) + ' ';
    }

    if (contentTypes.includes('low_stock')) {
      fullAnnouncement += this.generateLowStockAnnouncement(stock) + ' ';
    }

    if (contentTypes.includes('restock_alert')) {
      const restockAlert = this.generateRestockAlert(foodMenu, stock);
      if (restockAlert) {
        fullAnnouncement += restockAlert + ' ';
      }
    }

    return fullAnnouncement.trim();
  }

  scheduleAnnouncement(
    time: string,
    announcement: string,
    callback?: () => void
  ): NodeJS.Timeout | null {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);
    
    // If the scheduled time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    const delay = scheduledTime.getTime() - now.getTime();
    
    if (delay > 0) {
      return setTimeout(() => {
        this.speak(announcement);
        if (callback) callback();
      }, delay);
    }
    
    return null;
  }

  cancelAllScheduled(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }
}

export const voiceService = new VoiceService();