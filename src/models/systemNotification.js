const mongoose = require('mongoose');

const SystemNotificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        maxlength: 200
    },
    content: {
        type: String,
        required: true
    },
    notificationType: {
        type: String,
        enum: ['reminder', 'appointment', 'payment', 'system', 'promotion'],
        required: true
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high'],
        default: 'normal'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    actionUrl: {
        type: String,
        maxlength: 255
    },
    expiresAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: false }
});

module.exports = mongoose.model('SystemNotification', SystemNotificationSchema);
