import { TelegramSettings, DailyMenu, Task, Reminder, FoodMenu, Stock } from '../types';
import { getLowStockItems, hasAvailableMeals, getAllMissingIngredients } from '../utils/dataManager';

export class TelegramService {
  private botToken: string = '';
  private chatId: string = '';
  private enabled: boolean = false;

  constructor(settings?: TelegramSettings) {
    if (settings) {
      this.updateSettings(settings);
    }
  }

  updateSettings(settings: TelegramSettings): void {
    this.botToken = settings.bot_token;
    this.chatId = settings.chat_id;
    this.enabled = settings.enabled;
  }

  isConfigured(): boolean {
    return this.enabled && this.botToken !== '' && this.chatId !== '';
  }

  async sendMessage(text: string, options?: {
    parse_mode?: 'Markdown' | 'HTML';
    disable_notification?: boolean;
  }): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('Telegram service not configured');
      return false;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: text,
          parse_mode: options?.parse_mode || 'Markdown',
          disable_notification: options?.disable_notification || false,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.ok;
    } catch (error) {
      console.error('Error sending Telegram message:', error);
      return false;
    }
  }

  async sendFormattedMessage(
    title: string,
    content: string[],
    emoji?: string
  ): Promise<boolean> {
    const emojiPrefix = emoji ? `${emoji} ` : '🤖 ';
    let message = `${emojiPrefix}*${title}*\n\n`;
    
    content.forEach((item, index) => {
      message += `${index + 1}. ${item}\n`;
    });

    return this.sendMessage(message);
  }

  async sendMenuUpdate(
    todayMenu: any,
    tomorrowMenu: any
  ): Promise<boolean> {
    const message = `🍽️ *Daily Menu Update*\n\n` +
      `*Today's Menu:*\n` +
      `🌅 Breakfast: ${todayMenu.breakfast}\n` +
      `➕ Add-ons: ${todayMenu.addons}\n` +
      `🌞 Lunch: ${todayMenu.lunch}\n` +
      `🌙 Dinner: ${todayMenu.dinner}\n` +
      `🍿 Snacks: ${todayMenu.snacks}\n\n` +
      `*Tomorrow's Menu:*\n` +
      `🌅 Breakfast: ${tomorrowMenu.breakfast}\n` +
      `➕ Add-ons: ${tomorrowMenu.addons}\n` +
      `🌞 Lunch: ${tomorrowMenu.lunch}\n` +
      `🌙 Dinner: ${tomorrowMenu.dinner}\n` +
      `🍿 Snacks: ${tomorrowMenu.snacks}`;

    return this.sendMessage(message);
  }

  async sendTaskReminder(tasks: any[]): Promise<boolean> {
    if (tasks.length === 0) {
      return this.sendMessage('✅ *Task Update*\n\nNo pending tasks for today! Great job! 🎉');
    }

    const todoTasks = tasks.filter(task => task.type === 'todo');
    const shoppingTasks = tasks.filter(task => task.type === 'shopping');

    let message = `📋 *Task Reminder*\n\nYou have ${tasks.length} pending task${tasks.length > 1 ? 's' : ''}:\n\n`;

    if (todoTasks.length > 0) {
      message += `*Todo Tasks:*\n`;
      todoTasks.forEach((task, index) => {
        const priority = task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢';
        message += `${priority} ${task.task} (Due: ${task.due_time})\n`;
      });
      message += '\n';
    }

    if (shoppingTasks.length > 0) {
      message += `*Shopping Tasks:*\n`;
      shoppingTasks.forEach((task, index) => {
        const priority = task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢';
        message += `${priority} ${task.task} (Due: ${task.due_time})\n`;
      });
    }

    return this.sendMessage(message);
  }

  async sendLowStockAlert(lowStockItems: string[]): Promise<boolean> {
    if (lowStockItems.length === 0) {
      return this.sendMessage('📦 *Stock Update*\n\nAll items are well stocked! 👍');
    }

    let message = `⚠️ *Low Stock Alert*\n\n`;
    message += `You have ${lowStockItems.length} item${lowStockItems.length > 1 ? 's' : ''} running low:\n\n`;
    
    lowStockItems.forEach((item, index) => {
      message += `• ${item.replace(/_/g, ' ')}\n`;
    });
    
    message += `\n🛒 Consider restocking these items soon!`;

    return this.sendMessage(message);
  }

  async sendVoiceAnnouncementContent(content: string): Promise<boolean> {
    const message = `🔊 *Voice Announcement*\n\n${content}`;
    return this.sendMessage(message, { disable_notification: true });
  }

  async sendDailyUpdate(
    menu: any,
    tasks: any[],
    lowStockItems: string[],
    reminders: any[]
  ): Promise<boolean> {
    let message = `📱 *Daily Smart Assistant Update*\n\n`;

    // Menu section
    message += `🍽️ *Today's Menu:*\n`;
    message += `🌅 ${menu.breakfast} + ${menu.addons}\n`;
    message += `🌞 ${menu.lunch}\n`;
    message += `🌙 ${menu.dinner}\n`;
    message += `🍿 ${menu.snacks}\n\n`;

    // Tasks section
    if (tasks.length > 0) {
      message += `📋 *Pending Tasks (${tasks.length}):*\n`;
      tasks.slice(0, 5).forEach(task => {
        const icon = task.type === 'shopping' ? '🛒' : '✅';
        const priority = task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢';
        message += `${icon} ${priority} ${task.task}\n`;
      });
      if (tasks.length > 5) {
        message += `... and ${tasks.length - 5} more tasks\n`;
      }
      message += '\n';
    } else {
      message += `✅ *No pending tasks today!*\n\n`;
    }

    // Reminders section
    if (reminders.length > 0) {
      message += `🔔 *Today's Reminders (${reminders.length}):*\n`;
      reminders.slice(0, 3).forEach(reminder => {
        message += `• ${reminder.task} (${reminder.due_time})\n`;
      });
      if (reminders.length > 3) {
        message += `... and ${reminders.length - 3} more reminders\n`;
      }
      message += '\n';
    }

    // Stock section
    if (lowStockItems.length > 0) {
      message += `⚠️ *Low Stock Items (${lowStockItems.length}):*\n`;
      lowStockItems.slice(0, 5).forEach(item => {
        message += `📦 ${item.replace(/_/g, ' ')}\n`;
      });
      if (lowStockItems.length > 5) {
        message += `... and ${lowStockItems.length - 5} more items\n`;
      }
    } else {
      message += `📦 *All items well stocked!*\n`;
    }

    message += `\n🤖 Have a great day!`;

    return this.sendMessage(message);
  }

  scheduleMessage(
    time: string,
    messageFunction: () => Promise<boolean>,
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
      return setTimeout(async () => {
        await messageFunction();
        if (callback) callback();
      }, delay);
    }
    
    return null;
  }

  async testConnection(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/getMe`);
      const result = await response.json();
      return result.ok;
    } catch (error) {
      console.error('Error testing Telegram connection:', error);
      return false;
    }
  }

  async sendRestockAlert(foodMenu: FoodMenu, stock: Stock): Promise<boolean> {
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

      const message = `🚨 *CRITICAL STOCK ALERT* 🚨\n\n` +
                     `⚠️ No meals can be prepared with current stock!\n\n` +
                     `📝 *Missing Ingredients:*\n${allMissing.map(item => `• ${item}`).join('\n')}\n\n` +
                     `🛒 Please restock these items immediately!\n` +
                     `📱 Items have been added to your shopping list.`;
      
      return await this.sendMessage(message);
    }

    const lowStockItems = getLowStockItems(stock);
    if (lowStockItems.length > 0) {
      const itemList = lowStockItems.map(item => 
        `• ${item.name}: ${item.quantity} ${item.unit} left${item.threshold ? ` (threshold: ${item.threshold})` : ''}`
      ).join('\n');

      const message = `📦 *Stock Warning* 📦\n\n` +
                     `⚠️ Some ingredients are running low:\n\n` +
                     `${itemList}\n\n` +
                     `🛒 Consider restocking soon to avoid meal preparation issues.`;
      
      return await this.sendMessage(message);
    }

    return true;
  }
}

export const telegramService = new TelegramService();