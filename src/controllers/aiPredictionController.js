import aiPredictionService from "../services/aiPredictionService.js";

const aiPredictionController = {
  // Get all predictions
  getAllPredictions: async (req, res) => {
    try {
      const filters = req.query;
      const result = await aiPredictionService.getAllPredictions(filters);

      return res.status(result.statusCode).json({
        success: result.success,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      console.error("Get all predictions error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },

  // Get prediction by ID
  getPredictionById: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await aiPredictionService.getPredictionById(id);

      return res.status(result.statusCode).json({
        success: result.success,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      console.error("Get prediction by ID error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },

  // Generate demand forecast predictions
  generateDemandForecast: async (req, res) => {
    try {
      const { centerId, predictionPeriod } = req.body;
      const result = await aiPredictionService.generateDemandForecast(
        centerId,
        predictionPeriod
      );

      return res.status(result.statusCode).json({
        success: result.success,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      console.error("Generate demand forecast error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },

  // Generate stock optimization predictions
  generateStockOptimization: async (req, res) => {
    try {
      const { centerId } = req.body;
      const result = await aiPredictionService.generateStockOptimization(
        centerId
      );

      return res.status(result.statusCode).json({
        success: result.success,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      console.error("Generate stock optimization error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },

  // Apply AI recommendations to inventory settings
  applyRecommendations: async (req, res) => {
    try {
      const { centerId, predictionIds } = req.body;
      const result = await aiPredictionService.applyRecommendations(
        centerId,
        predictionIds
      );

      return res.status(result.statusCode).json({
        success: result.success,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      console.error("Apply recommendations error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
};

export default aiPredictionController;
