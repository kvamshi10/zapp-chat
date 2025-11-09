import React, { useState, useRef } from 'react';
import {
  PaperClipIcon,
  MicrophoneIcon,
  FaceSmileIcon,
  PaperAirplaneIcon,
  PhotoIcon,
  DocumentIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import EmojiPicker from 'emoji-picker-react';
import toast from 'react-hot-toast';

export default function MessageInput({ onSendMessage, onTyping, showEmojiPicker, setShowEmojiPicker }) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const textInputRef = useRef(null);

  const handleSend = (e) => {
    e?.preventDefault();
    if (message.trim() || attachments.length > 0) {
      onSendMessage(message, attachments);
      setMessage('');
      setAttachments([]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    onTyping();
  };

  const handleEmojiClick = (emojiObject) => {
    setMessage(prev => prev + emojiObject.emoji);
    textInputRef.current?.focus();
  };

  const handleFileSelect = (e, type) => {
    const files = Array.from(e.target.files);
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        toast.error(`File ${file.name} is too large. Maximum size is 10MB`);
        return false;
      }
      if (type === 'image' && !file.type.startsWith('image/')) {
        toast.error(`File ${file.name} is not an image`);
        return false;
      }
      return true;
    });

    setAttachments(prev => [...prev, ...validFiles]);
    setShowAttachmentMenu(false);
    
    // Clear input
    e.target.value = '';
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleVoiceRecord = () => {
    if (!isRecording) {
      // Start recording
      setIsRecording(true);
      toast.success('Recording started');
      // Implement actual voice recording logic here
    } else {
      // Stop recording
      setIsRecording(false);
      toast.success('Recording stopped');
      // Process and send the recording
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-800">
          {attachments.map((file, index) => (
            <div 
              key={index}
              className="relative group bg-gray-100 dark:bg-gray-800 rounded-lg p-2 flex items-center space-x-2"
            >
              {file.type.startsWith('image/') ? (
                <PhotoIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <DocumentIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
              <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[100px]">
                {file.name}
              </span>
              <button
                onClick={() => removeAttachment(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="px-4 py-3">
        <div className="flex items-end space-x-2">
          {/* Attachment button */}
          <div className="relative">
            <button
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <PaperClipIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            {/* Attachment menu */}
            {showAttachmentMenu && (
              <div className="absolute bottom-12 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-[150px]">
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                >
                  <PhotoIcon className="w-4 h-4" />
                  <span>Photos</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                >
                  <DocumentIcon className="w-4 h-4" />
                  <span>Documents</span>
                </button>
              </div>
            )}

            {/* Hidden file inputs */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e, 'image')}
            />
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e, 'file')}
            />
          </div>

          {/* Message input */}
          <div className="flex-1 relative">
            <textarea
              ref={textInputRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows="1"
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>

          {/* Emoji picker button */}
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <FaceSmileIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            {/* Emoji picker */}
            {showEmojiPicker && (
              <div className="absolute bottom-12 right-0 z-50">
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  theme="auto"
                  searchDisabled
                  skinTonesDisabled
                  width={300}
                  height={400}
                />
              </div>
            )}
          </div>

          {/* Send/Voice button */}
          {message.trim() || attachments.length > 0 ? (
            <button
              onClick={handleSend}
              className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleVoiceRecord}
              className={`p-2 rounded-lg transition-colors ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              <MicrophoneIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
