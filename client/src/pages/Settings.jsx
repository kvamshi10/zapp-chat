import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import {
  ArrowLeftIcon,
  UserIcon,
  BellIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  MoonIcon,
  SunIcon,
  ComputerDesktopIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function Settings() {
  const navigate = useNavigate();
  const { user, updateProfile, changePassword, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const [activeSection, setActiveSection] = useState('account');
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    status: user?.status || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [notifications, setNotifications] = useState({
    message: true,
    sound: true,
    desktop: true
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveProfile = async () => {
    const result = await updateProfile({
      username: formData.username,
      email: formData.email,
      status: formData.status
    });
    if (result.success) {
      toast.success('Profile updated successfully');
    }
  };

  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    const result = await changePassword({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword
    });
    
    if (result.success) {
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // Implement account deletion
      toast.error('Account deletion not implemented in demo');
    }
  };

  const sections = [
    { id: 'account', label: 'Account', icon: UserIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'privacy', label: 'Privacy & Security', icon: ShieldCheckIcon },
    { id: 'appearance', label: 'Appearance', icon: PaintBrushIcon },
    { id: 'help', label: 'Help & Support', icon: QuestionMarkCircleIcon }
  ];

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/chat')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h1>
          </div>
        </div>
        
        <nav className="p-4">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeSection === section.id
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <section.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{section.label}</span>
            </button>
          ))}
          
          <hr className="my-4 border-gray-200 dark:border-gray-800" />
          
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-8">
          {/* Account Section */}
          {activeSection === 'account' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Account Settings</h2>
                <p className="text-gray-600 dark:text-gray-400">Manage your account information and password</p>
              </div>

              <div className="card p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <input
                    type="text"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="input"
                    maxLength="100"
                  />
                </div>
                
                <button onClick={handleSaveProfile} className="btn btn-primary">
                  Save Changes
                </button>
              </div>

              <div className="card p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Change Password</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="input"
                  />
                </div>
                
                <button onClick={handleChangePassword} className="btn btn-primary">
                  Update Password
                </button>
              </div>

              <div className="card p-6 space-y-4">
                <h3 className="text-lg font-semibold text-red-600">Danger Zone</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button onClick={handleDeleteAccount} className="btn btn-danger">
                  <TrashIcon className="w-4 h-4 mr-2 inline" />
                  Delete Account
                </button>
              </div>
            </div>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Notification Settings</h2>
                <p className="text-gray-600 dark:text-gray-400">Configure how you receive notifications</p>
              </div>

              <div className="card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Message Notifications</p>
                    <p className="text-xs text-gray-500">Get notified when you receive new messages</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notifications.message}
                      onChange={(e) => setNotifications({...notifications, message: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Sound</p>
                    <p className="text-xs text-gray-500">Play sound for notifications</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notifications.sound}
                      onChange={(e) => setNotifications({...notifications, sound: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Desktop Notifications</p>
                    <p className="text-xs text-gray-500">Show notifications on desktop</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notifications.desktop}
                      onChange={(e) => setNotifications({...notifications, desktop: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Section */}
          {activeSection === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Privacy & Security</h2>
                <p className="text-gray-600 dark:text-gray-400">Control your privacy and security settings</p>
              </div>

              <div className="card p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <ShieldCheckIcon className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">End-to-End Encryption</p>
                    <p className="text-xs text-gray-500">All your messages are encrypted</p>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Read Receipts</p>
                      <p className="text-xs text-gray-500">Let others know when you've read their messages</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Last Seen</p>
                      <p className="text-xs text-gray-500">Show when you were last online</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Profile Photo</p>
                      <p className="text-xs text-gray-500">Who can see your profile photo</p>
                    </div>
                    <select className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm">
                      <option>Everyone</option>
                      <option>Contacts</option>
                      <option>Nobody</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Appearance Section */}
          {activeSection === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Appearance</h2>
                <p className="text-gray-600 dark:text-gray-400">Customize how ChatApp looks on your device</p>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Theme</h3>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setTheme('light')}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      theme === 'light'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <SunIcon className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Light</p>
                  </button>
                  
                  <button
                    onClick={() => setTheme('dark')}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      theme === 'dark'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <MoonIcon className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Dark</p>
                  </button>
                  
                  <button
                    onClick={() => setTheme('auto')}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      theme === 'auto'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <ComputerDesktopIcon className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">System</p>
                  </button>
                </div>
              </div>

              <div className="card p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Display</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Compact Mode</p>
                    <p className="text-xs text-gray-500">Reduce spacing between messages</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Font Size
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                    <option>Small</option>
                    <option selected>Medium</option>
                    <option>Large</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Help Section */}
          {activeSection === 'help' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Help & Support</h2>
                <p className="text-gray-600 dark:text-gray-400">Get help with ChatApp</p>
              </div>

              <div className="card p-6 space-y-4">
                <a href="#" className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-850 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">FAQ</p>
                  <p className="text-xs text-gray-500">Find answers to common questions</p>
                </a>
                
                <a href="#" className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-850 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Contact Support</p>
                  <p className="text-xs text-gray-500">Get help from our support team</p>
                </a>
                
                <a href="#" className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-850 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Terms of Service</p>
                  <p className="text-xs text-gray-500">Read our terms and conditions</p>
                </a>
                
                <a href="#" className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-850 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Privacy Policy</p>
                  <p className="text-xs text-gray-500">Learn how we protect your data</p>
                </a>
              </div>

              <div className="card p-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Version 1.0.0</p>
                <p className="text-xs text-gray-500">© 2024 ChatApp. All rights reserved.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
