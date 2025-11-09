import React, { useState, useEffect } from 'react';
import { XMarkIcon, UserGroupIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import UserAvatar from './UserAvatar';
import toast from 'react-hot-toast';

export default function NewChatModal({ onClose }) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { createChat } = useChatStore();
  const [activeTab, setActiveTab] = useState('individual');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchUsers = async () => {
    try {
      // If no search query, get all users, otherwise search
      const response = searchQuery 
        ? await api.get(`/users/search?query=${searchQuery}`)
        : await api.get('/users');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleUserSelect = (selectedUser) => {
    if (activeTab === 'individual') {
      createIndividualChat(selectedUser);
    } else {
      toggleUserSelection(selectedUser);
    }
  };

  const toggleUserSelection = (selectedUser) => {
    setSelectedUsers(prev => {
      const exists = prev.find(u => u._id === selectedUser._id);
      if (exists) {
        return prev.filter(u => u._id !== selectedUser._id);
      }
      return [...prev, selectedUser];
    });
  };

  const createIndividualChat = async (selectedUser) => {
    setLoading(true);
    try {
      const result = await createChat([selectedUser._id], null, false);
      if (result.success) {
        navigate(`/chat/${result.chat._id}`);
        onClose();
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error('Failed to create chat');
    } finally {
      setLoading(false);
    }
  };

  const createGroupChat = async () => {
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }
    if (selectedUsers.length < 2) {
      toast.error('Please select at least 2 members for the group');
      return;
    }

    setLoading(true);
    try {
      const result = await createChat(
        selectedUsers.map(u => u._id),
        groupName,
        true
      );
      if (result.success) {
        navigate(`/chat/${result.chat._id}`);
        onClose();
      }
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const isUserSelected = (userId) => {
    return selectedUsers.some(u => u._id === userId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              New Chat
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex mt-4 space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('individual')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'individual'
                  ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Individual
            </button>
            <button
              onClick={() => setActiveTab('group')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'group'
                  ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Group
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'group' && (
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Enter group name"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    placeholder="Enter group description"
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="px-6 py-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Selected users (for group) */}
          {activeTab === 'group' && selectedUsers.length > 0 && (
            <div className="px-6 pb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Selected: {selectedUsers.length} users
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map(user => (
                  <div
                    key={user._id}
                    className="flex items-center space-x-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-1 rounded-full text-sm"
                  >
                    <span>{user.username}</span>
                    <button
                      onClick={() => toggleUserSelection(user)}
                      className="hover:text-primary-900 dark:hover:text-primary-100"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Users list */}
          <div className="px-6 pb-4">
            {users.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                {searchQuery ? 'No users found' : 'Loading users...'}
              </p>
            )}
            <div className="space-y-2">
              {users.map(searchUser => (
                <button
                  key={searchUser._id}
                  onClick={() => handleUserSelect(searchUser)}
                  disabled={loading}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    isUserSelected(searchUser._id)
                      ? 'bg-primary-100 dark:bg-primary-900/30 border border-primary-500'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <UserAvatar user={searchUser} size="md" showStatus />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {searchUser.username}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {searchUser.status}
                    </p>
                  </div>
                  {activeTab === 'group' && isUserSelected(searchUser._id) && (
                    <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer (for group) */}
        {activeTab === 'group' && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={createGroupChat}
              disabled={loading || selectedUsers.length < 2 || !groupName.trim()}
              className="w-full btn btn-primary flex items-center justify-center space-x-2"
            >
              <UserGroupIcon className="w-5 h-5" />
              <span>Create Group</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
