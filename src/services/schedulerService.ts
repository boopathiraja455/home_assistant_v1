import { Settings, Task, Reminder, DailyMenu, Stock, FoodMenu } from '../types';
import { voiceService } from './voiceService';
import { telegramService } from './telegramService';
import { getTodaysTasks, getTodaysReminders, getLowStockItems } from '../utils/dataManager';

export class SchedulerService {
  private scheduledJobs: Map<string, NodeJS.Timeout> = new Map();
  private isRunning: boolean = false;
  
  // Data references
  private settings: Settings | null = null;
  private tasks: Task[] = [];
  private reminders: Reminder[] = [];
  private currentMenu: DailyMenu | null = null;
  private tomorrowMenu: DailyMenu | null = null;
  private stock: Stock = { groceries: {}, vegetables: {} };
  private foodMenu: FoodMenu = { breakfast: [], addons: [], lunch: [], dinner: [], snacks: [] };

  updateData(data: {
    settings: Settings;
    tasks: Task[];
    reminders: Reminder[];
    currentMenu: DailyMenu;
    tomorrowMenu: DailyMenu;
    stock: Stock;
    foodMenu: FoodMenu;
  }): void {
    this.settings = data.settings;
    this.tasks = data.tasks;
    this.reminders = data.reminders;
    this.currentMenu = data.currentMenu;
    this.tomorrowMenu = data.tomorrowMenu;
    this.stock = data.stock;
    this.foodMenu = data.foodMenu;

    // Restart scheduling with new data
    this.stop();
    this.start();
  }

  start(): void {
    if (this.isRunning || !this.settings) return;
    
    this.isRunning = true;
    this.scheduleVoiceAnnouncements();
    this.scheduleTelegramMessages();
    this.scheduleTaskReminders();
    
    console.log('Scheduler service started');
  }

  stop(): void {
    this.isRunning = false;
    
    // Clear all scheduled jobs
    this.scheduledJobs.forEach((timeout, key) => {
      clearTimeout(timeout);
    });
    this.scheduledJobs.clear();
    
    console.log('Scheduler service stopped');
  }

  private scheduleVoiceAnnouncements(): void {
    if (!this.settings?.voice.enabled) return;

    this.settings.voice.schedules.forEach(schedule => {
      if (!schedule.enabled) return;

      const jobId = `voice-${schedule.id}`;
      const timeout = this.scheduleDaily(schedule.time, async () => {
        try {
          const announcement = voiceService.generateFullAnnouncement(
            this.settings!,
            this.currentMenu!,
            this.tomorrowMenu!,
            this.tasks,
            this.reminders,
            this.stock,
            this.foodMenu,
            schedule.content_types
          );
          
          voiceService.speak(announcement);
          console.log(`Voice announcement played: ${schedule.name}`);
        } catch (error) {
          console.error(`Error playing voice announcement ${schedule.name}:`, error);
        }
      });

      if (timeout) {
        this.scheduledJobs.set(jobId, timeout);
      }
    });
  }

  private scheduleTelegramMessages(): void {
    if (!this.settings?.telegram.enabled) return;

    this.settings.telegram.schedules.forEach(schedule => {
      if (!schedule.enabled) return;

      const jobId = `telegram-${schedule.id}`;
      const timeout = this.scheduleDaily(schedule.time, async () => {
        try {
          if (schedule.content_types.includes('menu_today') && schedule.content_types.includes('tasks')) {
            // Send daily update
            const todaysTasks = getTodaysTasks(this.tasks);
            const todaysReminders = getTodaysReminders(this.reminders);
            const lowStockItems = getLowStockItems(this.stock);
            
            await telegramService.sendDailyUpdate(
              this.currentMenu!,
              todaysTasks,
              lowStockItems,
              todaysReminders
            );
          } else if (schedule.content_types.includes('low_stock')) {
            // Send low stock alert
            const lowStockItems = getLowStockItems(this.stock);
            await telegramService.sendLowStockAlert(lowStockItems);
          } else if (schedule.content_types.includes('tasks')) {
            // Send task reminder
            const todaysTasks = getTodaysTasks(this.tasks);
            await telegramService.sendTaskReminder(todaysTasks);
          } else if (schedule.content_types.includes('menu_today')) {
            // Send menu update
            await telegramService.sendMenuUpdate(this.currentMenu!, this.tomorrowMenu!);
          }
          
          console.log(`Telegram message sent: ${schedule.name}`);
        } catch (error) {
          console.error(`Error sending Telegram message ${schedule.name}:`, error);
        }
      });

      if (timeout) {
        this.scheduledJobs.set(jobId, timeout);
      }
    });
  }

