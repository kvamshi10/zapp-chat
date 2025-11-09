import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../store/chatStore';
import { useSocketStore } from '../store/socketStore';
import { useAuthStore } from '../store/authStore';
import { format, isToday, isYesterday } from 'date-fns';
import {
  PaperClipIcon,
  MicrophoneIcon,
  FaceSmileIcon,
  PaperAirplaneIcon,
  PhoneIcon,
  VideoCameraIcon,
  InformationCircleIcon,
  Bars3Icon,
  EllipsisVerticalIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import EmojiPicker from 'emoji-picker-react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import UserAvatar from './UserAvatar';
import ChatInfo from './ChatInfo';

export default function ChatWindow({ chat, onMenuClick }) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { messages, sendMessage, typingUsers } = useChatStore();
  const { isUserOnline, startTyping, stopTyping } = useSocketStore();
  const [showInfo, setShowInfo] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const chatMessages = messages[chat._id] || [];

  const getChatName = () => {
    if (chat.isGroup) return chat.name;
    const otherUser = chat.participants.find(p => p.user._id !== user?._id)?.user;
    return otherUser?.username || 'Unknown User';
  };

  const getChatAvatar = () => {
    if (chat.isGroup) return chat.avatar;
    const otherUser = chat.participants.find(p => p.user._id !== user?._id)?.user;
    return otherUser?.avatar;
  };

  const getChatStatus = () => {
    if (chat.isGroup) {
      const onlineCount = chat.participants.filter(p => 
        p.user._id !== user?._id && isUserOnline(p.user._id)
      ).length;
      return `${chat.participants.length} members${onlineCount > 0 ? `, ${onlineCount} online` : ''}`;
    }
    const otherUser = chat.participants.find(p => p.user._id !== user?._id)?.user;
    if (!otherUser) return '';
    return otherUser.isOnline || isUserOnline(otherUser._id) ? 'Online' : `Last seen ${formatLastSeen(otherUser.lastSeen)}`;
  };

  const formatLastSeen = (date) => {
    if (!date) return 'recently';
    const d = new Date(date);
    if (isToday(d)) return `today at ${format(d, 'HH:mm')}`;
    if (isYesterday(d)) return `yesterday at ${format(d, 'HH:mm')}`;
    return format(d, 'dd/MM/yyyy HH:mm');
  };

  const handleSendMessage = async (content, attachments = []) => {
    if (!content.trim() && attachments.length === 0) return;
    
    await sendMessage(chat._id, content, 'text', attachments);
    setShowEmojiPicker(false);
    
    // Stop typing indicator
    if (isTyping) {
      stopTyping(chat._id);
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleTyping = () => {
    if (!isTyping) {
      startTyping(chat._id);
      setIsTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(chat._id);
      setIsTyping(false);
    }, 3000);
  };

  const handleVoiceCall = () => {
    // Implement voice call
    console.log('Starting voice call...');
  };

  const handleVideoCall = () => {
    // Implement video call
    console.log('Starting video call...');
  };

  const handleProfileClick = () => {
    if (!chat.isGroup) {
      const otherUser = chat.participants.find(p => p.user._id !== user?._id)?.user;
      if (otherUser) {
        navigate(`/profile/${otherUser._id}`);
      }
    }
  };

  // Clean up typing indicator on unmount
  useEffect(() => {
    return () => {
      if (isTyping) {
        stopTyping(chat._id);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [chat._id, isTyping]);

  // Get typing users for this chat
  const typersInChat = typingUsers[chat._id] || [];
  const typers = typersInChat
    .filter(userId => userId !== user?._id)
    .map(userId => {
      const participant = chat.participants.find(p => p.user._id === userId);
      return participant?.user.username;
    })
    .filter(Boolean);

  return (
    <div className="h-full flex">
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Mobile menu button */}
              <button
                onClick={onMenuClick}
                className="lg:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <Bars3Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>

              <div 
                className="flex items-center space-x-3 cursor-pointer"
                onClick={handleProfileClick}
              >
                <UserAvatar 
                  user={{ avatar: getChatAvatar(), username: getChatName() }} 
                  size="md"
                  showStatus={!chat.isGroup}
                />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {getChatName()}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {typers.length > 0 ? (
                      <span className="text-primary-600">
                        {typers.join(', ')} {typers.length === 1 ? 'is' : 'are'} typing...
                      </span>
                    ) : (
                      getChatStatus()
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleVoiceCall}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <PhoneIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={handleVideoCall}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <VideoCameraIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <InformationCircleIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
          <MessageList 
            messages={chatMessages} 
            currentUserId={user?._id}
            chat={chat}
          />
          {typers.length > 0 && <TypingIndicator users={typers} />}
        </div>

        {/* Message input */}
        <MessageInput 
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          showEmojiPicker={showEmojiPicker}
          setShowEmojiPicker={setShowEmojiPicker}
        />
      </div>

      {/* Chat info sidebar */}
      {showInfo && (
        <ChatInfo 
          chat={chat} 
          onClose={() => setShowInfo(false)} 
        />
      )}
    </div>
  );
}
