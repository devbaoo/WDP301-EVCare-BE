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
      enum: [
        "not_started",
        "in_progress",
        "paused",
        "completed",
        "delayed",
        "inspection_completed",
        "quote_provided",
        "quote_approved",
        "quote_rejected",
      ],
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
    inspection: {
      isInspectionOnly: {
        type: Boolean,
        default: false,
      },
      inspectionNotes: {
        type: String,
      },
      inspectionCompletedAt: {
        type: Date,
      },
      vehicleCondition: {
        type: String,
      },
      diagnosisDetails: {
        type: String,
      },
    },
    quote: {
      quoteAmount: {
        type: Number,
        min: 0,
      },
      quoteDetails: {
        type: String,
      },
      quotedAt: {
        type: Date,
      },
      quoteStatus: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      customerResponseAt: {
        type: Date,
      },
      staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Staff who processed the quote
      },
    },
    paymentDetails: {
      paymentMethod: {
        type: String,
        enum: ["cash", "card", "banking", "ewallet", "not_required"],
        default: "not_required",
      },
      paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending",
      },
      paidAmount: {
        type: Number,
        default: 0,
      },
      paidAt: {
        type: Date,
      },
      processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Staff who processed the payment
      },
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
