import React, { useEffect, useState } from 'react';
import { X, Clock, Wifi } from 'lucide-react';

interface TimerModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'timer1' | 'timer2' | 'info';
  onClose: () => void;
}

export const TimerModal: React.FC<TimerModalProps> = ({
  isOpen,
  title,
  message,
  type,
  onClose
}) => {
  const [timeVisible, setTimeVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeVisible(true);
      // Auto-close after 30 seconds if not manually closed
      const autoCloseTimer = setTimeout(() => {
        onClose();
      }, 30000);

      return () => clearTimeout(autoCloseTimer);
    } else {
      setTimeVisible(false);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'timer1':
        return <Clock className="w-16 h-16 text-yellow-400" />;
      case 'timer2':
        return <Clock className="w-16 h-16 text-red-400" />;
      default:
        return <Wifi className="w-16 h-16 text-blue-400" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'timer1':
        return 'bg-gradient-to-br from-yellow-900/90 to-orange-900/90';
      case 'timer2':
        return 'bg-gradient-to-br from-red-900/90 to-pink-900/90';
      default:
        return 'bg-gradient-to-br from-blue-900/90 to-purple-900/90';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 ${getBackgroundColor()} backdrop-blur-sm`}
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative z-10 max-w-2xl w-full mx-4 bg-gray-800 rounded-2xl shadow-2xl border border-gray-600 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <div className="flex items-center space-x-4">
            {getIcon()}
            <h2 className="text-2xl font-bold text-white">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6 text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          <div className="mb-6">
            <p className="text-xl text-gray-200 leading-relaxed">
              {message}
            </p>
          </div>

          {timeVisible && (
            <div className="mb-8 p-4 bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-400 mb-2">Current Time</p>
              <p className="text-2xl font-mono text-white">
                {new Date().toLocaleTimeString()}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {new Date().toLocaleDateString()}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              Acknowledge
            </button>
            <button
              onClick={() => {
                // Snooze for 5 minutes
                setTimeout(() => {
                  // Show modal again (this is a simple implementation)
                  console.log('Snooze reminder triggered');
                }, 5 * 60 * 1000);
                onClose();
              }}
              className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              Snooze 5min
            </button>
          </div>

          {/* Auto-close notice */}
          <p className="text-xs text-gray-500 mt-6">
            This notification will auto-close in 30 seconds
          </p>
        </div>
      </div>
    </div>
  );
};

export default TimerModal;