import mongoose from "mongoose";

const AiPredictionSchema = new mongoose.Schema(
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
    predictionType: {
      type: String,
      enum: ["demand_forecast", "failure_prediction", "stock_optimization"],
      required: true,
    },
    predictedValue: {
      type: Number,
      required: true,
      min: 0,
    },
    confidenceScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    predictionPeriod: {
      type: String,
      enum: ["1_month", "3_months", "6_months"],
    },
    modelVersion: {
      type: String,
      maxlength: 20,
    },
    inputData: {
      type: mongoose.Schema.Types.Mixed, // JSON lưu dữ liệu đầu vào cho AI model
      default: {},
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

export default mongoose.model("AiPrediction", AiPredictionSchema);
