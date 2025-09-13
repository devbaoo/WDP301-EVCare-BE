import vehicleModelService from "../services/vehicleModelService.js";

// Lấy danh sách model xe
const getAllVehicleModels = async (req, res) => {
    try {
        const filters = req.query;
        const result = await vehicleModelService.getAllVehicleModels(filters);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        console.error("Get all vehicle models error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// Lấy model xe theo ID
const getVehicleModelById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await vehicleModelService.getVehicleModelById(id);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        console.error("Get vehicle model by ID error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// Tạo model xe mới
const createVehicleModel = async (req, res) => {
    try {
        const result = await vehicleModelService.createVehicleModel(req.body);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        console.error("Create vehicle model error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// Cập nhật model xe
const updateVehicleModel = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await vehicleModelService.updateVehicleModel(id, req.body);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        console.error("Update vehicle model error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// Xóa model xe
const deleteVehicleModel = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await vehicleModelService.deleteVehicleModel(id);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
        });
    } catch (error) {
        console.error("Delete vehicle model error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// Lấy danh sách hãng xe
const getBrands = async (req, res) => {
    try {
        const result = await vehicleModelService.getBrands();

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        console.error("Get brands error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// Lấy model xe theo hãng
const getModelsByBrand = async (req, res) => {
    try {
        const { brand } = req.params;
        const result = await vehicleModelService.getModelsByBrand(brand);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        console.error("Get models by brand error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// Tạo dữ liệu mẫu
const createSampleData = async (req, res) => {
    try {
        const result = await vehicleModelService.createSampleData();

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        console.error("Create sample data error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

export default {
    getAllVehicleModels,
    getVehicleModelById,
    createVehicleModel,
    updateVehicleModel,
    deleteVehicleModel,
    getBrands,
    getModelsByBrand,
    createSampleData,
};
