const mongoose = require('mongoose');

const PartSchema = new mongoose.Schema({
    partNumber: {
        type: String,
        required: true,
        unique: true,
        maxlength: 50
    },
    partName: {
        type: String,
        required: true,
        maxlength: 100
    },
    category: {
        type: String,
        maxlength: 50 // vd: battery, motor, brake, electrical...
    },
    description: {
        type: String
    },
    compatibleModels: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VehicleModel' // Tham chiếu đến bảng vehicle_models
    }],
    unitPrice: {
        type: Number,
        min: 0
    },
    supplierInfo: {
        name: { type: String },
        contact: { type: String },
        leadTimeDays: { type: Number, min: 0 } // thời gian cung cấp (ngày)
    },
    isCritical: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

module.exports = mongoose.model('Part', PartSchema);
