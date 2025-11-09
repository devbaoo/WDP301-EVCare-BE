import mongoose from "mongoose";

const ServiceRecordSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    technicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Kỹ thuật viên
      required: true,
    },
    serviceDate: {
      type: Date,
      required: true,
    },
    kmAtService: {
      type: Number,
      required: true,
      min: 0,
    },
    batteryHealthBefore: {
      type: Number,
      min: 0,
      max: 100,
    },
    batteryHealthAfter: {
      type: Number,
      min: 0,
      max: 100,
    },
    workPerformed: {
      type: String,
      required: true,
    },
    partsUsed: [
      {
        partName: { type: String, required: true },
        quantity: { type: Number, default: 1 },
        price: { type: Number, min: 0 },
      },
    ],
    laborHours: {
      type: Number,
      min: 0,
    },
    totalCost: {
      type: Number,
      min: 0,
    },
    recommendations: {
      type: String,
    },
    nextServiceKm: {
      type: Number,
      min: 0,
    },
    nextServiceDate: {
      type: Date,
    },
    warrantyInfo: {
      type: String,
    },
    customerSignature: {
      type: Boolean,
      default: false,
    },
    qualityRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    customerFeedback: {
      type: String,
    },
    images: [
      {
        type: String, // Lưu URL ảnh trước/sau dịch vụ
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
  }
);

export default mongoose.model("ServiceRecord", ServiceRecordSchema);
