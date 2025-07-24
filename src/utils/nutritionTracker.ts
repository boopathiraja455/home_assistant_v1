import { FoodMenu, DailyMenu, Dish, NutritionGoals } from '../types';

export interface NutritionSummary {
  totalProtein: number;
  totalFiber: number;
  proteinGoal: number;
  fiberGoal: number;
  proteinProgress: number;
  fiberProgress: number;
}

export class NutritionTracker {
  static calculateMenuNutrition(
    dailyMenu: DailyMenu,
    foodMenu: FoodMenu
  ): { protein: number; fiber: number } {
    let totalProtein = 0;
    let totalFiber = 0;

    // Helper function to find dish by name
    const findDish = (dishName: string): Dish | undefined => {
      for (const category of Object.values(foodMenu)) {
        const dish = category.find(d => d.name === dishName);
        if (dish) return dish;
      }
      return undefined;
    };

    // Calculate nutrition for each meal
    const meals = [
      dailyMenu.breakfast,
      dailyMenu.addons,
      dailyMenu.lunch,
      dailyMenu.dinner,
      dailyMenu.snacks
    ];

    meals.forEach(mealName => {
      const dish = findDish(mealName);
      if (dish) {
        totalProtein += dish.nutrition.protein;
        totalFiber += dish.nutrition.fiber;
      }
    });

    return { protein: totalProtein, fiber: totalFiber };
  }

  static getNutritionSummary(
    dailyMenu: DailyMenu,
    foodMenu: FoodMenu,
    goals: NutritionGoals,
    isForUser: boolean = true
  ): NutritionSummary {
    const nutrition = this.calculateMenuNutrition(dailyMenu, foodMenu);
    
    const proteinGoal = isForUser ? goals.user_protein : goals.spouse_protein;
    const fiberGoal = isForUser ? goals.user_fiber : goals.spouse_fiber;

    return {
      totalProtein: nutrition.protein,
      totalFiber: nutrition.fiber,
      proteinGoal,
      fiberGoal,
      proteinProgress: Math.min((nutrition.protein / proteinGoal) * 100, 100),
      fiberProgress: Math.min((nutrition.fiber / fiberGoal) * 100, 100)
    };
  }

  static suggestMealImprovements(
    summary: NutritionSummary
  ): string[] {
    const suggestions: string[] = [];

    if (summary.proteinProgress < 80) {
      suggestions.push('Consider adding more protein-rich foods like dal, nuts, or yogurt');
    }

    if (summary.fiberProgress < 80) {
      suggestions.push('Add more fiber-rich foods like vegetables, fruits, or whole grains');
    }

    if (summary.proteinProgress > 120) {
      suggestions.push('You might be consuming too much protein. Consider balancing with other nutrients');
    }

    if (summary.totalProtein < 30) {
      suggestions.push('Your protein intake is quite low. Try to include protein in every meal');
    }

    if (summary.totalFiber < 15) {
      suggestions.push('Your fiber intake could be improved. Add more vegetables and fruits');
    }

    return suggestions;
  }

  static getProteinRichDishes(foodMenu: FoodMenu, minProtein: number = 8): Dish[] {
    const proteinRichDishes: Dish[] = [];
    
    Object.values(foodMenu).forEach(category => {
      category.forEach(dish => {
        if (dish.nutrition.protein >= minProtein) {
          proteinRichDishes.push(dish);
        }
      });
    });

    return proteinRichDishes.sort((a, b) => b.nutrition.protein - a.nutrition.protein);
  }

  static getFiberRichDishes(foodMenu: FoodMenu, minFiber: number = 5): Dish[] {
    const fiberRichDishes: Dish[] = [];
    
    Object.values(foodMenu).forEach(category => {
      category.forEach(dish => {
        if (dish.nutrition.fiber >= minFiber) {
          fiberRichDishes.push(dish);
        }
      });
    });

    return fiberRichDishes.sort((a, b) => b.nutrition.fiber - a.nutrition.fiber);
  }

  static calculateWeeklyAverage(
    weeklyMenus: DailyMenu[],
    foodMenu: FoodMenu
  ): { avgProtein: number; avgFiber: number } {
    if (weeklyMenus.length === 0) {
      return { avgProtein: 0, avgFiber: 0 };
    }

    let totalProtein = 0;
    let totalFiber = 0;

    weeklyMenus.forEach(menu => {
      const nutrition = this.calculateMenuNutrition(menu, foodMenu);
      totalProtein += nutrition.protein;
      totalFiber += nutrition.fiber;
    });

    return {
      avgProtein: Math.round((totalProtein / weeklyMenus.length) * 10) / 10,
      avgFiber: Math.round((totalFiber / weeklyMenus.length) * 10) / 10
    };
  }

  static getNutritionStatus(progress: number): {
    status: 'low' | 'good' | 'high';
    color: string;
    message: string;
  } {
    if (progress < 70) {
      return {
        status: 'low',
        color: 'text-red-400',
        message: 'Below target'
      };
    } else if (progress <= 110) {
      return {
        status: 'good',
        color: 'text-green-400',
        message: 'On track'
      };
    } else {
      return {
        status: 'high',
        color: 'text-amber-400',
        message: 'Above target'
      };
    }
  }
}