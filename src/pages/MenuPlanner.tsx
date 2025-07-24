import React, { useState } from 'react';
import { Calendar, Eye, Plus, AlertCircle, Coffee, Utensils, Moon } from 'lucide-react';
import { FoodMenu, Stock, Dish } from '../types';
import { checkDishAvailability, saveFoodMenu } from '../utils/dataManager';

interface MenuPlannerProps {
  foodMenu: FoodMenu;
  stock: Stock;
  onUpdateMenu: (menu: FoodMenu) => void;
}

const MenuPlanner: React.FC<MenuPlannerProps> = ({ foodMenu, stock, onUpdateMenu }) => {
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [showAddDish, setShowAddDish] = useState<keyof FoodMenu | null>(null);
  const [newDish, setNewDish] = useState<Partial<Dish>>({
    name: '',
    ingredients: {},
    nutrition: { protein: 0, fiber: 0 }
  });

  const mealCategories = [
    { key: 'breakfast' as keyof FoodMenu, label: 'Breakfast', icon: Coffee, color: 'from-orange-500 to-amber-500' },
    { key: 'addons' as keyof FoodMenu, label: 'Add-ons', icon: Utensils, color: 'from-green-500 to-emerald-500' },
    { key: 'lunch' as keyof FoodMenu, label: 'Lunch', icon: Utensils, color: 'from-blue-500 to-cyan-500' },
    { key: 'dinner' as keyof FoodMenu, label: 'Dinner', icon: Moon, color: 'from-purple-500 to-indigo-500' },
    { key: 'snacks' as keyof FoodMenu, label: 'Snacks', icon: Coffee, color: 'from-pink-500 to-rose-500' }
  ];

  const handleAddDish = (mealType: keyof FoodMenu) => {
    if (!newDish.name || !newDish.ingredients || !newDish.nutrition) return;

    const updatedMenu = { ...foodMenu };
    updatedMenu[mealType] = [...updatedMenu[mealType], newDish as Dish];
    
    onUpdateMenu(updatedMenu);
    saveFoodMenu(updatedMenu);
    
    setShowAddDish(null);
    setNewDish({
      name: '',
      ingredients: {},
      nutrition: { protein: 0, fiber: 0 }
    });
  };

  const handleIngredientChange = (ingredient: string, amount: string) => {
    setNewDish(prev => ({
      ...prev,
      ingredients: {
        ...prev.ingredients,
        [ingredient]: amount
      }
    }));
  };

  const getAvailableCount = (dishes: Dish[]) => {
    return dishes.filter(dish => checkDishAvailability(dish, stock)).length;
  };

  const renderDishCard = (dish: Dish, mealType: keyof FoodMenu) => {
    const isAvailable = checkDishAvailability(dish, stock);
    
    return (
      <div
        key={dish.name}
        className={`card cursor-pointer transition-all duration-200 hover:scale-105 ${
          !isAvailable ? 'fade-unavailable' : ''
        }`}
        onClick={() => setSelectedDish(dish)}
      >
        <div className="flex items-center justify-between mb-2">
          <div className={`w-3 h-3 rounded-full ${
            isAvailable ? 'bg-green-400' : 'bg-red-400'
          }`}></div>
          <Eye size={16} className="text-primary-400" />
        </div>
        
        <h3 className="font-medium text-white mb-2 leading-tight">
          {dish.name}
        </h3>
        
        <div className="text-sm text-primary-300 mb-2">
          <div>Protein: {dish.nutrition.protein}g</div>
          <div>Fiber: {dish.nutrition.fiber}g</div>
        </div>
        
        {!isAvailable && (
          <div className="flex items-center text-xs text-red-400">
            <AlertCircle size={12} className="mr-1" />
            Ingredients unavailable
          </div>
        )}
      </div>
    );
  };

  const renderMealSection = (category: typeof mealCategories[0]) => {
    const dishes = foodMenu[category.key];
    const availableCount = getAvailableCount(dishes);
    const Icon = category.icon;

    return (
      <div key={category.key} className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <Icon className="mr-2 text-accent-400" size={20} />
            {category.label}
            <span className="ml-2 text-sm text-primary-400">
              ({availableCount}/{dishes.length} available)
            </span>
          </h2>
          <button
            onClick={() => setShowAddDish(category.key)}
            className="btn-primary flex items-center text-sm"
          >
            <Plus size={16} className="mr-1" />
            Add Dish
          </button>
        </div>

        {availableCount === 0 && dishes.length > 0 && (
          <div className="card mb-4 bg-red-500/10 border-red-500/30">
            <div className="flex items-center text-red-400">
              <AlertCircle className="mr-2" size={20} />
              <span className="font-medium">No dishes available with current stock!</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {dishes.map((dish) => renderDishCard(dish, category.key))}
          
          {/* Add Dish Form */}
          {showAddDish === category.key && (
            <div className="card border-2 border-accent-500/50">
              <h3 className="font-medium text-accent-400 mb-3">Add New Dish</h3>
              
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Dish name"
                  value={newDish.name}
                  onChange={(e) => setNewDish(prev => ({ ...prev, name: e.target.value }))}
                  className="input-field w-full text-sm"
                />
                
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Protein (g)"
                    value={newDish.nutrition?.protein || ''}
                    onChange={(e) => setNewDish(prev => ({
                      ...prev,
                      nutrition: { ...prev.nutrition!, protein: parseInt(e.target.value) || 0 }
                    }))}
                    className="input-field w-full text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Fiber (g)"
                    value={newDish.nutrition?.fiber || ''}
                    onChange={(e) => setNewDish(prev => ({
                      ...prev,
                      nutrition: { ...prev.nutrition!, fiber: parseInt(e.target.value) || 0 }
                    }))}
                    className="input-field w-full text-sm"
                  />
                </div>
                
                <textarea
                  placeholder="Ingredients (ingredient:amount, ...)"
                  className="input-field w-full text-sm h-20 resize-none"
                  onChange={(e) => {
                    const ingredients: { [key: string]: string } = {};
                    e.target.value.split(',').forEach(item => {
                      const [ingredient, amount] = item.trim().split(':');
                      if (ingredient && amount) {
                        ingredients[ingredient.trim()] = amount.trim();
                      }
                    });
                    setNewDish(prev => ({ ...prev, ingredients }));
                  }}
                />
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAddDish(category.key)}
                    className="btn-primary text-sm flex-1"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setShowAddDish(null)}
                    className="btn-secondary text-sm flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-primary-900 p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Menu Planner</h1>
        <p className="text-primary-300">Plan your meals and manage recipes</p>
      </div>

      {/* Menu Categories */}
      {mealCategories.map(renderMealSection)}

      {/* Dish Detail Modal */}
      {selectedDish && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">{selectedDish.name}</h2>
              <button
                onClick={() => setSelectedDish(null)}
                className="text-primary-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <h3 className="font-semibold text-accent-400 mb-2">Nutrition Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-primary-300">Protein:</span>
                  <span className="text-white ml-2">{selectedDish.nutrition.protein}g</span>
                </div>
                <div>
                  <span className="text-primary-300">Fiber:</span>
                  <span className="text-white ml-2">{selectedDish.nutrition.fiber}g</span>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="font-semibold text-accent-400 mb-2">Ingredients</h3>
              <div className="space-y-2">
                {Object.entries(selectedDish.ingredients).map(([ingredient, amount]) => {
                  const stockItem = stock.groceries[ingredient] || stock.vegetables[ingredient];
                  const isAvailable = stockItem && stockItem.quantity > 0;
                  
                  return (
                    <div key={ingredient} className={`flex justify-between items-center p-2 rounded ${
                      isAvailable ? 'bg-green-500/10' : 'bg-red-500/10'
                    }`}>
                      <span className="text-white capitalize">
                        {ingredient.replace(/_/g, ' ')}
                      </span>
                      <div className="flex items-center">
                        <span className="text-primary-300 mr-2">{amount}</span>
                        <div className={`w-2 h-2 rounded-full ${
                          isAvailable ? 'bg-green-400' : 'bg-red-400'
                        }`}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="flex items-center justify-center">
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                checkDishAvailability(selectedDish, stock)
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {checkDishAvailability(selectedDish, stock) ? 'Can be cooked' : 'Missing ingredients'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuPlanner;