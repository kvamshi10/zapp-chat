import React from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';

export default function LoadingScreen() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800 dark:from-gray-900 dark:to-gray-950">
      <div className="relative">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-full shadow-2xl mb-8">
          <ChatBubbleLeftRightIcon className="w-16 h-16 text-primary-600 dark:text-primary-500" />
        </div>
        <div className="absolute inset-0 bg-white dark:bg-gray-800 rounded-full animate-ping opacity-30"></div>
      </div>
      
      <h1 className="text-3xl font-bold text-white mb-4">ChatApp</h1>
      
      <div className="flex space-x-2">
        <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
}
