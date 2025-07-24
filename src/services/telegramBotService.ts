import { TelegramSettings, Task, DailyMenu, Stock, Reminder, FoodMenu } from '../types';
import { getTodaysTasks, getTodaysReminders, getLowStockItems, getStockStatus } from '../utils/dataManager';
import { telegramService } from './telegramService';

export interface BotCommand {
  command: string;
  description: string;
  handler: (chatId: string, messageText: string) => Promise<void>;
}

export class TelegramBotService {
  private botToken: string = '';
  private webhookUrl: string = '';
  private commands: BotCommand[] = [];
  private isPolling: boolean = false;
  private pollingInterval: NodeJS.Timeout | null = null;

  // Data references - these will be injected from the main app
  private tasks: Task[] = [];
  private reminders: Reminder[] = [];
  private currentMenu: DailyMenu | null = null;
  private tomorrowMenu: DailyMenu | null = null;
  private stock: Stock = { groceries: {}, vegetables: {} };
  private foodMenu: FoodMenu = { breakfast: [], addons: [], lunch: [], dinner: [], snacks: [] };

  constructor() {
    this.initializeCommands();
  }

  updateSettings(settings: TelegramSettings): void {
    this.botToken = settings.bot_token;
    telegramService.updateSettings(settings);
  }

  // Inject data from the main app
  updateData(data: {
    tasks: Task[];
    reminders: Reminder[];
    currentMenu: DailyMenu;
    tomorrowMenu: DailyMenu;
    stock: Stock;
    foodMenu: FoodMenu;
  }): void {
    this.tasks = data.tasks;
    this.reminders = data.reminders;
    this.currentMenu = data.currentMenu;
    this.tomorrowMenu = data.tomorrowMenu;
    this.stock = data.stock;
    this.foodMenu = data.foodMenu;
  }

  private initializeCommands(): void {
    this.commands = [
      {
        command: '/start',
        description: 'Start the bot and see available commands',
        handler: this.handleStartCommand.bind(this)
      },
      {
        command: '/help',
        description: 'Show all available commands',
        handler: this.handleHelpCommand.bind(this)
      },
      {
        command: '/due',
        description: 'Show today\'s due tasks and reminders',
        handler: this.handleDueCommand.bind(this)
      },
      {
        command: '/menu',
        description: 'Show today\'s and tomorrow\'s menu',
        handler: this.handleMenuCommand.bind(this)
      },
      {
        command: '/stocks',
        description: 'Show current stock levels for all items',
        handler: this.handleStocksCommand.bind(this)
      },
      {
        command: '/lowstocks',
        description: 'Show items that are running low or out of stock',
        handler: this.handleLowStocksCommand.bind(this)
      },
      {
        command: '/nutrition',
        description: 'Show today\'s nutrition summary',
        handler: this.handleNutritionCommand.bind(this)
      },
      {
        command: '/status',
        description: 'Show complete daily status overview',
        handler: this.handleStatusCommand.bind(this)
      }
    ];
  }

  private async handleStartCommand(chatId: string, messageText: string): Promise<void> {
    const message = `🤖 *Welcome to Smart Assistant Bot!*\n\n` +
      `I can help you manage your daily tasks, menu, and stock levels.\n\n` +
      `*Available Commands:*\n` +
      this.commands.map(cmd => `${cmd.command} - ${cmd.description}`).join('\n') +
      `\n\n💡 Just type any command to get started!`;

    await telegramService.sendMessage(message);
  }

  private async handleHelpCommand(chatId: string, messageText: string): Promise<void> {
    const message = `📋 *Smart Assistant Bot Commands*\n\n` +
      this.commands.map(cmd => `${cmd.command} - ${cmd.description}`).join('\n') +
      `\n\n🔄 Commands are updated in real-time with your app data.`;

    await telegramService.sendMessage(message);
  }

