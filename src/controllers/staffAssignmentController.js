import staffAssignmentService from "../services/staffAssignmentService.js";

const staffAssignmentController = {
  // Get all staff assignments
  getAllStaffAssignments: async (req, res) => {
    try {
      const { centerId, position, isActive } = req.query;
      const filters = {};

      if (centerId) filters.centerId = centerId;
      if (position) filters.position = position;
      if (isActive !== undefined) filters.isActive = isActive === "true";

      const assignments = await staffAssignmentService.getAllStaffAssignments(
        filters
      );

      res.status(200).json({
        success: true,
        data: assignments,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch staff assignments",
      });
    }
  },

  // Get staff assignment by ID
  getStaffAssignmentById: async (req, res) => {
    try {
      const { id } = req.params;
      const assignment = await staffAssignmentService.getStaffAssignmentById(
        id
      );

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: "Staff assignment not found",
        });
      }

      res.status(200).json({
        success: true,
        data: assignment,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch staff assignment",
      });
    }
  },

  // Create new staff assignment
  createStaffAssignment: async (req, res) => {
    try {
      const { userId, centerId, position, startDate, endDate } = req.body;

      // Validate required fields
      if (!userId || !centerId || !position || !startDate) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      const newAssignment = await staffAssignmentService.createStaffAssignment({
        userId,
        centerId,
        position,
        startDate,
        endDate,
        isActive: true,
      });

      res.status(201).json({
        success: true,
        data: newAssignment,
        message: "Staff assignment created successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create staff assignment",
      });
    }
  },

  // Update staff assignment
  updateStaffAssignment: async (req, res) => {
    try {
      const { id } = req.params;
      const { position, startDate, endDate, isActive } = req.body;

      const updatedAssignment =
        await staffAssignmentService.updateStaffAssignment(id, {
          position,
          startDate,
          endDate,
          isActive,
        });

      if (!updatedAssignment) {
        return res.status(404).json({
          success: false,
          message: "Staff assignment not found",
        });
      }

      res.status(200).json({
        success: true,
        data: updatedAssignment,
        message: "Staff assignment updated successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update staff assignment",
      });
    }
  },

  // Delete staff assignment
  deleteStaffAssignment: async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await staffAssignmentService.deleteStaffAssignment(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Staff assignment not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Staff assignment deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete staff assignment",
      });
    }
  },

  // Get staff by service center
  getStaffByCenter: async (req, res) => {
    try {
      const { centerId } = req.params;
      const { position } = req.query;

      const filters = { centerId };
      if (position) filters.position = position;

      const staff = await staffAssignmentService.getStaffByCenter(filters);

      res.status(200).json({
        success: true,
        data: staff,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch staff by center",
      });
    }
  },

  // Get centers by staff
  getCentersByStaff: async (req, res) => {
    try {
      const { userId } = req.params;
      const centers = await staffAssignmentService.getCentersByStaff(userId);

      res.status(200).json({
        success: true,
        data: centers,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch centers by staff",
      });
    }
  },

  // Update staff position
  updateStaffPosition: async (req, res) => {
    try {
      const { id } = req.params;
      const { position } = req.body;

      if (!position) {
        return res.status(400).json({
          success: false,
          message: "Position is required",
        });
      }

      const updatedAssignment =
        await staffAssignmentService.updateStaffPosition(id, position);

      if (!updatedAssignment) {
        return res.status(404).json({
          success: false,
          message: "Staff assignment not found",
        });
      }

      res.status(200).json({
        success: true,
        data: updatedAssignment,
        message: "Staff position updated successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update staff position",
      });
    }
  },
};

export default staffAssignmentController;
