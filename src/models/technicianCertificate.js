import mongoose from "mongoose";

const TechnicianCertificateSchema = new mongoose.Schema(
  {
    technicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // kỹ thuật viên
      required: true,
    },
    certificateName: {
      type: String,
      required: true,
      maxlength: 100,
    },
    issuingAuthority: {
      type: String,
      maxlength: 100,
    },
    issueDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
    },
    certificateNumber: {
      type: String,
      maxlength: 50,
    },
    specialization: {
      type: String,
      maxlength: 100, // ví dụ: EV Battery, EV Motor, General EV
    },
    status: {
      type: String,
      enum: ["active", "expired", "revoked"],
      default: "active",
    },
    documentUrl: {
      type: String,
      maxlength: 255,
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
  "TechnicianCertificate",
  TechnicianCertificateSchema
);
