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

        const result = await bookingService.getCompatibleServices(vehicleId, serviceCenterId);

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

// Lấy danh sách booking của customer
const getCustomerBookings = async (req, res) => {
    try {
        const customerId = req.user.id;
        const filters = req.query;

        const result = await bookingService.getCustomerBookings(customerId, filters);

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
        const customerId = req.user.id;
        const { reason } = req.body;

        const result = await bookingService.cancelBooking(bookingId, customerId, reason);

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

        const result = await bookingService.rescheduleBooking(bookingId, customerId, {
            newDate,
            newTime,
        });

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

        const result = await bookingService.getBookingDetails(bookingId, customerId);

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
    getCustomerBookings,
    cancelBooking,
    rescheduleBooking,
    getBookingDetails,
};
