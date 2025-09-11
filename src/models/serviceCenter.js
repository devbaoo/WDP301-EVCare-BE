const mongoose = require('mongoose');

const ServiceCenterSchema = new mongoose.Schema({
    centerName: {
        type: String,
        required: true,
        maxlength: 100
    },
    address: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        maxlength: 15
    },
    email: {
        type: String,
        maxlength: 100
    },
    managerId: {
        type: mongoose.Schema.Types.ObjectId, // Tham chiếu tới User hoặc Manager
        ref: 'User'
    },
    operatingHours: {
        type: mongoose.Schema.Types.Mixed, // JSON lưu theo ngày
        default: {}
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

module.exports = mongoose.model('ServiceCenter', ServiceCenterSchema);
