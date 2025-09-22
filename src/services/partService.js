import Part from "../models/part.js";

const partService = {
  // Get all parts with optional filtering
  getAllParts: async (filters = {}) => {
    try {
      const query = {};

      // Apply filters if provided
      if (filters.partNumber)
        query.partNumber = { $regex: filters.partNumber, $options: "i" };
      if (filters.partName)
        query.partName = { $regex: filters.partName, $options: "i" };
      if (filters.category) query.category = filters.category;
      if (filters.isCritical !== undefined)
        query.isCritical = filters.isCritical === "true";

      // Handle compatible model filter
      if (filters.compatibleModel) {
        query.compatibleModels = { $in: [filters.compatibleModel] };
      }

      const parts = await Part.find(query)
        .populate("compatibleModels", "brand model year")
        .sort({ createdAt: -1 });

      return {
        success: true,
        statusCode: 200,
        data: parts,
        message: "Parts retrieved successfully",
      };
    } catch (error) {
      console.error("Error in getAllParts service:", error);
      return {
        success: false,
        statusCode: 500,
        message: error.message || "Error retrieving parts",
      };
    }
  },

  // Get part by ID
  getPartById: async (id) => {
    try {
      const part = await Part.findById(id).populate(
        "compatibleModels",
        "brand model year"
      );

      if (!part) {
        return {
          success: false,
          statusCode: 404,
          message: "Part not found",
        };
      }

      return {
        success: true,
        statusCode: 200,
        data: part,
        message: "Part retrieved successfully",
      };
    } catch (error) {
      console.error("Error in getPartById service:", error);
      return {
        success: false,
        statusCode: 500,
        message: error.message || "Error retrieving part",
      };
    }
  },

  // Create new part
  createPart: async (partData) => {
    try {
      const newPart = new Part(partData);
      await newPart.save();

      return {
        success: true,
        statusCode: 201,
        data: newPart,
        message: "Part created successfully",
      };
    } catch (error) {
      console.error("Error in createPart service:", error);

      // Handle duplicate part number error
      if (error.code === 11000) {
        return {
          success: false,
          statusCode: 400,
          message: "Part number already exists",
        };
      }

      return {
        success: false,
        statusCode: 500,
        message: error.message || "Error creating part",
      };
    }
  },

  // Update part
  updatePart: async (id, partData) => {
    try {
      const part = await Part.findById(id);

      if (!part) {
        return {
          success: false,
          statusCode: 404,
          message: "Part not found",
        };
      }

      // Update part fields
      const updatedPart = await Part.findByIdAndUpdate(
        id,
        { $set: partData },
        { new: true, runValidators: true }
      );

      return {
        success: true,
        statusCode: 200,
        data: updatedPart,
        message: "Part updated successfully",
      };
    } catch (error) {
      console.error("Error in updatePart service:", error);

      // Handle duplicate part number error
      if (error.code === 11000) {
        return {
          success: false,
          statusCode: 400,
          message: "Part number already exists",
        };
      }

      return {
        success: false,
        statusCode: 500,
        message: error.message || "Error updating part",
      };
    }
  },

  // Delete part
  deletePart: async (id) => {
    try {
      const part = await Part.findById(id);

      if (!part) {
        return {
          success: false,
          statusCode: 404,
          message: "Part not found",
        };
      }

      await Part.findByIdAndDelete(id);

      return {
        success: true,
        statusCode: 200,
        message: "Part deleted successfully",
      };
    } catch (error) {
      console.error("Error in deletePart service:", error);
      return {
        success: false,
        statusCode: 500,
        message: error.message || "Error deleting part",
      };
    }
  },

  // Get parts by category
  getPartsByCategory: async (category) => {
    try {
      const parts = await Part.find({ category }).populate(
        "compatibleModels",
        "brand model year"
      );

      return {
        success: true,
        statusCode: 200,
        data: parts,
        message: "Parts retrieved successfully",
      };
    } catch (error) {
      console.error("Error in getPartsByCategory service:", error);
      return {
        success: false,
        statusCode: 500,
        message: error.message || "Error retrieving parts by category",
      };
    }
  },

  // Get parts compatible with a specific vehicle model
  getCompatibleParts: async (vehicleModelId) => {
    try {
      const parts = await Part.find({
        compatibleModels: vehicleModelId,
      }).populate("compatibleModels", "brand model year");

      return {
        success: true,
        statusCode: 200,
        data: parts,
        message: "Compatible parts retrieved successfully",
      };
    } catch (error) {
      console.error("Error in getCompatibleParts service:", error);
      return {
        success: false,
        statusCode: 500,
        message: error.message || "Error retrieving compatible parts",
      };
    }
  },
};

export default partService;
