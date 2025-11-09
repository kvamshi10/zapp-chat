const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const User = require('../models/User');
const { protect, checkChatPermission } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', req.user._id.toString());
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'audio/mpeg',
      'audio/wav',
      'audio/webm',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'text/plain'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Helper function to encrypt message
const encryptMessage = (text, publicKey) => {
  try {
    const buffer = Buffer.from(text, 'utf8');
    const encrypted = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      buffer
    );
    return encrypted.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
};

// Helper function to decrypt message
const decryptMessage = (encryptedText, privateKey) => {
  try {
    const buffer = Buffer.from(encryptedText, 'base64');
    const decrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      buffer
    );
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};

// @route   GET /api/messages/:chatId
// @desc    Get messages for a chat
// @access  Private (chat members only)
router.get('/:chatId', protect, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const chatId = req.params.chatId;

    // Check if user is a member of the chat
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isParticipant(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this chat'
      });
    }

    // Get messages
    const messages = await Message.find({
      chat: chatId,
      deleted: false,
      deletedFor: { $ne: req.user._id }
    })
    .populate('sender', 'username avatar')
    .populate('replyTo')
    .populate('reactions.user', 'username avatar')
    .sort('-createdAt')
    .limit(limit * 1)
    .skip((page - 1) * limit);

    // Get user's private key for decryption (if needed)
    const user = await User.findById(req.user._id).select('+privateKey');

    // Decrypt messages if encrypted
    const decryptedMessages = messages.map(message => {
      const messageObj = message.toObject();
      if (messageObj.content.encrypted && user.privateKey) {
        messageObj.content.text = decryptMessage(messageObj.content.encrypted, user.privateKey) || messageObj.content.text;
      }
      return messageObj;
    });

    // Mark messages as read
    await chat.markAsRead(req.user._id, messages[0]?._id);

    res.json({
      success: true,
      count: decryptedMessages.length,
      page: parseInt(page),
      messages: decryptedMessages.reverse()
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages'
    });
  }
});

// @route   POST /api/messages/send
// @desc    Send a message
// @access  Private
router.post('/send', protect, upload.array('attachments', 10), async (req, res) => {
  try {
    const { chatId, content, type = 'text', replyTo, metadata } = req.body;

    if (!chatId) {
      return res.status(400).json({
        success: false,
        message: 'Chat ID is required'
      });
    }

    // Check if user is a member of the chat
    const chat = await Chat.findById(chatId)
      .populate('participants.user', 'publicKey');
    
    if (!chat || !chat.isParticipant(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this chat'
      });
    }

    // Prepare message data
    const messageData = {
      chat: chatId,
      sender: req.user._id,
      type,
      content: {
        text: content || ''
      },
      replyTo,
      metadata: metadata ? JSON.parse(metadata) : {},
      status: {
        sent: true,
        sentAt: new Date()
      }
    };

    // Encrypt message if encryption is enabled
    if (chat.settings.encryptionEnabled && content) {
      // For simplicity, we'll encrypt with the first recipient's public key
      // In a real app, you'd encrypt for each recipient separately
      const recipient = chat.participants.find(
        p => p.user._id.toString() !== req.user._id.toString()
      );
      
      if (recipient && recipient.user.publicKey) {
        const encryptedContent = encryptMessage(content, recipient.user.publicKey);
        if (encryptedContent) {
          messageData.content.encrypted = encryptedContent;
          messageData.metadata.encryptionType = 'RSA';
        }
      }
    }

    // Handle file attachments
    if (req.files && req.files.length > 0) {
      messageData.attachments = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: `/uploads/${req.user._id}/${file.filename}`
      }));
    }

    // Create message
    const message = await Message.create(messageData);

    // Update chat's last message and activity
    await chat.updateLastActivity(message._id);

    // Update unread count for other participants
    for (const participant of chat.participants) {
      if (participant.user._id.toString() !== req.user._id.toString()) {
        await chat.updateUnreadCount(participant.user._id, true);
      }
    }

    // Populate and return the message
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username avatar')
      .populate('replyTo');

    res.status(201).json({
      success: true,
      message: populatedMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message'
    });
  }
});

// @route   PUT /api/messages/:messageId/status
// @desc    Update message status (delivered/read)
// @access  Private
router.put('/:messageId/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const messageId = req.params.messageId;

    if (!['delivered', 'read'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is a recipient
    const chat = await Chat.findById(message.chat);
    if (!chat.isParticipant(req.user._id) || message.sender.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Cannot update status for this message'
      });
    }

    // Update message status
    await message.updateStatus(status, req.user._id);

    // If marking as read, update chat's unread count
    if (status === 'read') {
      await chat.markAsRead(req.user._id, messageId);
    }

    res.json({
      success: true,
      message: 'Message status updated'
    });
  } catch (error) {
    console.error('Update message status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating message status'
    });
  }
});

