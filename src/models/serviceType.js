const mongoose = require('mongoose');

const ServiceTypeSchema = new mongoose.Schema({
    serviceName: {
        type: String,
        required: true,
        maxlength: 100
    },
    category: {
        type: String,
        enum: ['maintenance', 'repair', 'inspection', 'emergency'],
        required: true
    },
    description: {
        type: String
    },
    estimatedDuration: {
        type: Number, // phút
        min: 0
    },
    basePrice: {
        type: Number, // có thể lưu đơn vị tiền tệ ở tầng khác
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

module.exports = mongoose.model('ServiceType', ServiceTypeSchema);
