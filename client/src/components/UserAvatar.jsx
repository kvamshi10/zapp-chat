import React from 'react';
import { UserIcon } from '@heroicons/react/24/solid';

export default function UserAvatar({ user, size = 'md', showStatus = false, onClick }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-20 h-20'
  };

  const statusSizeClasses = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4',
    '2xl': 'w-5 h-5'
  };

  return (
    <div 
      className={`relative ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt={user.username || 'User'}
          className={`${sizeClasses[size]} rounded-full object-cover`}
        />
      ) : (
        <div className={`${sizeClasses[size]} rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center`}>
          <UserIcon className={`${size === 'sm' ? 'w-4 h-4' : size === 'lg' || size === 'xl' || size === '2xl' ? 'w-8 h-8' : 'w-5 h-5'} text-gray-500 dark:text-gray-400`} />
        </div>
      )}
      
      {showStatus && user?.isOnline && (
        <div className={`absolute bottom-0 right-0 ${statusSizeClasses[size]} bg-green-500 border-2 border-white dark:border-gray-900 rounded-full`}></div>
      )}
    </div>
  );
}