// @route   PUT /api/messages/:messageId/edit
// @desc    Edit a message
// @access  Private (message sender only)
router.put('/:messageId/edit', protect, async (req, res) => {
  try {
    const { content } = req.body;
    const messageId = req.params.messageId;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own messages'
      });
    }

    // Edit the message
    await message.editMessage(content);

    const updatedMessage = await Message.findById(messageId)
      .populate('sender', 'username avatar');

    res.json({
      success: true,
      message: 'Message edited successfully',
      data: updatedMessage
    });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error editing message'
    });
  }
});

// @route   DELETE /api/messages/:messageId
// @desc    Delete a message
// @access  Private
router.delete('/:messageId', protect, async (req, res) => {
  try {
    const { forEveryone = false } = req.query;
    const messageId = req.params.messageId;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check permissions
    if (forEveryone && message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages for everyone'
      });
    }

    // Check if user is a participant in the chat
    const chat = await Chat.findById(message.chat);
    if (!chat.isParticipant(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this chat'
      });
    }

    // Delete the message
    if (forEveryone) {
      await message.softDelete();
    } else {
      await message.softDelete(req.user._id);
    }

    res.json({
      success: true,
      message: `Message deleted ${forEveryone ? 'for everyone' : 'for you'}`
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting message'
    });
  }
});

// @route   POST /api/messages/:messageId/reaction
// @desc    Add/update reaction to a message
// @access  Private
router.post('/:messageId/reaction', protect, async (req, res) => {
  try {
    const { emoji } = req.body;
    const messageId = req.params.messageId;

    if (!emoji) {
      return res.status(400).json({
        success: false,
        message: 'Emoji is required'
      });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is a participant in the chat
    const chat = await Chat.findById(message.chat);
    if (!chat.isParticipant(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this chat'
      });
    }

    // Add/update reaction
    await message.addReaction(req.user._id, emoji);

    res.json({
      success: true,
      message: 'Reaction added'
    });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding reaction'
    });
  }
});

// @route   DELETE /api/messages/:messageId/reaction
// @desc    Remove reaction from a message
// @access  Private
router.delete('/:messageId/reaction', protect, async (req, res) => {
  try {
    const messageId = req.params.messageId;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Remove reaction
    await message.removeReaction(req.user._id);

    res.json({
      success: true,
      message: 'Reaction removed'
    });
  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing reaction'
    });
  }
});

// @route   POST /api/messages/:messageId/star
// @desc    Star/unstar a message
// @access  Private
router.post('/:messageId/star', protect, async (req, res) => {
  try {
    const messageId = req.params.messageId;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Toggle star
    await message.toggleStar(req.user._id);

    res.json({
      success: true,
      message: message.starredBy.includes(req.user._id) ? 'Message starred' : 'Message unstarred'
    });
  } catch (error) {
    console.error('Star message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error starring message'
    });
  }
});

// @route   GET /api/messages/starred
// @desc    Get starred messages
// @access  Private
router.get('/starred', protect, async (req, res) => {
  try {
    const messages = await Message.find({
      starredBy: req.user._id,
      deleted: false
    })
    .populate('sender', 'username avatar')
    .populate('chat', 'name isGroup')
    .sort('-createdAt');

    res.json({
      success: true,
      count: messages.length,
      messages
    });
  } catch (error) {
    console.error('Get starred messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching starred messages'
    });
  }
});

// @route   GET /api/messages/search
// @desc    Search messages
// @access  Private
router.get('/search', protect, async (req, res) => {
  try {
    const { query, chatId } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Build search criteria
    const searchCriteria = {
      'content.text': { $regex: query, $options: 'i' },
      deleted: false,
      deletedFor: { $ne: req.user._id }
    };

    // If chatId is provided, search within that chat
    if (chatId) {
      const chat = await Chat.findById(chatId);
      if (!chat || !chat.isParticipant(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this chat'
        });
      }
      searchCriteria.chat = chatId;
    } else {
      // Search only in chats where user is a participant
      const userChats = await Chat.find({
        'participants.user': req.user._id
      }).select('_id');
      searchCriteria.chat = { $in: userChats.map(c => c._id) };
    }

    const messages = await Message.find(searchCriteria)
      .populate('sender', 'username avatar')
      .populate('chat', 'name isGroup')
      .sort('-createdAt')
      .limit(50);

    res.json({
      success: true,
      count: messages.length,
      messages
    });
  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching messages'
    });
  }
});

module.exports = router;
