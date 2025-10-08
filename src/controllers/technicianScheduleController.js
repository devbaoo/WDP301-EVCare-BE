import technicianScheduleService from "../services/technicianScheduleService.js";

const technicianScheduleController = {
  // Tạo lịch làm việc mặc định cho kỹ thuật viên
  createDefaultSchedule: async (req, res) => {
    try {
      const { technicianId, centerId, startDate, endDate } = req.body;

      // Validate required fields
      if (!technicianId || !centerId || !startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message:
            "Missing required fields: technicianId, centerId, startDate, endDate",
        });
      }

      const schedules = await technicianScheduleService.createDefaultSchedule(
        technicianId,
        centerId,
        startDate,
        endDate
      );

      res.status(201).json({
        success: true,
        data: schedules,
        message: `Successfully created ${schedules.length} default schedules`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create default schedules",
      });
    }
  },
  // Get all schedules
  getAllSchedules: async (req, res) => {
    try {
      const { technicianId, centerId, workDate, status, availability } =
        req.query;
      const filters = {};

      if (technicianId) filters.technicianId = technicianId;
      if (centerId) filters.centerId = centerId;
      if (status) filters.status = status;
      if (availability) filters.availability = availability;

      // Handle date filtering
      if (workDate) {
        const date = new Date(workDate);
        date.setHours(0, 0, 0, 0);

        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        filters.workDate = {
          $gte: date,
          $lt: nextDay,
        };
      }

      const schedules = await technicianScheduleService.getAllSchedules(
        filters
      );

      res.status(200).json({
        success: true,
        data: schedules,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch schedules",
      });
    }
  },

  // Get schedule by ID
  getScheduleById: async (req, res) => {
    try {
      const { id } = req.params;
      const schedule = await technicianScheduleService.getScheduleById(id);

      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: "Schedule not found",
        });
      }

      res.status(200).json({
        success: true,
        data: schedule,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch schedule",
      });
    }
  },

  // Create new schedule
  createSchedule: async (req, res) => {
    try {
      const {
        technicianId,
        centerId,
        workDate,
        shiftStart,
        shiftEnd,
        status,
        breakTime,
        notes,
      } = req.body;

      // Validate required fields
      if (!technicianId || !centerId || !workDate || !shiftStart || !shiftEnd) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      const newSchedule = await technicianScheduleService.createSchedule({
        technicianId,
        centerId,
        workDate,
        shiftStart,
        shiftEnd,
        status,
        breakTime,
        notes,
      });

      res.status(201).json({
        success: true,
        data: newSchedule,
        message: "Schedule created successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create schedule",
      });
    }
  },

  // Update schedule
  updateSchedule: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        workDate,
        shiftStart,
        shiftEnd,
        status,
        breakTime,
        overtimeHours,
        overtimeReason,
        availability,
        availabilityNotes,
        notes,
      } = req.body;

      const updatedSchedule = await technicianScheduleService.updateSchedule(
        id,
        {
          workDate,
          shiftStart,
          shiftEnd,
          status,
          breakTime,
          overtimeHours,
          overtimeReason,
          availability,
          availabilityNotes,
          notes,
        }
      );

      if (!updatedSchedule) {
        return res.status(404).json({
          success: false,
          message: "Schedule not found",
        });
      }

      res.status(200).json({
        success: true,
        data: updatedSchedule,
        message: "Schedule updated successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update schedule",
      });
    }
  },

  // Delete schedule
  deleteSchedule: async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await technicianScheduleService.deleteSchedule(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Schedule not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Schedule deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete schedule",
      });
    }
  },

  // Get schedules by technician
  getSchedulesByTechnician: async (req, res) => {
    try {
      const { technicianId } = req.params;
      const { startDate, endDate } = req.query;

      const schedules =
        await technicianScheduleService.getSchedulesByTechnician(
          technicianId,
          startDate,
          endDate
        );

      res.status(200).json({
        success: true,
        data: schedules,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch schedules by technician",
      });
    }
  },

  // Get schedules by service center
  getSchedulesByCenter: async (req, res) => {
    try {
      const { centerId } = req.params;
      const { date } = req.query;

      const schedules = await technicianScheduleService.getSchedulesByCenter(
        centerId,
        date
      );

      res.status(200).json({
        success: true,
        data: schedules,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch schedules by center",
      });
    }
  },

  // Update schedule status
  updateScheduleStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "Status is required",
        });
      }

      const updatedSchedule =
        await technicianScheduleService.updateScheduleStatus(id, status);

      if (!updatedSchedule) {
        return res.status(404).json({
          success: false,
          message: "Schedule not found",
        });
      }

      res.status(200).json({
        success: true,
        data: updatedSchedule,
        message: "Schedule status updated successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update schedule status",
      });
    }
  },

  // Record check-in
  recordCheckIn: async (req, res) => {
    try {
      const { id } = req.params;

      const updatedSchedule = await technicianScheduleService.recordCheckIn(id);

      res.status(200).json({
        success: true,
        data: updatedSchedule,
        message: "Check-in recorded successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to record check-in",
      });
    }
  },

  // Record check-out
  recordCheckOut: async (req, res) => {
    try {
      const { id } = req.params;

      const updatedSchedule = await technicianScheduleService.recordCheckOut(
        id
      );

      res.status(200).json({
        success: true,
        data: updatedSchedule,
        message: "Check-out recorded successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to record check-out",
      });
    }
  },

  // Update availability
  updateAvailability: async (req, res) => {
    try {
      const { id } = req.params;
      const { availability, notes } = req.body;

      if (!availability) {
        return res.status(400).json({
          success: false,
          message: "Availability status is required",
        });
      }

      const updatedSchedule =
        await technicianScheduleService.updateAvailability(
          id,
          availability,
          notes
        );

      res.status(200).json({
        success: true,
        data: updatedSchedule,
        message: "Availability updated successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update availability",
      });
    }
  },

  // Add appointment to schedule
  addAppointmentToSchedule: async (req, res) => {
    try {
      const { id } = req.params;
      const { appointmentId, scheduleIds } = req.body;

      if (!appointmentId) {
        return res.status(400).json({
          success: false,
          message: "Appointment ID is required",
        });
      }

      // If caller provided scheduleIds array, add appointment to multiple schedules
      if (Array.isArray(scheduleIds) && scheduleIds.length > 0) {
        const updatedSchedules = await technicianScheduleService.addAppointmentToMultipleSchedules(
          scheduleIds,
          appointmentId
        );

        return res.status(200).json({
          success: true,
          data: updatedSchedules,
          message: "Appointment added to multiple schedules successfully",
        });
      }

      // Fallback: single schedule (path preserved for backward compatibility)
      const updatedSchedule =
        await technicianScheduleService.addAppointmentToSchedule(
          id,
          appointmentId
        );

      res.status(200).json({
        success: true,
        data: updatedSchedule,
        message: "Appointment added to schedule successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to add appointment to schedule",
      });
    }
  },

  // Remove appointment from schedule
  removeAppointmentFromSchedule: async (req, res) => {
    try {
      const { id, appointmentId } = req.params;

      const updatedSchedule =
        await technicianScheduleService.removeAppointmentFromSchedule(
          id,
          appointmentId
        );

      res.status(200).json({
        success: true,
        data: updatedSchedule,
        message: "Appointment removed from schedule successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to remove appointment from schedule",
      });
    }
  },

  // Get available technicians
  getAvailableTechnicians: async (req, res) => {
    try {
      const { centerId } = req.params;
      const { date, timeSlot } = req.query;

      if (!date || !timeSlot) {
        return res.status(400).json({
          success: false,
          message: "Date and time slot are required",
        });
      }

      const technicians =
        await technicianScheduleService.getAvailableTechnicians(
          centerId,
          date,
          timeSlot
        );

      res.status(200).json({
        success: true,
        data: technicians,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch available technicians",
      });
    }
  },

  // Get overtime report
  getOvertimeReport: async (req, res) => {
    try {
      const { startDate, endDate, centerId } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "Start date and end date are required",
        });
      }

      const overtimeReport = await technicianScheduleService.getOvertimeReport(
        startDate,
        endDate,
        centerId
      );

      res.status(200).json({
        success: true,
        data: overtimeReport,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to generate overtime report",
      });
    }
  },

  // ===== CHỨC NĂNG XIN NGHỈ PHÉP =====

  // Gửi yêu cầu xin nghỉ phép
  requestLeave: async (req, res) => {
    try {
      const { technicianId } = req.params;
      const { startDate, endDate, reason } = req.body;

      // Validate required fields
      if (!startDate || !endDate || !reason) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: startDate, endDate, reason",
        });
      }

      const updatedSchedules = await technicianScheduleService.requestLeave(
        technicianId,
        { startDate, endDate, reason }
      );

      res.status(200).json({
        success: true,
        data: updatedSchedules,
        message: "Leave request submitted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to submit leave request",
      });
    }
  },

  // Phê duyệt hoặc từ chối yêu cầu xin nghỉ
  processLeaveRequest: async (req, res) => {
    try {
      const { scheduleId } = req.params;
      const { action } = req.body;
      const staffId = req.user.id; // Lấy ID của nhân viên từ token xác thực

      if (!action || (action !== "approve" && action !== "reject")) {
        return res.status(400).json({
          success: false,
          message: "Action must be either 'approve' or 'reject'",
        });
      }

      const updatedSchedule =
        await technicianScheduleService.processLeaveRequest(
          scheduleId,
          staffId,
          action
        );

      res.status(200).json({
        success: true,
        data: updatedSchedule,
        message: `Leave request ${action === "approve" ? "approved" : "rejected"
          } successfully`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to process leave request",
      });
    }
  },

  // Lấy danh sách yêu cầu xin nghỉ đang chờ duyệt
  getPendingLeaveRequests: async (req, res) => {
    try {
      const { centerId } = req.query;

      const pendingRequests =
        await technicianScheduleService.getPendingLeaveRequests(centerId);

      res.status(200).json({
        success: true,
        data: pendingRequests,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch pending leave requests",
      });
    }
  },

  // Lấy lịch sử xin nghỉ của một kỹ thuật viên
  getLeaveHistory: async (req, res) => {
    try {
      const { technicianId } = req.params;
      const { status } = req.query;

      const leaveHistory = await technicianScheduleService.getLeaveHistory(
        technicianId,
        status
      );

      res.status(200).json({
        success: true,
        data: leaveHistory,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch leave history",
      });
    }
  },
};

export default technicianScheduleController;
