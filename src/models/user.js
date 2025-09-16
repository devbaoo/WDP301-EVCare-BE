const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  fullName: {
    type: String
  },
  phone: {
    type: String
  },
  address: {
    type: String
  },
  role: {
    type: String,
    enum: ['customer', 'staff', 'technician', 'admin'],
    default: 'customer'
  },
  avatar: {
    type: String
  },
  notificationSettings: {
    email: {
      maintenanceReminders: {
        type: Boolean,
        default: true,
        description: "Nhắc nhở bảo dưỡng định kỳ qua email"
      },
      packageRenewalReminders: {
        type: Boolean,
        default: true,
        description: "Nhắc nhở gia hạn gói dịch vụ qua email"
      },
      bookingUpdates: {
        type: Boolean,
        default: true,
        description: "Thông báo cập nhật lịch hẹn qua email"
      },
      paymentNotifications: {
        type: Boolean,
        default: true,
        description: "Thông báo thanh toán qua email"
      },
      generalUpdates: {
        type: Boolean,
        default: true,
        description: "Thông báo chung về dịch vụ qua email"
      }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);
