const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign(
    { id }, 
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// Protect routes middleware
const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check for token in cookies
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Get user from token
    req.user = await User.findById(decoded.id).select('-password -privateKey');
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Socket authentication middleware
const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Get user from token
    const user = await User.findById(decoded.id).select('-password -privateKey');
    
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    // Attach user to socket
    socket.userId = user._id.toString();
    socket.user = user;
    
    next();
  } catch (error) {
    console.error('Socket auth error:', error);
    next(new Error('Authentication error: Invalid token'));
  }
};

// Optional auth middleware (doesn't require authentication but adds user if token exists)
const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.user = await User.findById(decoded.id).select('-password -privateKey');
    } catch (error) {
      // Token is invalid, but we don't stop the request
      req.user = null;
    }
  } else {
    req.user = null;
  }

  next();
};

// Check if user has permission for a specific chat
const checkChatPermission = async (req, res, next) => {
  try {
    const Chat = require('../models/Chat');
    const chatId = req.params.chatId || req.body.chatId;
    
    if (!chatId) {
      return res.status(400).json({
        success: false,
        message: 'Chat ID is required'
      });
    }

    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Check if user is a participant
    if (!chat.isParticipant(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this chat'
      });
    }

    req.chat = chat;
    next();
  } catch (error) {
    console.error('Chat permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking chat permissions'
    });
  }
};

// Check if user is admin of a group chat
const checkGroupAdmin = async (req, res, next) => {
  try {
    const Chat = require('../models/Chat');
    const chatId = req.params.chatId || req.body.chatId;
    
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    if (!chat.isGroup) {
      return res.status(400).json({
        success: false,
        message: 'This is not a group chat'
      });
    }

    const role = chat.getParticipantRole(req.user._id);
    
    if (role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You must be an admin to perform this action'
      });
    }

    req.chat = chat;
    next();
  } catch (error) {
    console.error('Group admin check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking admin permissions'
    });
  }
};

module.exports = {
  generateToken,
  protect,
  socketAuth,
  optionalAuth,
  checkChatPermission,
  checkGroupAdmin
};