  private async handleDueCommand(chatId: string, messageText: string): Promise<void> {
    const todaysTasks = getTodaysTasks(this.tasks);
    const todaysReminders = getTodaysReminders(this.reminders);
    
    let message = `📅 *Today's Due Items*\n\n`;

    if (todaysTasks.length === 0 && todaysReminders.length === 0) {
      message += '✅ No items due today! You\'re all caught up! 🎉';
    } else {
      // Tasks
      if (todaysTasks.length > 0) {
        message += `📋 *Tasks (${todaysTasks.length}):*\n`;
        todaysTasks.forEach(task => {
          const priority = task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢';
          const type = task.type === 'shopping' ? '🛒' : '✅';
          message += `${type} ${priority} ${task.task}\n`;
          message += `   ⏰ Due: ${task.due_time}\n\n`;
        });
      }

      // Reminders
      if (todaysReminders.length > 0) {
        message += `🔔 *Reminders (${todaysReminders.length}):*\n`;
        todaysReminders.forEach(reminder => {
          const categoryEmoji = {
            home: '🏠',
            health: '🏥',
            work: '💼',
            personal: '👤'
          }[reminder.category] || '📝';
          
          message += `${categoryEmoji} ${reminder.task}\n`;
          message += `   ⏰ ${reminder.due_time} (${reminder.frequency})\n\n`;
        });
      }
    }

    await telegramService.sendMessage(message);
  }

  private async handleMenuCommand(chatId: string, messageText: string): Promise<void> {
    if (!this.currentMenu || !this.tomorrowMenu) {
      await telegramService.sendMessage('❌ Menu data not available. Please check the app.');
      return;
    }

    const message = `🍽️ *Daily Menu*\n\n` +
      `*📅 Today (${new Date().toLocaleDateString()}):*\n` +
      `🌅 Breakfast: ${this.currentMenu.breakfast}\n` +
      `➕ Add-ons: ${this.currentMenu.addons}\n` +
      `🌞 Lunch: ${this.currentMenu.lunch}\n` +
      `🌙 Dinner: ${this.currentMenu.dinner}\n` +
      `🍿 Snacks: ${this.currentMenu.snacks}\n\n` +
      `*📅 Tomorrow:*\n` +
      `🌅 Breakfast: ${this.tomorrowMenu.breakfast}\n` +
      `➕ Add-ons: ${this.tomorrowMenu.addons}\n` +
      `🌞 Lunch: ${this.tomorrowMenu.lunch}\n` +
      `🌙 Dinner: ${this.tomorrowMenu.dinner}\n` +
      `🍿 Snacks: ${this.tomorrowMenu.snacks}`;

    await telegramService.sendMessage(message);
  }

  private async handleStocksCommand(chatId: string, messageText: string): Promise<void> {
    let message = `📦 *Current Stock Levels*\n\n`;

    // Vegetables
    const vegetables = Object.entries(this.stock.vegetables);
    if (vegetables.length > 0) {
      message += `🥬 *Vegetables:*\n`;
      vegetables.forEach(([name, item]) => {
        const status = getStockStatus(item);
        const statusEmoji = status === 'in-stock' ? '✅' : status === 'low-stock' ? '⚠️' : '❌';
        const formattedName = name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        message += `${statusEmoji} ${formattedName}: ${item.quantity} ${item.unit}\n`;
      });
      message += '\n';
    }

    // Groceries
    const groceries = Object.entries(this.stock.groceries);
    if (groceries.length > 0) {
      message += `🛒 *Groceries:*\n`;
      groceries.forEach(([name, item]) => {
        const status = getStockStatus(item);
        const statusEmoji = status === 'in-stock' ? '✅' : status === 'low-stock' ? '⚠️' : '❌';
        const formattedName = name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        message += `${statusEmoji} ${formattedName}: ${item.quantity} ${item.unit}\n`;
      });
    }

    // Summary
    const allItems = [...vegetables, ...groceries];
    const inStock = allItems.filter(([, item]) => getStockStatus(item) === 'in-stock').length;
    const lowStock = allItems.filter(([, item]) => getStockStatus(item) === 'low-stock').length;
    const outOfStock = allItems.filter(([, item]) => getStockStatus(item) === 'out-of-stock').length;

    message += `\n📊 *Summary:*\n`;
    message += `✅ In Stock: ${inStock}\n`;
    message += `⚠️ Low Stock: ${lowStock}\n`;
    message += `❌ Out of Stock: ${outOfStock}`;

    await telegramService.sendMessage(message);
  }

