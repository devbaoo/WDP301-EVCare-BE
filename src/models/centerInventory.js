const mongoose = require("mongoose");

const CenterInventorySchema = new mongoose.Schema(
  {
    centerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceCenter",
      required: true,
    },
    partId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Part",
      required: true,
    },
    currentStock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    reservedQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    minStockLevel: {
      type: Number,
      required: true,
      default: 5,
      min: 0,
    },
    maxStockLevel: {
      type: Number,
      required: true,
      default: 100,
      min: 1,
    },
    reorderPoint: {
      type: Number,
      required: true,
      default: 10,
      min: 0,
    },
    lastRestockDate: {
      type: Date,
    },
    costPerUnit: {
      type: Number,
      min: 0,
    },
    location: {
      type: String,
      maxlength: 50,
    },
    status: {
      type: String,
      enum: ["available", "out_of_stock", "discontinued"],
      default: "available",
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: "updatedAt" },
  }
);

module.exports = mongoose.model("CenterInventory", CenterInventorySchema);
