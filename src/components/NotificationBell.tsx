import React, { useState } from 'react';
import { Bell, X, Package, AlertTriangle } from 'lucide-react';
import { FoodMenu, Stock } from '../types';
import { getLowStockItems, hasAvailableMeals, getAllMissingIngredients } from '../utils/dataManager';

interface NotificationBellProps {
  foodMenu: FoodMenu;
  stock: Stock;
  onAddShoppingTask: (items: string[]) => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  foodMenu,
  stock,
  onAddShoppingTask
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const lowStockItems = getLowStockItems(stock);
  const hasAvailable = hasAvailableMeals(foodMenu, stock);
  const missingIngredients = getAllMissingIngredients(foodMenu, stock);
  
  const totalNotifications = lowStockItems.length + (hasAvailable ? 0 : 1);
  
  const getAllMissingItems = (): string[] => {
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
    return allMissing;
  };

  const handleAddToShopping = () => {
    const missingItems = getAllMissingItems();
    const lowItems = lowStockItems.map(item => item.name);
    const allItems = [...new Set([...missingItems, ...lowItems])];
    onAddShoppingTask(allItems);
    setIsOpen(false);
  };

  if (totalNotifications === 0) {
    return (
      <button className="relative p-2 text-primary-400 hover:text-accent-400 transition-colors">
        <Bell size={20} />
      </button>
    );
  }

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-accent-400 hover:text-accent-300 transition-colors"
      >
        <Bell size={20} />
        {totalNotifications > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {totalNotifications > 9 ? '9+' : totalNotifications}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Notification Panel */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-primary-800 rounded-lg shadow-xl border border-primary-700 z-50 max-h-96 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white">Notifications</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-primary-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3">
                {/* Critical Stock Alert */}
                {!hasAvailable && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="text-red-400 mt-0.5 flex-shrink-0" size={16} />
                      <div className="flex-1">
                        <h4 className="font-medium text-red-400 text-sm">Critical Stock Alert</h4>
                        <p className="text-red-300 text-xs mt-1">
                          No meals can be prepared! Missing ingredients for all dishes.
                        </p>
                        <button
                          onClick={handleAddToShopping}
                          className="mt-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs transition-colors"
                        >
                          Add to Shopping List
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Low Stock Items */}
                {lowStockItems.length > 0 && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Package className="text-amber-400 mt-0.5 flex-shrink-0" size={16} />
                      <div className="flex-1">
                        <h4 className="font-medium text-amber-400 text-sm">Low Stock Items</h4>
                        <div className="mt-2 space-y-1">
                          {lowStockItems.slice(0, 5).map((item, index) => (
                            <div key={index} className="text-xs text-amber-200 flex justify-between">
                              <span>{item.name}</span>
                              <span>{item.quantity} {item.unit}</span>
                            </div>
                          ))}
                          {lowStockItems.length > 5 && (
                            <div className="text-xs text-amber-300">
                              +{lowStockItems.length - 5} more items
                            </div>
                          )}
                        </div>
                        <button
                          onClick={handleAddToShopping}
                          className="mt-2 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded text-xs transition-colors"
                        >
                          Add to Shopping List
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* No Notifications */}
                {totalNotifications === 0 && (
                  <div className="text-center py-8 text-primary-400">
                    <Bell size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notifications</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;