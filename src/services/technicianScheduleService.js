import mongoose from "mongoose";
import TechnicianSchedule from "../models/technicianSchedule.js";
import User from "../models/user.js";
import ServiceCenter from "../models/serviceCenter.js";

const technicianScheduleService = {
  // Get all schedules with optional filtering
  getAllSchedules: async (filters = {}) => {
    try {
      return await TechnicianSchedule.find(filters)
        .populate("technicianId", "firstName lastName email phoneNumber")
        .populate("centerId", "name address")
        .populate("assignedAppointments")
        .sort({ workDate: 1, shiftStart: 1 });
    } catch (error) {
      throw new Error(`Error fetching schedules: ${error.message}`);
    }
  },

  // Get schedule by ID
  getScheduleById: async (id) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid schedule ID");
      }

      return await TechnicianSchedule.findById(id)
        .populate("technicianId", "firstName lastName email phoneNumber")
        .populate("centerId", "name address")
        .populate("assignedAppointments");
    } catch (error) {
      throw new Error(`Error fetching schedule: ${error.message}`);
    }
  },

  // Create new schedule
  createSchedule: async (scheduleData) => {
    try {
      // Check if technician exists
      const technicianExists = await User.findById(scheduleData.technicianId);
      if (!technicianExists) {
        throw new Error("Technician not found");
      }

      // Check if service center exists
      const centerExists = await ServiceCenter.findById(scheduleData.centerId);
      if (!centerExists) {
        throw new Error("Service center not found");
      }

      // Validate shift times
      const startTime = scheduleData.shiftStart.split(":");
      const endTime = scheduleData.shiftEnd.split(":");

      const startHour = parseInt(startTime[0]);
      const startMinute = parseInt(startTime[1]);
      const endHour = parseInt(endTime[0]);
      const endMinute = parseInt(endTime[1]);

      if (
        startHour > endHour ||
        (startHour === endHour && startMinute >= endMinute)
      ) {
        throw new Error("Shift end time must be after shift start time");
      }

      // Check for overlapping schedules for the same technician on the same day
      const workDate = new Date(scheduleData.workDate);
      workDate.setHours(0, 0, 0, 0);

      const nextDay = new Date(workDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const existingSchedule = await TechnicianSchedule.findOne({
        technicianId: scheduleData.technicianId,
        workDate: {
          $gte: workDate,
          $lt: nextDay,
        },
        status: { $nin: ["absent", "on_leave"] },
      });

      if (existingSchedule) {
        throw new Error("Technician already has a schedule for this date");
      }

      // Create new schedule
      const newSchedule = new TechnicianSchedule(scheduleData);
      await newSchedule.save();

      return await TechnicianSchedule.findById(newSchedule._id)
        .populate("technicianId", "firstName lastName email phoneNumber")
        .populate("centerId", "name address");
    } catch (error) {
      throw new Error(`Error creating schedule: ${error.message}`);
    }
  },

  // Update schedule
  updateSchedule: async (id, updateData) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid schedule ID");
      }

      // If shift times are being updated, validate them
      if (updateData.shiftStart && updateData.shiftEnd) {
        const startTime = updateData.shiftStart.split(":");
        const endTime = updateData.shiftEnd.split(":");

        const startHour = parseInt(startTime[0]);
        const startMinute = parseInt(startTime[1]);
        const endHour = parseInt(endTime[0]);
        const endMinute = parseInt(endTime[1]);

        if (
          startHour > endHour ||
          (startHour === endHour && startMinute >= endMinute)
        ) {
          throw new Error("Shift end time must be after shift start time");
        }
      }

      const schedule = await TechnicianSchedule.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      )
        .populate("technicianId", "firstName lastName email phoneNumber")
        .populate("centerId", "name address")
        .populate("assignedAppointments");

      return schedule;
    } catch (error) {
      throw new Error(`Error updating schedule: ${error.message}`);
    }
  },

  // Delete schedule
  deleteSchedule: async (id) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid schedule ID");
      }

      const schedule = await TechnicianSchedule.findByIdAndDelete(id);
      return schedule;
    } catch (error) {
      throw new Error(`Error deleting schedule: ${error.message}`);
    }
  },

  // Get schedules by technician
  getSchedulesByTechnician: async (technicianId, startDate, endDate) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(technicianId)) {
        throw new Error("Invalid technician ID");
      }

      const query = { technicianId };

      // Add date range filter if provided
      if (startDate && endDate) {
        query.workDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      } else if (startDate) {
        query.workDate = { $gte: new Date(startDate) };
      } else if (endDate) {
        query.workDate = { $lte: new Date(endDate) };
      }

      return await TechnicianSchedule.find(query)
        .populate("centerId", "name address")
        .populate("assignedAppointments")
        .sort({ workDate: 1, shiftStart: 1 });
    } catch (error) {
      throw new Error(
        `Error fetching schedules by technician: ${error.message}`
      );
    }
  },

  // Get schedules by service center
  getSchedulesByCenter: async (centerId, date) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(centerId)) {
        throw new Error("Invalid center ID");
      }

      const query = { centerId };

      // Add date filter if provided
      if (date) {
        const workDate = new Date(date);
        workDate.setHours(0, 0, 0, 0);

        const nextDay = new Date(workDate);
        nextDay.setDate(nextDay.getDate() + 1);

        query.workDate = {
          $gte: workDate,
          $lt: nextDay,
        };
      }

      return await TechnicianSchedule.find(query)
        .populate("technicianId", "firstName lastName email phoneNumber")
        .sort({ workDate: 1, shiftStart: 1 });
    } catch (error) {
      throw new Error(`Error fetching schedules by center: ${error.message}`);
    }
  },

  // Update schedule status
  updateScheduleStatus: async (id, status) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid schedule ID");
      }

      // Validate status
      const validStatuses = [
        "scheduled",
        "working",
        "completed",
        "absent",
        "on_leave",
      ];
      if (!validStatuses.includes(status)) {
        throw new Error(
          "Invalid status. Must be one of: scheduled, working, completed, absent, on_leave"
        );
      }

      const schedule = await TechnicianSchedule.findByIdAndUpdate(
        id,
        { $set: { status } },
        { new: true, runValidators: true }
      )
        .populate("technicianId", "firstName lastName email phoneNumber")
        .populate("centerId", "name address");

      return schedule;
    } catch (error) {
      throw new Error(`Error updating schedule status: ${error.message}`);
    }
  },

  // Record check-in
  recordCheckIn: async (id) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid schedule ID");
      }

      const schedule = await TechnicianSchedule.findById(id);
      if (!schedule) {
        throw new Error("Schedule not found");
      }

      if (schedule.checkInTime) {
        throw new Error("Check-in already recorded");
      }

      const checkInTime = new Date();

      const updatedSchedule = await TechnicianSchedule.findByIdAndUpdate(
        id,
        {
          $set: {
            checkInTime,
            status: "working",
          },
        },
        { new: true, runValidators: true }
      )
        .populate("technicianId", "firstName lastName email phoneNumber")
        .populate("centerId", "name address");

      return updatedSchedule;
    } catch (error) {
      throw new Error(`Error recording check-in: ${error.message}`);
    }
  },

  // Record check-out
  recordCheckOut: async (id) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid schedule ID");
      }

      const schedule = await TechnicianSchedule.findById(id);
      if (!schedule) {
        throw new Error("Schedule not found");
      }

      if (!schedule.checkInTime) {
        throw new Error("Check-in must be recorded before check-out");
      }

      if (schedule.checkOutTime) {
        throw new Error("Check-out already recorded");
      }

      const checkOutTime = new Date();

      // Calculate actual work hours
      const checkInTime = new Date(schedule.checkInTime);
      const actualWorkHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);

      // Calculate overtime hours
      let overtimeHours = 0;
      const shiftStartParts = schedule.shiftStart.split(":");
      const shiftEndParts = schedule.shiftEnd.split(":");

      const shiftStartHour = parseInt(shiftStartParts[0]);
      const shiftStartMinute = parseInt(shiftStartParts[1]);
      const shiftEndHour = parseInt(shiftEndParts[0]);
      const shiftEndMinute = parseInt(shiftEndParts[1]);

      const scheduledWorkHours =
        shiftEndHour +
        shiftEndMinute / 60 -
        (shiftStartHour + shiftStartMinute / 60);

      if (actualWorkHours > scheduledWorkHours) {
        overtimeHours = actualWorkHours - scheduledWorkHours;
      }

      const updatedSchedule = await TechnicianSchedule.findByIdAndUpdate(
        id,
        {
          $set: {
            checkOutTime,
            status: "completed",
            actualWorkHours: parseFloat(actualWorkHours.toFixed(2)),
            overtimeHours: parseFloat(overtimeHours.toFixed(2)),
          },
        },
        { new: true, runValidators: true }
      )
        .populate("technicianId", "firstName lastName email phoneNumber")
        .populate("centerId", "name address");

      return updatedSchedule;
    } catch (error) {
      throw new Error(`Error recording check-out: ${error.message}`);
    }
  },

  // Update availability
  updateAvailability: async (id, availability, notes) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid schedule ID");
      }

      // Validate availability
      const validAvailabilities = ["available", "busy", "unavailable"];
      if (!validAvailabilities.includes(availability)) {
        throw new Error(
          "Invalid availability. Must be one of: available, busy, unavailable"
        );
      }

      const schedule = await TechnicianSchedule.findByIdAndUpdate(
        id,
        {
          $set: {
            availability,
            availabilityNotes: notes,
          },
        },
        { new: true, runValidators: true }
      )
        .populate("technicianId", "firstName lastName email phoneNumber")
        .populate("centerId", "name address");

      return schedule;
    } catch (error) {
      throw new Error(`Error updating availability: ${error.message}`);
    }
  },

  // Add appointment to schedule
  addAppointmentToSchedule: async (id, appointmentId) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid schedule ID");
      }

      if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
        throw new Error("Invalid appointment ID");
      }

      const schedule = await TechnicianSchedule.findByIdAndUpdate(
        id,
        {
          $addToSet: { assignedAppointments: appointmentId },
          $set: { availability: "busy" },
        },
        { new: true, runValidators: true }
      )
        .populate("technicianId", "firstName lastName email phoneNumber")
        .populate("centerId", "name address")
        .populate("assignedAppointments");

      return schedule;
    } catch (error) {
      throw new Error(`Error adding appointment to schedule: ${error.message}`);
    }
  },

  // Remove appointment from schedule
  removeAppointmentFromSchedule: async (id, appointmentId) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid schedule ID");
      }

      if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
        throw new Error("Invalid appointment ID");
      }

      const schedule = await TechnicianSchedule.findByIdAndUpdate(
        id,
        {
          $pull: { assignedAppointments: appointmentId },
        },
        { new: true, runValidators: true }
      )
        .populate("technicianId", "firstName lastName email phoneNumber")
        .populate("centerId", "name address")
        .populate("assignedAppointments");

      // Update availability if no appointments left
      if (schedule.assignedAppointments.length === 0) {
        schedule.availability = "available";
        await schedule.save();
      }

      return schedule;
    } catch (error) {
      throw new Error(
        `Error removing appointment from schedule: ${error.message}`
      );
    }
  },

  // Get available technicians for a specific date, time and service center
  getAvailableTechnicians: async (centerId, date, timeSlot) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(centerId)) {
        throw new Error("Invalid center ID");
      }

      const workDate = new Date(date);
      workDate.setHours(0, 0, 0, 0);

      // Parse time slot
      const [startTime, endTime] = timeSlot.split("-");

      // Find technicians who are scheduled, available, and whose shift covers the time slot
      const availableTechnicians = await TechnicianSchedule.find({
        centerId,
        workDate,
        status: { $in: ["scheduled", "working"] },
        availability: "available",
        shiftStart: { $lte: startTime },
        shiftEnd: { $gte: endTime },
      }).populate("technicianId", "firstName lastName email phoneNumber");

      return availableTechnicians;
    } catch (error) {
      throw new Error(`Error fetching available technicians: ${error.message}`);
    }
  },

  // Get overtime report
  getOvertimeReport: async (startDate, endDate, centerId = null) => {
    try {
      const query = {
        overtimeHours: { $gt: 0 },
      };

      // Add date range filter
      if (startDate && endDate) {
        query.workDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      // Add center filter if provided
      if (centerId && mongoose.Types.ObjectId.isValid(centerId)) {
        query.centerId = centerId;
      }

      const overtimeRecords = await TechnicianSchedule.find(query)
        .populate("technicianId", "firstName lastName email")
        .populate("centerId", "name")
        .sort({ workDate: 1 });

      // Group by technician
      const overtimeByTechnician = {};

      overtimeRecords.forEach((record) => {
        const techId = record.technicianId._id.toString();
        const techName = `${record.technicianId.firstName} ${record.technicianId.lastName}`;

        if (!overtimeByTechnician[techId]) {
          overtimeByTechnician[techId] = {
            technicianId: techId,
            technicianName: techName,
            totalOvertimeHours: 0,
            records: [],
          };
        }

        overtimeByTechnician[techId].totalOvertimeHours += record.overtimeHours;
        overtimeByTechnician[techId].records.push({
          scheduleId: record._id,
          workDate: record.workDate,
          centerName: record.centerId.name,
          overtimeHours: record.overtimeHours,
          overtimeReason: record.overtimeReason || "Not specified",
        });
      });

      return Object.values(overtimeByTechnician);
    } catch (error) {
      throw new Error(`Error generating overtime report: ${error.message}`);
    }
  },
};

export default technicianScheduleService;
