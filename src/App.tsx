import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HamburgerMenu from './components/HamburgerMenu';
import Dashboard from './pages/Dashboard';
import StockManager from './pages/StockManager';
import MenuPlanner from './pages/MenuPlanner';
import TaskManager from './pages/TaskManager';
import Settings from './pages/Settings';
import { 
  FoodMenu, 
  Stock, 
  Task, 
  Reminder, 
  Settings as SettingsType, 
  DailyMenu 
} from './types';
import {
  loadFoodMenu,
  loadStock,
  loadTasks,
  loadReminders,
  loadSettings,
  loadDailyMenus,
  saveStock,
  saveTasks,
  saveReminders,
  saveSettings,
  saveDailyMenus,
  rotateMeal,
  reduceStock,
  checkDishAvailability,
  generateTaskId,
  hasAvailableMeals
} from './utils/dataManager';
import { telegramBotService } from './services/telegramBotService';
import { schedulerService } from './services/schedulerService';
import { restockAlertService } from './services/restockAlertService';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [foodMenu, setFoodMenu] = useState<FoodMenu>({ breakfast: [], addons: [], lunch: [], dinner: [], snacks: [] });
  const [stock, setStock] = useState<Stock>({ groceries: {}, vegetables: {} });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [settings, setSettingsState] = useState<SettingsType | null>(null);
  const [dailyMenus, setDailyMenus] = useState<DailyMenu[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    const initializeData = async () => {
      try {
        const [menuData, stockData, tasksData, remindersData, settingsData, menusData] = await Promise.all([
          loadFoodMenu(),
          loadStock(),
          loadTasks(),
          loadReminders(),
          Promise.resolve(loadSettings()),
          Promise.resolve(loadDailyMenus())
        ]);

        setFoodMenu(menuData);
        setStock(stockData);
        setTasks(tasksData);
        setReminders(remindersData);
        setSettingsState(settingsData);
        setDailyMenus(menusData);

        // Initialize restock alert service
        restockAlertService.resetStatus(hasAvailableMeals(menuData, stockData));

        // Initialize Telegram bot service
        if (settingsData.telegram.enabled) {
          telegramBotService.updateSettings(settingsData.telegram);
          
          // Get current and tomorrow menus from the loaded data
          const today = new Date().toISOString().split('T')[0];
          const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
          
          const currentMenu = menusData.find(menu => menu.date === today) || {
            date: today,
            breakfast: "No meal planned",
            addons: "No addon planned",
            lunch: "No meal planned",
            dinner: "No meal planned",
            snacks: "No snack planned"
          };
          
          const tomorrowMenu = menusData.find(menu => menu.date === tomorrow) || {
            date: tomorrow,
            breakfast: "No meal planned",
            addons: "No addon planned",
            lunch: "No meal planned",
            dinner: "No meal planned",
            snacks: "No snack planned"
          };
          
          telegramBotService.updateData({
            tasks: tasksData,
            reminders: remindersData,
            currentMenu: currentMenu,
            tomorrowMenu: tomorrowMenu,
            stock: stockData,
            foodMenu: menuData
          });
          telegramBotService.startPolling();
          telegramBotService.setBotCommands();
        }
      } catch (error) {
        console.error('Error initializing data:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();

    // Cleanup function
    return () => {
      telegramBotService.stopPolling();
    };
  }, []);

  // Get current and tomorrow's menu
  const getCurrentMenu = (): DailyMenu => {
    const today = new Date().toISOString().split('T')[0];
    return dailyMenus.find(menu => menu.date === today) || {
      date: today,
      breakfast: "No meal planned",
      addons: "No addon planned",
      lunch: "No meal planned",
      dinner: "No meal planned",
      snacks: "No snack planned"
    };
  };

  const getTomorrowMenu = (): DailyMenu => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    return dailyMenus.find(menu => menu.date === tomorrow) || {
      date: tomorrow,
      breakfast: "No meal planned",
      addons: "No addon planned",
      lunch: "No meal planned",
      dinner: "No meal planned",
      snacks: "No snack planned"
    };
  };

  // Handle menu rotation
  const handleMenuRotate = (mealType: keyof FoodMenu) => {
    const currentMenu = getCurrentMenu();
    const newMeal = rotateMeal(currentMenu[mealType], foodMenu, stock, mealType);
    
    const updatedMenus = dailyMenus.map(menu => 
      menu.date === currentMenu.date 
        ? { ...menu, [mealType]: newMeal }
        : menu
    );
    
    setDailyMenus(updatedMenus);
    saveDailyMenus(updatedMenus);
  };

  // Handle marking meal as cooked
  const handleMarkCooked = (mealType: keyof FoodMenu, dishName: string) => {
    const dish = foodMenu[mealType].find(d => d.name === dishName);
    if (!dish) return;

    if (!checkDishAvailability(dish, stock)) {
      alert('Insufficient ingredients to cook this dish!');
      return;
    }

    const confirmCook = window.confirm(
      `Mark "${dishName}" as cooked? This will reduce ingredients from stock.`
    );

    if (confirmCook) {
      const newStock = reduceStock(stock, dish);
      handleUpdateStock(newStock);
      
      // Show success message
      alert(`${dishName} marked as cooked! Stock updated.`);
    }
  };

  // Handle adding new task
  const handleAddTask = () => {
    const taskText = prompt('Enter new task:');
    if (!taskText) return;

    const taskType = window.confirm('Is this a shopping task? Click OK for shopping, Cancel for todo') ? 'shopping' : 'todo';
    const dueDate = prompt('Enter due date (YYYY-MM-DD):') || new Date().toISOString().split('T')[0];
    const dueTime = prompt('Enter due time (HH:MM):') || '09:00';
    const priority = (prompt('Enter priority (low/medium/high):') || 'medium') as 'low' | 'medium' | 'high';

    const newTask: Task = {
      id: generateTaskId(),
      type: taskType,
      task: taskText,
      due_date: dueDate,
      due_time: dueTime,
      priority: priority,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  // Handle updating stock
  const handleUpdateStock = async (newStock: Stock) => {
    setStock(newStock);
    saveStock(newStock);
    
    // Check for restock alerts
    if (settings) {
      await restockAlertService.checkAndAlert(
        foodMenu,
        newStock,
        settings,
        (newTasks) => {
          const updatedTasks = [...tasks, ...newTasks];
          setTasks(updatedTasks);
          saveTasks(updatedTasks);
        }
      );
    }
    
    // Update Telegram bot data
    if (settings?.telegram.enabled) {
      telegramBotService.updateData({
        tasks,
        reminders,
        currentMenu: getCurrentMenu(),
        tomorrowMenu: getTomorrowMenu(),
        stock: newStock,
        foodMenu
      });
    }
  };

  // Handle updating tasks
  const handleUpdateTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    saveTasks(newTasks);
    
    // Update Telegram bot data
    if (settings?.telegram.enabled) {
      telegramBotService.updateData({
        tasks: newTasks,
        reminders,
        currentMenu: getCurrentMenu(),
        tomorrowMenu: getTomorrowMenu(),
        stock,
        foodMenu
      });
    }
  };

  // Handle updating reminders
  const handleUpdateReminders = (newReminders: Reminder[]) => {
    setReminders(newReminders);
    saveReminders(newReminders);
    
    // Update Telegram bot data
    if (settings?.telegram.enabled) {
      telegramBotService.updateData({
        tasks,
        reminders: newReminders,
        currentMenu: getCurrentMenu(),
        tomorrowMenu: getTomorrowMenu(),
        stock,
        foodMenu
      });
    }
  };

  // Handle updating settings
  const handleUpdateSettings = (newSettings: SettingsType) => {
    setSettingsState(newSettings);
    saveSettings(newSettings);
    
    // Update Telegram bot service
    telegramBotService.updateSettings(newSettings.telegram);
    
    if (newSettings.telegram.enabled) {
      telegramBotService.updateData({
        tasks,
        reminders,
        currentMenu: getCurrentMenu(),
        tomorrowMenu: getTomorrowMenu(),
        stock,
        foodMenu
      });
      telegramBotService.startPolling();
      telegramBotService.setBotCommands();
    } else {
      telegramBotService.stopPolling();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500 mx-auto mb-4"></div>
          <p className="text-primary-300">Loading Smart Assistant...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-primary-900 text-white">
        <Routes>
          <Route 
            path="/" 
            element={
              <Dashboard
                currentMenu={getCurrentMenu()}
                tomorrowMenu={getTomorrowMenu()}
                tasks={tasks}
                reminders={reminders}
                foodMenu={foodMenu}
                settings={settings!}
                stock={stock}
                onMenuRotate={handleMenuRotate}
                onMarkCooked={handleMarkCooked}
                onAddTask={handleAddTask}
                onUpdateTasks={handleUpdateTasks}
              />
            } 
          />
          <Route 
            path="/stock" 
            element={
              <StockManager
                stock={stock}
                onUpdateStock={handleUpdateStock}
              />
            } 
          />
          <Route 
            path="/menu" 
            element={
              <MenuPlanner
                foodMenu={foodMenu}
                stock={stock}
                onUpdateMenu={setFoodMenu}
              />
            } 
          />
          <Route 
            path="/tasks" 
            element={
              <TaskManager
                tasks={tasks}
                reminders={reminders}
                onUpdateTasks={handleUpdateTasks}
                onUpdateReminders={handleUpdateReminders}
              />
            } 
          />
          <Route 
            path="/settings" 
            element={
              <Settings
                settings={settings!}
                onUpdateSettings={handleUpdateSettings}
              />
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        <HamburgerMenu 
          currentPage={currentPage} 
          onPageChange={setCurrentPage} 
        />
      </div>
    </Router>
  );
}

export default App;