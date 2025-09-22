import AiPrediction from "../models/aiPrediction.js";
import CenterInventory from "../models/centerInventory.js";
import InventoryTransaction from "../models/inventoryTransaction.js";
import ServiceRecord from "../models/serviceRecord.js";

const aiPredictionService = {
  // Get all predictions with optional filtering
  getAllPredictions: async (filters = {}) => {
    try {
      const query = {};

      // Apply filters if provided
      if (filters.centerId) query.centerId = filters.centerId;
      if (filters.partId) query.partId = filters.partId;
      if (filters.predictionType) query.predictionType = filters.predictionType;
      if (filters.predictionPeriod)
        query.predictionPeriod = filters.predictionPeriod;

      // Date range filter
      if (filters.startDate && filters.endDate) {
        query.createdAt = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate),
        };
      } else if (filters.startDate) {
        query.createdAt = { $gte: new Date(filters.startDate) };
      } else if (filters.endDate) {
        query.createdAt = { $lte: new Date(filters.endDate) };
      }

      const predictions = await AiPrediction.find(query)
        .populate("centerId", "name location")
        .populate("partId", "partNumber partName category")
        .sort({ createdAt: -1 });

      return {
        success: true,
        statusCode: 200,
        data: predictions,
        message: "Predictions retrieved successfully",
      };
    } catch (error) {
      console.error("Error in getAllPredictions service:", error);
      return {
        success: false,
        statusCode: 500,
        message: error.message || "Error retrieving predictions",
      };
    }
  },

  // Get prediction by ID
  getPredictionById: async (id) => {
    try {
      const prediction = await AiPrediction.findById(id)
        .populate("centerId", "name location")
        .populate("partId", "partNumber partName category");

      if (!prediction) {
        return {
          success: false,
          statusCode: 404,
          message: "Prediction not found",
        };
      }

      return {
        success: true,
        statusCode: 200,
        data: prediction,
        message: "Prediction retrieved successfully",
      };
    } catch (error) {
      console.error("Error in getPredictionById service:", error);
      return {
        success: false,
        statusCode: 500,
        message: error.message || "Error retrieving prediction",
      };
    }
  },

  // Generate demand forecast predictions
  generateDemandForecast: async (centerId, predictionPeriod = "1_month") => {
    try {
      // Get all inventory items for the center
      const inventoryItems = await CenterInventory.find({ centerId }).populate(
        "partId"
      );

      const predictions = [];

      // For each inventory item, generate a prediction
      for (const item of inventoryItems) {
        // Get historical transactions for this part
        const transactions = await InventoryTransaction.find({
          inventoryId: item._id,
          transactionType: "out", // Only consider outgoing transactions
          transactionDate: {
            $gte: getPastDate(predictionPeriod), // Get transactions from relevant past period
          },
        });

        // Calculate average monthly usage
        const monthlyUsage = calculateMonthlyUsage(
          transactions,
          predictionPeriod
        );

        // Calculate confidence score based on data quality
        const confidenceScore = calculateConfidenceScore(transactions);

        // Create prediction
        const prediction = new AiPrediction({
          centerId,
          partId: item.partId._id,
          predictionType: "demand_forecast",
          predictedValue: monthlyUsage,
          confidenceScore,
          predictionPeriod,
          modelVersion: "1.0",
          inputData: {
            transactionCount: transactions.length,
            historicalPeriod: predictionPeriod,
            currentStock: item.currentStock,
          },
        });

        await prediction.save();
        predictions.push(prediction);
      }

      return {
        success: true,
        statusCode: 200,
        data: predictions,
        message: "Demand forecast predictions generated successfully",
      };
    } catch (error) {
      console.error("Error in generateDemandForecast service:", error);
      return {
        success: false,
        statusCode: 500,
        message:
          error.message || "Error generating demand forecast predictions",
      };
    }
  },

  // Generate stock optimization predictions
  generateStockOptimization: async (centerId) => {
    try {
      // Get latest demand forecasts
      const latestForecasts = await AiPrediction.find({
        centerId,
        predictionType: "demand_forecast",
      }).sort({ createdAt: -1 });

      // Group by partId and get only the latest forecast for each part
      const partForecasts = {};
      latestForecasts.forEach((forecast) => {
        const partId = forecast.partId.toString();
        if (
          !partForecasts[partId] ||
          forecast.createdAt > partForecasts[partId].createdAt
        ) {
          partForecasts[partId] = forecast;
        }
      });

      const predictions = [];

      // For each part, calculate optimal stock levels
      for (const partId in partForecasts) {
        const forecast = partForecasts[partId];

        // Get current inventory data
        const inventory = await CenterInventory.findOne({
          centerId,
          partId,
        }).populate("partId");

        if (!inventory) continue;

        // Get part details
        const part = inventory.partId;

        // Calculate optimal min stock level based on forecast and lead time
        const leadTimeDays = part.supplierInfo?.leadTimeDays || 14; // Default to 14 days if not specified
        const dailyUsage = forecast.predictedValue / 30; // Assuming monthly forecast

        // Min stock = usage during lead time + safety stock
        const safetyFactor = part.isCritical ? 2.0 : 1.5; // Higher safety factor for critical parts
        const minStockLevel = Math.ceil(
          dailyUsage * leadTimeDays * safetyFactor
        );

        // Reorder point = min stock + buffer
        const reorderPoint = Math.ceil(minStockLevel * 1.2);

        // Max stock = enough for 2 months for critical parts, 1.5 months for others
        const maxMonths = part.isCritical ? 2 : 1.5;
        const maxStockLevel = Math.ceil(forecast.predictedValue * maxMonths);

        // Create prediction
        const prediction = new AiPrediction({
          centerId,
          partId,
          predictionType: "stock_optimization",
          predictedValue: minStockLevel, // Store recommended min stock as predicted value
          confidenceScore: forecast.confidenceScore * 0.9, // Slightly lower confidence than demand forecast
          predictionPeriod: forecast.predictionPeriod,
          modelVersion: "1.0",
          inputData: {
            forecastId: forecast._id,
            leadTimeDays,
            dailyUsage,
            recommendedMinStock: minStockLevel,
            recommendedReorderPoint: reorderPoint,
            recommendedMaxStock: maxStockLevel,
            currentMinStock: inventory.minStockLevel,
            currentReorderPoint: inventory.reorderPoint,
            currentMaxStock: inventory.maxStockLevel,
          },
        });

        await prediction.save();
        predictions.push(prediction);
      }

      return {
        success: true,
        statusCode: 200,
        data: predictions,
        message: "Stock optimization predictions generated successfully",
      };
    } catch (error) {
      console.error("Error in generateStockOptimization service:", error);
      return {
        success: false,
        statusCode: 500,
        message:
          error.message || "Error generating stock optimization predictions",
      };
    }
  },

  // Apply AI recommendations to inventory settings
  applyRecommendations: async (centerId, predictionIds = []) => {
    try {
      let query = {
        centerId,
        predictionType: "stock_optimization",
      };

      // If specific prediction IDs are provided, use them
      if (predictionIds.length > 0) {
        query._id = { $in: predictionIds };
      }

      // Get latest stock optimization predictions
      const predictions = await AiPrediction.find(query).sort({
        createdAt: -1,
      });

      // Group by partId and get only the latest prediction for each part
      const partPredictions = {};
      predictions.forEach((prediction) => {
        const partId = prediction.partId.toString();
        if (
          !partPredictions[partId] ||
          prediction.createdAt > partPredictions[partId].createdAt
        ) {
          partPredictions[partId] = prediction;
        }
      });

      const updatedInventory = [];

      // Apply recommendations to inventory settings
      for (const partId in partPredictions) {
        const prediction = partPredictions[partId];
        const inputData = prediction.inputData;

        // Update inventory settings
        const updatedItem = await CenterInventory.findOneAndUpdate(
          { centerId, partId },
          {
            $set: {
              minStockLevel: inputData.recommendedMinStock,
              reorderPoint: inputData.recommendedReorderPoint,
              maxStockLevel: inputData.recommendedMaxStock,
            },
          },
          { new: true }
        );

        if (updatedItem) {
          updatedInventory.push(updatedItem);
        }
      }

      return {
        success: true,
        statusCode: 200,
        data: updatedInventory,
        message: "AI recommendations applied successfully",
      };
    } catch (error) {
      console.error("Error in applyRecommendations service:", error);
      return {
        success: false,
        statusCode: 500,
        message: error.message || "Error applying AI recommendations",
      };
    }
  },
};

