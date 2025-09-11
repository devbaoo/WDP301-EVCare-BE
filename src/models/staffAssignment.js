const mongoose = require('mongoose');

const StaffAssignmentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    centerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ServiceCenter',
        required: true
    },
    position: {
        type: String,
        enum: ['manager', 'staff', 'technician'],
        maxlength: 50,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date
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

module.exports = mongoose.model('StaffAssignment', StaffAssignmentSchema);
