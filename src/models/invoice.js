const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    serviceRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceRecord",
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      maxlength: 50,
    },
    issueDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0.0,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0.0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["draft", "sent", "paid", "overdue", "cancelled"],
      default: "draft",
    },
    paymentTerms: {
      type: String,
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
    timestamps: { createdAt: "createdAt", updatedAt: false },
  }
);

module.exports = mongoose.model("Invoice", InvoiceSchema);
