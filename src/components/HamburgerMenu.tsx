import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu,
  X,
  Home, 
  Package, 
  Calendar, 
  CheckSquare, 
  Settings as SettingsIcon 
} from 'lucide-react';

interface HamburgerMenuProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ currentPage, onPageChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/' },
    { id: 'stock', label: 'Stock Manager', icon: Package, path: '/stock' },
    { id: 'menu', label: 'Menu Planner', icon: Calendar, path: '/menu' },
    { id: 'tasks', label: 'Task Manager', icon: CheckSquare, path: '/tasks' },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, path: '/settings' },
  ];

  const handleNavigation = (item: typeof navigationItems[0]) => {
    onPageChange(item.id);
    navigate(item.path);
    setIsOpen(false);
  };

  const getCurrentPage = () => {
    const currentPath = location.pathname;
    const currentItem = navigationItems.find(item => item.path === currentPath);
    return currentItem?.id || 'dashboard';
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={toggleMenu}
        className="fixed top-4 right-4 z-50 bg-primary-800 hover:bg-primary-700 text-white p-3 rounded-lg shadow-lg transition-colors duration-200"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Menu Panel */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-primary-800 shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-6 pt-20">
          <h2 className="text-xl font-bold text-white mb-6">Navigation</h2>
          
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = getCurrentPage() === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item)}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-accent-500 text-white'
                      : 'text-primary-300 hover:text-white hover:bg-primary-700'
                  }`}
                >
                  <Icon size={20} className="mr-3" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Quick Stats */}
          <div className="mt-8 p-4 bg-primary-700 rounded-lg">
            <h3 className="text-sm font-medium text-accent-400 mb-2">Quick Access</h3>
            <div className="text-xs text-primary-300 space-y-1">
              <div>Current Time: {new Date().toLocaleTimeString()}</div>
              <div>Today: {new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HamburgerMenu;