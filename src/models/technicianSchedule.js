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
      required: true,
    },
    shiftEnd: {
      type: String, // lưu dưới dạng HH:mm
      required: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "working", "completed", "absent", "on_leave"],
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
