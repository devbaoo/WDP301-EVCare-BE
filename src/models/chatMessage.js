const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
    conversationId: {
        type: String, // vd: "customerId_centerId"
        required: true,
        maxlength: 50
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'document', 'system'],
        default: 'text'
    },
    content: {
        type: String,
        required: true
    },
    attachmentUrl: {
        type: String,
        maxlength: 255
    },
    isRead: {
        type: Boolean,
        default: false
    },
    sentAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: { createdAt: false, updatedAt: false }
});

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
