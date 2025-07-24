import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Target, 
  Volume2, 
  MessageSquare, 
  GitBranch,
  Save,
  Upload,
  Download,
  TestTube
} from 'lucide-react';
import { Settings as SettingsType } from '../types';

interface SettingsProps {
  settings: SettingsType;
  onUpdateSettings: (settings: SettingsType) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onUpdateSettings }) => {
  const [activeTab, setActiveTab] = useState('nutrition');
  const [localSettings, setLocalSettings] = useState<SettingsType>(settings);
  const [testMessage, setTestMessage] = useState('');

  const tabs = [
    { id: 'nutrition', label: 'Nutrition Goals', icon: Target },
    { id: 'user', label: 'User Info', icon: User },
    { id: 'voice', label: 'Voice Settings', icon: Volume2 },
    { id: 'telegram', label: 'Telegram', icon: MessageSquare },
    { id: 'gitlab', label: 'GitLab Sync', icon: GitBranch },
  ];

  const handleSave = () => {
    onUpdateSettings(localSettings);
    alert('Settings saved successfully!');
  };

  const handleVoiceTest = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('Hello! This is a test of the voice announcement system.');
      speechSynthesis.speak(utterance);
    } else {
      alert('Speech synthesis not supported in this browser');
    }
  };

  const handleTelegramTest = async () => {
    if (!localSettings.telegram.bot_token || !localSettings.telegram.chat_id) {
      alert('Please enter bot token and chat ID first');
      return;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${localSettings.telegram.bot_token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: localSettings.telegram.chat_id,
          text: testMessage || 'Test message from Smart Assistant PWA! 🤖'
        })
      });

      if (response.ok) {
        alert('Test message sent successfully!');
      } else {
        alert('Failed to send test message. Check your bot token and chat ID.');
      }
    } catch (error) {
      alert('Error sending test message: ' + error);
    }
  };

  const renderNutritionTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Daily Nutrition Goals</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h4 className="font-medium text-accent-400 mb-3">User ({localSettings.user_info.user_name})</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-primary-300 mb-1">Protein Goal (g)</label>
                <input
                  type="number"
                  value={localSettings.nutrition_goals.user_protein}
                  onChange={(e) => setLocalSettings(prev => ({
                    ...prev,
                    nutrition_goals: { ...prev.nutrition_goals, user_protein: parseInt(e.target.value) || 0 }
                  }))}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-primary-300 mb-1">Fiber Goal (g)</label>
                <input
                  type="number"
                  value={localSettings.nutrition_goals.user_fiber}
                  onChange={(e) => setLocalSettings(prev => ({
                    ...prev,
                    nutrition_goals: { ...prev.nutrition_goals, user_fiber: parseInt(e.target.value) || 0 }
                  }))}
                  className="input-field w-full"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <h4 className="font-medium text-accent-400 mb-3">Spouse ({localSettings.user_info.spouse_name})</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-primary-300 mb-1">Protein Goal (g)</label>
                <input
                  type="number"
                  value={localSettings.nutrition_goals.spouse_protein}
                  onChange={(e) => setLocalSettings(prev => ({
                    ...prev,
                    nutrition_goals: { ...prev.nutrition_goals, spouse_protein: parseInt(e.target.value) || 0 }
                  }))}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-primary-300 mb-1">Fiber Goal (g)</label>
                <input
                  type="number"
                  value={localSettings.nutrition_goals.spouse_fiber}
                  onChange={(e) => setLocalSettings(prev => ({
                    ...prev,
                    nutrition_goals: { ...prev.nutrition_goals, spouse_fiber: parseInt(e.target.value) || 0 }
                  }))}
                  className="input-field w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUserTab = () => (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">User Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-primary-300 mb-1">User Name</label>
            <input
              type="text"
              value={localSettings.user_info.user_name}
              onChange={(e) => setLocalSettings(prev => ({
                ...prev,
                user_info: { ...prev.user_info, user_name: e.target.value }
              }))}
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-primary-300 mb-1">User Weight (kg)</label>
            <input
              type="number"
              value={localSettings.user_info.user_weight}
              onChange={(e) => setLocalSettings(prev => ({
                ...prev,
                user_info: { ...prev.user_info, user_weight: parseInt(e.target.value) || 0 }
              }))}
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-primary-300 mb-1">Spouse Name</label>
            <input
              type="text"
              value={localSettings.user_info.spouse_name}
              onChange={(e) => setLocalSettings(prev => ({
                ...prev,
                user_info: { ...prev.user_info, spouse_name: e.target.value }
              }))}
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-primary-300 mb-1">Spouse Weight (kg)</label>
            <input
              type="number"
              value={localSettings.user_info.spouse_weight}
              onChange={(e) => setLocalSettings(prev => ({
                ...prev,
                user_info: { ...prev.user_info, spouse_weight: parseInt(e.target.value) || 0 }
              }))}
              className="input-field w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderVoiceTab = () => (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Voice Announcements</h3>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleVoiceTest}
              className="btn-secondary flex items-center text-sm"
            >
              <TestTube size={16} className="mr-1" />
              Test Voice
            </button>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={localSettings.voice.enabled}
                onChange={(e) => setLocalSettings(prev => ({
                  ...prev,
                  voice: { ...prev.voice, enabled: e.target.checked }
                }))}
                className="rounded"
              />
              <span className="text-white">Enable Voice</span>
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-accent-400">Announcement Schedules</h4>
          {localSettings.voice.schedules.map((schedule, index) => (
            <div key={schedule.id} className="p-4 bg-primary-700 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-primary-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={schedule.name}
                    onChange={(e) => {
                      const newSchedules = [...localSettings.voice.schedules];
                      newSchedules[index] = { ...schedule, name: e.target.value };
                      setLocalSettings(prev => ({
                        ...prev,
                        voice: { ...prev.voice, schedules: newSchedules }
                      }));
                    }}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-primary-300 mb-1">Time</label>
                  <input
                    type="time"
                    value={schedule.time}
                    onChange={(e) => {
                      const newSchedules = [...localSettings.voice.schedules];
                      newSchedules[index] = { ...schedule, time: e.target.value };
                      setLocalSettings(prev => ({
                        ...prev,
                        voice: { ...prev.voice, schedules: newSchedules }
                      }));
                    }}
                    className="input-field w-full"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={schedule.enabled}
                      onChange={(e) => {
                        const newSchedules = [...localSettings.voice.schedules];
                        newSchedules[index] = { ...schedule, enabled: e.target.checked };
                        setLocalSettings(prev => ({
                          ...prev,
                          voice: { ...prev.voice, schedules: newSchedules }
                        }));
                      }}
                      className="rounded"
                    />
                    <span className="text-white">Enabled</span>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTelegramTab = () => (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Telegram Integration</h3>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={localSettings.telegram.enabled}
              onChange={(e) => setLocalSettings(prev => ({
                ...prev,
                telegram: { ...prev.telegram, enabled: e.target.checked }
              }))}
              className="rounded"
            />
            <span className="text-white">Enable Telegram</span>
          </label>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-primary-300 mb-1">Bot Token</label>
            <input
              type="password"
              value={localSettings.telegram.bot_token}
              onChange={(e) => setLocalSettings(prev => ({
                ...prev,
                telegram: { ...prev.telegram, bot_token: e.target.value }
              }))}
              className="input-field w-full"
              placeholder="Enter your Telegram bot token"
            />
          </div>
          <div>
            <label className="block text-sm text-primary-300 mb-1">Chat ID</label>
            <input
              type="text"
              value={localSettings.telegram.chat_id}
              onChange={(e) => setLocalSettings(prev => ({
                ...prev,
                telegram: { ...prev.telegram, chat_id: e.target.value }
              }))}
              className="input-field w-full"
              placeholder="Enter your chat ID"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <input
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Test message (optional)"
              className="input-field flex-1"
            />
            <button
              onClick={handleTelegramTest}
              className="btn-secondary flex items-center"
            >
              <TestTube size={16} className="mr-1" />
              Test
            </button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-primary-700 rounded-lg">
          <h4 className="font-medium text-accent-400 mb-2">Setup Instructions</h4>
          <ol className="text-sm text-primary-300 space-y-1">
            <li>1. Message @BotFather on Telegram</li>
            <li>2. Create a new bot with /newbot</li>
            <li>3. Copy the bot token from BotFather</li>
            <li>4. Start a chat with your new bot</li>
            <li>5. Get your chat ID from @userinfobot</li>
            <li>6. Enter both values above and test</li>
          </ol>
        </div>
      </div>
    </div>
  );

  const renderGitLabTab = () => (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">GitLab Synchronization</h3>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={localSettings.gitlab.enabled}
              onChange={(e) => setLocalSettings(prev => ({
                ...prev,
                gitlab: { ...prev.gitlab, enabled: e.target.checked }
              }))}
              className="rounded"
            />
            <span className="text-white">Enable GitLab Sync</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-primary-300 mb-1">Personal Access Token</label>
            <input
              type="password"
              value={localSettings.gitlab.token}
              onChange={(e) => setLocalSettings(prev => ({
                ...prev,
                gitlab: { ...prev.gitlab, token: e.target.value }
              }))}
              className="input-field w-full"
              placeholder="Enter GitLab token"
            />
          </div>
          <div>
            <label className="block text-sm text-primary-300 mb-1">Project ID</label>
            <input
              type="text"
              value={localSettings.gitlab.project_id}
              onChange={(e) => setLocalSettings(prev => ({
                ...prev,
                gitlab: { ...prev.gitlab, project_id: e.target.value }
              }))}
              className="input-field w-full"
              placeholder="Enter project ID"
            />
          </div>
          <div>
            <label className="block text-sm text-primary-300 mb-1">Branch</label>
            <input
              type="text"
              value={localSettings.gitlab.branch}
              onChange={(e) => setLocalSettings(prev => ({
                ...prev,
                gitlab: { ...prev.gitlab, branch: e.target.value }
              }))}
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-primary-300 mb-1">Auto-sync Interval (minutes)</label>
            <input
              type="number"
              value={localSettings.gitlab.auto_sync_interval}
              onChange={(e) => setLocalSettings(prev => ({
                ...prev,
                gitlab: { ...prev.gitlab, auto_sync_interval: parseInt(e.target.value) || 5 }
              }))}
              className="input-field w-full"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4 mt-4">
          <button className="btn-secondary flex items-center">
            <Upload size={16} className="mr-1" />
            Push to GitLab
          </button>
          <button className="btn-secondary flex items-center">
            <Download size={16} className="mr-1" />
            Pull from GitLab
          </button>
        </div>

        {localSettings.gitlab.last_sync && (
          <div className="mt-4 text-sm text-primary-400">
            Last sync: {new Date(localSettings.gitlab.last_sync).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-primary-900 p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
        <p className="text-primary-300">Configure your Smart Assistant</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-accent-500 text-white'
                  : 'bg-primary-800 text-primary-300 hover:bg-primary-700'
              }`}
            >
              <Icon size={18} />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="mb-6">
        {activeTab === 'nutrition' && renderNutritionTab()}
        {activeTab === 'user' && renderUserTab()}
        {activeTab === 'voice' && renderVoiceTab()}
        {activeTab === 'telegram' && renderTelegramTab()}
        {activeTab === 'gitlab' && renderGitLabTab()}
      </div>

      {/* Save Button */}
      <div className="fixed bottom-20 right-4">
        <button
          onClick={handleSave}
          className="btn-primary flex items-center shadow-lg"
        >
          <Save size={18} className="mr-2" />
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default Settings;