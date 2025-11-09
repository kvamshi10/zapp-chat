import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  XMarkIcon,
  UserGroupIcon,
  BellIcon,
  PhotoIcon,
  DocumentIcon,
  LinkIcon,
  TrashIcon,
  ArrowRightOnRectangleIcon,
  PlusIcon,
  UserMinusIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import UserAvatar from './UserAvatar';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { useSocketStore } from '../store/socketStore';
import toast from 'react-hot-toast';

export default function ChatInfo({ chat, onClose }) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { messages, removeChat } = useChatStore();
  const { leaveGroup, removeParticipant, isUserOnline } = useSocketStore();
  const [expandedSection, setExpandedSection] = useState('members');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const chatMessages = messages[chat._id] || [];
  const mediaMessages = chatMessages.filter(msg => 
    msg.attachments?.some(att => att.mimetype?.startsWith('image/') || att.mimetype?.startsWith('video/'))
  );
  const fileMessages = chatMessages.filter(msg => 
    msg.attachments?.some(att => !att.mimetype?.startsWith('image/') && !att.mimetype?.startsWith('video/'))
  );

  const isAdmin = chat.isGroup && chat.participants.find(
    p => p.user._id === user?._id
  )?.role === 'admin';

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

  const handleLeaveGroup = async () => {
    if (window.confirm('Are you sure you want to leave this group?')) {
      leaveGroup(chat._id);
      removeChat(chat._id);
      navigate('/chat');
      onClose();
      toast.success('Left the group');
    }
  };

  const handleDeleteChat = async () => {
    if (showDeleteConfirm) {
      removeChat(chat._id);
      navigate('/chat');
      onClose();
      toast.success('Chat deleted');
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  const handleRemoveParticipant = (participantId) => {
    if (window.confirm('Remove this participant from the group?')) {
      removeParticipant(chat._id, participantId);
      toast.success('Participant removed');
    }
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="w-80 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Chat Info
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Profile section */}
      <div className="px-6 py-6 text-center border-b border-gray-200 dark:border-gray-800">
        <UserAvatar 
          user={{ avatar: getChatAvatar(), username: getChatName() }} 
          size="2xl"
        />
        <h4 className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">
          {getChatName()}
        </h4>
        {chat.isGroup ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {chat.participants.length} members
          </p>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {chat.participants.find(p => p.user._id !== user?._id)?.user.status}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Group Description */}
        {chat.isGroup && chat.description && (
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {chat.description}
            </p>
          </div>
        )}

        {/* Notifications */}
        <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-850 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <BellIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-gray-900 dark:text-white">Notifications</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
          </label>
        </button>

        {/* Members section (for groups) */}
        {chat.isGroup && (
          <div className="border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => toggleSection('members')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-850"
            >
              <div className="flex items-center space-x-3">
                <UserGroupIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm text-gray-900 dark:text-white">
                  Members ({chat.participants.length})
                </span>
              </div>
              {expandedSection === 'members' ? (
                <ChevronDownIcon className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 text-gray-400" />
              )}
            </button>
            
            {expandedSection === 'members' && (
              <div className="px-6 pb-4">
                {isAdmin && (
                  <button className="w-full mb-3 py-2 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-sm text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-850 flex items-center justify-center space-x-2">
                    <PlusIcon className="w-4 h-4" />
                    <span>Add Members</span>
                  </button>
                )}
                <div className="space-y-2">
                  {chat.participants.map(participant => (
                    <div 
                      key={participant.user._id}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center space-x-3">
                        <UserAvatar 
                          user={participant.user} 
                          size="sm" 
                          showStatus={isUserOnline(participant.user._id)}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {participant.user.username}
                            {participant.user._id === user?._id && ' (You)'}
                          </p>
                          {participant.role === 'admin' && (
                            <span className="text-xs text-primary-600 dark:text-primary-400">
                              Admin
                            </span>
                          )}
                        </div>
                      </div>
                      {isAdmin && participant.user._id !== user?._id && (
                        <button
                          onClick={() => handleRemoveParticipant(participant.user._id)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                        >
                          <UserMinusIcon className="w-4 h-4 text-red-500" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Media section */}
        <div className="border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => toggleSection('media')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-850"
          >
            <div className="flex items-center space-x-3">
              <PhotoIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-900 dark:text-white">
                Media ({mediaMessages.length})
              </span>
            </div>
            {expandedSection === 'media' ? (
              <ChevronDownIcon className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 text-gray-400" />
            )}
          </button>
          
          {expandedSection === 'media' && (
            <div className="px-6 pb-4">
              {mediaMessages.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No media shared yet
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {mediaMessages.slice(0, 9).map(msg => 
                    msg.attachments.filter(att => 
                      att.mimetype?.startsWith('image/') || att.mimetype?.startsWith('video/')
                    ).map(att => (
                      <div 
                        key={att.url}
                        className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:opacity-90"
                        onClick={() => window.open(att.url, '_blank')}
                      >
                        {att.mimetype?.startsWith('image/') ? (
                          <img 
                            src={att.url} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <PhotoIcon className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Files section */}
        <div className="border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => toggleSection('files')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-850"
          >
            <div className="flex items-center space-x-3">
              <DocumentIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-900 dark:text-white">
                Files ({fileMessages.length})
              </span>
            </div>
            {expandedSection === 'files' ? (
              <ChevronDownIcon className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 text-gray-400" />
            )}
          </button>
          
          {expandedSection === 'files' && (
            <div className="px-6 pb-4">
              {fileMessages.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No files shared yet
                </p>
              ) : (
                <div className="space-y-2">
                  {fileMessages.slice(0, 5).map(msg => 
                    msg.attachments.filter(att => 
                      !att.mimetype?.startsWith('image/') && !att.mimetype?.startsWith('video/')
                    ).map(att => (
                      <a
                        key={att.url}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                      >
                        <DocumentIcon className="w-5 h-5 text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 dark:text-white truncate">
                            {att.originalName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(msg.createdAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </a>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Encryption info */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <ShieldCheckIcon className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                End-to-End Encrypted
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Messages are secured with encryption
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 space-y-2">
          {chat.isGroup ? (
            <button
              onClick={handleLeaveGroup}
              className="w-full flex items-center justify-center space-x-2 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Leave Group</span>
            </button>
          ) : (
            <button
              onClick={handleDeleteChat}
              className={`w-full flex items-center justify-center space-x-2 py-2 rounded-lg ${
                showDeleteConfirm 
                  ? 'bg-red-600 text-white' 
                  : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
              }`}
            >
              <TrashIcon className="w-5 h-5" />
              <span className="text-sm font-medium">
                {showDeleteConfirm ? 'Click again to confirm' : 'Delete Chat'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
