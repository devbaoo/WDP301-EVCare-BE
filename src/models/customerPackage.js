const mongoose = require('mongoose');

const CustomerPackageSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Tham chiếu tới khách hàng
        required: true
    },
    vehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle', // Tham chiếu tới xe
        required: true
    },
    packageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ServicePackage', // Tham chiếu tới gói dịch vụ
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    remainingServices: {
        type: Number,
        required: true,
        min: 0
    },
    autoRenewal: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'cancelled'],
        default: 'active'
    },
    paymentStatus: {
        type: String,
        enum: ['paid', 'pending', 'overdue'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

module.exports = mongoose.model('CustomerPackage', CustomerPackageSchema);
