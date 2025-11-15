import aiPredictionService from "../services/aiPredictionService.js";

/**
 * Tạo dự đoán AI mới cho inventory optimization
 */
const generateInventoryPrediction = async (req, res) => {
  try {
    const { centerId } = req.params;
    const userId = req.user?.id;

    if (!centerId) {
      return res.status(400).json({
        success: false,
        message: "Center ID is required",
      });
    }

    // Kiểm tra xem có prediction còn hiệu lực không
    const existingPrediction = await aiPredictionService.getLatestPrediction(
      centerId
    );

    if (
      existingPrediction.data &&
      existingPrediction.data.validUntil > new Date()
    ) {
      return res.status(200).json({
        success: true,
        data: existingPrediction.data,
        message: "Active prediction already exists",
        isExisting: true,
      });
    }

    // Tạo prediction mới
    const result = await aiPredictionService.generateInventoryPrediction(
      centerId,
      userId
    );

    res.status(201).json({
      success: true,
      data: result.data,
      message: "AI prediction generated successfully",
    });
  } catch (error) {
    console.error("Error in generateInventoryPrediction:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate AI prediction",
    });
  }
};

/**
 * Lấy prediction mới nhất cho center
 */
const getLatestPrediction = async (req, res) => {
  try {
    const { centerId } = req.params;

    if (!centerId) {
      return res.status(400).json({
        success: false,
        message: "Center ID is required",
      });
    }

    const result = await aiPredictionService.getLatestPrediction(centerId);

    if (!result.data) {
      return res.status(404).json({
        success: false,
        message: "No active prediction found for this center",
      });
    }

    res.status(200).json({
      success: true,
      data: result.data,
      message: "Latest prediction retrieved successfully",
    });
  } catch (error) {
    console.error("Error in getLatestPrediction:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get latest prediction",
    });
  }
};

/**
 * Lấy lịch sử predictions
 */
const getPredictionHistory = async (req, res) => {
  try {
    const { centerId } = req.params;
    const { limit = 10, page = 1 } = req.query;

    if (!centerId) {
      return res.status(400).json({
        success: false,
        message: "Center ID is required",
      });
    }

    const result = await aiPredictionService.getPredictionHistory(
      centerId,
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.data.length,
      },
      message: "Prediction history retrieved successfully",
    });
  } catch (error) {
    console.error("Error in getPredictionHistory:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get prediction history",
    });
  }
};

/**
 * Cập nhật feedback cho prediction
 */
const updatePredictionFeedback = async (req, res) => {
  try {
    const { predictionId } = req.params;
    const { accuracy, usefulness, comments } = req.body;
    const userId = req.user?.id;

    if (!predictionId) {
      return res.status(400).json({
        success: false,
        message: "Prediction ID is required",
      });
    }

    // Validate feedback data
    if (accuracy !== undefined && (accuracy < 1 || accuracy > 5)) {
      return res.status(400).json({
        success: false,
        message: "Accuracy must be between 1 and 5",
      });
    }

    if (usefulness !== undefined && (usefulness < 1 || usefulness > 5)) {
      return res.status(400).json({
        success: false,
        message: "Usefulness must be between 1 and 5",
      });
    }

    const feedback = {
      accuracy,
      usefulness,
      comments,
    };

    const result = await aiPredictionService.updatePredictionFeedback(
      predictionId,
      feedback,
      userId
    );

    res.status(200).json({
      success: true,
      data: result.data,
      message: "Feedback updated successfully",
    });
  } catch (error) {
    console.error("Error in updatePredictionFeedback:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update feedback",
    });
  }
};

/**
 * Lấy thống kê tổng quan về predictions
 */
const getPredictionStats = async (req, res) => {
  try {
    const { centerId } = req.params;

    if (!centerId) {
      return res.status(400).json({
        success: false,
        message: "Center ID is required",
      });
    }

    // Lấy prediction mới nhất
    const latestResult = await aiPredictionService.getLatestPrediction(
      centerId
    );
    const latest = latestResult.data;

    if (!latest) {
      return res.status(404).json({
        success: false,
        message: "No predictions found for this center",
      });
    }

    // Tính toán thống kê
    const recommendations = latest.predictions.inventoryRecommendations || [];

    const stats = {
      totalParts: recommendations.length,
      criticalRiskParts: recommendations.filter(
        (r) => r.riskLevel === "critical"
      ).length,
      highRiskParts: recommendations.filter((r) => r.riskLevel === "high")
        .length,
      mediumRiskParts: recommendations.filter((r) => r.riskLevel === "medium")
        .length,
      lowRiskParts: recommendations.filter((r) => r.riskLevel === "low").length,
      overStockedItems:
        latest.predictions.costOptimization?.overStockedItems?.length || 0,
      underStockedItems:
        latest.predictions.costOptimization?.underStockedItems?.length || 0,
      potentialSavings:
        latest.predictions.costOptimization?.potentialSavings || 0,
      averageConfidence:
        recommendations.length > 0
          ? recommendations.reduce((sum, r) => sum + (r.confidence || 0), 0) /
            recommendations.length
          : 0,
      lastUpdated: latest.createdAt,
      validUntil: latest.validUntil,
    };

    res.status(200).json({
      success: true,
      data: stats,
      message: "Prediction statistics retrieved successfully",
    });
  } catch (error) {
    console.error("Error in getPredictionStats:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get prediction statistics",
    });
  }
};

/**
 * Lấy khuyến nghị cho phụ tùng cụ thể
 */
const getPartRecommendation = async (req, res) => {
  try {
    const { centerId, partId } = req.params;

    if (!centerId || !partId) {
      return res.status(400).json({
        success: false,
        message: "Center ID and Part ID are required",
      });
    }

    const result = await aiPredictionService.getLatestPrediction(centerId);

    if (!result.data) {
      return res.status(404).json({
        success: false,
        message: "No active prediction found for this center",
      });
    }

    const recommendation =
      result.data.predictions.inventoryRecommendations.find(
        (r) => r.partId && r.partId.toString() === partId
      );

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: "No recommendation found for this part",
      });
    }

    res.status(200).json({
      success: true,
      data: recommendation,
      message: "Part recommendation retrieved successfully",
    });
  } catch (error) {
    console.error("Error in getPartRecommendation:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get part recommendation",
    });
  }
};

/**
 * Force regenerate prediction (bỏ qua prediction hiện tại)
 */
const forceRegeneratePrediction = async (req, res) => {
  try {
    const { centerId } = req.params;
    const userId = req.user?.id;

    if (!centerId) {
      return res.status(400).json({
        success: false,
        message: "Center ID is required",
      });
    }

    // Tạo prediction mới ngay lập tức
    const result = await aiPredictionService.generateInventoryPrediction(
      centerId,
      userId
    );

    res.status(201).json({
      success: true,
      data: result.data,
      message: "AI prediction regenerated successfully",
    });
  } catch (error) {
    console.error("Error in forceRegeneratePrediction:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to regenerate AI prediction",
    });
  }
};

const aiPredictionController = {
  generateInventoryPrediction,
  getLatestPrediction,
  getPredictionHistory,
  updatePredictionFeedback,
  getPredictionStats,
  getPartRecommendation,
  forceRegeneratePrediction,
};

export default aiPredictionController;
