import serviceCenterService from "../services/serviceCenterService.js";

// Lấy danh sách trung tâm dịch vụ
const getAllServiceCenters = async (req, res) => {
    try {
        const filters = req.query;
        const result = await serviceCenterService.getAllServiceCenters(filters);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        console.error("Get all service centers error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// Lấy trung tâm dịch vụ theo ID
const getServiceCenterById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await serviceCenterService.getServiceCenterById(id);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        console.error("Get service center by ID error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// Tạo trung tâm dịch vụ mới
const createServiceCenter = async (req, res) => {
    try {
        const result = await serviceCenterService.createServiceCenter(req.body);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        console.error("Create service center error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// Cập nhật trung tâm dịch vụ
const updateServiceCenter = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await serviceCenterService.updateServiceCenter(id, req.body);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        console.error("Update service center error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// Xóa trung tâm dịch vụ
const deleteServiceCenter = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await serviceCenterService.deleteServiceCenter(id);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
        });
    } catch (error) {
        console.error("Delete service center error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// Thêm dịch vụ vào trung tâm
const addServiceToCenter = async (req, res) => {
    try {
        const { id } = req.params;
        const { serviceId } = req.body;

        if (!serviceId) {
            return res.status(400).json({
                success: false,
                message: "Service ID là bắt buộc",
            });
        }

        const result = await serviceCenterService.addServiceToCenter(id, serviceId);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        console.error("Add service to center error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// Thêm nhân viên vào trung tâm
const addStaffToCenter = async (req, res) => {
    try {
        const { id } = req.params;
        const { user, role } = req.body;

        if (!user || !role) {
            return res.status(400).json({
                success: false,
                message: "User ID và role là bắt buộc",
            });
        }

        const staffData = { user, role, isActive: true };
        const result = await serviceCenterService.addStaffToCenter(id, staffData);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        console.error("Add staff to center error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// Tìm kiếm trung tâm dịch vụ gần nhất
const findNearestCenters = async (req, res) => {
    try {
        const { lat, lng, radius } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                message: "Latitude và longitude là bắt buộc",
            });
        }

        const result = await serviceCenterService.findNearestCenters(
            parseFloat(lat),
            parseFloat(lng),
            radius ? parseFloat(radius) : 10
        );

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        console.error("Find nearest centers error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

export default {
    getAllServiceCenters,
    getServiceCenterById,
    createServiceCenter,
    updateServiceCenter,
    deleteServiceCenter,
    addServiceToCenter,
    addStaffToCenter,
    findNearestCenters,
};
