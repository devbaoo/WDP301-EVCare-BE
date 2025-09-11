const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Giả sử customer được lưu trong collection User
        required: true
    },
    modelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VehicleModel', // Liên kết đến bảng vehicle_models
        required: true
    },
    vin: {
        type: String,
        required: true,
        unique: true,
        minlength: 17,
        maxlength: 17
    },
    licensePlate: {
        type: String,
        unique: true,
        maxlength: 20
    },
    color: {
        type: String,
        maxlength: 30
    },
    manufactureDate: {
        type: Date
    },
    purchaseDate: {
        type: Date
    },
    currentKm: {
        type: Number,
        default: 0,
        min: 0
    },
    batteryHealth: {
        type: Number, // %
        default: 100.00,
        min: 0,
        max: 100
    },
    warrantyExpiry: {
        type: Date
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'sold'],
        default: 'active'
    },
    notes: {
        type: String
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
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

module.exports = mongoose.model('Vehicle', VehicleSchema);
