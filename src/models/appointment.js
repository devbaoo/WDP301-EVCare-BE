import mongoose from "mongoose";

const AppointmentSchema = new mongoose.Schema(
  {
    // Thông tin khách hàng
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Thông tin xe
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },

    // Thông tin trung tâm dịch vụ
    serviceCenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceCenter",
      required: true,
    },

    // Thông tin dịch vụ
    serviceType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceType",
      required: false,
    },

    // Thông tin kỹ thuật viên
    technician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Có thể chưa phân công ngay
    },

    // Thời gian hẹn
    appointmentTime: {
      date: { type: Date, required: true }, // Ngày hẹn
      startTime: { type: String, required: true }, // Giờ bắt đầu (HH:MM)
      endTime: { type: String, required: true }, // Giờ kết thúc dự kiến (HH:MM)
      duration: { type: Number, required: true }, // Thời gian dự kiến (phút)
    },

    // Trạng thái cuộc hẹn
    status: {
      type: String,
      enum: [
        "pending_confirmation", // Chờ xác nhận
        "confirmed", // Đã xác nhận
        "in_progress", // Đang thực hiện
        "inspection_completed", // Đã hoàn thành kiểm tra
        "quote_provided", // Đã báo giá
        "quote_approved", // Khách hàng đã chấp nhận báo giá
        "quote_rejected", // Khách hàng từ chối báo giá
        "maintenance_in_progress", // Đang bảo dưỡng sau khi chấp nhận báo giá
        "maintenance_completed", // Đã hoàn thành bảo dưỡng
        "payment_pending", // Chờ thanh toán
        "completed", // Hoàn thành (đã thanh toán)
        "cancelled", // Đã hủy
        "rescheduled", // Đã dời lịch
        "no_show", // Khách không đến
      ],
      default: "pending_confirmation",
    },

    // Thông tin dịch vụ chi tiết
    serviceDetails: {
      description: { type: String }, // Mô tả vấn đề/dịch vụ cần làm
      estimatedCost: { type: Number }, // Chi phí ước tính
      actualCost: { type: Number }, // Chi phí thực tế
      notes: { type: String }, // Ghi chú thêm
      // Đặt lịch kiểm tra tổng quát, không chọn dịch vụ cụ thể
      isInspectionOnly: { type: Boolean, default: false },
      // Gói dịch vụ nếu có
      isFromPackage: { type: Boolean, default: false },
      servicePackageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CustomerPackage",
      },
    },

    // Thông tin kiểm tra và báo giá
    inspectionAndQuote: {
      inspectionNotes: { type: String }, // Ghi chú kiểm tra
      inspectionCompletedAt: { type: Date }, // Thời gian hoàn thành kiểm tra
      vehicleCondition: { type: String }, // Tình trạng xe
      diagnosisDetails: { type: String }, // Chi tiết chẩn đoán
      quoteAmount: { type: Number, min: 0 }, // Số tiền báo giá
      quoteDetails: { type: mongoose.Schema.Types.Mixed }, // Chi tiết báo giá - Support both String and Object
      quotedAt: { type: Date }, // Thời gian báo giá
      quoteStatus: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      customerResponseAt: { type: Date }, // Thời gian khách hàng phản hồi
      customerResponseNotes: { type: String }, // Ghi chú phản hồi của khách hàng
      staffId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Nhân viên xử lý báo giá
    },

    // Thông tin thanh toán
    payment: {
      method: {
        type: String,
        enum: ["cash", "card", "banking", "ewallet", "not_required"],
        default: "not_required",
      },
      status: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending",
      },
      amount: { type: Number, default: 0 },
      paidAt: { type: Date },
      transactionId: { type: String },
      notes: { type: String },
    },

    // Thông tin xác nhận
    confirmation: {
      isConfirmed: { type: Boolean, default: false },
      confirmedAt: { type: Date },
      confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      confirmationMethod: {
        type: String,
        enum: ["email", "sms", "phone", "app"],
        default: "email",
      },
    },

    // Thông tin hủy/dời lịch
    cancellation: {
      isCancelled: { type: Boolean, default: false },
      cancelledAt: { type: Date },
      cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reason: { type: String },
      refundAmount: { type: Number, default: 0 },
    },

    // Thông tin dời lịch
    rescheduling: {
      isRescheduled: { type: Boolean, default: false },
      rescheduledAt: { type: Date },
      rescheduledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      originalDate: { type: Date },
      originalTime: { type: String },
      reason: { type: String },
    },

    // Thông tin hoàn thành
    completion: {
      isCompleted: { type: Boolean, default: false },
      completedAt: { type: Date },
      completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      actualDuration: { type: Number }, // Thời gian thực tế (phút)
      workDone: { type: String }, // Công việc đã thực hiện
      recommendations: { type: String }, // Khuyến nghị
      customerSatisfaction: { type: Number, min: 1, max: 5 }, // Đánh giá khách hàng
    },

    // Thông tin nhắc nhở
    reminders: [
      {
        type: {
          type: String,
          enum: ["email", "sms", "push", "phone"],
          required: true,
        },
        sentAt: { type: Date, required: true },
        status: {
          type: String,
          enum: ["sent", "delivered", "failed"],
          default: "sent",
        },
        message: { type: String },
      },
    ],

    // Tài liệu và hình ảnh
    documents: [
      {
        type: { type: String, required: true }, // Loại tài liệu
        url: { type: String, required: true },
        name: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],

    // Ghi chú nội bộ
    internalNotes: [
      {
        note: { type: String, required: true },
        addedAt: { type: Date, default: Date.now },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        isVisibleToCustomer: { type: Boolean, default: false },
      },
    ],

    // Thông tin đánh giá
    rating: {
      overall: { type: Number, min: 1, max: 5 },
      service: { type: Number, min: 1, max: 5 },
      technician: { type: Number, min: 1, max: 5 },
      facility: { type: Number, min: 1, max: 5 },
      comment: { type: String },
      ratedAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
AppointmentSchema.index({ customer: 1 });
AppointmentSchema.index({ vehicle: 1 });
AppointmentSchema.index({ serviceCenter: 1 });
AppointmentSchema.index({ technician: 1 });
AppointmentSchema.index({ "appointmentTime.date": 1 });
AppointmentSchema.index({ status: 1 });
AppointmentSchema.index({
  "appointmentTime.date": 1,
  "appointmentTime.startTime": 1,
});

// Virtual for appointment date time
AppointmentSchema.virtual("appointmentDateTime").get(function () {
  const date = this.appointmentTime.date;
  const time = this.appointmentTime.startTime;
  return new Date(`${date.toDateString()} ${time}`);
});

// Virtual for is upcoming
AppointmentSchema.virtual("isUpcoming").get(function () {
  const now = new Date();
  const appointmentDate = this.appointmentDateTime;
  return appointmentDate > now && this.status === "confirmed";
});

// Virtual for is overdue
AppointmentSchema.virtual("isOverdue").get(function () {
  const now = new Date();
  const appointmentDate = this.appointmentDateTime;
  return (
    appointmentDate < now &&
    ["pending_confirmation", "confirmed"].includes(this.status)
  );
});

// Method to confirm appointment
AppointmentSchema.methods.confirm = function (confirmedBy, method = "email") {
  this.status = "confirmed";
  this.confirmation.isConfirmed = true;
  this.confirmation.confirmedAt = new Date();
  this.confirmation.confirmedBy = confirmedBy;
  this.confirmation.confirmationMethod = method;
  return this.save();
};

// Method to cancel appointment
AppointmentSchema.methods.cancel = function (cancelledBy, reason) {
  this.status = "cancelled";
  this.cancellation.isCancelled = true;
  this.cancellation.cancelledAt = new Date();
  this.cancellation.cancelledBy = cancelledBy;
  this.cancellation.reason = reason;
  return this.save();
};

// Method to reschedule appointment
AppointmentSchema.methods.reschedule = function (
  newDate,
  newStartTime,
  newEndTime,
  rescheduledBy,
  reason
) {
  this.rescheduling.isRescheduled = true;
  this.rescheduling.rescheduledAt = new Date();
  this.rescheduling.rescheduledBy = rescheduledBy;
  this.rescheduling.originalDate = this.appointmentTime.date;
  this.rescheduling.originalTime = this.appointmentTime.startTime;
  this.rescheduling.reason = reason;

  this.appointmentTime.date = newDate;
  this.appointmentTime.startTime = newStartTime;
  this.appointmentTime.endTime = newEndTime;

  return this.save();
};

// Method to complete appointment
AppointmentSchema.methods.complete = function (
  completedBy,
  workDone,
  recommendations
) {
  this.status = "completed";
  this.completion.isCompleted = true;
  this.completion.completedAt = new Date();
  this.completion.completedBy = completedBy;
  this.completion.workDone = workDone;
  this.completion.recommendations = recommendations;
  return this.save();
};

// Method to add reminder
AppointmentSchema.methods.addReminder = function (type, message) {
  this.reminders.push({
    type,
    message,
    sentAt: new Date(),
  });
  return this.save();
};

const Appointment = mongoose.model("Appointment", AppointmentSchema);

export default Appointment;
