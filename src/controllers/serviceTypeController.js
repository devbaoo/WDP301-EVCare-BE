import serviceTypeService from "../services/serviceTypeService.js";

// Lấy danh sách loại dịch vụ
const getAllServiceTypes = async (req, res) => {
    try {
        const filters = req.query;
        const result = await serviceTypeService.getAllServiceTypes(filters);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        console.error("Get all service types error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// Lấy loại dịch vụ theo ID
const getServiceTypeById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await serviceTypeService.getServiceTypeById(id);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        console.error("Get service type by ID error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// Tạo loại dịch vụ mới
const createServiceType = async (req, res) => {
    try {
        const result = await serviceTypeService.createServiceType(req.body);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        console.error("Create service type error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// Cập nhật loại dịch vụ
const updateServiceType = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await serviceTypeService.updateServiceType(id, req.body);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        console.error("Update service type error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// Xóa loại dịch vụ
const deleteServiceType = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await serviceTypeService.deleteServiceType(id);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
        });
    } catch (error) {
        console.error("Delete service type error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// Lấy dịch vụ theo danh mục
const getServiceTypesByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const result = await serviceTypeService.getServiceTypesByCategory(category);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        console.error("Get service types by category error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// Lấy dịch vụ phổ biến
const getPopularServiceTypes = async (req, res) => {
    try {
        const { limit } = req.query;
        const result = await serviceTypeService.getPopularServiceTypes(
            limit ? parseInt(limit) : 10
        );

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        console.error("Get popular service types error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// Tìm kiếm dịch vụ tương thích với xe
const getCompatibleServices = async (req, res) => {
    try {
        const vehicleInfo = req.body;
        const result = await serviceTypeService.getCompatibleServices(vehicleInfo);

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

// Cập nhật dữ liệu AI cho dịch vụ
const updateAIData = async (req, res) => {
    try {
        const { id } = req.params;
        const aiData = req.body;
        const result = await serviceTypeService.updateAIData(id, aiData);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        console.error("Update AI data error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

export default {
    getAllServiceTypes,
    getServiceTypeById,
    createServiceType,
    updateServiceType,
    deleteServiceType,
    getServiceTypesByCategory,
    getPopularServiceTypes,
    getCompatibleServices,
    updateAIData,
};
