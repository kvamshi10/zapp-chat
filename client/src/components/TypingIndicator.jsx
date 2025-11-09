import React from 'react';

export default function TypingIndicator({ users }) {
  if (!users || users.length === 0) return null;

  const displayText = users.length === 1 
    ? `${users[0]} is typing` 
    : users.length === 2
    ? `${users[0]} and ${users[1]} are typing`
    : `${users[0]} and ${users.length - 1} others are typing`;

  return (
    <div className="px-4 py-2">
      <div className="flex items-center space-x-2">
        <div className="bg-white dark:bg-gray-800 rounded-full px-4 py-2 flex items-center space-x-2 shadow-sm">
          <div className="typing-indicator">
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
            {displayText}
          </span>
        </div>
      </div>
    </div>
  );
}
