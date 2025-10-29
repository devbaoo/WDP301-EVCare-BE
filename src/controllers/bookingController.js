import bookingService from "../services/bookingService.js";
import VehicleModel from "../models/vehicleModel.js";

// Lấy danh sách trung tâm dịch vụ có sẵn
const getAvailableServiceCenters = async (req, res) => {
  try {
    const filters = req.query;
    const result = await bookingService.getAvailableServiceCenters(filters);

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("Get available service centers error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Lấy danh sách dịch vụ tương thích với xe
const getCompatibleServices = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { serviceCenterId } = req.query;

    const result = await bookingService.getCompatibleServices(
      vehicleId,
      serviceCenterId
    );

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("Get compatible services error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Lấy lịch trống của trung tâm
const getAvailableSlots = async (req, res) => {
  try {
    const { serviceCenterId, serviceTypeId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Ngày là bắt buộc",
      });
    }

    const result = await bookingService.getAvailableSlots(
      serviceCenterId,
      serviceTypeId,
      date
    );

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("Get available slots error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Tạo booking mới
const createBooking = async (req, res) => {
  try {
    const customerId = req.user.id;
    const bookingData = {
      ...req.body,
      customerId,
    };

    const result = await bookingService.createBooking(bookingData);

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Xác nhận booking (confirm) với confirm gate (yêu cầu upfront đã thanh toán nếu có)
const confirmBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const staffId = req.user.id;
    const result = await bookingService.confirmBooking(bookingId, staffId);
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("Confirm booking error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Lấy các booking đã xác nhận (để đưa vào work-progress)
const getConfirmedBookings = async (req, res) => {
  try {
    const filters = {
      serviceCenterId: req.query.serviceCenterId,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 10),
      sortBy: req.query.sortBy || "createdAt",
      sortOrder: req.query.sortOrder || "desc",
    };

    const result = await bookingService.getConfirmedBookings(filters);
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("Get confirmed bookings error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// Lấy các booking thanh toán offline đang chờ staff xác nhận
const getPendingOfflinePaymentBookings = async (req, res) => {
  try {
    const filters = {
      serviceCenterId: req.query.serviceCenterId,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 10),
      sortBy: req.query.sortBy || "createdAt",
      sortOrder: req.query.sortOrder || "desc",
    };

    const result = await bookingService.getPendingOfflinePaymentBookings(
      filters
    );
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("Get pending offline payment bookings error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Lấy các booking đã thanh toán và chờ xác nhận (admin/staff)
const getPaidAwaitingConfirmation = async (req, res) => {
  try {
    const filters = {
      serviceCenterId: req.query.serviceCenterId,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 10),
      sortBy: req.query.sortBy || "createdAt",
      sortOrder: req.query.sortOrder || "desc",
    };

    const result = await bookingService.getPaidAwaitingConfirmation(filters);
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("Get paid awaiting confirmation error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Lấy danh sách booking của customer
const getCustomerBookings = async (req, res) => {
  try {
    const customerId = req.user.id;
    const filters = req.query;

    const result = await bookingService.getCustomerBookings(
      customerId,
      filters
    );

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("Get customer bookings error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Hủy booking
const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const actingUser = { id: req.user.id, role: req.user.role };
    const { reason } = req.body;

    const result = await bookingService.cancelBooking(
      bookingId,
      actingUser,
      reason
    );

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Dời lịch booking
const rescheduleBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const customerId = req.user.id;
    const newDate = req.body?.newDate ?? req.body?.rescheduleData?.newDate;
    const newTime = req.body?.newTime ?? req.body?.rescheduleData?.newTime;

    const result = await bookingService.rescheduleBooking(
      bookingId,
      customerId,
      {
        newDate,
        newTime,
      }
    );

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("Reschedule booking error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Lấy chi tiết booking
const getBookingDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const customerId = req.user.id;

    const result = await bookingService.getBookingDetails(
      bookingId,
      customerId
    );

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("Get booking details error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export default {
  getAvailableServiceCenters,
  getCompatibleServices,
  getAvailableSlots,
  createBooking,
  confirmBooking,
  getPaidAwaitingConfirmation,
  getPendingOfflinePaymentBookings,
  getConfirmedBookings,
  getCustomerBookings,
  cancelBooking,
  rescheduleBooking,
  getBookingDetails,
};
