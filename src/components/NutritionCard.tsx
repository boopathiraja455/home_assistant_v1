import React from 'react';
import { Target, TrendingUp } from 'lucide-react';
import { FoodMenu, DailyMenu, Settings } from '../types';
import { NutritionTracker, NutritionSummary } from '../utils/nutritionTracker';

interface NutritionCardProps {
  currentMenu: DailyMenu;
  foodMenu: FoodMenu;
  settings: Settings;
}

const NutritionCard: React.FC<NutritionCardProps> = ({
  currentMenu,
  foodMenu,
  settings
}) => {
  const userSummary = NutritionTracker.getNutritionSummary(
    currentMenu,
    foodMenu,
    settings.nutrition_goals,
    true
  );

  const spouseSummary = NutritionTracker.getNutritionSummary(
    currentMenu,
    foodMenu,
    settings.nutrition_goals,
    false
  );

  const renderProgressBar = (progress: number, color: string) => (
    <div className="w-full bg-primary-700 rounded-full h-2">
      <div
        className={`h-2 rounded-full transition-all duration-300 ${color}`}
        style={{ width: `${Math.min(progress, 100)}%` }}
      ></div>
    </div>
  );

  const renderNutritionSection = (
    summary: NutritionSummary,
    userName: string,
    isUser: boolean
  ) => (
    <div className="flex-1">
      <h4 className="font-medium text-accent-400 mb-3 text-sm">
        {userName} ({isUser ? settings.user_info.user_weight : settings.user_info.spouse_weight}kg)
      </h4>
      
      <div className="space-y-3">
        {/* Protein */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-primary-300">Protein</span>
            <span className="text-xs text-white">
              {summary.totalProtein}g / {summary.proteinGoal}g
            </span>
          </div>
          {renderProgressBar(summary.proteinProgress, 'bg-blue-500')}
          <div className="text-xs text-primary-400 mt-1">
            {Math.round(summary.proteinProgress)}% of goal
          </div>
        </div>

        {/* Fiber */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-primary-300">Fiber</span>
            <span className="text-xs text-white">
              {summary.totalFiber}g / {summary.fiberGoal}g
            </span>
          </div>
          {renderProgressBar(summary.fiberProgress, 'bg-green-500')}
          <div className="text-xs text-primary-400 mt-1">
            {Math.round(summary.fiberProgress)}% of goal
          </div>
        </div>
      </div>
    </div>
  );

  const suggestions = NutritionTracker.suggestMealImprovements(userSummary);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Target className="mr-2 text-accent-400" size={20} />
          Today's Nutrition
        </h3>
        <TrendingUp className="text-accent-400" size={16} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
        {renderNutritionSection(userSummary, settings.user_info.user_name, true)}
        {renderNutritionSection(spouseSummary, settings.user_info.spouse_name, false)}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="mt-4 p-3 bg-primary-700 rounded-lg">
          <h5 className="text-sm font-medium text-accent-400 mb-2">💡 Nutrition Tips</h5>
          <ul className="text-xs text-primary-300 space-y-1">
            {suggestions.slice(0, 2).map((suggestion, index) => (
              <li key={index} className="flex items-start">
                <span className="text-accent-400 mr-1">•</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NutritionCard;