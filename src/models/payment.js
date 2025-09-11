const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // khách hàng
        required: true
    },
    referenceType: {
        type: String,
        enum: ['service', 'package', 'fine'],
        required: true
    },
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'referenceType' // tham chiếu động theo loại
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'bank_transfer', 'e_wallet', 'package_credit'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    transactionId: {
        type: String,
        maxlength: 100
    },
    paymentDate: {
        type: Date
    },
    notes: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: false }
});

module.exports = mongoose.model('Payment', PaymentSchema);
