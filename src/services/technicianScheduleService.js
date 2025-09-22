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

  // Tạo lịch làm việc mặc định cho kỹ thuật viên
  createDefaultSchedule: async (technicianId, centerId, startDate, endDate) => {
    try {
      // Kiểm tra kỹ thuật viên tồn tại
      const technicianExists = await User.findById(technicianId);
      if (!technicianExists) {
        throw new Error("Technician not found");
      }

      // Kiểm tra trung tâm dịch vụ tồn tại
      const centerExists = await ServiceCenter.findById(centerId);
      if (!centerExists) {
        throw new Error("Service center not found");
      }

      // Chuyển đổi ngày bắt đầu và kết thúc thành đối tượng Date
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      // Mảng lưu trữ các lịch đã tạo
      const createdSchedules = [];

      // Tạo lịch làm việc cho mỗi ngày từ startDate đến endDate (chỉ từ thứ 2 đến thứ 7)
      const currentDate = new Date(start);
      while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay(); // 0 = Chủ nhật, 1-6 = Thứ 2 - Thứ 7

        // Chỉ tạo lịch cho các ngày từ thứ 2 đến thứ 7 (dayOfWeek từ 1 đến 6)
        if (dayOfWeek >= 1 && dayOfWeek <= 6) {
          // Kiểm tra xem đã có lịch cho ngày này chưa
          const existingSchedule = await TechnicianSchedule.findOne({
            technicianId,
            workDate: {
              $gte: new Date(currentDate.setHours(0, 0, 0, 0)),
              $lt: new Date(currentDate.setHours(23, 59, 59, 999)),
            },
          });

          // Nếu chưa có lịch, tạo lịch mới
          if (!existingSchedule) {
            const newSchedule = new TechnicianSchedule({
              technicianId,
              centerId,
              workDate: new Date(currentDate),
              // Sử dụng giá trị mặc định cho shiftStart (8:00) và shiftEnd (17:00)
            });

            await newSchedule.save();

            const populatedSchedule = await TechnicianSchedule.findById(
              newSchedule._id
            )
              .populate("technicianId", "firstName lastName email phoneNumber")
              .populate("centerId", "name address");

            createdSchedules.push(populatedSchedule);
          }
        }

        // Tăng ngày hiện tại lên 1 ngày
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return createdSchedules;
    } catch (error) {
      throw new Error(`Error creating default schedules: ${error.message}`);
    }
  },

  // Create new schedule (giữ lại để tương thích ngược)
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
      const startTime = scheduleData.shiftStart
        ? scheduleData.shiftStart.split(":")
        : ["08", "00"];
      const endTime = scheduleData.shiftEnd
        ? scheduleData.shiftEnd.split(":")
        : ["17", "00"];

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

  // ===== CHỨC NĂNG XIN NGHỈ PHÉP =====

  // Gửi yêu cầu xin nghỉ phép
  requestLeave: async (technicianId, leaveData) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(technicianId)) {
        throw new Error("Invalid technician ID");
      }

      const { startDate, endDate, reason } = leaveData;

      if (!startDate || !endDate || !reason) {
        throw new Error("Start date, end date and reason are required");
      }

      // Chuyển đổi ngày bắt đầu và kết thúc thành đối tượng Date
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      // Kiểm tra ngày bắt đầu phải trước ngày kết thúc
      if (start > end) {
        throw new Error("Start date must be before end date");
      }

      // Tìm tất cả lịch làm việc trong khoảng thời gian xin nghỉ
      const schedules = await TechnicianSchedule.find({
        technicianId,
        workDate: { $gte: start, $lte: end },
      });

      // Nếu không có lịch làm việc nào trong khoảng thời gian này
      if (schedules.length === 0) {
        throw new Error("No work schedules found in the specified date range");
      }

      // Kiểm tra xem có lịch nào đã có yêu cầu nghỉ phép đang chờ duyệt hoặc đã được duyệt
      const hasExistingLeaveRequests = schedules.some(
        (schedule) =>
          schedule.leaveRequest &&
          (schedule.leaveRequest.status === "pending" ||
            schedule.leaveRequest.status === "approved")
      );

      if (hasExistingLeaveRequests) {
        throw new Error(
          "There are already leave requests pending or approved for some of these dates"
        );
      }

      // Cập nhật tất cả lịch làm việc với thông tin xin nghỉ
      const updatedSchedules = [];

      for (const schedule of schedules) {
        schedule.status = "leave_requested";
        schedule.leaveRequest = {
          startDate: start,
          endDate: end,
          reason,
          status: "pending",
          requestedAt: new Date(),
        };

        await schedule.save();

        const updatedSchedule = await TechnicianSchedule.findById(schedule._id)
          .populate("technicianId", "firstName lastName email phoneNumber")
          .populate("centerId", "name address");

        updatedSchedules.push(updatedSchedule);
      }

      return updatedSchedules;
    } catch (error) {
      throw new Error(`Error requesting leave: ${error.message}`);
    }
  },

  // Phê duyệt hoặc từ chối yêu cầu xin nghỉ
  processLeaveRequest: async (scheduleId, managerId, action) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
        throw new Error("Invalid schedule ID");
      }

      if (!mongoose.Types.ObjectId.isValid(managerId)) {
        throw new Error("Invalid manager ID");
      }

      // Kiểm tra action hợp lệ
      if (action !== "approve" && action !== "reject") {
        throw new Error("Invalid action. Must be either 'approve' or 'reject'");
      }

      // Tìm lịch làm việc
      const schedule = await TechnicianSchedule.findById(scheduleId);

      if (!schedule) {
        throw new Error("Schedule not found");
      }

      // Kiểm tra xem có yêu cầu xin nghỉ đang chờ duyệt không
      if (
        !schedule.leaveRequest ||
        schedule.leaveRequest.status !== "pending"
      ) {
        throw new Error("No pending leave request found for this schedule");
      }

      // Cập nhật trạng thái yêu cầu xin nghỉ
      schedule.leaveRequest.status =
        action === "approve" ? "approved" : "rejected";
      schedule.leaveRequest.approvedBy = managerId;
      schedule.leaveRequest.approvedAt = new Date();

      // Nếu phê duyệt, cập nhật trạng thái lịch làm việc
      if (action === "approve") {
        schedule.status = "on_leave";
        schedule.availability = "unavailable";
      } else {
        // Nếu từ chối, đặt lại trạng thái lịch làm việc
        schedule.status = "scheduled";
      }

      await schedule.save();

      // Nếu phê duyệt, cập nhật tất cả các lịch làm việc khác trong khoảng thời gian xin nghỉ
      if (action === "approve") {
        const startDate = schedule.leaveRequest.startDate;
        const endDate = schedule.leaveRequest.endDate;
        const technicianId = schedule.technicianId;

        // Tìm tất cả lịch làm việc khác trong khoảng thời gian này
        const otherSchedules = await TechnicianSchedule.find({
          _id: { $ne: scheduleId },
          technicianId,
          workDate: { $gte: startDate, $lte: endDate },
          "leaveRequest.status": "pending",
        });

        // Cập nhật tất cả lịch làm việc khác
        for (const otherSchedule of otherSchedules) {
          otherSchedule.leaveRequest.status = "approved";
          otherSchedule.leaveRequest.approvedBy = managerId;
          otherSchedule.leaveRequest.approvedAt = new Date();
          otherSchedule.status = "on_leave";
          otherSchedule.availability = "unavailable";

          await otherSchedule.save();
        }
      }

      return await TechnicianSchedule.findById(scheduleId)
        .populate("technicianId", "firstName lastName email phoneNumber")
        .populate("centerId", "name address")
        .populate("leaveRequest.approvedBy", "firstName lastName email");
    } catch (error) {
      throw new Error(`Error processing leave request: ${error.message}`);
    }
  },

  // Lấy danh sách yêu cầu xin nghỉ đang chờ duyệt
  getPendingLeaveRequests: async (centerId = null) => {
    try {
      const query = {
        "leaveRequest.status": "pending",
        status: "leave_requested",
      };

      // Lọc theo trung tâm nếu có
      if (centerId && mongoose.Types.ObjectId.isValid(centerId)) {
        query.centerId = centerId;
      }

      // Lấy tất cả lịch làm việc có yêu cầu xin nghỉ đang chờ duyệt
      const schedules = await TechnicianSchedule.find(query)
        .populate("technicianId", "firstName lastName email phoneNumber")
        .populate("centerId", "name address")
        .sort({ "leaveRequest.requestedAt": -1 });

      // Nhóm các yêu cầu xin nghỉ theo kỹ thuật viên và khoảng thời gian
      const groupedRequests = {};

      schedules.forEach((schedule) => {
        const techId = schedule.technicianId._id.toString();
        const startDate = schedule.leaveRequest.startDate
          .toISOString()
          .split("T")[0];
        const endDate = schedule.leaveRequest.endDate
          .toISOString()
          .split("T")[0];
        const key = `${techId}-${startDate}-${endDate}`;

        if (!groupedRequests[key]) {
          groupedRequests[key] = {
            technicianId: techId,
            technicianName: `${schedule.technicianId.firstName} ${schedule.technicianId.lastName}`,
            startDate: schedule.leaveRequest.startDate,
            endDate: schedule.leaveRequest.endDate,
            reason: schedule.leaveRequest.reason,
            requestedAt: schedule.leaveRequest.requestedAt,
            centerId: schedule.centerId._id,
            centerName: schedule.centerId.name,
            scheduleIds: [],
          };
        }

        groupedRequests[key].scheduleIds.push(schedule._id);
      });

      return Object.values(groupedRequests);
    } catch (error) {
      throw new Error(
        `Error fetching pending leave requests: ${error.message}`
      );
    }
  },

  // Lấy lịch sử xin nghỉ của một kỹ thuật viên
  getLeaveHistory: async (technicianId, status = null) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(technicianId)) {
        throw new Error("Invalid technician ID");
      }

      const query = {
        technicianId,
        leaveRequest: { $exists: true, $ne: null },
      };

      // Lọc theo trạng thái nếu có
      if (status) {
        query["leaveRequest.status"] = status;
      }

      // Lấy tất cả lịch làm việc có thông tin xin nghỉ
      const schedules = await TechnicianSchedule.find(query)
        .populate("centerId", "name address")
        .populate("leaveRequest.approvedBy", "firstName lastName email")
        .sort({ "leaveRequest.requestedAt": -1 });

      // Nhóm các yêu cầu xin nghỉ theo khoảng thời gian
      const groupedHistory = {};

      schedules.forEach((schedule) => {
        if (!schedule.leaveRequest) return;

        const startDate = schedule.leaveRequest.startDate
          .toISOString()
          .split("T")[0];
        const endDate = schedule.leaveRequest.endDate
          .toISOString()
          .split("T")[0];
        const key = `${startDate}-${endDate}-${schedule.leaveRequest.status}`;

        if (!groupedHistory[key]) {
          groupedHistory[key] = {
            startDate: schedule.leaveRequest.startDate,
            endDate: schedule.leaveRequest.endDate,
            reason: schedule.leaveRequest.reason,
            status: schedule.leaveRequest.status,
            requestedAt: schedule.leaveRequest.requestedAt,
            approvedAt: schedule.leaveRequest.approvedAt,
            approvedBy: schedule.leaveRequest.approvedBy,
            scheduleIds: [],
          };
        }

        groupedHistory[key].scheduleIds.push(schedule._id);
      });

      return Object.values(groupedHistory);
    } catch (error) {
      throw new Error(`Error fetching leave history: ${error.message}`);
    }
  },
};

export default technicianScheduleService;
