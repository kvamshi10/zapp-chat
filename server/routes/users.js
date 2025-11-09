const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Chat = require('../models/Chat');
const { protect } = require('../middleware/auth');

// @route   GET /api/users
// @desc    Get all users (excluding current user)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('username email avatar status isOnline lastSeen')
      .sort({ username: 1 });

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
});

// @route   GET /api/users/search
// @desc    Search users
// @access  Private
router.get('/search', protect, async (req, res) => {
  try {
    const { query, limit = 20 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    // Search users by username or email (exclude current user)
    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } },
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    })
    .select('username email avatar status isOnline lastSeen')
    .limit(parseInt(limit));

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching users'
    });
  }
});

// @route   GET /api/users/:userId
// @desc    Get user by ID
// @access  Private
router.get('/:userId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('username email avatar status isOnline lastSeen createdAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if users have a chat together
    const chat = await Chat.findOne({
      isGroup: false,
      'participants.user': { $all: [req.user._id, user._id] }
    });

    res.json({
      success: true,
      user,
      hasChat: !!chat,
      chatId: chat ? chat._id : null
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user'
    });
  }
});

// @route   GET /api/users/online
// @desc    Get online users
// @access  Private
router.get('/online', protect, async (req, res) => {
  try {
    // Get user's contacts who are online
    const user = await User.findById(req.user._id)
      .populate({
        path: 'contacts',
        match: { isOnline: true },
        select: 'username email avatar status isOnline lastSeen'
      });

    res.json({
      success: true,
      count: user.contacts.length,
      users: user.contacts
    });
  } catch (error) {
    console.error('Get online users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching online users'
    });
  }
});

// @route   POST /api/users/contacts/add
// @desc    Add contact
// @access  Private
router.post('/contacts/add', protect, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot add yourself as a contact'
      });
    }

    // Check if user exists
    const userToAdd = await User.findById(userId);
    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already in contacts
    if (req.user.contacts.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'User is already in your contacts'
      });
    }

    // Add to contacts
    req.user.contacts.push(userId);
    await req.user.save();

    // Also add current user to the other user's contacts (bidirectional)
    if (!userToAdd.contacts.includes(req.user._id)) {
      userToAdd.contacts.push(req.user._id);
      await userToAdd.save();
    }

    res.json({
      success: true,
      message: 'Contact added successfully',
      contact: {
        _id: userToAdd._id,
        username: userToAdd.username,
        email: userToAdd.email,
        avatar: userToAdd.avatar,
        status: userToAdd.status,
        isOnline: userToAdd.isOnline,
        lastSeen: userToAdd.lastSeen
      }
    });
  } catch (error) {
    console.error('Add contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding contact'
    });
  }
});

// @route   DELETE /api/users/contacts/:userId
// @desc    Remove contact
// @access  Private
router.delete('/contacts/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;

    // Remove from contacts
    req.user.contacts = req.user.contacts.filter(
      contact => contact.toString() !== userId
    );
    await req.user.save();

    // Also remove from the other user's contacts
    await User.findByIdAndUpdate(userId, {
      $pull: { contacts: req.user._id }
    });

    res.json({
      success: true,
      message: 'Contact removed successfully'
    });
  } catch (error) {
    console.error('Remove contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing contact'
    });
  }
});

// @route   GET /api/users/contacts
// @desc    Get user contacts
// @access  Private
router.get('/contacts', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('contacts', 'username email avatar status isOnline lastSeen');

    res.json({
      success: true,
      count: user.contacts.length,
      contacts: user.contacts
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contacts'
    });
  }
});

// @route   POST /api/users/block
// @desc    Block user
// @access  Private
router.post('/block', protect, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot block yourself'
      });
    }

    // Check if already blocked
    if (req.user.blockedUsers.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'User is already blocked'
      });
    }

    // Add to blocked users
    req.user.blockedUsers.push(userId);
    
    // Remove from contacts if exists
    req.user.contacts = req.user.contacts.filter(
      contact => contact.toString() !== userId
    );
    
    await req.user.save();

    res.json({
      success: true,
      message: 'User blocked successfully'
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error blocking user'
    });
  }
});

// @route   POST /api/users/unblock
// @desc    Unblock user
// @access  Private
router.post('/unblock', protect, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Remove from blocked users
    req.user.blockedUsers = req.user.blockedUsers.filter(
      blocked => blocked.toString() !== userId
    );
    await req.user.save();

    res.json({
      success: true,
      message: 'User unblocked successfully'
    });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unblocking user'
    });
  }
});

// @route   GET /api/users/blocked
// @desc    Get blocked users
// @access  Private
router.get('/blocked', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('blockedUsers', 'username email avatar');

    res.json({
      success: true,
      count: user.blockedUsers.length,
      blockedUsers: user.blockedUsers
    });
  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching blocked users'
    });
  }
});

// @route   GET /api/users/:userId/public-key
// @desc    Get user's public key for encryption
// @access  Private
router.get('/:userId/public-key', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('publicKey');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      publicKey: user.publicKey
    });
  } catch (error) {
    console.error('Get public key error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching public key'
    });
  }
});

module.exports = router;
