const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const User = require('../models/User');
const Message = require('../models/Message');
const { protect, checkChatPermission, checkGroupAdmin } = require('../middleware/auth');

// @route   GET /api/chats
// @desc    Get all chats for current user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const chats = await Chat.find({
      'participants.user': req.user._id,
      isDeleted: false
    })
    .populate('participants.user', 'username email avatar isOnline lastSeen status')
    .populate({
      path: 'lastMessage',
      populate: {
        path: 'sender',
        select: 'username avatar'
      }
    })
    .sort('-lastActivity');

    // Add unread count for each chat
    const chatsWithUnread = chats.map(chat => {
      const participant = chat.participants.find(
        p => p.user._id.toString() === req.user._id.toString()
      );
      return {
        ...chat.toObject(),
        unreadCount: participant ? participant.unreadCount : 0
      };
    });

    res.json({
      success: true,
      count: chatsWithUnread.length,
      chats: chatsWithUnread
    });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chats'
    });
  }
});

// @route   POST /api/chats/create
// @desc    Create a new chat (1-to-1 or group)
// @access  Private
router.post('/create', protect, async (req, res) => {
  try {
    const { participants, name, description, isGroup = false } = req.body;

    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Participants are required'
      });
    }

    // Add current user to participants if not included
    if (!participants.includes(req.user._id.toString())) {
      participants.push(req.user._id.toString());
    }

    // For 1-to-1 chat
    if (!isGroup) {
      if (participants.length !== 2) {
        return res.status(400).json({
          success: false,
          message: 'One-to-one chat must have exactly 2 participants'
        });
      }

      // Check if chat already exists
      const existingChat = await Chat.findOne({
        isGroup: false,
        'participants.user': { $all: participants }
      });

      if (existingChat) {
        const populatedChat = await Chat.findById(existingChat._id)
          .populate('participants.user', 'username email avatar isOnline lastSeen status')
          .populate('lastMessage');

        return res.json({
          success: true,
          message: 'Chat already exists',
          chat: populatedChat
        });
      }
    }

    // For group chat
    if (isGroup && !name) {
      return res.status(400).json({
        success: false,
        message: 'Group name is required'
      });
    }

    // Create participants array with roles
    const chatParticipants = participants.map(userId => ({
      user: userId,
      role: userId === req.user._id.toString() ? 'admin' : 'member',
      joinedAt: new Date()
    }));

    // Create chat
    const chat = await Chat.create({
      name: isGroup ? name : null,
      isGroup,
      participants: chatParticipants,
      creator: req.user._id,
      description,
      avatar: isGroup 
        ? `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=200&bold=true`
        : null
    });

    // Populate the created chat
    const populatedChat = await Chat.findById(chat._id)
      .populate('participants.user', 'username email avatar isOnline lastSeen status');

    res.status(201).json({
      success: true,
      message: `${isGroup ? 'Group' : 'Chat'} created successfully`,
      chat: populatedChat
    });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating chat'
    });
  }
});

// @route   GET /api/chats/:chatId
// @desc    Get single chat
// @access  Private (chat members only)
router.get('/:chatId', protect, checkChatPermission, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId)
      .populate('participants.user', 'username email avatar isOnline lastSeen status publicKey')
      .populate('lastMessage')
      .populate('pinnedMessages');

    res.json({
      success: true,
      chat
    });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chat'
    });
  }
});

// @route   PUT /api/chats/:chatId/update
// @desc    Update group chat details
// @access  Private (group admin only)
router.put('/:chatId/update', protect, checkGroupAdmin, async (req, res) => {
  try {
    const { name, description, avatar } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (avatar !== undefined) updates.avatar = avatar;

    const chat = await Chat.findByIdAndUpdate(
      req.params.chatId,
      updates,
      { new: true, runValidators: true }
    ).populate('participants.user', 'username email avatar isOnline lastSeen status');

    res.json({
      success: true,
      message: 'Group updated successfully',
      chat
    });
  } catch (error) {
    console.error('Update chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating group'
    });
  }
});

// @route   POST /api/chats/:chatId/participants/add
// @desc    Add participants to group chat
// @access  Private (group admin only)
router.post('/:chatId/participants/add', protect, checkGroupAdmin, async (req, res) => {
  try {
    const { participants } = req.body;

    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Participants are required'
      });
    }

    const chat = req.chat;

    // Add new participants
    for (const userId of participants) {
      const user = await User.findById(userId);
      if (user && !chat.isParticipant(userId)) {
        await chat.addParticipant(userId);
      }
    }

    const updatedChat = await Chat.findById(chat._id)
      .populate('participants.user', 'username email avatar isOnline lastSeen status');

    res.json({
      success: true,
      message: 'Participants added successfully',
      chat: updatedChat
    });
  } catch (error) {
    console.error('Add participants error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding participants'
    });
  }
});

