import bookingService from "../services/bookingService.js";
import VehicleModel from "../models/vehicleModel.js";

// Lấy danh sách xe của customer
const getCustomerVehicles = async (req, res) => {
    try {
        const customerId = req.user.id;
        const result = await bookingService.getCustomerVehicles(customerId);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        console.error("Get customer vehicles error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// Thêm xe mới cho customer
const addCustomerVehicle = async (req, res) => {
    try {
        const customerId = req.user.id;
        const result = await bookingService.addCustomerVehicle(customerId, req.body);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        console.error("Add customer vehicle error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

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

// Lấy danh sách vehicle models
const getVehicleModels = async (req, res) => {
    try {
        const { brand, search, page = 1, limit = 20 } = req.query;

        let query = {};

        if (brand) {
            query.brand = new RegExp(brand, "i");
        }

        if (search) {
            query.$or = [
                { brand: new RegExp(search, "i") },
                { modelName: new RegExp(search, "i") },
            ];
        }

        const vehicleModels = await VehicleModel.find(query)
            .sort({ brand: 1, modelName: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await VehicleModel.countDocuments(query);

        res.status(200).json({
            success: true,
            message: "Lấy danh sách model xe thành công",
            data: {
                vehicleModels,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: limit,
                },
            },
        });
    } catch (error) {
        console.error("Get vehicle models error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};


export default {
    getCustomerVehicles,
    addCustomerVehicle,
    getVehicleModels,
    getAvailableServiceCenters,
    getCompatibleServices,
    getAvailableSlots,
    createBooking,
    getCustomerBookings,
    cancelBooking,
    rescheduleBooking,
    getBookingDetails,
};
