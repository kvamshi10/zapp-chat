import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useChatStore } from '../store/chatStore';
import { useSocketStore } from '../store/socketStore';
import { useAuthStore } from '../store/authStore';
import ChatSidebar from '../components/ChatSidebar';
import ChatWindow from '../components/ChatWindow';
import EmptyState from '../components/EmptyState';
import CallModal from '../components/CallModal';

export default function Chat() {
  const { chatId } = useParams();
  const { currentChat, setCurrentChat, fetchChats, incomingCall } = useChatStore();
  const { connected } = useSocketStore();
  const { user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (chatId) {
      setCurrentChat(chatId);
    }
  }, [chatId]);

  return (
    <div className="h-screen flex overflow-hidden bg-white dark:bg-gray-950">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-200 ease-in-out
        lg:relative lg:translate-x-0 lg:w-96
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <ChatSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {currentChat ? (
          <ChatWindow 
            chat={currentChat} 
            onMenuClick={() => setSidebarOpen(true)}
          />
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Connection status indicator */}
      {!connected && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-yellow-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm font-medium">Connecting...</span>
          </div>
        </div>
      )}

      {/* Incoming call modal */}
      {incomingCall && <CallModal />}
    </div>
  );
}
