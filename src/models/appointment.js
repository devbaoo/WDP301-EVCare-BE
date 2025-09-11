const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Tham chiếu đến khách hàng
        required: true
    },
    vehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle', // Tham chiếu đến xe
        required: true
    },
    centerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ServiceCenter', // Tham chiếu đến trung tâm dịch vụ
        required: true
    },
    serviceTypeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ServiceType', // Tham chiếu đến loại dịch vụ
        required: true
    },
    appointmentDate: {
        type: Date,
        required: true
    },
    appointmentTime: {
        type: String, // lưu định dạng HH:mm (vd: "09:30")
        required: true
    },
    currentKm: {
        type: Number,
        min: 0
    },
    description: {
        type: String
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
        default: 'pending'
    },
    assignedTechnicianId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // kỹ thuật viên được assign
    },
    estimatedCompletion: {
        type: Date
    },
    actualCompletion: {
        type: Date
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

module.exports = mongoose.model('Appointment', AppointmentSchema);
