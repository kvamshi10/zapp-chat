import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import api from '../utils/api';
import toast from 'react-hot-toast';

export const useChatStore = create(
  devtools((set, get) => ({
    chats: [],
    currentChat: null,
    messages: {},
    typingUsers: {},
    loadingChats: false,
    loadingMessages: false,
    incomingCall: null,
    activeCall: null,

    // Fetch all chats
    fetchChats: async () => {
      set({ loadingChats: true });
      try {
        const response = await api.get('/chats');
        set({ chats: response.data.chats, loadingChats: false });
      } catch (error) {
        console.error('Error fetching chats:', error);
        set({ loadingChats: false });
        toast.error('Failed to load chats');
      }
    },

    // Create new chat
    createChat: async (participants, name = null, isGroup = false) => {
      try {
        const response = await api.post('/chats/create', {
          participants,
          name,
          isGroup
        });
        const chat = response.data.chat;
        set((state) => ({
          chats: [chat, ...state.chats]
        }));
        return { success: true, chat };
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to create chat';
        toast.error(message);
        return { success: false, error: message };
      }
    },

    // Add chat to list
    addChat: (chat) => {
      set((state) => {
        const exists = state.chats.find(c => c._id === chat._id);
        if (exists) return state;
        return { chats: [chat, ...state.chats] };
      });
    },

    // Update chat
    updateChat: (chatId, updates) => {
      set((state) => ({
        chats: state.chats.map(chat => 
          chat._id === chatId ? { ...chat, ...updates } : chat
        ),
        currentChat: state.currentChat?._id === chatId 
          ? { ...state.currentChat, ...updates }
          : state.currentChat
      }));
    },

    // Remove chat
    removeChat: (chatId) => {
      set((state) => ({
        chats: state.chats.filter(chat => chat._id !== chatId),
        currentChat: state.currentChat?._id === chatId ? null : state.currentChat,
        messages: { ...state.messages, [chatId]: undefined }
      }));
    },

    // Set current chat
    setCurrentChat: async (chatId) => {
      if (!chatId) {
        set({ currentChat: null });
        return;
      }

      const chat = get().chats.find(c => c._id === chatId);
      if (chat) {
        set({ currentChat: chat });
        // Fetch messages if not already loaded
        if (!get().messages[chatId]) {
          await get().fetchMessages(chatId);
        }
        // Mark as read
        get().markChatAsRead(chatId);
      } else {
        // Fetch chat details
        try {
          const response = await api.get(`/chats/${chatId}`);
          set({ currentChat: response.data.chat });
          await get().fetchMessages(chatId);
        } catch (error) {
          console.error('Error fetching chat:', error);
          toast.error('Failed to load chat');
        }
      }
    },

    // Fetch messages for a chat
    fetchMessages: async (chatId, page = 1) => {
      set({ loadingMessages: true });
      try {
        const response = await api.get(`/messages/${chatId}?page=${page}`);
        const messages = response.data.messages;
        
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: page === 1 
              ? messages 
              : [...(state.messages[chatId] || []), ...messages]
          },
          loadingMessages: false
        }));

        // Mark messages as delivered
        messages.forEach(msg => {
          if (msg.sender._id !== get().user?._id && !msg.status.delivered) {
            get().markMessageDelivered(msg._id, chatId);
          }
        });
      } catch (error) {
        console.error('Error fetching messages:', error);
        set({ loadingMessages: false });
        toast.error('Failed to load messages');
      }
    },

    // Add message
    addMessage: (message) => {
      set((state) => {
        const chatMessages = state.messages[message.chat] || [];
        const exists = chatMessages.find(m => m._id === message._id);
        if (exists) return state;

        // Update chat's last message
        const updatedChats = state.chats.map(chat => 
          chat._id === message.chat 
            ? { 
                ...chat, 
                lastMessage: message, 
                lastActivity: message.createdAt,
                unreadCount: message.sender._id !== state.user?._id 
                  ? (chat.unreadCount || 0) + 1 
                  : chat.unreadCount
              }
            : chat
        );

        // Sort chats by last activity
        updatedChats.sort((a, b) => 
          new Date(b.lastActivity) - new Date(a.lastActivity)
        );

        return {
          messages: {
            ...state.messages,
            [message.chat]: [...chatMessages, message]
          },
          chats: updatedChats
        };
      });
    },

    // Update message
    updateMessage: (updatedMessage) => {
      set((state) => ({
        messages: {
          ...state.messages,
          [updatedMessage.chat]: state.messages[updatedMessage.chat]?.map(msg =>
            msg._id === updatedMessage._id ? updatedMessage : msg
          ) || []
        }
      }));
    },

    // Delete message
    deleteMessage: (messageId) => {
      set((state) => {
        const newMessages = { ...state.messages };
        Object.keys(newMessages).forEach(chatId => {
          newMessages[chatId] = newMessages[chatId]?.filter(msg => msg._id !== messageId);
        });
        return { messages: newMessages };
      });
    },

    // Hide message (delete for me)
    hideMessage: (messageId) => {
      set((state) => {
        const newMessages = { ...state.messages };
        Object.keys(newMessages).forEach(chatId => {
          newMessages[chatId] = newMessages[chatId]?.map(msg =>
            msg._id === messageId ? { ...msg, hidden: true } : msg
          );
        });
        return { messages: newMessages };
      });
    },

    // Send message
    sendMessage: async (chatId, content, type = 'text', attachments = [], replyTo = null) => {
      try {
        const formData = new FormData();
        formData.append('chatId', chatId);
        formData.append('content', content);
        formData.append('type', type);
        if (replyTo) formData.append('replyTo', replyTo);

        // Add attachments
        attachments.forEach(file => {
          formData.append('attachments', file);
        });

        const response = await api.post('/messages/send', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        return { success: true, message: response.data.message };
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to send message';
        toast.error(message);
        return { success: false, error: message };
      }
    },

    // Update message status
    updateMessageStatus: (messageId, status, userId, timestamp) => {
      set((state) => {
        const newMessages = { ...state.messages };
        Object.keys(newMessages).forEach(chatId => {
          newMessages[chatId] = newMessages[chatId]?.map(msg => {
            if (msg._id === messageId) {
              const updatedMsg = { ...msg };
              updatedMsg.status[status] = true;
              updatedMsg.status[`${status}At`] = timestamp;
              
              if (status === 'delivered' && userId) {
                updatedMsg.deliveredTo = updatedMsg.deliveredTo || [];
                if (!updatedMsg.deliveredTo.find(d => d.user === userId)) {
                  updatedMsg.deliveredTo.push({ user: userId, deliveredAt: timestamp });
                }
              } else if (status === 'read' && userId) {
                updatedMsg.readBy = updatedMsg.readBy || [];
                if (!updatedMsg.readBy.find(r => r.user === userId)) {
                  updatedMsg.readBy.push({ user: userId, readAt: timestamp });
                }
              }
              
              return updatedMsg;
            }
            return msg;
          });
        });
        return { messages: newMessages };
      });
    },

    // Mark chat as read
    markChatAsRead: (chatId, userId = null) => {
      set((state) => ({
        chats: state.chats.map(chat => 
          chat._id === chatId ? { ...chat, unreadCount: 0 } : chat
        )
      }));
    },

    // Typing indicators
    setTypingStatus: (chatId, userId, isTyping) => {
      set((state) => ({
        typingUsers: {
          ...state.typingUsers,
          [chatId]: isTyping
            ? [...(state.typingUsers[chatId] || []).filter(id => id !== userId), userId]
            : (state.typingUsers[chatId] || []).filter(id => id !== userId)
        }
      }));
    },

    // Update user status
    updateUserStatus: (userId, isOnline, lastSeen = null) => {
      set((state) => ({
        chats: state.chats.map(chat => ({
          ...chat,
          participants: chat.participants.map(p => 
            p.user._id === userId 
              ? { ...p, user: { ...p.user, isOnline, lastSeen } }
              : p
          )
        }))
      }));
    },

    // Add reaction
    addReaction: (messageId, userId, emoji) => {
      set((state) => {
        const newMessages = { ...state.messages };
        Object.keys(newMessages).forEach(chatId => {
          newMessages[chatId] = newMessages[chatId]?.map(msg => {
            if (msg._id === messageId) {
              const reactions = msg.reactions || [];
              const existingReaction = reactions.find(r => r.user === userId);
              
              if (existingReaction) {
                existingReaction.emoji = emoji;
              } else {
                reactions.push({ user: userId, emoji, createdAt: new Date() });
              }
              
              return { ...msg, reactions };
            }
            return msg;
          });
        });
        return { messages: newMessages };
      });
    },

    // Remove reaction
    removeReaction: (messageId, userId) => {
      set((state) => {
        const newMessages = { ...state.messages };
        Object.keys(newMessages).forEach(chatId => {
          newMessages[chatId] = newMessages[chatId]?.map(msg => {
            if (msg._id === messageId) {
              return {
                ...msg,
                reactions: (msg.reactions || []).filter(r => r.user !== userId)
              };
            }
            return msg;
          });
        });
        return { messages: newMessages };
      });
    },

    // Remove participant
    removeParticipant: (chatId, userId) => {
      set((state) => ({
        chats: state.chats.map(chat => 
          chat._id === chatId 
            ? {
                ...chat,
                participants: chat.participants.filter(p => p.user._id !== userId)
              }
            : chat
        ),
        currentChat: state.currentChat?._id === chatId
          ? {
              ...state.currentChat,
              participants: state.currentChat.participants.filter(p => p.user._id !== userId)
            }
          : state.currentChat
      }));
    },

    // Call management
    setIncomingCall: (callData) => {
      set({ incomingCall: callData });
    },

    handleCallAnswered: (answererId, answer) => {
      set((state) => ({
        activeCall: {
          ...state.activeCall,
          answer,
          status: 'connected'
        }
      }));
    },

    handleCallRejected: (rejecterId, reason) => {
      set({ incomingCall: null, activeCall: null });
    },

    endCall: () => {
      set({ incomingCall: null, activeCall: null });
    },

    handleIceCandidate: (senderId, candidate) => {
      // Handle WebRTC ICE candidate
      console.log('ICE candidate received:', { senderId, candidate });
    },

    // Helper to get user by ID
    getUserById: (userId) => {
      const chats = get().chats;
      for (const chat of chats) {
        const participant = chat.participants.find(p => p.user._id === userId);
        if (participant) return participant.user;
      }
      return null;
    },

    // Clear all data
    clearAll: () => {
      set({
        chats: [],
        currentChat: null,
        messages: {},
        typingUsers: {},
        incomingCall: null,
        activeCall: null
      });
    }
  }))
);
