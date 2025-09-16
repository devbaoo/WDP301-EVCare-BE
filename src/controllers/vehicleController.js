import vehicleService from "../services/vehicleService.js";

// Thêm xe mới cho customer
const addVehicle = async (req, res) => {
    try {
        const customerId = req.user.id;
        const vehicleData = req.body;

        const result = await vehicleService.addCustomerVehicle(customerId, vehicleData);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data
        });
    } catch (error) {
        console.error("Add vehicle error:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi thêm xe"
        });
    }
};

// Lấy danh sách xe của customer
const getCustomerVehicles = async (req, res) => {
    try {
        const customerId = req.user.id;
        const result = await vehicleService.getCustomerVehicles(customerId);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data
        });
    } catch (error) {
        console.error("Get customer vehicles error:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách xe"
        });
    }
};

// Cập nhật thông tin xe
const updateVehicle = async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const customerId = req.user.id;
        const updateData = req.body;

        const result = await vehicleService.updateVehicle(vehicleId, customerId, updateData);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data
        });
    } catch (error) {
        console.error("Update vehicle error:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật thông tin xe"
        });
    }
};

// Xóa xe
const deleteVehicle = async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const customerId = req.user.id;

        const result = await vehicleService.deleteVehicle(vehicleId, customerId);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message
        });
    } catch (error) {
        console.error("Delete vehicle error:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa xe"
        });
    }
};

// Lấy thông tin chi tiết xe
const getVehicleDetails = async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const customerId = req.user.id;

        const result = await vehicleService.getVehicleDetails(vehicleId, customerId);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data
        });
    } catch (error) {
        console.error("Get vehicle details error:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thông tin xe"
        });
    }
};

export default {
    addVehicle,
    getCustomerVehicles,
    updateVehicle,
    deleteVehicle,
    getVehicleDetails
};