// Helper functions

// Get date from X months ago based on prediction period
function getPastDate(predictionPeriod) {
  const now = new Date();
  let monthsAgo;

  switch (predictionPeriod) {
    case "1_month":
      monthsAgo = 3; // Use 3 months of data for 1 month prediction
      break;
    case "3_months":
      monthsAgo = 6; // Use 6 months of data for 3 month prediction
      break;
    case "6_months":
      monthsAgo = 12; // Use 12 months of data for 6 month prediction
      break;
    default:
      monthsAgo = 3;
  }

  now.setMonth(now.getMonth() - monthsAgo);
  return now;
}

// Calculate average monthly usage from transactions
function calculateMonthlyUsage(transactions, predictionPeriod) {
  if (transactions.length === 0) return 0;

  // Calculate total quantity
  const totalQuantity = transactions.reduce(
    (sum, transaction) => sum + transaction.quantity,
    0
  );

  // Calculate number of months in the data
  const oldestDate = Math.min(
    ...transactions.map((t) => new Date(t.transactionDate).getTime())
  );
  const newestDate = Math.max(
    ...transactions.map((t) => new Date(t.transactionDate).getTime())
  );
  const monthsDiff =
    (newestDate - oldestDate) / (1000 * 60 * 60 * 24 * 30) || 1; // Default to 1 if same day

  // Calculate monthly average
  let monthlyAverage = totalQuantity / monthsDiff;

  // Apply trend adjustment based on recent data
  const recentTransactions = transactions.filter(
    (t) =>
      new Date(t.transactionDate) >=
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  );

  if (recentTransactions.length > 0) {
    const recentAvg =
      recentTransactions.reduce((sum, t) => sum + t.quantity, 0) /
      recentTransactions.length;
    const overallAvg = totalQuantity / transactions.length;
    const trendFactor = recentAvg / overallAvg || 1;

    // Apply trend factor with dampening
    monthlyAverage *= 1 + (trendFactor - 1) * 0.5;
  }

  // Round up to nearest integer
  return Math.ceil(monthlyAverage);
}