  private async handleLowStocksCommand(chatId: string, messageText: string): Promise<void> {
    const lowStockItems = getLowStockItems(this.stock);
    
    if (lowStockItems.length === 0) {
      const message = `✅ *All Items Well Stocked!*\n\n` +
        `🎉 No items are running low. Great job keeping everything stocked!`;
      await telegramService.sendMessage(message);
      return;
    }

    let message = `⚠️ *Low Stock Alert*\n\n` +
      `You have ${lowStockItems.length} item${lowStockItems.length > 1 ? 's' : ''} that need attention:\n\n`;

    // Separate by category and status
    const lowVegetables: string[] = [];
    const outVegetables: string[] = [];
    const lowGroceries: string[] = [];
    const outGroceries: string[] = [];

    lowStockItems.forEach(itemName => {
      const vegItem = this.stock.vegetables[itemName];
      const grocItem = this.stock.groceries[itemName];
      
      if (vegItem) {
        if (vegItem.quantity === 0) {
          outVegetables.push(itemName);
        } else {
          lowVegetables.push(itemName);
        }
      } else if (grocItem) {
        if (grocItem.quantity === 0) {
          outGroceries.push(itemName);
        } else {
          lowGroceries.push(itemName);
        }
      }
    });

    if (outVegetables.length > 0) {
      message += `❌ *Out of Stock - Vegetables:*\n`;
      outVegetables.forEach(item => {
        const formattedName = item.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        message += `• ${formattedName}\n`;
      });
      message += '\n';
    }

    if (lowVegetables.length > 0) {
      message += `⚠️ *Low Stock - Vegetables:*\n`;
      lowVegetables.forEach(item => {
        const vegItem = this.stock.vegetables[item];
        const formattedName = item.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        message += `• ${formattedName}: ${vegItem.quantity} ${vegItem.unit}\n`;
      });
      message += '\n';
    }

    if (outGroceries.length > 0) {
      message += `❌ *Out of Stock - Groceries:*\n`;
      outGroceries.forEach(item => {
        const formattedName = item.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        message += `• ${formattedName}\n`;
      });
      message += '\n';
    }

    if (lowGroceries.length > 0) {
      message += `⚠️ *Low Stock - Groceries:*\n`;
      lowGroceries.forEach(item => {
        const grocItem = this.stock.groceries[item];
        const formattedName = item.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        message += `• ${formattedName}: ${grocItem.quantity} ${grocItem.unit}\n`;
      });
      message += '\n';
    }

    message += `🛒 *Tip:* Add these items to your shopping list in the app!`;

    await telegramService.sendMessage(message);
  }

  private async handleNutritionCommand(chatId: string, messageText: string): Promise<void> {
    if (!this.currentMenu) {
      await telegramService.sendMessage('❌ Menu data not available for nutrition calculation.');
      return;
    }

    // Calculate nutrition for today's menu
    let totalProtein = 0;
    let totalFiber = 0;

    const meals = [
      this.currentMenu.breakfast,
      this.currentMenu.addons,
      this.currentMenu.lunch,
      this.currentMenu.dinner,
      this.currentMenu.snacks
    ];

    meals.forEach(mealName => {
      for (const category of Object.values(this.foodMenu)) {
        const dish = category.find(d => d.name === mealName);
        if (dish) {
          totalProtein += dish.nutrition.protein;
          totalFiber += dish.nutrition.fiber;
          break;
        }
      }
    });

    const message = `🎯 *Today's Nutrition Summary*\n\n` +
      `📊 *Total Intake:*\n` +
      `🥩 Protein: ${totalProtein}g\n` +
      `🌾 Fiber: ${totalFiber}g\n\n` +
      `📋 *Menu Breakdown:*\n` +
      `🌅 ${this.currentMenu.breakfast} + ${this.currentMenu.addons}\n` +
      `🌞 ${this.currentMenu.lunch}\n` +
      `🌙 ${this.currentMenu.dinner}\n` +
      `🍿 ${this.currentMenu.snacks}\n\n` +
      `💡 *Tip:* Check the app for detailed nutrition goals and progress tracking!`;

    await telegramService.sendMessage(message);
  }

