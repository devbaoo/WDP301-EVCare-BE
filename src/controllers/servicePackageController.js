import servicePackageService from "../services/servicePackageService.js";

// Lấy danh sách tất cả gói dịch vụ
const getAllServicePackages = async (req, res) => {
    try {
        const filters = req.query;
        const result = await servicePackageService.getAllServicePackages(filters);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        console.error("Get all service packages error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Lấy chi tiết gói dịch vụ
const getServicePackageById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await servicePackageService.getServicePackageById(id);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        console.error("Get service package by id error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Tạo gói dịch vụ mới (Admin only)
const createServicePackage = async (req, res) => {
    try {
        const packageData = req.body;
        const result = await servicePackageService.createServicePackage(packageData);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        console.error("Create service package error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Cập nhật gói dịch vụ (Admin only)
const updateServicePackage = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const result = await servicePackageService.updateServicePackage(id, updateData);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        console.error("Update service package error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Xóa gói dịch vụ (Admin only)
const deleteServicePackage = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await servicePackageService.deleteServicePackage(id);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
        });
    } catch (error) {
        console.error("Delete service package error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Lấy gói dịch vụ phù hợp với xe
const getCompatiblePackages = async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const result = await servicePackageService.getCompatiblePackages(vehicleId);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        console.error("Get compatible packages error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

export default {
    getAllServicePackages,
    getServicePackageById,
    createServicePackage,
    updateServicePackage,
    deleteServicePackage,
    getCompatiblePackages
};
