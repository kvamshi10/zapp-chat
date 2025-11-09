import React from 'react';
import { ChatBubbleLeftRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="max-w-md text-center">
        <div className="bg-primary-100 dark:bg-primary-900/30 p-6 rounded-full w-fit mx-auto mb-6">
          <ChatBubbleLeftRightIcon className="w-16 h-16 text-primary-600 dark:text-primary-400" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome to ChatApp
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Select a conversation from the sidebar or start a new chat to begin messaging
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <ArrowLeftIcon className="w-4 h-4 hidden lg:block" />
            <span>Choose a chat from the sidebar</span>
          </div>
        </div>
        
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-4">
            <div className="text-2xl mb-2">🔒</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">End-to-end encrypted</p>
          </div>
          <div className="p-4">
            <div className="text-2xl mb-2">⚡</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Real-time messaging</p>
          </div>
          <div className="p-4">
            <div className="text-2xl mb-2">📱</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Works everywhere</p>
          </div>
        </div>
      </div>
    </div>
  );
}
