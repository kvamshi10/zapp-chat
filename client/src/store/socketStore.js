import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import io from 'socket.io-client';
import { useAuthStore } from './authStore';
import { useChatStore } from './chatStore';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useSocketStore = create(
  devtools((set, get) => ({
    socket: null,
    connected: false,
    onlineUsers: new Set(),

    // Connect to socket server
    connect: () => {
      const token = useAuthStore.getState().token;
      const user = useAuthStore.getState().user;
      
      if (!token || !user) {
        console.error('No token or user found');
        return;
      }

      if (get().socket?.connected) {
        console.log('Socket already connected');
        return;
      }

      const socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      // Connection events
      socket.on('connect', () => {
        console.log('✅ Socket connected');
        set({ connected: true });
      });

      socket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
        set({ connected: false });
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        set({ connected: false });
        
        if (error.message.includes('Authentication')) {
          useAuthStore.getState().logout();
          toast.error('Authentication failed. Please login again.');
        }
      });

      // User events
      socket.on('user_online', ({ userId }) => {
        set((state) => ({
          onlineUsers: new Set([...state.onlineUsers, userId])
        }));
        useChatStore.getState().updateUserStatus(userId, true);
      });

      socket.on('user_offline', ({ userId, lastSeen }) => {
        set((state) => {
          const newSet = new Set(state.onlineUsers);
          newSet.delete(userId);
          return { onlineUsers: newSet };
        });
        useChatStore.getState().updateUserStatus(userId, false, lastSeen);
      });

      // Chat events
      socket.on('chat_created', (chat) => {
        useChatStore.getState().addChat(chat);
        toast.success('New chat created!');
      });

      socket.on('new_message', (message) => {
        useChatStore.getState().addMessage(message);
        
        // Show notification if not in current chat
        const currentChatId = useChatStore.getState().currentChat?._id;
        if (message.chat !== currentChatId && message.sender._id !== user._id) {
          toast(`${message.sender.username}: ${message.content.text}`, {
            icon: '💬',
            duration: 4000,
          });
        }
      });

      socket.on('message_sent', ({ clientId, messageId, timestamp }) => {
        useChatStore.getState().confirmMessageSent(clientId, messageId, timestamp);
      });

      socket.on('message_delivered', ({ messageId, userId, deliveredAt }) => {
        useChatStore.getState().updateMessageStatus(messageId, 'delivered', userId, deliveredAt);
      });

      socket.on('message_read', ({ messageId, chatId, userId, readAt }) => {
        useChatStore.getState().updateMessageStatus(messageId, 'read', userId, readAt);
        if (chatId) {
          useChatStore.getState().markChatAsRead(chatId, userId);
        }
      });

      socket.on('message_edited', (message) => {
        useChatStore.getState().updateMessage(message);
      });

      socket.on('message_deleted', ({ messageId, deletedFor }) => {
        if (deletedFor === 'everyone') {
          useChatStore.getState().deleteMessage(messageId);
        } else {
          useChatStore.getState().hideMessage(messageId);
        }
      });

      // Typing indicators
      socket.on('user_typing', ({ userId, chatId, isTyping }) => {
        useChatStore.getState().setTypingStatus(chatId, userId, isTyping);
      });

      // Reaction events
      socket.on('reaction_added', ({ messageId, userId, emoji }) => {
        useChatStore.getState().addReaction(messageId, userId, emoji);
      });

      socket.on('reaction_removed', ({ messageId, userId }) => {
        useChatStore.getState().removeReaction(messageId, userId);
      });

      // Group events
      socket.on('participants_added', ({ chatId, participants, chat }) => {
        useChatStore.getState().updateChat(chatId, chat);
        toast.success('New participants added to group');
      });

      socket.on('participant_removed', ({ chatId, userId }) => {
        useChatStore.getState().removeParticipant(chatId, userId);
      });

      socket.on('participant_left', ({ chatId, userId }) => {
        useChatStore.getState().removeParticipant(chatId, userId);
        const username = useChatStore.getState().getUserById(userId)?.username;
        if (username) {
          toast(`${username} left the group`, { icon: '👋' });
        }
      });

      socket.on('removed_from_chat', ({ chatId }) => {
        useChatStore.getState().removeChat(chatId);
        toast.error('You have been removed from the group');
      });

      // Call events
      socket.on('incoming_call', ({ callerId, callerName, chatId, callType, offer }) => {
        useChatStore.getState().setIncomingCall({
          callerId,
          callerName,
          chatId,
          callType,
          offer
        });
      });

      socket.on('call_answered', ({ answererId, answer }) => {
        useChatStore.getState().handleCallAnswered(answererId, answer);
      });

      socket.on('call_rejected', ({ rejecterId, reason }) => {
        useChatStore.getState().handleCallRejected(rejecterId, reason);
        toast.error(`Call rejected: ${reason || 'User declined'}`);
      });

      socket.on('call_ended', ({ enderId }) => {
        useChatStore.getState().endCall();
        toast('Call ended', { icon: '📞' });
      });

      socket.on('ice_candidate', ({ senderId, candidate }) => {
        useChatStore.getState().handleIceCandidate(senderId, candidate);
      });

      set({ socket });
    },

    // Disconnect from socket server
    disconnect: () => {
      const socket = get().socket;
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        set({ socket: null, connected: false, onlineUsers: new Set() });
      }
    },

    // Emit events
    emit: (event, data) => {
      const socket = get().socket;
      if (socket?.connected) {
        socket.emit(event, data);
      } else {
        console.error('Socket not connected');
      }
    },

    // Join chat room
    joinChat: (chatId) => {
      get().emit('join_chat', chatId);
    },

    // Leave chat room
    leaveChat: (chatId) => {
      get().emit('leave_chat', chatId);
    },

    // Send message
    sendMessage: (messageData) => {
      const clientId = `msg_${Date.now()}_${Math.random()}`;
      get().emit('send_message', { ...messageData, clientId });
      return clientId;
    },

    // Update message status
    markMessageDelivered: (messageId, chatId) => {
      get().emit('message_delivered', { messageId, chatId });
    },

    markMessageRead: (messageId, chatId) => {
      get().emit('message_read', { messageId, chatId });
    },

    // Typing indicators
    startTyping: (chatId) => {
      get().emit('typing_start', { chatId });
    },

    stopTyping: (chatId) => {
      get().emit('typing_stop', { chatId });
    },

    // Message actions
    editMessage: (messageId, content) => {
      get().emit('edit_message', { messageId, content });
    },

    deleteMessage: (messageId, forEveryone = false) => {
      get().emit('delete_message', { messageId, forEveryone });
    },

    // Reactions
    addReaction: (messageId, emoji) => {
      get().emit('add_reaction', { messageId, emoji });
    },

    removeReaction: (messageId) => {
      get().emit('remove_reaction', { messageId });
    },

    // Group management
    createChat: (chatData) => {
      get().emit('create_chat', chatData);
    },

    addParticipants: (chatId, participants) => {
      get().emit('add_participants', { chatId, participants });
    },

    removeParticipant: (chatId, userId) => {
      get().emit('remove_participant', { chatId, userId });
    },

    leaveGroup: (chatId) => {
      get().emit('leave_group', chatId);
    },

    // Call functions
    initiateCall: (targetUserId, chatId, callType, offer) => {
      get().emit('call_initiate', { targetUserId, chatId, callType, offer });
    },

    answerCall: (callerId, answer) => {
      get().emit('call_answer', { callerId, answer });
    },

    rejectCall: (callerId, reason) => {
      get().emit('call_reject', { callerId, reason });
    },

    endCall: (targetUserId) => {
      get().emit('call_end', { targetUserId });
    },

    sendIceCandidate: (targetUserId, candidate) => {
      get().emit('ice_candidate', { targetUserId, candidate });
    },

    // Check if user is online
    isUserOnline: (userId) => {
      return get().onlineUsers.has(userId);
    }
  }))
);
