import React, { useEffect, useRef } from 'react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import Message from './Message';

export default function MessageList({ messages, currentUserId, chat }) {
  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatDateSeparator = (date) => {
    const d = new Date(date);
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'MMMM d, yyyy');
  };

  const shouldShowDateSeparator = (currentMsg, previousMsg) => {
    if (!previousMsg) return true;
    return !isSameDay(new Date(currentMsg.createdAt), new Date(previousMsg.createdAt));
  };

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <p className="text-lg font-medium mb-2">No messages yet</p>
        <p className="text-sm">Send a message to start the conversation</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col px-4 py-4">
      {messages.map((message, index) => {
        const showDate = shouldShowDateSeparator(message, messages[index - 1]);
        const previousMessage = messages[index - 1];
        const nextMessage = messages[index + 1];
        const isFirstInGroup = !previousMessage || 
          previousMessage.sender._id !== message.sender._id ||
          showDate;
        const isLastInGroup = !nextMessage || 
          nextMessage.sender._id !== message.sender._id ||
          shouldShowDateSeparator(nextMessage, message);

        return (
          <React.Fragment key={message._id || index}>
            {showDate && (
              <div className="flex items-center justify-center my-4">
                <div className="bg-gray-200 dark:bg-gray-800 px-3 py-1 rounded-full">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {formatDateSeparator(message.createdAt)}
                  </span>
                </div>
              </div>
            )}
            <Message
              message={message}
              isSent={message.sender._id === currentUserId}
              isFirstInGroup={isFirstInGroup}
              isLastInGroup={isLastInGroup}
              chat={chat}
            />
          </React.Fragment>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
