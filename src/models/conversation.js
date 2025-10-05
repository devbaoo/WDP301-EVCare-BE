import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema({
  // Required booking ID that this conversation is associated with
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment",
    required: true,
  },

  // Array of participants in this conversation
  participants: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      role: {
        type: String,
        enum: ["customer", "staff", "technician", "admin"],
        required: true,
      },
      lastRead: {
        type: Date,
        default: null,
      },
      unreadCount: {
        type: Number,
        default: 0,
      },
    },
  ],

  // Last message in the conversation (for quick preview)
  lastMessage: {
    content: { type: String },
    messageType: { type: String },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    sentAt: { type: Date },
  },

  // Timestamps for conversation management
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },

  // Optional metadata for the conversation
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
});

// Add indexes for efficient queries
ConversationSchema.index({ bookingId: 1 });
ConversationSchema.index({ "participants.userId": 1 });

// Virtual method to check if a user is participant in this conversation
ConversationSchema.methods.isParticipant = function (userId) {
  return this.participants.some(
    (p) => p.userId.toString() === userId.toString()
  );
};

// Method to add a participant to the conversation
ConversationSchema.methods.addParticipant = function (userId, role) {
  // Check if participant already exists
  if (this.isParticipant(userId)) {
    return false; // Participant already exists
  }

  this.participants.push({
    userId,
    role,
    lastRead: null,
    unreadCount: 0,
  });

  return true;
};

// Method to remove a participant from the conversation
ConversationSchema.methods.removeParticipant = function (userId) {
  const initialLength = this.participants.length;
  this.participants = this.participants.filter(
    (p) => p.userId.toString() !== userId.toString()
  );
  return this.participants.length !== initialLength;
};

// Method to update last message and unread counts
ConversationSchema.methods.updateWithNewMessage = function (message, senderId) {
  // Update last message
  this.lastMessage = {
    content: message.content,
    messageType: message.messageType,
    senderId: message.senderId,
    sentAt: message.sentAt,
  };

  // Update timestamp
  this.updatedAt = new Date();

  // Increment unread count for all participants except sender
  this.participants.forEach((participant) => {
    if (participant.userId.toString() !== senderId.toString()) {
      participant.unreadCount += 1;
    }
  });

  return this;
};

// Method to mark messages as read for a participant
ConversationSchema.methods.markAsRead = function (userId) {
  const participant = this.participants.find(
    (p) => p.userId.toString() === userId.toString()
  );

  if (participant) {
    participant.lastRead = new Date();
    participant.unreadCount = 0;
    return true;
  }

  return false;
};

// Method to get all participants except the specified user
ConversationSchema.methods.getOtherParticipants = function (userId) {
  return this.participants.filter(
    (p) => p.userId.toString() !== userId.toString()
  );
};

export default mongoose.model("Conversation", ConversationSchema);
