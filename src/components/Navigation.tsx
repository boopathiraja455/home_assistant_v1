import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Package, 
  Calendar, 
  CheckSquare, 
  Settings as SettingsIcon 
} from 'lucide-react';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/' },
    { id: 'stock', label: 'Stock', icon: Package, path: '/stock' },
    { id: 'menu', label: 'Menu', icon: Calendar, path: '/menu' },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, path: '/tasks' },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, path: '/settings' },
  ];

  const handleNavigation = (item: typeof navigationItems[0]) => {
    onPageChange(item.id);
    navigate(item.path);
  };

  const getCurrentPage = () => {
    const currentPath = location.pathname;
    const currentItem = navigationItems.find(item => item.path === currentPath);
    return currentItem?.id || 'dashboard';
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-primary-800 border-t border-primary-700 z-50">
      <div className="flex justify-around items-center py-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = getCurrentPage() === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item)}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 min-w-[60px] ${
                isActive
                  ? 'text-accent-400 bg-accent-500/10'
                  : 'text-primary-400 hover:text-primary-200 hover:bg-primary-700'
              }`}
            >
              <Icon 
                size={24} 
                className={`mb-1 ${isActive ? 'text-accent-400' : 'text-primary-400'}`} 
              />
              <span 
                className={`text-xs font-medium ${
                  isActive ? 'text-accent-400' : 'text-primary-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;