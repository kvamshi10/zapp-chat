import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useSocketStore } from '../store/socketStore';
import { format, isToday, isYesterday } from 'date-fns';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  Cog6ToothIcon,
  MoonIcon,
  SunIcon,
  ArrowRightOnRectangleIcon,
  UserGroupIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';
import NewChatModal from './NewChatModal';
import UserAvatar from './UserAvatar';

export default function ChatSidebar({ onClose }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { chats, currentChat, setCurrentChat } = useChatStore();
  const { theme, toggleTheme } = useThemeStore();
  const { isUserOnline } = useSocketStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const filteredChats = chats.filter(chat => {
    const chatName = chat.isGroup 
      ? chat.name 
      : chat.participants.find(p => p.user._id !== user?._id)?.user.username;
    return chatName?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatLastSeen = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isToday(d)) return format(d, 'HH:mm');
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'dd/MM/yyyy');
  };

  const getChatName = (chat) => {
    if (chat.isGroup) return chat.name;
    const otherUser = chat.participants.find(p => p.user._id !== user?._id)?.user;
    return otherUser?.username || 'Unknown User';
  };

  const getChatAvatar = (chat) => {
    if (chat.isGroup) return chat.avatar;
    const otherUser = chat.participants.find(p => p.user._id !== user?._id)?.user;
    return otherUser?.avatar;
  };

  const getChatStatus = (chat) => {
    if (chat.isGroup) {
      return `${chat.participants.length} members`;
    }
    const otherUser = chat.participants.find(p => p.user._id !== user?._id)?.user;
    if (!otherUser) return '';
    return otherUser.isOnline ? 'Online' : `Last seen ${formatLastSeen(otherUser.lastSeen)}`;
  };

  const handleChatSelect = (chat) => {
    setCurrentChat(chat._id);
    navigate(`/chat/${chat._id}`);
    if (onClose) onClose();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <ChatBubbleLeftRightIcon className="w-8 h-8 text-primary-600" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">ChatApp</h1>
          </div>
          
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* User section */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <UserAvatar user={user} size="md" showStatus />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.username}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.status}
              </p>
            </div>
          </button>

          {/* User menu dropdown */}
          {showUserMenu && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
              <button
                onClick={() => {
                  navigate('/profile');
                  setShowUserMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
                <UserGroupIcon className="w-4 h-4" />
                <span>Profile</span>
              </button>
              <button
                onClick={() => {
                  navigate('/settings');
                  setShowUserMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
                <Cog6ToothIcon className="w-4 h-4" />
                <span>Settings</span>
              </button>
              <button
                onClick={toggleTheme}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
                {theme === 'dark' ? (
                  <>
                    <SunIcon className="w-4 h-4" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <MoonIcon className="w-4 h-4" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>
              <hr className="border-gray-200 dark:border-gray-700" />
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>

        {/* Search bar */}
        <div className="mt-4 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* New chat button */}
        <button
          onClick={() => setShowNewChatModal(true)}
          className="mt-4 w-full btn btn-primary flex items-center justify-center space-x-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <ChatBubbleLeftRightIcon className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-sm">No chats yet</p>
            <p className="text-xs mt-1">Start a new conversation</p>
          </div>
        ) : (
          filteredChats.map(chat => {
            const otherUser = !chat.isGroup 
              ? chat.participants.find(p => p.user._id !== user?._id)?.user 
              : null;
            const isOnline = otherUser ? isUserOnline(otherUser._id) : false;

            return (
              <div
                key={chat._id}
                onClick={() => handleChatSelect(chat)}
                className={`
                  chat-list-item px-4 py-3 cursor-pointer transition-colors
                  ${currentChat?._id === chat._id ? 'active' : ''}
                `}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <UserAvatar 
                      user={{ avatar: getChatAvatar(chat), username: getChatName(chat) }} 
                      size="md"
                    />
                    {!chat.isGroup && isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {getChatName(chat)}
                      </p>
                      {chat.lastMessage && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatLastSeen(chat.lastMessage.createdAt)}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {chat.lastMessage ? (
                          <>
                            {chat.lastMessage.sender._id === user?._id && 'You: '}
                            {chat.lastMessage.content.text || '[Media]'}
                          </>
                        ) : (
                          getChatStatus(chat)
                        )}
                      </p>
                      {chat.unreadCount > 0 && (
                        <span className="unread-badge">
                          {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New chat modal */}
      {showNewChatModal && (
        <NewChatModal onClose={() => setShowNewChatModal(false)} />
      )}
    </div>
  );
}
