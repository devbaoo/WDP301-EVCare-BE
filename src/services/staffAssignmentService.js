import mongoose from "mongoose";
import StaffAssignment from "../models/staffAssignment.js";
import User from "../models/user.js";
import ServiceCenter from "../models/serviceCenter.js";

const staffAssignmentService = {
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

      // Create new assignment
      const newAssignment = new StaffAssignment(assignmentData);
      await newAssignment.save();

      return await StaffAssignment.findById(newAssignment._id)
        .populate("userId", "firstName lastName email phoneNumber avatar")
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

      const assignment = await StaffAssignment.findByIdAndDelete(id);
      return assignment;
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
      const validPositions = ["manager", "staff", "technician"];
      if (!validPositions.includes(position)) {
        throw new Error(
          "Invalid position. Must be one of: manager, staff, technician"
        );
      }

      const assignment = await StaffAssignment.findByIdAndUpdate(
        id,
        { $set: { position } },
        { new: true, runValidators: true }
      )
        .populate("userId", "firstName lastName email phoneNumber avatar")
        .populate("centerId", "name address location");

      return assignment;
    } catch (error) {
      throw new Error(`Error updating staff position: ${error.message}`);
    }
  },
};

export default staffAssignmentService;
