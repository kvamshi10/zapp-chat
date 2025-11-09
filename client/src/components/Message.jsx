import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  CheckIcon,
  EllipsisVerticalIcon,
  FaceSmileIcon,
  ArrowUturnLeftIcon,
  TrashIcon,
  PencilIcon,
  StarIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import { CheckIcon as CheckSolidIcon } from '@heroicons/react/24/solid';
import UserAvatar from './UserAvatar';
import { useSocketStore } from '../store/socketStore';
import { useChatStore } from '../store/chatStore';
import toast from 'react-hot-toast';

export default function Message({ message, isSent, isFirstInGroup, isLastInGroup, chat }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const { addReaction, deleteMessage, editMessage } = useSocketStore();
  const { addReaction: addLocalReaction } = useChatStore();

  const handleReaction = (emoji) => {
    addReaction(message._id, emoji);
    addLocalReaction(message._id, message.sender._id, emoji);
    setShowReactions(false);
  };

  const handleDelete = (forEveryone = false) => {
    deleteMessage(message._id, forEveryone);
    setShowMenu(false);
    toast.success(forEveryone ? 'Message deleted for everyone' : 'Message deleted');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content.text);
    toast.success('Message copied to clipboard');
    setShowMenu(false);
  };

  const getStatusIcon = () => {
    if (!isSent) return null;
    
    if (message.status.read) {
      return (
        <div className="flex -space-x-2">
          <CheckSolidIcon className="w-4 h-4 text-blue-500" />
          <CheckSolidIcon className="w-4 h-4 text-blue-500" />
        </div>
      );
    } else if (message.status.delivered) {
      return (
        <div className="flex -space-x-2">
          <CheckIcon className="w-4 h-4 text-gray-400" />
          <CheckIcon className="w-4 h-4 text-gray-400" />
        </div>
      );
    } else if (message.status.sent) {
      return <CheckIcon className="w-4 h-4 text-gray-400" />;
    }
    return null;
  };

  const messageAlignment = isSent ? 'justify-end' : 'justify-start';
  const bubbleColor = isSent 
    ? 'bg-primary-600 text-white' 
    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700';

  return (
    <div className={`flex ${messageAlignment} mb-${isLastInGroup ? '3' : '1'} group relative`}>
      <div className={`flex ${isSent ? 'flex-row-reverse' : 'flex-row'} items-end max-w-[70%] space-x-2`}>
        {/* Avatar */}
        {!isSent && isLastInGroup && (
          <UserAvatar 
            user={message.sender} 
            size="sm"
          />
        )}
        {!isSent && !isLastInGroup && <div className="w-8" />}

        {/* Message bubble */}
        <div className="relative">
          <div
            className={`
              px-4 py-2 rounded-2xl ${bubbleColor} relative
              ${isSent 
                ? isLastInGroup ? 'rounded-br-sm' : '' 
                : isLastInGroup ? 'rounded-bl-sm' : ''
              }
            `}
          >
            {/* Sender name (for groups) */}
            {!isSent && chat.isGroup && isFirstInGroup && (
              <p className="text-xs font-medium text-primary-600 dark:text-primary-400 mb-1">
                {message.sender.username}
              </p>
            )}

            {/* Reply indicator */}
            {message.replyTo && (
              <div className="mb-2 p-2 bg-black/10 dark:bg-white/10 rounded">
                <p className="text-xs opacity-70">
                  <ArrowUturnLeftIcon className="w-3 h-3 inline mr-1" />
                  {message.replyTo.sender.username}
                </p>
                <p className="text-xs truncate">{message.replyTo.content.text}</p>
              </div>
            )}

            {/* Message content */}
            {message.type === 'text' && (
              <p className="whitespace-pre-wrap break-words">
                {message.content.text}
              </p>
            )}

            {/* Attachments */}
            {message.attachments?.length > 0 && (
              <div className="mt-2">
                {message.attachments.map((attachment, idx) => (
                  <div key={idx}>
                    {attachment.mimetype?.startsWith('image/') && (
                      <img 
                        src={attachment.url} 
                        alt="Attachment" 
                        className="rounded-lg max-w-full cursor-pointer hover:opacity-90"
                        onClick={() => window.open(attachment.url, '_blank')}
                      />
                    )}
                    {attachment.mimetype?.startsWith('video/') && (
                      <video 
                        src={attachment.url} 
                        controls 
                        className="rounded-lg max-w-full"
                      />
                    )}
                    {!attachment.mimetype?.startsWith('image/') && 
                     !attachment.mimetype?.startsWith('video/') && (
                      <a 
                        href={attachment.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 p-2 bg-black/10 dark:bg-white/10 rounded hover:bg-black/20 dark:hover:bg-white/20"
                      >
                        <ClipboardDocumentIcon className="w-4 h-4" />
                        <span className="text-sm">{attachment.originalName}</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Edited indicator */}
            {message.edited && (
              <p className="text-xs opacity-60 mt-1">(edited)</p>
            )}

            {/* Time and status */}
            <div className={`flex items-center space-x-1 mt-1 ${isSent ? 'justify-end' : ''}`}>
              <span className="text-xs opacity-60">
                {format(new Date(message.createdAt), 'HH:mm')}
              </span>
              {isSent && getStatusIcon()}
            </div>
          </div>

          {/* Reactions */}
          {message.reactions?.length > 0 && (
            <div className="absolute -bottom-3 left-2 flex space-x-1">
              {message.reactions.slice(0, 3).map((reaction, idx) => (
                <div 
                  key={idx}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-2 py-0.5 text-xs flex items-center space-x-1"
                >
                  <span>{reaction.emoji}</span>
                  {message.reactions.filter(r => r.emoji === reaction.emoji).length > 1 && (
                    <span className="text-gray-600 dark:text-gray-400">
                      {message.reactions.filter(r => r.emoji === reaction.emoji).length}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Message menu button */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={`
              absolute top-2 ${isSent ? '-left-8' : '-right-8'} 
              opacity-0 group-hover:opacity-100 transition-opacity
              p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded
            `}
          >
            <EllipsisVerticalIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Message menu dropdown */}
          {showMenu && (
            <div className={`
              absolute top-8 ${isSent ? 'right-0' : 'left-0'} 
              bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 
              z-10 min-w-[150px]
            `}>
              <button
                onClick={() => {
                  setShowReactions(true);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
                <FaceSmileIcon className="w-4 h-4" />
                <span>React</span>
              </button>
              <button
                onClick={handleCopy}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
                <ClipboardDocumentIcon className="w-4 h-4" />
                <span>Copy</span>
              </button>
              {isSent && (
                <>
                  <button
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <PencilIcon className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(true)}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <TrashIcon className="w-4 h-4" />
                    <span>Delete for everyone</span>
                  </button>
                </>
              )}
              <button
                onClick={() => handleDelete(false)}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
                <TrashIcon className="w-4 h-4" />
                <span>Delete for me</span>
              </button>
            </div>
          )}

          {/* Reaction picker */}
          {showReactions && (
            <div className={`
              absolute top-8 ${isSent ? 'right-0' : 'left-0'} 
              bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 
              z-10 p-2 flex space-x-2
            `}>
              {['❤️', '👍', '😂', '😮', '😢', '🙏'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="text-xl hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
