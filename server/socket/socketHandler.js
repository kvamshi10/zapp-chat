const { socketAuth } = require('../middleware/auth');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

// Store active socket connections
const activeConnections = new Map();
const userSockets = new Map(); // userId -> Set of socket IDs

module.exports = (io) => {
  // Apply authentication middleware
  io.use(socketAuth);

  io.on('connection', async (socket) => {
    console.log(`✅ User ${socket.userId} connected with socket ${socket.id}`);

    try {
      // Update user online status
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: true,
        socketId: socket.id,
        lastSeen: new Date()
      });

      // Store connection
      activeConnections.set(socket.id, socket.userId);
      
      // Add to user sockets map
      if (!userSockets.has(socket.userId)) {
        userSockets.set(socket.userId, new Set());
      }
      userSockets.get(socket.userId).add(socket.id);

      // Join user to their personal room
      socket.join(`user:${socket.userId}`);

      // Join user to all their chat rooms
      const userChats = await Chat.find({
        'participants.user': socket.userId
      }).select('_id');
      
      for (const chat of userChats) {
        socket.join(`chat:${chat._id}`);
      }

      // Notify user's contacts that they're online
      const user = await User.findById(socket.userId)
        .populate('contacts', '_id');
      
      for (const contact of user.contacts) {
        io.to(`user:${contact._id}`).emit('user_online', {
          userId: socket.userId,
          isOnline: true
        });
      }

      // Send initial data to the connected user
      socket.emit('connected', {
        userId: socket.userId,
        socketId: socket.id
      });

    } catch (error) {
      console.error('Socket connection error:', error);
    }

    // Handle joining a chat room
    socket.on('join_chat', async (chatId) => {
      try {
        const chat = await Chat.findById(chatId);
        if (chat && chat.isParticipant(socket.userId)) {
          socket.join(`chat:${chatId}`);
          socket.emit('joined_chat', { chatId });
          
          // Notify other participants
          socket.to(`chat:${chatId}`).emit('user_joined_chat', {
            userId: socket.userId,
            chatId
          });
        }
      } catch (error) {
        console.error('Join chat error:', error);
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    // Handle leaving a chat room
    socket.on('leave_chat', (chatId) => {
      socket.leave(`chat:${chatId}`);
      socket.emit('left_chat', { chatId });
    });

    // Handle sending a message
    socket.on('send_message', async (data) => {
      try {
        const { chatId, content, type = 'text', attachments, replyTo, clientId } = data;

        // Validate chat membership
        const chat = await Chat.findById(chatId);
        if (!chat || !chat.isParticipant(socket.userId)) {
          return socket.emit('error', { 
            message: 'You are not a member of this chat',
            clientId 
          });
        }

        // Create message
        const message = await Message.create({
          chat: chatId,
          sender: socket.userId,
          content: { text: content },
          type,
          attachments,
          replyTo,
          status: {
            sent: true,
            sentAt: new Date()
          },
          metadata: { clientId }
        });

        // Update chat
        await chat.updateLastActivity(message._id);
        
        // Update unread count for other participants
        for (const participant of chat.participants) {
          if (participant.user.toString() !== socket.userId) {
            await chat.updateUnreadCount(participant.user, true);
          }
        }

        // Populate message
        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'username avatar')
          .populate('replyTo');

        // Send message to all participants in the chat
        io.to(`chat:${chatId}`).emit('new_message', populatedMessage);

        // Send delivery confirmation to sender
        socket.emit('message_sent', {
          clientId,
          messageId: message._id,
          timestamp: message.createdAt
        });

        // Send push notification to offline users
        const offlineParticipants = await User.find({
          _id: { $in: chat.participants.map(p => p.user) },
          isOnline: false
        });

        for (const participant of offlineParticipants) {
          // In a real app, you would send push notifications here
          console.log(`📱 Would send push notification to ${participant.username}`);
        }

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { 
          message: 'Failed to send message',
          clientId: data.clientId 
        });
      }
    });

    // Handle message delivered status
    socket.on('message_delivered', async (data) => {
      try {
        const { messageId, chatId } = data;
        
        const message = await Message.findById(messageId);
        if (message) {
          await message.updateStatus('delivered', socket.userId);
          
          // Notify sender
          const senderSocketIds = userSockets.get(message.sender.toString());
          if (senderSocketIds) {
            senderSocketIds.forEach(socketId => {
              io.to(socketId).emit('message_delivered', {
                messageId,
                userId: socket.userId,
                deliveredAt: new Date()
              });
            });
          }
        }
      } catch (error) {
        console.error('Message delivered error:', error);
      }
    });

    // Handle message read status
    socket.on('message_read', async (data) => {
      try {
        const { messageId, chatId } = data;
        
        const message = await Message.findById(messageId);
        if (message) {
          await message.updateStatus('read', socket.userId);
          
          const chat = await Chat.findById(chatId);
          if (chat) {
            await chat.markAsRead(socket.userId, messageId);
          }
          
          // Notify sender
          const senderSocketIds = userSockets.get(message.sender.toString());
          if (senderSocketIds) {
            senderSocketIds.forEach(socketId => {
              io.to(socketId).emit('message_read', {
                messageId,
                chatId,
                userId: socket.userId,
                readAt: new Date()
              });
            });
          }
        }
      } catch (error) {
        console.error('Message read error:', error);
      }
    });

    // Handle typing indicators
    socket.on('typing_start', ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit('user_typing', {
        userId: socket.userId,
        chatId,
        isTyping: true
      });
    });

    socket.on('typing_stop', ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit('user_typing', {
        userId: socket.userId,
        chatId,
        isTyping: false
      });
    });

    // Handle message editing
    socket.on('edit_message', async (data) => {
      try {
        const { messageId, content } = data;
        
        const message = await Message.findById(messageId);
        if (message && message.sender.toString() === socket.userId) {
          await message.editMessage(content);
          
          const updatedMessage = await Message.findById(messageId)
            .populate('sender', 'username avatar');
          
          // Notify all participants
          io.to(`chat:${message.chat}`).emit('message_edited', updatedMessage);
        }
      } catch (error) {
        console.error('Edit message error:', error);
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    // Handle message deletion
    socket.on('delete_message', async (data) => {
      try {
        const { messageId, forEveryone = false } = data;
        
        const message = await Message.findById(messageId);
        if (!message) return;
        
        const chat = await Chat.findById(message.chat);
        if (!chat || !chat.isParticipant(socket.userId)) return;
        
        if (forEveryone && message.sender.toString() === socket.userId) {
          await message.softDelete();
          io.to(`chat:${message.chat}`).emit('message_deleted', {
            messageId,
            deletedFor: 'everyone'
          });
        } else {
          await message.softDelete(socket.userId);
          socket.emit('message_deleted', {
            messageId,
            deletedFor: 'me'
          });
        }
      } catch (error) {
        console.error('Delete message error:', error);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    // Handle message reactions
    socket.on('add_reaction', async (data) => {
      try {
        const { messageId, emoji } = data;
        
        const message = await Message.findById(messageId);
        if (message) {
          await message.addReaction(socket.userId, emoji);
          
          // Notify all participants
          io.to(`chat:${message.chat}`).emit('reaction_added', {
            messageId,
            userId: socket.userId,
            emoji
          });
        }
      } catch (error) {
        console.error('Add reaction error:', error);
      }
    });

    socket.on('remove_reaction', async (data) => {
      try {
        const { messageId } = data;
        
        const message = await Message.findById(messageId);
        if (message) {
          await message.removeReaction(socket.userId);
          
          // Notify all participants
          io.to(`chat:${message.chat}`).emit('reaction_removed', {
            messageId,
            userId: socket.userId
          });
        }
      } catch (error) {
        console.error('Remove reaction error:', error);
      }
    });

    // Handle creating a new chat
    socket.on('create_chat', async (data) => {
      try {
        const { participants, name, isGroup = false } = data;
        
        // Include current user in participants
        if (!participants.includes(socket.userId)) {
          participants.push(socket.userId);
        }
        
        // Create chat
        const chatParticipants = participants.map(userId => ({
          user: userId,
          role: userId === socket.userId ? 'admin' : 'member'
        }));
        
        const chat = await Chat.create({
          name: isGroup ? name : null,
          isGroup,
          participants: chatParticipants,
          creator: socket.userId
        });
        
        const populatedChat = await Chat.findById(chat._id)
          .populate('participants.user', 'username email avatar isOnline lastSeen status');
        
        // Notify all participants
        for (const participantId of participants) {
          const participantSocketIds = userSockets.get(participantId);
          if (participantSocketIds) {
            participantSocketIds.forEach(socketId => {
              io.to(socketId).emit('chat_created', populatedChat);
              // Join them to the chat room
              io.sockets.sockets.get(socketId)?.join(`chat:${chat._id}`);
            });
          }
        }
      } catch (error) {
        console.error('Create chat error:', error);
        socket.emit('error', { message: 'Failed to create chat' });
      }
    });

    // Handle adding participants to group
    socket.on('add_participants', async (data) => {
      try {
        const { chatId, participants } = data;
        
        const chat = await Chat.findById(chatId);
        if (!chat || !chat.isGroup) return;
        
        const role = chat.getParticipantRole(socket.userId);
        if (role !== 'admin') {
          return socket.emit('error', { message: 'Only admins can add participants' });
        }
        
        // Add participants
        for (const userId of participants) {
          await chat.addParticipant(userId);
          
          // Join new participant to chat room
          const participantSocketIds = userSockets.get(userId);
          if (participantSocketIds) {
            participantSocketIds.forEach(socketId => {
              io.sockets.sockets.get(socketId)?.join(`chat:${chatId}`);
            });
          }
        }
        
        const updatedChat = await Chat.findById(chatId)
          .populate('participants.user', 'username email avatar isOnline lastSeen status');
        
        // Notify all participants
        io.to(`chat:${chatId}`).emit('participants_added', {
          chatId,
          participants,
          chat: updatedChat
        });
      } catch (error) {
        console.error('Add participants error:', error);
        socket.emit('error', { message: 'Failed to add participants' });
      }
    });

    // Handle removing participant from group
    socket.on('remove_participant', async (data) => {
      try {
        const { chatId, userId } = data;
        
        const chat = await Chat.findById(chatId);
        if (!chat || !chat.isGroup) return;
        
        const role = chat.getParticipantRole(socket.userId);
        if (role !== 'admin') {
          return socket.emit('error', { message: 'Only admins can remove participants' });
        }
        
        await chat.removeParticipant(userId);
        
        // Remove participant from chat room
        const participantSocketIds = userSockets.get(userId);
        if (participantSocketIds) {
          participantSocketIds.forEach(socketId => {
            io.sockets.sockets.get(socketId)?.leave(`chat:${chatId}`);
          });
        }
        
        // Notify all
        io.to(`chat:${chatId}`).emit('participant_removed', {
          chatId,
          userId
        });
        
        // Notify removed user
        io.to(`user:${userId}`).emit('removed_from_chat', { chatId });
      } catch (error) {
        console.error('Remove participant error:', error);
        socket.emit('error', { message: 'Failed to remove participant' });
      }
    });

    // Handle leaving group
    socket.on('leave_group', async (chatId) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat || !chat.isGroup) return;
        
        await chat.removeParticipant(socket.userId);
        
        socket.leave(`chat:${chatId}`);
        
        // Notify others
        socket.to(`chat:${chatId}`).emit('participant_left', {
          chatId,
          userId: socket.userId
        });
        
        socket.emit('left_group', { chatId });
      } catch (error) {
        console.error('Leave group error:', error);
        socket.emit('error', { message: 'Failed to leave group' });
      }
    });

    // Handle video/voice call initiation
    socket.on('call_initiate', async (data) => {
      try {
        const { targetUserId, chatId, callType, offer } = data;
        
        // Verify chat membership
        const chat = await Chat.findById(chatId);
        if (!chat || !chat.isParticipant(socket.userId) || !chat.isParticipant(targetUserId)) {
          return socket.emit('error', { message: 'Invalid call request' });
        }
        
        // Send call invitation to target user
        const targetSocketIds = userSockets.get(targetUserId);
        if (targetSocketIds) {
          targetSocketIds.forEach(socketId => {
            io.to(socketId).emit('incoming_call', {
              callerId: socket.userId,
              callerName: socket.user.username,
              chatId,
              callType,
              offer
            });
          });
          
          socket.emit('call_initiated', { targetUserId, chatId });
        } else {
          socket.emit('user_offline', { userId: targetUserId });
        }
      } catch (error) {
        console.error('Call initiate error:', error);
        socket.emit('error', { message: 'Failed to initiate call' });
      }
    });

    // Handle call answer
    socket.on('call_answer', (data) => {
      const { callerId, answer } = data;
      const callerSocketIds = userSockets.get(callerId);
      if (callerSocketIds) {
        callerSocketIds.forEach(socketId => {
          io.to(socketId).emit('call_answered', {
            answererId: socket.userId,
            answer
          });
        });
      }
    });

    // Handle call rejection
    socket.on('call_reject', (data) => {
      const { callerId, reason } = data;
      const callerSocketIds = userSockets.get(callerId);
      if (callerSocketIds) {
        callerSocketIds.forEach(socketId => {
          io.to(socketId).emit('call_rejected', {
            rejecterId: socket.userId,
            reason
          });
        });
      }
    });

    // Handle ICE candidates for WebRTC
    socket.on('ice_candidate', (data) => {
      const { targetUserId, candidate } = data;
      const targetSocketIds = userSockets.get(targetUserId);
      if (targetSocketIds) {
        targetSocketIds.forEach(socketId => {
          io.to(socketId).emit('ice_candidate', {
            senderId: socket.userId,
            candidate
          });
        });
      }
    });

    // Handle call end
    socket.on('call_end', (data) => {
      const { targetUserId } = data;
      const targetSocketIds = userSockets.get(targetUserId);
      if (targetSocketIds) {
        targetSocketIds.forEach(socketId => {
          io.to(socketId).emit('call_ended', {
            enderId: socket.userId
          });
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`❌ User ${socket.userId} disconnected`);
      
      try {
        // Remove from active connections
        activeConnections.delete(socket.id);
        
        // Remove from user sockets
        const socketSet = userSockets.get(socket.userId);
        if (socketSet) {
          socketSet.delete(socket.id);
          if (socketSet.size === 0) {
            userSockets.delete(socket.userId);
            
            // User has no more active connections, mark as offline
            await User.findByIdAndUpdate(socket.userId, {
              isOnline: false,
              lastSeen: new Date(),
              socketId: null
            });
            
            // Notify user's contacts
            const user = await User.findById(socket.userId)
              .populate('contacts', '_id');
            
            for (const contact of user.contacts) {
              io.to(`user:${contact._id}`).emit('user_offline', {
                userId: socket.userId,
                lastSeen: new Date()
              });
            }
          }
        }
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    });
  });

  // Periodic cleanup of stale connections
  setInterval(async () => {
    for (const [socketId, userId] of activeConnections.entries()) {
      const socket = io.sockets.sockets.get(socketId);
      if (!socket || !socket.connected) {
        activeConnections.delete(socketId);
        const socketSet = userSockets.get(userId);
        if (socketSet) {
          socketSet.delete(socketId);
          if (socketSet.size === 0) {
            userSockets.delete(userId);
            await User.findByIdAndUpdate(userId, {
              isOnline: false,
              lastSeen: new Date()
            });
          }
        }
      }
    }
  }, 30000); // Run every 30 seconds
};
