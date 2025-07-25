import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  RotateCw, 
  CheckCircle, 
  Plus, 
  Calendar,
  Utensils,
  Coffee,
  Moon
} from 'lucide-react';
import { DailyMenu, Task, Reminder, FoodMenu, Settings as SettingsType, FoodMenu as FoodMenuType, Stock } from '../types';
import { getCurrentTime, getCurrentDate, formatTime, getTodaysTasks, getTodaysReminders, generateTaskId } from '../utils/dataManager';
import NotificationBell from '../components/NotificationBell';

interface DashboardProps {
  currentMenu: DailyMenu;
  tomorrowMenu: DailyMenu;
  tasks: Task[];
  reminders: Reminder[];
  foodMenu: FoodMenuType;
  settings: SettingsType;
  stock: Stock;
  onMenuRotate: (mealType: keyof FoodMenu) => void;
  onMarkCooked: (mealType: keyof FoodMenu, dishName: string) => Promise<void> | void;
  onAddTask: () => void;
  onUpdateTasks: (tasks: Task[]) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  currentMenu,
  tomorrowMenu,
  tasks,
  reminders,
  foodMenu,
  settings,
  stock,
  onMenuRotate,
  onMarkCooked,
  onAddTask,
  onUpdateTasks
}) => {
  const [currentTime, setCurrentTime] = useState(getCurrentTime());
  const [currentDate, setCurrentDate] = useState(getCurrentDate());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentTime());
      setCurrentDate(getCurrentDate());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const todaysTasks = getTodaysTasks(tasks);
  const todaysReminders = getTodaysReminders(reminders);

  const handleAddShoppingTask = (items: string[]) => {
    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const newTasks = items.map(item => ({
      id: generateTaskId(),
      type: 'shopping' as const,
      task: `Buy ${item}`,
      due_date: today,
      due_time: time,
      priority: 'high' as const,
      status: 'pending' as const,
      created_at: new Date().toISOString()
    }));

    onUpdateTasks([...tasks, ...newTasks]);
  };

  const mealTypes = [
    { key: 'breakfast' as keyof FoodMenu, label: 'Breakfast', icon: Coffee, color: 'from-orange-500 to-amber-500' },
    { key: 'addons' as keyof FoodMenu, label: 'Add-ons', icon: Utensils, color: 'from-green-500 to-emerald-500' },
    { key: 'lunch' as keyof FoodMenu, label: 'Lunch', icon: Utensils, color: 'from-blue-500 to-cyan-500' },
    { key: 'dinner' as keyof FoodMenu, label: 'Dinner', icon: Moon, color: 'from-purple-500 to-indigo-500' },
    { key: 'snacks' as keyof FoodMenu, label: 'Snacks', icon: Coffee, color: 'from-pink-500 to-rose-500' }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/10';
      case 'medium': return 'text-amber-400 bg-amber-500/10';
      case 'low': return 'text-green-400 bg-green-500/10';
      default: return 'text-primary-400 bg-primary-500/10';
    }
  };

  const getTaskTypeColor = (type: string) => {
    return type === 'shopping' ? 'text-purple-400 bg-purple-500/10' : 'text-blue-400 bg-blue-500/10';
  };

  return (
    <div className="min-h-screen bg-primary-900 p-4">
      {/* Header with Clock - Ribbon Style */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="text-accent-400 mr-2" size={20} />
            <div>
              <div className="text-lg font-mono text-white">{currentTime}</div>
              <div className="text-xs text-primary-400">{currentDate}</div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <NotificationBell
              foodMenu={foodMenu}
              stock={stock}
              onAddShoppingTask={handleAddShoppingTask}
            />
            <div className="text-right">
              <h1 className="text-xl font-bold text-accent-400">Smart Assistant</h1>
              <div className="text-xs text-primary-300">Dashboard</div>
            </div>
          </div>
        </div>
      </div>



      {/* Today's Menu */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
          <Calendar className="mr-2 text-accent-400" size={20} />
          Today's Menu
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {mealTypes.map(({ key, label, icon: Icon, color }) => (
            <div key={key} className="card relative overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-10`}></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <Icon size={20} className="text-primary-300" />
                  <button
                    onClick={() => onMenuRotate(key)}
                    className="p-1 hover:bg-primary-700 rounded transition-colors"
                    title="Rotate meal"
                  >
                    <RotateCw size={16} className="text-primary-400 hover:text-accent-400" />
                  </button>
                </div>
                <h3 className="font-medium text-sm text-primary-200 mb-2">{label}</h3>
                <p className="text-white text-sm font-medium mb-3 min-h-[2.5rem] leading-tight">
                  {currentMenu[key]}
                </p>
                <button
                  onClick={() => onMarkCooked(key, currentMenu[key])}
                  className="w-full btn-primary text-xs py-2 flex items-center justify-center"
                >
                  <CheckCircle size={14} className="mr-1" />
                  Mark Cooked
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tomorrow's Menu Preview */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
          <Calendar className="mr-2 text-accent-400" size={20} />
          Tomorrow's Menu
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {mealTypes.map(({ key, label, icon: Icon, color }) => (
            <div key={key} className="card relative overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-10`}></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <Icon size={18} className="text-primary-300" />
                  <button
                    onClick={() => onMenuRotate(key)}
                    className="p-1 hover:bg-primary-700 rounded transition-colors"
                    title="Rotate meal"
                  >
                    <RotateCw size={14} className="text-primary-400 hover:text-accent-400" />
                  </button>
                </div>
                <h3 className="font-medium text-sm text-primary-200 mb-2">{label}</h3>
                <p className="text-white text-sm font-medium mb-3 min-h-[2rem] leading-tight">
                  {tomorrowMenu[key]}
                </p>
                <button
                  onClick={() => onMarkCooked(key, tomorrowMenu[key])}
                  className="w-full btn-secondary text-xs py-2 flex items-center justify-center opacity-75"
                >
                  <CheckCircle size={12} className="mr-1" />
                  Pre-cook
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Tasks and Reminders */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <CheckCircle className="mr-2 text-accent-400" size={20} />
            Today's Tasks
          </h2>
          <button
            onClick={onAddTask}
            className="btn-primary flex items-center text-sm"
          >
            <Plus size={16} className="mr-1" />
            Add Task
          </button>
        </div>

        {/* Tasks */}
        {todaysTasks.length > 0 ? (
          <div className="space-y-3 mb-4">
            {todaysTasks.map((task) => (
              <div key={task.id} className="card">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getTaskTypeColor(task.type)}`}>
                        {task.type}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-white font-medium">{task.task}</p>
                    <p className="text-primary-400 text-sm">Due: {formatTime(task.due_time)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-8">
            <CheckCircle className="mx-auto text-accent-400 mb-2" size={32} />
            <p className="text-primary-300">No tasks for today!</p>
          </div>
        )}

        {/* Reminders */}
        {todaysReminders.length > 0 && (
          <>
            <h3 className="text-lg font-semibold text-white mb-3 mt-6">Today's Reminders</h3>
            <div className="space-y-2">
              {todaysReminders.map((reminder) => (
                <div key={reminder.id} className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{reminder.task}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-primary-400 text-sm">{formatTime(reminder.due_time)}</span>
                        <span className="px-2 py-1 rounded text-xs bg-primary-700 text-primary-200">
                          {reminder.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;