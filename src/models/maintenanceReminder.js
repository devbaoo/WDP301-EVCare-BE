const mongoose = require('mongoose');

const MaintenanceReminderSchema = new mongoose.Schema({
    vehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true
    },
    reminderType: {
        type: String,
        enum: ['km_based', 'time_based', 'package_expiry', 'payment_due'],
        required: true
    },
    targetKm: {
        type: Number,
        min: 0
    },
    targetDate: {
        type: Date
    },
    message: {
        type: String,
        required: true
    },
    isSent: {
        type: Boolean,
        default: false
    },
    sentAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: false }
});

module.exports = mongoose.model('MaintenanceReminder', MaintenanceReminderSchema);
