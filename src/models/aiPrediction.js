import mongoose from "mongoose";

const AIPredictionSchema = new mongoose.Schema(
  {
    centerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceCenter",
      required: true,
    },
    predictionType: {
      type: String,
      enum: [
        "inventory_optimization",
        "demand_forecast",
        "maintenance_prediction",
      ],
      required: true,
    },
    analysisData: {
      // Dữ liệu phân tích đầu vào
      historicalUsage: [
        {
          partId: { type: mongoose.Schema.Types.ObjectId, ref: "Part" },
          partName: String,
          monthlyUsage: [Number], // Mảng 12 tháng gần nhất
          averageUsage: Number,
          trend: String, // "increasing", "decreasing", "stable"
        },
      ],
      seasonalFactors: {
        type: Map,
        of: Number, // Hệ số theo mùa (1-12 tháng)
      },
      vehiclePopulation: {
        totalVehicles: Number,
        modelDistribution: [
          {
            modelId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "VehicleModel",
            },
            count: Number,
            averageAge: Number,
          },
        ],
      },
      servicePatterns: {
        averageServiceInterval: Number, // Khoảng cách trung bình giữa các lần bảo dưỡng
        peakServiceMonths: [Number], // Tháng cao điểm
      },
    },
    predictions: {
      // Kết quả dự đoán từ AI
      inventoryRecommendations: [
        {
          partId: { type: mongoose.Schema.Types.ObjectId, ref: "Part" },
          partName: String,
          currentStock: Number,
          recommendedMinStock: Number,
          recommendedMaxStock: Number,
          predictedDemand: {
            next30Days: Number,
            next60Days: Number,
            next90Days: Number,
          },
          riskLevel: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
          },
          reasoning: String, // Lý do từ AI
          confidence: {
            type: Number,
            min: 0,
            max: 1,
          },
        },
      ],
      costOptimization: {
        totalInventoryValue: Number,
        potentialSavings: Number,
        overStockedItems: [String],
        underStockedItems: [String],
      },
    },
    aiModelUsed: {
      type: String,
      default: "google/gemini-2.0-flash-exp:free",
    },
    accuracy: {
      type: Number,
      min: 0,
      max: 1,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "expired", "archived"],
      default: "active",
    },
    feedback: {
      // Phản hồi từ người dùng để cải thiện model
      accuracy: Number,
      usefulness: Number,
      comments: String,
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

// Index để tối ưu query
AIPredictionSchema.index({ centerId: 1, predictionType: 1, status: 1 });
AIPredictionSchema.index({ generatedAt: -1 });
AIPredictionSchema.index({ validUntil: 1 });

export default mongoose.model("AIPrediction", AIPredictionSchema);
