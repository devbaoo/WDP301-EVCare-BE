import mongoose from "mongoose";
import StaffAssignment from "../models/staffAssignment.js";
import User from "../models/user.js";
import ServiceCenter from "../models/serviceCenter.js";

const staffAssignmentService = {
  // Check if a technician is already assigned to another center
  checkTechnicianCenterAssignment: async (userId, centerId) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID");
      }

      if (!mongoose.Types.ObjectId.isValid(centerId)) {
        throw new Error("Invalid service center ID");
      }

      // Check if the user is a technician
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Only apply this constraint for technicians
      if (user.role === "technician") {
        // Find any existing assignment for this technician at a different center
        const existingAssignment = await StaffAssignment.findOne({
          userId,
          centerId: { $ne: centerId },
          isActive: true,
          position: "technician",
        }).populate("centerId", "name");

        if (existingAssignment) {
          throw new Error(
            `Technician is already assigned to service center: ${existingAssignment.centerId.name}`
          );
        }
      }

      return true;
    } catch (error) {
      throw new Error(`Error checking technician assignment: ${error.message}`);
    }
  },
  // Get all staff assignments with optional filtering
  getAllStaffAssignments: async (filters = {}) => {
    try {
      return await StaffAssignment.find(filters)
        .populate("userId", "firstName lastName email phoneNumber avatar")
        .populate("centerId", "name address location")
        .sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Error fetching staff assignments: ${error.message}`);
    }
  },

  // Get staff assignment by ID
  getStaffAssignmentById: async (id) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid assignment ID");
      }

      return await StaffAssignment.findById(id)
        .populate("userId", "firstName lastName email phoneNumber avatar")
        .populate("centerId", "name address location");
    } catch (error) {
      throw new Error(`Error fetching staff assignment: ${error.message}`);
    }
  },

  // Create new staff assignment
  createStaffAssignment: async (assignmentData) => {
    try {
      // Check if user exists
      const userExists = await User.findById(assignmentData.userId);
      if (!userExists) {
        throw new Error("User not found");
      }

      // Check if service center exists
      const centerExists = await ServiceCenter.findById(
        assignmentData.centerId
      );
      if (!centerExists) {
        throw new Error("Service center not found");
      }

      // Check if assignment already exists
      const existingAssignment = await StaffAssignment.findOne({
        userId: assignmentData.userId,
        centerId: assignmentData.centerId,
        isActive: true,
      });

      if (existingAssignment) {
        throw new Error("User is already assigned to this service center");
      }

      // If position is technician, check if already assigned to another center
      if (assignmentData.position === "technician") {
        await staffAssignmentService.checkTechnicianCenterAssignment(
          assignmentData.userId,
          assignmentData.centerId
        );
      }

      // Update user role based on position
      if (assignmentData.position === "technician") {
        await User.findByIdAndUpdate(assignmentData.userId, {
          role: "technician",
        });
      } else if (assignmentData.position === "staff") {
        await User.findByIdAndUpdate(assignmentData.userId, { role: "staff" });
      }

      // Create new assignment
      const newAssignment = new StaffAssignment(assignmentData);
      await newAssignment.save();

      return await StaffAssignment.findById(newAssignment._id)
        .populate("userId", "firstName lastName email phoneNumber avatar role")
        .populate("centerId", "name address location");
    } catch (error) {
      throw new Error(`Error creating staff assignment: ${error.message}`);
    }
  },

  // Update staff assignment
  updateStaffAssignment: async (id, updateData) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid assignment ID");
      }

      // Get current assignment data
      const currentAssignment = await StaffAssignment.findById(id);
      if (!currentAssignment) {
        throw new Error("Staff assignment not found");
      }

      // If position is being updated to technician, check if already assigned to another center
      if (
        updateData.position === "technician" &&
        currentAssignment.position !== "technician"
      ) {
        await staffAssignmentService.checkTechnicianCenterAssignment(
          currentAssignment.userId,
          currentAssignment.centerId
        );
      }

      const assignment = await StaffAssignment.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      )
        .populate("userId", "firstName lastName email phoneNumber avatar")
        .populate("centerId", "name address location");

      return assignment;
    } catch (error) {
      throw new Error(`Error updating staff assignment: ${error.message}`);
    }
  },

  // Delete staff assignment
  deleteStaffAssignment: async (id) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid assignment ID");
      }

      // Find the assignment first to get user details
      const assignment = await StaffAssignment.findById(id);
      if (!assignment) {
        return null;
      }

      // Reset user role to customer when removing from service center
      await User.findByIdAndUpdate(assignment.userId, { role: "customer" });

      // Delete the assignment
      const deletedAssignment = await StaffAssignment.findByIdAndDelete(id);
      return deletedAssignment;
    } catch (error) {
      throw new Error(`Error deleting staff assignment: ${error.message}`);
    }
  },

  // Get staff by service center
  getStaffByCenter: async (filters) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(filters.centerId)) {
        throw new Error("Invalid center ID");
      }

      return await StaffAssignment.find({
        ...filters,
        isActive: true,
      })
        .populate("userId", "firstName lastName email phoneNumber avatar role")
        .sort({ position: 1, createdAt: -1 });
    } catch (error) {
      throw new Error(`Error fetching staff by center: ${error.message}`);
    }
  },

  // Get centers by staff
  getCentersByStaff: async (userId) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID");
      }

      const assignments = await StaffAssignment.find({
        userId,
        isActive: true,
      })
        .populate(
          "centerId",
          "name address location contactInfo operatingHours"
        )
        .sort({ createdAt: -1 });

      return assignments.map((assignment) => ({
        ...assignment.centerId.toObject(),
        position: assignment.position,
        assignmentId: assignment._id,
        startDate: assignment.startDate,
      }));
    } catch (error) {
      throw new Error(`Error fetching centers by staff: ${error.message}`);
    }
  },

  // Update staff position
  updateStaffPosition: async (id, position) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid assignment ID");
      }

      // Validate position
      const validPositions = ["staff", "technician"];
      if (!validPositions.includes(position)) {
        throw new Error("Invalid position. Must be one of: staff, technician");
      }

      // Get current assignment data
      const currentAssignment = await StaffAssignment.findById(id);
      if (!currentAssignment) {
        throw new Error("Staff assignment not found");
      }

      // If position is being updated to technician, check if already assigned to another center
      if (
        position === "technician" &&
        currentAssignment.position !== "technician"
      ) {
        await staffAssignmentService.checkTechnicianCenterAssignment(
          currentAssignment.userId,
          currentAssignment.centerId
        );
      }

      const assignment = await StaffAssignment.findByIdAndUpdate(
        id,
        { $set: { position } },
        { new: true, runValidators: true }
      )
        .populate("userId", "firstName lastName email phoneNumber avatar")
        .populate("centerId", "name address location");

      // Update user role based on position
      await User.findByIdAndUpdate(assignment.userId, { role: position });

      return assignment;
    } catch (error) {
      throw new Error(`Error updating staff position: ${error.message}`);
    }
  },
};

export default staffAssignmentService;
