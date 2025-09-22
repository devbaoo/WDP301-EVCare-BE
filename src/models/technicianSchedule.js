import mongoose from "mongoose";

const TechnicianScheduleSchema = new mongoose.Schema(
  {
    technicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // kỹ thuật viên
      required: true,
    },
    centerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceCenter",
      required: true,
    },
    workDate: {
      type: Date,
      required: true,
    },
    shiftStart: {
      type: String, // lưu dưới dạng HH:mm
      default: "08:00", // mặc định 8h sáng
    },
    shiftEnd: {
      type: String, // lưu dưới dạng HH:mm
      default: "17:00", // mặc định 5h chiều
    },
    status: {
      type: String,
      enum: [
        "scheduled",
        "working",
        "completed",
        "absent",
        "on_leave",
        "leave_requested",
      ],
      default: "scheduled",
    },
    breakTime: [
      {
        start: { type: String }, // HH:mm
        end: { type: String }, // HH:mm
      },
    ],
    overtimeHours: {
      type: Number,
      default: 0.0,
      min: 0,
    },
    overtimeReason: {
      type: String,
    },
    availability: {
      type: String,
      enum: ["available", "busy", "unavailable"],
      default: "available",
    },
    availabilityNotes: {
      type: String,
    },
    assignedAppointments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment",
      },
    ],
    actualWorkHours: {
      type: Number,
      min: 0,
      default: 0,
    },
    checkInTime: {
      type: Date,
    },
    checkOutTime: {
      type: Date,
    },
    notes: {
      type: String,
    },
    // Thông tin xin nghỉ phép
    leaveRequest: {
      startDate: { type: Date },
      endDate: { type: Date },
      reason: { type: String },
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // người quản lý phê duyệt
      },
      approvedAt: { type: Date },
      requestedAt: { type: Date },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

export default mongoose.model("TechnicianSchedule", TechnicianScheduleSchema);