  private scheduleTaskReminders(): void {
    // Schedule reminders for tasks and recurring reminders
    const today = new Date().toISOString().split('T')[0];
    
    // Task reminders
    this.tasks.forEach(task => {
      if (task.status === 'pending' && task.due_date === today) {
        const jobId = `task-${task.id}`;
        const timeout = this.scheduleToday(task.due_time, async () => {
          try {
            // Voice reminder
            if (this.settings?.voice.enabled) {
              const message = `Reminder: ${task.task} is due now. Priority: ${task.priority}.`;
              voiceService.speak(message);
            }

            // Telegram reminder
            if (this.settings?.telegram.enabled) {
              const priority = task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢';
              const type = task.type === 'shopping' ? '🛒' : '✅';
              const message = `⏰ *Task Reminder*\n\n${type} ${priority} ${task.task}\n\nDue now!`;
              await telegramService.sendMessage(message);
            }
            
            console.log(`Task reminder sent: ${task.task}`);
          } catch (error) {
            console.error(`Error sending task reminder for ${task.task}:`, error);
          }
        });

        if (timeout) {
          this.scheduledJobs.set(jobId, timeout);
        }
      }
    });

    // Recurring reminders
    this.reminders.forEach(reminder => {
      const reminderDate = new Date(reminder.next_due).toISOString().split('T')[0];
      if (reminderDate === today) {
        const jobId = `reminder-${reminder.id}`;
        const timeout = this.scheduleToday(reminder.due_time, async () => {
          try {
            // Voice reminder
            if (this.settings?.voice.enabled) {
              const message = `Reminder: ${reminder.task}. This is a ${reminder.frequency} reminder.`;
              voiceService.speak(message);
            }

            // Telegram reminder
            if (this.settings?.telegram.enabled) {
              const categoryEmoji = {
                home: '🏠',
                health: '🏥',
                work: '💼',
                personal: '👤'
              }[reminder.category] || '📝';
              
              const message = `🔔 *Recurring Reminder*\n\n${categoryEmoji} ${reminder.task}\n\nFrequency: ${reminder.frequency}`;
              await telegramService.sendMessage(message);
            }
            
            console.log(`Recurring reminder sent: ${reminder.task}`);
          } catch (error) {
            console.error(`Error sending recurring reminder for ${reminder.task}:`, error);
          }
        });

        if (timeout) {
          this.scheduledJobs.set(jobId, timeout);
        }
      }
    });
  }

  private scheduleDaily(time: string, callback: () => void): NodeJS.Timeout | null {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    
    if (isNaN(hours) || isNaN(minutes)) {
      console.error(`Invalid time format: ${time}`);
      return null;
    }
    
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);
    
    // If the scheduled time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    const delay = scheduledTime.getTime() - now.getTime();
    
    console.log(`Scheduling ${time} - delay: ${delay}ms (${Math.round(delay/1000/60)} minutes)`);
    
    if (delay > 0) {
      return setTimeout(() => {
        console.log(`Executing scheduled task at ${time}`);
        try {
          callback();
        } catch (error) {
          console.error(`Error executing scheduled task at ${time}:`, error);
        }
        // Reschedule for next day
        const nextTimeout = this.scheduleDaily(time, callback);
        if (nextTimeout) {
          this.scheduledJobs.set(`${time}-daily`, nextTimeout);
        }
      }, delay);
    }
    
    return null;
  }

  private scheduleToday(time: string, callback: () => void): NodeJS.Timeout | null {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);
    
    // Only schedule if the time hasn't passed today
    if (scheduledTime > now) {
      const delay = scheduledTime.getTime() - now.getTime();
      return setTimeout(callback, delay);
    }
    
    return null;
  }

  // Get status of scheduled jobs
  getScheduledJobs(): { id: string; type: string; nextRun?: string }[] {
    const jobs: { id: string; type: string; nextRun?: string }[] = [];
    
    this.scheduledJobs.forEach((timeout, id) => {
      const [type] = id.split('-');
      jobs.push({
        id,
        type,
        nextRun: 'Scheduled'
      });
    });
    
    return jobs;
  }

  // Manual trigger for testing
  async triggerVoiceAnnouncement(scheduleId: string): Promise<void> {
    if (!this.settings?.voice.enabled) return;

    const schedule = this.settings.voice.schedules.find(s => s.id === scheduleId);
    if (!schedule) return;

    const announcement = voiceService.generateFullAnnouncement(
      this.settings,
      this.currentMenu!,
      this.tomorrowMenu!,
      this.tasks,
      this.reminders,
      this.stock,
      this.foodMenu,
      schedule.content_types
    );
    
    voiceService.speak(announcement);
  }

  async triggerTelegramMessage(scheduleId: string): Promise<void> {
    if (!this.settings?.telegram.enabled) return;

    const schedule = this.settings.telegram.schedules.find(s => s.id === scheduleId);
    if (!schedule) return;

    const todaysTasks = getTodaysTasks(this.tasks);
    const todaysReminders = getTodaysReminders(this.reminders);
    const lowStockItems = getLowStockItems(this.stock);
    
    await telegramService.sendDailyUpdate(
      this.currentMenu!,
      todaysTasks,
      lowStockItems,
      todaysReminders
    );
  }
}

export const schedulerService = new SchedulerService();