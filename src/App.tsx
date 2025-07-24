import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
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
  generateTaskId
} from './utils/dataManager';

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
      } catch (error) {
        console.error('Error initializing data:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
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
      setStock(newStock);
      saveStock(newStock);
      
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
  const handleUpdateStock = (newStock: Stock) => {
    setStock(newStock);
    saveStock(newStock);
  };

  // Handle updating tasks
  const handleUpdateTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    saveTasks(newTasks);
  };

  // Handle updating reminders
  const handleUpdateReminders = (newReminders: Reminder[]) => {
    setReminders(newReminders);
    saveReminders(newReminders);
  };

  // Handle updating settings
  const handleUpdateSettings = (newSettings: SettingsType) => {
    setSettingsState(newSettings);
    saveSettings(newSettings);
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
        <div className="pb-16">
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
                  onMenuRotate={handleMenuRotate}
                  onMarkCooked={handleMarkCooked}
                  onAddTask={handleAddTask}
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
        </div>
        
        <Navigation 
          currentPage={currentPage} 
          onPageChange={setCurrentPage} 
        />
      </div>
    </Router>
  );
}

export default App;