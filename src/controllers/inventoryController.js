import inventoryService from "../services/inventoryService.js";

const inventoryController = {
  // Get all inventory items
  getAllInventory: async (req, res) => {
    try {
      const filters = req.query;
      const result = await inventoryService.getAllInventory(filters);

      return res.status(result.statusCode).json({
        success: result.success,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      console.error("Get all inventory error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },

  // Get inventory item by ID
  getInventoryById: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await inventoryService.getInventoryById(id);

      return res.status(result.statusCode).json({
        success: result.success,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      console.error("Get inventory by ID error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },

  // Create new inventory item
  createInventory: async (req, res) => {
    try {
      const inventoryData = req.body;
      const result = await inventoryService.createInventory(inventoryData);

      return res.status(result.statusCode).json({
        success: result.success,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      console.error("Create inventory error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },

  // Update inventory item
  updateInventory: async (req, res) => {
    try {
      const { id } = req.params;
      const inventoryData = req.body;
      const result = await inventoryService.updateInventory(id, inventoryData);

      return res.status(result.statusCode).json({
        success: result.success,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      console.error("Update inventory error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },

  // Create inventory transaction
  createTransaction: async (req, res) => {
    try {
      const transactionData = req.body;
      const userId = req.user.id;
      const result = await inventoryService.createTransaction(
        transactionData,
        userId
      );

      return res.status(result.statusCode).json({
        success: result.success,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      console.error("Create transaction error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },

  // Get inventory transactions
  getTransactions: async (req, res) => {
    try {
      const filters = req.query;
      const result = await inventoryService.getTransactions(filters);

      return res.status(result.statusCode).json({
        success: result.success,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      console.error("Get transactions error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },

  // Get low stock alerts
  getLowStockAlerts: async (req, res) => {
    try {
      const { centerId } = req.query;
      const result = await inventoryService.getLowStockAlerts(centerId);

      return res.status(result.statusCode).json({
        success: result.success,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      console.error("Get low stock alerts error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },

  // Get inventory statistics for a center
  getInventoryStats: async (req, res) => {
    try {
      const { centerId } = req.params;
      const result = await inventoryService.getInventoryStats(centerId);

      return res.status(result.statusCode).json({
        success: result.success,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      console.error("Get inventory stats error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
};

export default inventoryController;