// Calculate confidence score based on data quality
function calculateConfidenceScore(transactions) {
  if (transactions.length === 0) return 0.3; // Low confidence with no data

  // More transactions = higher confidence, max out at 20 transactions
  const transactionFactor = Math.min(transactions.length / 20, 1) * 0.5;

  // More recent data = higher confidence
  const now = Date.now();
  const recencyScores = transactions.map((t) => {
    const ageInDays =
      (now - new Date(t.transactionDate).getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, 1 - ageInDays / 90); // Full score if < 30 days, decreasing until 90 days
  });

  const recencyFactor =
    (recencyScores.reduce((sum, score) => sum + score, 0) /
      Math.max(recencyScores.length, 1)) *
    0.3;

  // Consistency factor - lower variance = higher confidence
  let consistencyFactor = 0.2;
  if (transactions.length > 1) {
    const quantities = transactions.map((t) => t.quantity);
    const mean = quantities.reduce((sum, q) => sum + q, 0) / quantities.length;
    const variance =
      quantities.reduce((sum, q) => sum + Math.pow(q - mean, 2), 0) /
      quantities.length;
    const cv = Math.sqrt(variance) / mean || 0; // Coefficient of variation
    consistencyFactor = Math.max(0, 0.2 - Math.min(cv / 2, 0.2)); // Lower CV = higher factor
  }

  // Combine factors and ensure between 0 and 1
  return Math.min(
    Math.max(transactionFactor + recencyFactor + consistencyFactor, 0),
    1
  );
}

export default aiPredictionService;
