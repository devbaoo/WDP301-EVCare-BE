import CenterInventory from "../models/centerInventory.js";
import InventoryTransaction from "../models/inventoryTransaction.js";
import Part from "../models/part.js";
import ServiceCenter from "../models/serviceCenter.js";

const inventoryService = {
  // Get all inventory items with optional filtering
  getAllInventory: async (filters = {}) => {
    try {
      const query = {};

      // Apply filters if provided
      if (filters.centerId) query.centerId = filters.centerId;
      if (filters.partId) query.partId = filters.partId;
      if (filters.status) query.status = filters.status;

      // Filter for low stock if requested
      if (filters.lowStock === "true") {
        query.$expr = { $lte: ["$currentStock", "$reorderPoint"] };
      }

      const inventory = await CenterInventory.find(query)
        .populate("centerId", "name location")
        .populate("partId", "partNumber partName category isCritical")
        .sort({ updatedAt: -1 });

      return {
        success: true,
        statusCode: 200,
        data: inventory,
        message: "Inventory items retrieved successfully",
      };
    } catch (error) {
      console.error("Error in getAllInventory service:", error);
      return {
        success: false,
        statusCode: 500,
        message: error.message || "Error retrieving inventory items",
      };
    }
  },

  // Get inventory item by ID
  getInventoryById: async (id) => {
    try {
      const inventory = await CenterInventory.findById(id)
        .populate("centerId", "name location")
        .populate("partId", "partNumber partName category isCritical");

      if (!inventory) {
        return {
          success: false,
          statusCode: 404,
          message: "Inventory item not found",
        };
      }

      return {
        success: true,
        statusCode: 200,
        data: inventory,
        message: "Inventory item retrieved successfully",
      };
    } catch (error) {
      console.error("Error in getInventoryById service:", error);
      return {
        success: false,
        statusCode: 500,
        message: error.message || "Error retrieving inventory item",
      };
    }
  },

  // Create new inventory item
  createInventory: async (inventoryData) => {
    try {
      // Check if part exists
      const part = await Part.findById(inventoryData.partId);
      if (!part) {
        return {
          success: false,
          statusCode: 404,
          message: "Part not found",
        };
      }

      // Check if service center exists
      const center = await ServiceCenter.findById(inventoryData.centerId);
      if (!center) {
        return {
          success: false,
          statusCode: 404,
          message: "Service center not found",
        };
      }

      // Check if inventory item already exists for this part and center
      const existingInventory = await CenterInventory.findOne({
        centerId: inventoryData.centerId,
        partId: inventoryData.partId,
      });

      if (existingInventory) {
        return {
          success: false,
          statusCode: 400,
          message: "Inventory item already exists for this part and center",
        };
      }

      const newInventory = new CenterInventory(inventoryData);
      await newInventory.save();

      return {
        success: true,
        statusCode: 201,
        data: newInventory,
        message: "Inventory item created successfully",
      };
    } catch (error) {
      console.error("Error in createInventory service:", error);
      return {
        success: false,
        statusCode: 500,
        message: error.message || "Error creating inventory item",
      };
    }
  },

  // Update inventory item
  updateInventory: async (id, inventoryData) => {
    try {
      const inventory = await CenterInventory.findById(id);

      if (!inventory) {
        return {
          success: false,
          statusCode: 404,
          message: "Inventory item not found",
        };
      }

      // Update inventory fields
      const updatedInventory = await CenterInventory.findByIdAndUpdate(
        id,
        { $set: inventoryData },
        { new: true, runValidators: true }
      );

      return {
        success: true,
        statusCode: 200,
        data: updatedInventory,
        message: "Inventory item updated successfully",
      };
    } catch (error) {
      console.error("Error in updateInventory service:", error);
      return {
        success: false,
        statusCode: 500,
        message: error.message || "Error updating inventory item",
      };
    }
  },

  // Create inventory transaction and update stock
  createTransaction: async (transactionData, userId) => {
    try {
      // Check if inventory exists
      const inventory = await CenterInventory.findById(
        transactionData.inventoryId
      );
      if (!inventory) {
        return {
          success: false,
          statusCode: 404,
          message: "Inventory item not found",
        };
      }

      // Create transaction with user who performed it
      const transaction = new InventoryTransaction({
        ...transactionData,
        performedBy: userId,
      });

      // Update inventory stock based on transaction type
      let newStock = inventory.currentStock;

      if (transaction.transactionType === "in") {
        newStock += transaction.quantity;
      } else if (transaction.transactionType === "out") {
        if (inventory.currentStock < transaction.quantity) {
          return {
            success: false,
            statusCode: 400,
            message: "Insufficient stock for this transaction",
          };
        }
        newStock -= transaction.quantity;
      } else if (transaction.transactionType === "adjustment") {
        // For adjustment, we directly set the new stock value
        newStock = transaction.quantity;
      }

      // Update inventory status based on new stock level
      let status = "available";
      if (newStock <= 0) {
        status = "out_of_stock";
      }

      // Update last restock date if it's an 'in' transaction
      const updateData = {
        currentStock: newStock,
        status,
      };

      if (transaction.transactionType === "in") {
        updateData.lastRestockDate = Date.now();
      }

      // Save transaction and update inventory
      await transaction.save();
      await CenterInventory.findByIdAndUpdate(
        transactionData.inventoryId,
        { $set: updateData },
        { new: true }
      );

      return {
        success: true,
        statusCode: 201,
        data: transaction,
        message: "Transaction created and inventory updated successfully",
      };
    } catch (error) {
      console.error("Error in createTransaction service:", error);
      return {
        success: false,
        statusCode: 500,
        message: error.message || "Error creating transaction",
      };
    }
  },

  // Get inventory transactions with optional filtering
  getTransactions: async (filters = {}) => {
    try {
      const query = {};

      // Apply filters if provided
      if (filters.inventoryId) query.inventoryId = filters.inventoryId;
      if (filters.transactionType)
        query.transactionType = filters.transactionType;
      if (filters.referenceType) query.referenceType = filters.referenceType;
      if (filters.performedBy) query.performedBy = filters.performedBy;

      // Date range filter
      if (filters.startDate && filters.endDate) {
        query.transactionDate = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate),
        };
      } else if (filters.startDate) {
        query.transactionDate = { $gte: new Date(filters.startDate) };
      } else if (filters.endDate) {
        query.transactionDate = { $lte: new Date(filters.endDate) };
      }

      const transactions = await InventoryTransaction.find(query)
        .populate("inventoryId")
        .populate({
          path: "inventoryId",
          populate: [
            { path: "centerId", select: "name location" },
            { path: "partId", select: "partNumber partName" },
          ],
        })
        .populate("performedBy", "username fullName")
        .sort({ transactionDate: -1 });

      return {
        success: true,
        statusCode: 200,
        data: transactions,
        message: "Transactions retrieved successfully",
      };
    } catch (error) {
      console.error("Error in getTransactions service:", error);
      return {
        success: false,
        statusCode: 500,
        message: error.message || "Error retrieving transactions",
      };
    }
  },

  // Get low stock alerts
  getLowStockAlerts: async (centerId = null) => {
    try {
      const query = {
        $expr: { $lte: ["$currentStock", "$reorderPoint"] },
      };

      if (centerId) {
        query.centerId = centerId;
      }

      const lowStockItems = await CenterInventory.find(query)
        .populate("centerId", "name location")
        .populate("partId", "partNumber partName category isCritical")
        .sort({ currentStock: 1 });

      return {
        success: true,
        statusCode: 200,
        data: lowStockItems,
        message: "Low stock items retrieved successfully",
      };
    } catch (error) {
      console.error("Error in getLowStockAlerts service:", error);
      return {
        success: false,
        statusCode: 500,
        message: error.message || "Error retrieving low stock alerts",
      };
    }
  },

  // Get inventory statistics for a center
  getInventoryStats: async (centerId) => {
    try {
      const stats = await CenterInventory.aggregate([
        { $match: { centerId: mongoose.Types.ObjectId(centerId) } },
        {
          $group: {
            _id: null,
            totalItems: { $sum: 1 },
            totalStock: { $sum: "$currentStock" },
            lowStockItems: {
              $sum: {
                $cond: [{ $lte: ["$currentStock", "$reorderPoint"] }, 1, 0],
              },
            },
            outOfStockItems: {
              $sum: {
                $cond: [{ $eq: ["$currentStock", 0] }, 1, 0],
              },
            },
            totalValue: {
              $sum: { $multiply: ["$currentStock", "$costPerUnit"] },
            },
          },
        },
      ]);

      return {
        success: true,
        statusCode: 200,
        data:
          stats.length > 0
            ? stats[0]
            : {
                totalItems: 0,
                totalStock: 0,
                lowStockItems: 0,
                outOfStockItems: 0,
                totalValue: 0,
              },
        message: "Inventory statistics retrieved successfully",
      };
    } catch (error) {
      console.error("Error in getInventoryStats service:", error);
      return {
        success: false,
        statusCode: 500,
        message: error.message || "Error retrieving inventory statistics",
      };
    }
  },
};

export default inventoryService;
