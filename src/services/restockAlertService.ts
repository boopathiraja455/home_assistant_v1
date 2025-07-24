import { FoodMenu, Stock, Settings, Task } from '../types';
import { hasAvailableMeals, getAllMissingIngredients, generateTaskId } from '../utils/dataManager';
import { voiceService } from './voiceService';
import { telegramService } from './telegramService';

export class RestockAlertService {
  private previousStockStatus: boolean = true; // Assume meals were available initially
  
  async checkAndAlert(
    foodMenu: FoodMenu, 
    stock: Stock, 
    settings: Settings,
    onAddShoppingTasks?: (tasks: Task[]) => void
  ): Promise<void> {
    const hasAvailable = hasAvailableMeals(foodMenu, stock);
    
    // Only alert if status changed from available to unavailable
    if (this.previousStockStatus && !hasAvailable) {
      console.log('Critical stock alert triggered - no meals available');
      
      // Voice alert
      if (settings.voice.enabled) {
        const alert = voiceService.generateRestockAlert(foodMenu, stock);
        if (alert) {
          voiceService.speak(alert);
        }
      }
      
      // Telegram alert
      if (settings.telegram.enabled) {
        await telegramService.sendRestockAlert(foodMenu, stock);
      }
      
      // Auto-add shopping tasks
      if (onAddShoppingTasks) {
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

        if (allMissing.length > 0) {
          const today = new Date().toISOString().split('T')[0];
          const time = new Date().toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
          });

          const newTasks = allMissing.map(item => ({
            id: generateTaskId(),
            type: 'shopping' as const,
            task: `🚨 URGENT: Buy ${item}`,
            due_date: today,
            due_time: time,
            priority: 'high' as const,
            status: 'pending' as const,
            created_at: new Date().toISOString()
          }));

          onAddShoppingTasks(newTasks);
        }
      }
    }
    
    // Update previous status
    this.previousStockStatus = hasAvailable;
  }
  
  // Reset the status (useful when app starts)
  resetStatus(hasAvailable: boolean): void {
    this.previousStockStatus = hasAvailable;
  }
}

export const restockAlertService = new RestockAlertService();