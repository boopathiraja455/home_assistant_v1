import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Edit3, 
  Trash2, 
  Clock, 
  Calendar,
  Bell,
  Check,
  X
} from 'lucide-react';
import { Task, Reminder, TaskType, TaskPriority, ReminderFrequency, ReminderCategory } from '../types';
import { generateTaskId, generateReminderId, formatTime, formatDate } from '../utils/dataManager';

interface TaskManagerProps {
  tasks: Task[];
  reminders: Reminder[];
  onUpdateTasks: (tasks: Task[]) => void;
  onUpdateReminders: (reminders: Reminder[]) => void;
}

const TaskManager: React.FC<TaskManagerProps> = ({
  tasks,
  reminders,
  onUpdateTasks,
  onUpdateReminders
}) => {
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    type: 'todo',
    task: '',
    due_date: new Date().toISOString().split('T')[0],
    due_time: '09:00',
    priority: 'medium',
    status: 'pending'
  });
  const [newReminder, setNewReminder] = useState<Partial<Reminder>>({
    task: '',
    category: 'home',
    frequency: 'daily',
    due_time: '09:00'
  });

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'low': return 'text-green-400 bg-green-500/10 border-green-500/30';
    }
  };

  const getTaskTypeColor = (type: TaskType) => {
    return type === 'shopping' 
      ? 'text-purple-400 bg-purple-500/10 border-purple-500/30' 
      : 'text-blue-400 bg-blue-500/10 border-blue-500/30';
  };

  const getCategoryColor = (category: ReminderCategory) => {
    switch (category) {
      case 'home': return 'text-blue-400 bg-blue-500/10';
      case 'health': return 'text-green-400 bg-green-500/10';
      case 'work': return 'text-orange-400 bg-orange-500/10';
      case 'personal': return 'text-purple-400 bg-purple-500/10';
    }
  };

  const handleAddTask = () => {
    if (!newTask.task) return;

    const task: Task = {
      id: generateTaskId(),
      type: newTask.type as TaskType,
      task: newTask.task,
      due_date: newTask.due_date!,
      due_time: newTask.due_time!,
      priority: newTask.priority as TaskPriority,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    onUpdateTasks([...tasks, task]);
    setShowAddTask(false);
    setNewTask({
      type: 'todo',
      task: '',
      due_date: new Date().toISOString().split('T')[0],
      due_time: '09:00',
      priority: 'medium',
      status: 'pending'
    });
  };

  const handleAddReminder = () => {
    if (!newReminder.task) return;

    const reminder: Reminder = {
      id: generateReminderId(),
      task: newReminder.task,
      category: newReminder.category as ReminderCategory,
      frequency: newReminder.frequency as ReminderFrequency,
      due_time: newReminder.due_time!,
      next_due: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    onUpdateReminders([...reminders, reminder]);
    setShowAddReminder(false);
    setNewReminder({
      task: '',
      category: 'home',
      frequency: 'daily',
      due_time: '09:00'
    });
  };

  const handleToggleTask = (taskId: string) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId
        ? { ...task, status: task.status === 'pending' ? 'completed' : 'pending' as any }
        : task
    );
    onUpdateTasks(updatedTasks);
  };

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      onUpdateTasks(tasks.filter(task => task.id !== taskId));
    }
  };

  const handleDeleteReminder = (reminderId: string) => {
    if (window.confirm('Are you sure you want to delete this reminder?')) {
      onUpdateReminders(reminders.filter(reminder => reminder.id !== reminderId));
    }
  };

  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const completedTasks = tasks.filter(task => task.status === 'completed');

  return (
    <div className="min-h-screen bg-primary-900 p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Task Manager</h1>
        <p className="text-primary-300">Manage your tasks and reminders</p>
      </div>

      {/* Tasks Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <CheckSquare className="mr-2 text-accent-400" size={20} />
            Tasks ({pendingTasks.length} pending)
          </h2>
          <button
            onClick={() => setShowAddTask(true)}
            className="btn-primary flex items-center text-sm"
          >
            <Plus size={16} className="mr-1" />
            Add Task
          </button>
        </div>

        {/* Add Task Form */}
        {showAddTask && (
          <div className="card mb-4 border-2 border-accent-500/50">
            <h3 className="font-medium text-accent-400 mb-3">Add New Task</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Task description"
                  value={newTask.task}
                  onChange={(e) => setNewTask(prev => ({ ...prev, task: e.target.value }))}
                  className="input-field w-full"
                />
              </div>
              <div>
                <select
                  value={newTask.type}
                  onChange={(e) => setNewTask(prev => ({ ...prev, type: e.target.value as TaskType }))}
                  className="select-field w-full"
                >
                  <option value="todo">Todo</option>
                  <option value="shopping">Shopping</option>
                </select>
              </div>
              <div>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value as TaskPriority }))}
                  className="select-field w-full"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>
              <div>
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
                  className="input-field w-full"
                />
              </div>
              <div>
                <input
                  type="time"
                  value={newTask.due_time}
                  onChange={(e) => setNewTask(prev => ({ ...prev, due_time: e.target.value }))}
                  className="input-field w-full"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleAddTask} className="btn-primary">
                Add Task
              </button>
              <button
                onClick={() => setShowAddTask(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Pending Tasks */}
        <div className="space-y-3 mb-6">
          {pendingTasks.map((task) => (
            <div key={task.id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <button
                    onClick={() => handleToggleTask(task.id)}
                    className="text-primary-400 hover:text-accent-400"
                  >
                    <Check size={20} />
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getTaskTypeColor(task.type)}`}>
                        {task.type}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-white font-medium">{task.task}</p>
                    <div className="flex items-center text-sm text-primary-400 mt-1">
                      <Calendar size={14} className="mr-1" />
                      <span>{formatDate(task.due_date)}</span>
                      <Clock size={14} className="ml-3 mr-1" />
                      <span>{formatTime(task.due_time)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditingTask(task)}
                    className="p-2 text-primary-400 hover:text-accent-400"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-2 text-primary-400 hover:text-red-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <>
            <h3 className="text-lg font-semibold text-white mb-3">Completed Tasks</h3>
            <div className="space-y-2">
              {completedTasks.map((task) => (
                <div key={task.id} className="card opacity-60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className="text-accent-400"
                      >
                        <Check size={20} />
                      </button>
                      <div className="flex-1">
                        <p className="text-white font-medium line-through">{task.task}</p>
                        <div className="flex items-center text-sm text-primary-400 mt-1">
                          <span className={`px-2 py-1 rounded text-xs mr-2 ${getTaskTypeColor(task.type)}`}>
                            {task.type}
                          </span>
                          <span>Completed</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-2 text-primary-400 hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Reminders Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <Bell className="mr-2 text-accent-400" size={20} />
            Recurring Reminders ({reminders.length})
          </h2>
          <button
            onClick={() => setShowAddReminder(true)}
            className="btn-primary flex items-center text-sm"
          >
            <Plus size={16} className="mr-1" />
            Add Reminder
          </button>
        </div>

        {/* Add Reminder Form */}
        {showAddReminder && (
          <div className="card mb-4 border-2 border-accent-500/50">
            <h3 className="font-medium text-accent-400 mb-3">Add New Reminder</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Reminder description"
                  value={newReminder.task}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, task: e.target.value }))}
                  className="input-field w-full"
                />
              </div>
              <div>
                <select
                  value={newReminder.category}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, category: e.target.value as ReminderCategory }))}
                  className="select-field w-full"
                >
                  <option value="home">Home</option>
                  <option value="health">Health</option>
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                </select>
              </div>
              <div>
                <select
                  value={newReminder.frequency}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, frequency: e.target.value as ReminderFrequency }))}
                  className="select-field w-full"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <input
                  type="time"
                  value={newReminder.due_time}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, due_time: e.target.value }))}
                  className="input-field w-full"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleAddReminder} className="btn-primary">
                Add Reminder
              </button>
              <button
                onClick={() => setShowAddReminder(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Reminders List */}
        <div className="space-y-3">
          {reminders.map((reminder) => (
            <div key={reminder.id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(reminder.category)}`}>
                      {reminder.category}
                    </span>
                    <span className="px-2 py-1 rounded text-xs bg-primary-700 text-primary-200">
                      {reminder.frequency}
                    </span>
                  </div>
                  <p className="text-white font-medium mb-1">{reminder.task}</p>
                  <div className="flex items-center text-sm text-primary-400">
                    <Clock size={14} className="mr-1" />
                    <span>{formatTime(reminder.due_time)}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditingReminder(reminder)}
                    className="p-2 text-primary-400 hover:text-accent-400"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteReminder(reminder.id)}
                    className="p-2 text-primary-400 hover:text-red-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {reminders.length === 0 && (
          <div className="card text-center py-8">
            <Bell className="mx-auto text-accent-400 mb-2" size={32} />
            <p className="text-primary-300">No reminders set up yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskManager;