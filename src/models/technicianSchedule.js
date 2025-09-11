const mongoose = require('mongoose');

const TechnicianScheduleSchema = new mongoose.Schema({
    technicianId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // kỹ thuật viên
        required: true
    },
    centerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ServiceCenter',
        required: true
    },
    workDate: {
        type: Date,
        required: true
    },
    shiftStart: {
        type: String, // lưu dưới dạng HH:mm
        required: true
    },
    shiftEnd: {
        type: String, // lưu dưới dạng HH:mm
        required: true
    },
    status: {
        type: String,
        enum: ['scheduled', 'working', 'completed', 'absent'],
        default: 'scheduled'
    },
    breakTime: [{
        start: { type: String }, // HH:mm
        end: { type: String }    // HH:mm
    }],
    overtimeHours: {
        type: Number,
        default: 0.00,
        min: 0
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

module.exports = mongoose.model('TechnicianSchedule', TechnicianScheduleSchema);
