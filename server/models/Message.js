const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  content: {
    text: {
      type: String,
      default: ''
    },
    encrypted: {
      type: String,
      default: null
    }
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'file', 'voice', 'location', 'contact'],
    default: 'text'
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String,
    thumbnail: String,
    duration: Number, // for audio/video
    dimensions: {
      width: Number,
      height: Number
    }
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  forwardedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  status: {
    sent: {
      type: Boolean,
      default: false
    },
    delivered: {
      type: Boolean,
      default: false
    },
    read: {
      type: Boolean,
      default: false
    },
    sentAt: {
      type: Date,
      default: null
    },
    deliveredAt: {
      type: Date,
      default: null
    },
    readAt: {
      type: Date,
      default: null
    }
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  deliveredTo: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    deliveredAt: {
      type: Date,
      default: Date.now
    }
  }],
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  },
  editHistory: [{
    content: String,
    editedAt: Date
  }],
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  starred: {
    type: Boolean,
    default: false
  },
  starredBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isPinned: {
    type: Boolean,
    default: false
  },
  metadata: {
    clientId: String, // For client-side message tracking
    encryptionType: String,
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    }
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

// Indexes for better query performance
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ 'status.sent': 1, 'status.delivered': 1, 'status.read': 1 });
messageSchema.index({ type: 1 });
messageSchema.index({ deleted: 1 });
messageSchema.index({ createdAt: -1 });

// Update message status
messageSchema.methods.updateStatus = async function(statusType, userId = null) {
  switch(statusType) {
    case 'sent':
      this.status.sent = true;
      this.status.sentAt = new Date();
      break;
    case 'delivered':
      this.status.delivered = true;
      this.status.deliveredAt = new Date();
      if (userId) {
        const alreadyDelivered = this.deliveredTo.find(
          d => d.user.toString() === userId.toString()
        );
        if (!alreadyDelivered) {
          this.deliveredTo.push({
            user: userId,
            deliveredAt: new Date()
          });
        }
      }
      break;
    case 'read':
      this.status.read = true;
      this.status.readAt = new Date();
      if (userId) {
        const alreadyRead = this.readBy.find(
          r => r.user.toString() === userId.toString()
        );
        if (!alreadyRead) {
          this.readBy.push({
            user: userId,
            readAt: new Date()
          });
        }
      }
      break;
  }
  await this.save();
  return this;
};

// Add reaction to message
messageSchema.methods.addReaction = async function(userId, emoji) {
  const existingReaction = this.reactions.find(
    r => r.user.toString() === userId.toString()
  );
  
  if (existingReaction) {
    existingReaction.emoji = emoji;
    existingReaction.createdAt = new Date();
  } else {
    this.reactions.push({
      user: userId,
      emoji: emoji
    });
  }
  
  await this.save();
  return this;
};

// Remove reaction from message
messageSchema.methods.removeReaction = async function(userId) {
  this.reactions = this.reactions.filter(
    r => r.user.toString() !== userId.toString()
  );
  await this.save();
  return this;
};

// Edit message
messageSchema.methods.editMessage = async function(newContent) {
  if (this.content.text !== newContent) {
    this.editHistory.push({
      content: this.content.text,
      editedAt: new Date()
    });
    this.content.text = newContent;
    this.edited = true;
    this.editedAt = new Date();
    await this.save();
  }
  return this;
};

// Soft delete message
messageSchema.methods.softDelete = async function(userId = null) {
  if (userId) {
    // Delete for specific user only
    this.deletedFor.push(userId);
  } else {
    // Delete for everyone
    this.deleted = true;
    this.deletedAt = new Date();
  }
  await this.save();
  return this;
};

// Star/unstar message
messageSchema.methods.toggleStar = async function(userId) {
  const isStarred = this.starredBy.includes(userId);
  
  if (isStarred) {
    this.starredBy = this.starredBy.filter(
      id => id.toString() !== userId.toString()
    );
  } else {
    this.starredBy.push(userId);
  }
  
  this.starred = this.starredBy.length > 0;
  await this.save();
  return this;
};

// Check if message is visible to user
messageSchema.methods.isVisibleTo = function(userId) {
  return !this.deleted && !this.deletedFor.includes(userId);
};

module.exports = mongoose.model('Message', messageSchema);
