import React, { useEffect, useState } from 'react';
import { PhoneIcon, VideoCameraIcon, PhoneXMarkIcon } from '@heroicons/react/24/solid';
import { useChatStore } from '../store/chatStore';
import { useSocketStore } from '../store/socketStore';
import UserAvatar from './UserAvatar';

export default function CallModal() {
  const { incomingCall, endCall } = useChatStore();
  const { answerCall, rejectCall } = useSocketStore();
  const [ringtoneInterval, setRingtoneInterval] = useState(null);

  useEffect(() => {
    // Play ringtone
    const interval = setInterval(() => {
      // Play sound effect here
      console.log('Ring ring...');
    }, 2000);
    setRingtoneInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const handleAnswer = () => {
    if (ringtoneInterval) clearInterval(ringtoneInterval);
    answerCall(incomingCall.callerId, null); // WebRTC answer would go here
    // Navigate to call screen
  };

  const handleReject = () => {
    if (ringtoneInterval) clearInterval(ringtoneInterval);
    rejectCall(incomingCall.callerId, 'User declined');
    endCall();
  };

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-sm w-full mx-4 animate-slide-up">
        <div className="text-center">
          <div className="relative inline-block mb-6">
            <UserAvatar
              user={{ username: incomingCall.callerName }}
              size="2xl"
            />
            <div className="absolute inset-0 rounded-full border-4 border-white dark:border-gray-900 animate-ping"></div>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {incomingCall.callerName}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Incoming {incomingCall.callType} call...
          </p>
          
          <div className="flex justify-center space-x-6">
            <button
              onClick={handleReject}
              className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full transition-all hover:scale-110"
            >
              <PhoneXMarkIcon className="w-8 h-8" />
            </button>
            
            <button
              onClick={handleAnswer}
              className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full transition-all hover:scale-110 animate-pulse"
            >
              {incomingCall.callType === 'video' ? (
                <VideoCameraIcon className="w-8 h-8" />
              ) : (
                <PhoneIcon className="w-8 h-8" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
