import mongoose from "mongoose";

const WorkProgressTrackingSchema = new mongoose.Schema(
  {
    technicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // kỹ thuật viên
      required: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    serviceRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceRecord",
    },
    serviceDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
    },
    currentStatus: {
      type: String,
      enum: ["not_started", "in_progress", "paused", "completed", "delayed"],
      default: "not_started",
    },
    progressPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    milestones: [
      {
        name: { type: String, required: true },
        description: { type: String },
        completedAt: { type: Date },
        status: {
          type: String,
          enum: ["pending", "completed"],
          default: "pending",
        },
      },
    ],
    issues: [
      {
        description: { type: String, required: true },
        reportedAt: { type: Date, default: Date.now },
        resolvedAt: { type: Date },
        status: {
          type: String,
          enum: ["open", "in_progress", "resolved"],
          default: "open",
        },
      },
    ],
    notes: {
      type: String,
    },
    timeSpent: {
      type: Number, // in minutes
      default: 0,
    },
    pauseTime: {
      type: Number, // in minutes
      default: 0,
    },
    efficiency: {
      type: Number, // calculated field (percentage)
      min: 0,
      max: 100,
    },
    qualityScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    supervisorNotes: {
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

export default mongoose.model(
  "WorkProgressTracking",
  WorkProgressTrackingSchema
);
