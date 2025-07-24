import React from 'react';
import { AlertTriangle, ShoppingCart, Package } from 'lucide-react';
import { FoodMenu, Stock } from '../types';
import { getAllMissingIngredients, hasAvailableMeals, getLowStockItems } from '../utils/dataManager';

interface RestockAlertProps {
  foodMenu: FoodMenu;
  stock: Stock;
  onAddShoppingTask: (items: string[]) => void;
}

const RestockAlert: React.FC<RestockAlertProps> = ({
  foodMenu,
  stock,
  onAddShoppingTask
}) => {
  const hasAvailable = hasAvailableMeals(foodMenu, stock);
  const missingIngredients = getAllMissingIngredients(foodMenu, stock);
  const lowStockItems = getLowStockItems(stock);

  if (hasAvailable && lowStockItems.length === 0) {
    return null; // No alerts needed
  }

  const getAllMissingItems = (): string[] => {
    const allMissing: string[] = [];
    Object.values(missingIngredients).forEach(mealTypeMissing => {
      mealTypeMissing.forEach(dishInfo => {
        dishInfo.missing.forEach(item => {
          const itemName = item.split(' (')[0]; // Extract just the ingredient name
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
  };

  return (
    <div className="space-y-4">
      {/* Critical Alert - No meals available */}
      {!hasAvailable && (
        <div className="card border-red-500 bg-red-500/10">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="text-red-400 mt-1 flex-shrink-0" size={24} />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-400 mb-2">
                ⚠️ Critical Stock Alert
              </h3>
              <p className="text-red-300 mb-4">
                No meals can be prepared with current stock! Please restock ingredients immediately.
              </p>
              
              {/* Show missing ingredients by meal type */}
              <div className="space-y-3">
                {Object.entries(missingIngredients).map(([mealType, dishes]) => (
                  dishes.length > 0 && (
                    <div key={mealType} className="bg-primary-800/50 rounded-lg p-3">
                      <h4 className="font-medium text-red-300 mb-2 capitalize">
                        {mealType} - Missing Ingredients:
                      </h4>
                      <div className="space-y-1">
                        {dishes.map((dishInfo, index) => (
                          <div key={index} className="text-sm">
                            <span className="text-white font-medium">{dishInfo.dish}:</span>
                            <ul className="text-red-200 ml-4 mt-1">
                              {dishInfo.missing.map((item, idx) => (
                                <li key={idx} className="text-xs">• {item}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>

              <button
                onClick={handleAddToShopping}
                className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
              >
                <ShoppingCart size={16} className="mr-2" />
                Add All to Shopping List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Low Stock Warning */}
      {hasAvailable && lowStockItems.length > 0 && (
        <div className="card border-amber-500 bg-amber-500/10">
          <div className="flex items-start space-x-3">
            <Package className="text-amber-400 mt-1 flex-shrink-0" size={20} />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-amber-400 mb-2">
                📦 Low Stock Warning
              </h3>
              <p className="text-amber-300 mb-3">
                Some ingredients are running low. Consider restocking soon.
              </p>
              
              <div className="bg-primary-800/50 rounded-lg p-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {lowStockItems.map((item, index) => (
                    <div key={index} className="text-sm">
                      <span className="text-white font-medium">{item.name}</span>
                      <div className="text-amber-200 text-xs">
                        {item.quantity} {item.unit} left
                        {item.threshold && ` (threshold: ${item.threshold})`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAddToShopping}
                className="mt-3 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors text-sm"
              >
                <ShoppingCart size={14} className="mr-2" />
                Add to Shopping List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestockAlert;