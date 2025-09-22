import partService from "../services/partService.js";

const partController = {
  // Get all parts
  getAllParts: async (req, res) => {
    try {
      const filters = req.query;
      const result = await partService.getAllParts(filters);

      return res.status(result.statusCode).json({
        success: result.success,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      console.error("Get all parts error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },

  // Get part by ID
  getPartById: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await partService.getPartById(id);

      return res.status(result.statusCode).json({
        success: result.success,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      console.error("Get part by ID error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },

  // Create new part
  createPart: async (req, res) => {
    try {
      const partData = req.body;
      const result = await partService.createPart(partData);

      return res.status(result.statusCode).json({
        success: result.success,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      console.error("Create part error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },

  // Update part
  updatePart: async (req, res) => {
    try {
      const { id } = req.params;
      const partData = req.body;
      const result = await partService.updatePart(id, partData);

      return res.status(result.statusCode).json({
        success: result.success,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      console.error("Update part error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },

  // Delete part
  deletePart: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await partService.deletePart(id);

      return res.status(result.statusCode).json({
        success: result.success,
        message: result.message,
      });
    } catch (error) {
      console.error("Delete part error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },

  // Get parts by category
  getPartsByCategory: async (req, res) => {
    try {
      const { category } = req.params;
      const result = await partService.getPartsByCategory(category);

      return res.status(result.statusCode).json({
        success: result.success,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      console.error("Get parts by category error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },

  // Get compatible parts for a vehicle model
  getCompatibleParts: async (req, res) => {
    try {
      const { vehicleModelId } = req.params;
      const result = await partService.getCompatibleParts(vehicleModelId);

      return res.status(result.statusCode).json({
        success: result.success,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      console.error("Get compatible parts error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
};

export default partController;