// @route   DELETE /api/chats/:chatId/participants/:userId
// @desc    Remove participant from group chat
// @access  Private (group admin only)
router.delete('/:chatId/participants/:userId', protect, checkGroupAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const chat = req.chat;

    // Cannot remove the last admin
    const admins = chat.participants.filter(p => p.role === 'admin');
    if (admins.length === 1 && admins[0].user.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the last admin from the group'
      });
    }

    await chat.removeParticipant(userId);

    const updatedChat = await Chat.findById(chat._id)
      .populate('participants.user', 'username email avatar isOnline lastSeen status');

    res.json({
      success: true,
      message: 'Participant removed successfully',
      chat: updatedChat
    });
  } catch (error) {
    console.error('Remove participant error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing participant'
    });
  }
});

// @route   POST /api/chats/:chatId/leave
// @desc    Leave group chat
// @access  Private (chat members only)
router.post('/:chatId/leave', protect, checkChatPermission, async (req, res) => {
  try {
    const chat = req.chat;

    if (!chat.isGroup) {
      return res.status(400).json({
        success: false,
        message: 'Cannot leave a one-to-one chat'
      });
    }

    // If user is the last admin, promote another member
    const userRole = chat.getParticipantRole(req.user._id);
    if (userRole === 'admin') {
      const admins = chat.participants.filter(p => p.role === 'admin');
      if (admins.length === 1) {
        const otherParticipants = chat.participants.filter(
          p => p.user.toString() !== req.user._id.toString()
        );
        if (otherParticipants.length > 0) {
          otherParticipants[0].role = 'admin';
          await chat.save();
        }
      }
    }

    await chat.removeParticipant(req.user._id);

    res.json({
      success: true,
      message: 'Left group successfully'
    });
  } catch (error) {
    console.error('Leave chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Error leaving group'
    });
  }
});

// @route   PUT /api/chats/:chatId/participants/:userId/role
// @desc    Update participant role (promote/demote admin)
// @access  Private (group admin only)
router.put('/:chatId/participants/:userId/role', protect, checkGroupAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    const chat = req.chat;
    const participant = chat.participants.find(
      p => p.user.toString() === userId
    );

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      });
    }

    participant.role = role;
    await chat.save();

    const updatedChat = await Chat.findById(chat._id)
      .populate('participants.user', 'username email avatar isOnline lastSeen status');

    res.json({
      success: true,
      message: `Participant ${role === 'admin' ? 'promoted to' : 'demoted from'} admin`,
      chat: updatedChat
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating participant role'
    });
  }
});

// @route   DELETE /api/chats/:chatId
// @desc    Delete chat
// @access  Private (chat members only)
router.delete('/:chatId', protect, checkChatPermission, async (req, res) => {
  try {
    const chat = req.chat;

    // For groups, only admin can delete
    if (chat.isGroup) {
      const role = chat.getParticipantRole(req.user._id);
      if (role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can delete the group'
        });
      }
    }

    // Soft delete the chat
    await chat.softDelete();

    res.json({
      success: true,
      message: 'Chat deleted successfully'
    });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting chat'
    });
  }
});

// @route   POST /api/chats/:chatId/pin-message
// @desc    Pin a message in chat
// @access  Private (group admin for groups, any member for 1-to-1)
router.post('/:chatId/pin-message', protect, checkChatPermission, async (req, res) => {
  try {
    const { messageId } = req.body;
    const chat = req.chat;

    // For groups, only admin can pin
    if (chat.isGroup) {
      const role = chat.getParticipantRole(req.user._id);
      if (role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can pin messages'
        });
      }
    }

    // Check if message exists and belongs to this chat
    const message = await Message.findOne({
      _id: messageId,
      chat: chat._id
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Pin the message
    if (!chat.pinnedMessages.includes(messageId)) {
      chat.pinnedMessages.push(messageId);
      await chat.save();
    }

    res.json({
      success: true,
      message: 'Message pinned successfully'
    });
  } catch (error) {
    console.error('Pin message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error pinning message'
    });
  }
});

// @route   DELETE /api/chats/:chatId/unpin-message/:messageId
// @desc    Unpin a message in chat
// @access  Private
router.delete('/:chatId/unpin-message/:messageId', protect, checkChatPermission, async (req, res) => {
  try {
    const { messageId } = req.params;
    const chat = req.chat;

    // For groups, only admin can unpin
    if (chat.isGroup) {
      const role = chat.getParticipantRole(req.user._id);
      if (role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can unpin messages'
        });
      }
    }

    // Unpin the message
    chat.pinnedMessages = chat.pinnedMessages.filter(
      id => id.toString() !== messageId
    );
    await chat.save();

    res.json({
      success: true,
      message: 'Message unpinned successfully'
    });
  } catch (error) {
    console.error('Unpin message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unpinning message'
    });
  }
});

module.exports = router;
