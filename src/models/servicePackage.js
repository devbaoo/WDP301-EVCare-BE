const mongoose = require('mongoose');

const ServicePackageSchema = new mongoose.Schema({
    packageName: {
        type: String,
        required: true,
        maxlength: 100
    },
    description: {
        type: String
    },
    durationMonths: {
        type: Number,
        required: true,
        min: 1 // tối thiểu 1 tháng
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    includedServices: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ServiceType' // liên kết đến service_types
    }],
    maxServicesPerMonth: {
        type: Number,
        default: 1,
        min: 1
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

module.exports = mongoose.model('ServicePackage', ServicePackageSchema);