  private async handleStatusCommand(chatId: string, messageText: string): Promise<void> {
    const todaysTasks = getTodaysTasks(this.tasks);
    const todaysReminders = getTodaysReminders(this.reminders);
    const lowStockItems = getLowStockItems(this.stock);

    let message = `📱 *Smart Assistant Status Overview*\n\n`;

    // Quick stats
    message += `📊 *Quick Stats:*\n`;
    message += `📋 Tasks Due Today: ${todaysTasks.length}\n`;
    message += `🔔 Reminders: ${todaysReminders.length}\n`;
    message += `⚠️ Low Stock Items: ${lowStockItems.length}\n\n`;

    // Today's menu
    if (this.currentMenu) {
      message += `🍽️ *Today's Menu:*\n`;
      message += `🌅 ${this.currentMenu.breakfast} + ${this.currentMenu.addons}\n`;
      message += `🌞 ${this.currentMenu.lunch}\n`;
      message += `🌙 ${this.currentMenu.dinner}\n`;
      message += `🍿 ${this.currentMenu.snacks}\n\n`;
    }

    // High priority tasks
    const highPriorityTasks = todaysTasks.filter(task => task.priority === 'high');
    if (highPriorityTasks.length > 0) {
      message += `🔴 *High Priority Tasks:*\n`;
      highPriorityTasks.forEach(task => {
        const type = task.type === 'shopping' ? '🛒' : '✅';
        message += `${type} ${task.task} (${task.due_time})\n`;
      });
      message += '\n';
    }

    // Critical stock items (out of stock)
    const outOfStockItems = lowStockItems.filter(item => {
      const vegItem = this.stock.vegetables[item];
      const grocItem = this.stock.groceries[item];
      return (vegItem && vegItem.quantity === 0) || (grocItem && grocItem.quantity === 0);
    });

    if (outOfStockItems.length > 0) {
      message += `❌ *Critical - Out of Stock:*\n`;
      outOfStockItems.slice(0, 5).forEach(item => {
        const formattedName = item.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        message += `• ${formattedName}\n`;
      });
      if (outOfStockItems.length > 5) {
        message += `... and ${outOfStockItems.length - 5} more items\n`;
      }
      message += '\n';
    }

    message += `🤖 Use specific commands for detailed information:\n`;
    message += `/due /menu /stocks /lowstocks /nutrition`;

    await telegramService.sendMessage(message);
  }

  // Start polling for messages (alternative to webhooks)
  startPolling(): void {
    if (this.isPolling || !this.botToken) return;

    this.isPolling = true;
    let offset = 0;

    const poll = async () => {
      try {
        const response = await fetch(`https://api.telegram.org/bot${this.botToken}/getUpdates?offset=${offset}&timeout=30`);
        const data = await response.json();

        if (data.ok && data.result.length > 0) {
          for (const update of data.result) {
            offset = update.update_id + 1;
            await this.processUpdate(update);
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }

      if (this.isPolling) {
        this.pollingInterval = setTimeout(poll, 1000);
      }
    };

    poll();
  }

  stopPolling(): void {
    this.isPolling = false;
    if (this.pollingInterval) {
      clearTimeout(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private async processUpdate(update: any): Promise<void> {
    if (!update.message || !update.message.text) return;

    const chatId = update.message.chat.id.toString();
    const messageText = update.message.text.trim();

    // Find matching command
    const command = this.commands.find(cmd => 
      messageText.startsWith(cmd.command)
    );

    if (command) {
      try {
        await command.handler(chatId, messageText);
      } catch (error) {
        console.error(`Error handling command ${command.command}:`, error);
        await telegramService.sendMessage('❌ Sorry, there was an error processing your command. Please try again.');
      }
    } else {
      // Unknown command
      const message = `❓ Unknown command: ${messageText}\n\n` +
        `Type /help to see all available commands.`;
      await telegramService.sendMessage(message);
    }
  }

  // Set bot commands (so they appear in Telegram UI)
  async setBotCommands(): Promise<boolean> {
    if (!this.botToken) return false;

    try {
      const commands = this.commands.filter(cmd => cmd.command !== '/start').map(cmd => ({
        command: cmd.command.substring(1), // Remove the '/' prefix
        description: cmd.description
      }));

      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/setMyCommands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commands })
      });

      const result = await response.json();
      return result.ok;
    } catch (error) {
      console.error('Error setting bot commands:', error);
      return false;
    }
  }

  getAvailableCommands(): BotCommand[] {
    return [...this.commands];
  }
}

export const telegramBotService = new TelegramBotService();