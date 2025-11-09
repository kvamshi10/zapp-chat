const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    maxlength: [50, 'Chat name cannot exceed 50 characters']
  },
  isGroup: {
    type: Boolean,
    default: false
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['member', 'admin'],
      default: 'member'
    },
    lastReadMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    unreadCount: {
      type: Number,
      default: 0
    }
  }],
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  avatar: {
    type: String,
    default: null
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  settings: {
    muteNotifications: {
      type: Boolean,
      default: false
    },
    encryptionEnabled: {
      type: Boolean,
      default: true
    }
  },
  pinnedMessages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
chatSchema.index({ 'participants.user': 1 });
chatSchema.index({ lastActivity: -1 });
chatSchema.index({ isGroup: 1 });
chatSchema.index({ creator: 1 });

// Virtual for participant count
chatSchema.virtual('participantCount').get(function() {
  return this.participants.length;
});

// Add participant to chat
chatSchema.methods.addParticipant = async function(userId, role = 'member') {
  const existingParticipant = this.participants.find(
    p => p.user.toString() === userId.toString()
  );
  
  if (!existingParticipant) {
    this.participants.push({
      user: userId,
      role: role,
      joinedAt: new Date()
    });
    await this.save();
  }
  
  return this;
};

// Remove participant from chat
chatSchema.methods.removeParticipant = async function(userId) {
  this.participants = this.participants.filter(
    p => p.user.toString() !== userId.toString()
  );
  await this.save();
  return this;
};

// Update unread count for a participant
chatSchema.methods.updateUnreadCount = async function(userId, increment = true) {
  const participant = this.participants.find(
    p => p.user.toString() === userId.toString()
  );
  
  if (participant) {
    if (increment) {
      participant.unreadCount += 1;
    } else {
      participant.unreadCount = 0;
    }
    await this.save();
  }
  
  return this;
};

// Mark messages as read for a participant
chatSchema.methods.markAsRead = async function(userId, messageId) {
  const participant = this.participants.find(
    p => p.user.toString() === userId.toString()
  );
  
  if (participant) {
    participant.lastReadMessage = messageId;
    participant.unreadCount = 0;
    await this.save();
  }
  
  return this;
};

// Update last activity
chatSchema.methods.updateLastActivity = async function(messageId = null) {
  this.lastActivity = new Date();
  if (messageId) {
    this.lastMessage = messageId;
  }
  await this.save();
  return this;
};

// Check if user is participant
chatSchema.methods.isParticipant = function(userId) {
  return this.participants.some(
    p => p.user.toString() === userId.toString()
  );
};

// Get participant role
chatSchema.methods.getParticipantRole = function(userId) {
  const participant = this.participants.find(
    p => p.user.toString() === userId.toString()
  );
  return participant ? participant.role : null;
};

// Soft delete chat
chatSchema.methods.softDelete = async function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  await this.save();
  return this;
};

module.exports = mongoose.model('Chat', chatSchema);
