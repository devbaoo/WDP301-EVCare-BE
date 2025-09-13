import VehicleModel from "../models/vehicleModel.js";

// Lấy danh sách model xe
const getAllVehicleModels = async (filters = {}) => {
    try {
        const {
            brand,
            search,
            batteryType,
            yearFrom,
            yearTo,
            page = 1,
            limit = 20,
            sortBy = "brand",
            sortOrder = "asc",
        } = filters;

        // Build query
        const query = {};

        if (brand) query.brand = new RegExp(brand, "i");
        if (batteryType) query.batteryType = new RegExp(batteryType, "i");
        if (yearFrom) query.yearFrom = { $gte: yearFrom };
        if (yearTo) query.yearTo = { $lte: yearTo };

        if (search) {
            query.$or = [
                { brand: new RegExp(search, "i") },
                { modelName: new RegExp(search, "i") },
            ];
        }

        // Build sort
        const sort = {};
        sort[sortBy] = sortOrder === "desc" ? -1 : 1;

        // Execute query
        const vehicleModels = await VehicleModel.find(query)
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await VehicleModel.countDocuments(query);

        return {
            success: true,
            statusCode: 200,
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
        };
    } catch (error) {
        console.error("Get all vehicle models error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi lấy danh sách model xe",
        };
    }
};

// Lấy model xe theo ID
const getVehicleModelById = async (id) => {
    try {
        const vehicleModel = await VehicleModel.findById(id);

        if (!vehicleModel) {
            return {
                success: false,
                statusCode: 404,
                message: "Không tìm thấy model xe",
            };
        }

        return {
            success: true,
            statusCode: 200,
            message: "Lấy thông tin model xe thành công",
            data: vehicleModel,
        };
    } catch (error) {
        console.error("Get vehicle model by ID error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi lấy thông tin model xe",
        };
    }
};

// Tạo model xe mới
const createVehicleModel = async (vehicleModelData) => {
    try {
        // Validate required fields
        const requiredFields = ["brand", "modelName", "yearFrom"];
        for (const field of requiredFields) {
            if (!vehicleModelData[field]) {
                return {
                    success: false,
                    statusCode: 400,
                    message: `Thiếu trường bắt buộc: ${field}`,
                };
            }
        }

        // Check if model already exists
        const existingModel = await VehicleModel.findOne({
            brand: vehicleModelData.brand,
            modelName: vehicleModelData.modelName,
        });

        if (existingModel) {
            return {
                success: false,
                statusCode: 400,
                message: "Model xe đã tồn tại",
            };
        }

        const vehicleModel = new VehicleModel(vehicleModelData);
        await vehicleModel.save();

        return {
            success: true,
            statusCode: 201,
            message: "Tạo model xe thành công",
            data: vehicleModel,
        };
    } catch (error) {
        console.error("Create vehicle model error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi tạo model xe",
        };
    }
};

// Cập nhật model xe
const updateVehicleModel = async (id, updateData) => {
    try {
        const vehicleModel = await VehicleModel.findById(id);

        if (!vehicleModel) {
            return {
                success: false,
                statusCode: 404,
                message: "Không tìm thấy model xe",
            };
        }

        // Check if updated model already exists (excluding current model)
        if (updateData.brand || updateData.modelName) {
            const existingModel = await VehicleModel.findOne({
                _id: { $ne: id },
                brand: updateData.brand || vehicleModel.brand,
                modelName: updateData.modelName || vehicleModel.modelName,
            });

            if (existingModel) {
                return {
                    success: false,
                    statusCode: 400,
                    message: "Model xe đã tồn tại",
                };
            }
        }

        // Update fields
        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined) {
                vehicleModel[key] = updateData[key];
            }
        });

        await vehicleModel.save();

        return {
            success: true,
            statusCode: 200,
            message: "Cập nhật model xe thành công",
            data: vehicleModel,
        };
    } catch (error) {
        console.error("Update vehicle model error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi cập nhật model xe",
        };
    }
};

// Xóa model xe
const deleteVehicleModel = async (id) => {
    try {
        const vehicleModel = await VehicleModel.findById(id);

        if (!vehicleModel) {
            return {
                success: false,
                statusCode: 404,
                message: "Không tìm thấy model xe",
            };
        }

        // Check if model is being used by any vehicles
        const Vehicle = (await import("../models/vehicle.js")).default;
        const vehiclesUsingModel = await Vehicle.countDocuments({
            "vehicleInfo.vehicleModel": id,
        });

        if (vehiclesUsingModel > 0) {
            return {
                success: false,
                statusCode: 400,
                message: `Không thể xóa model xe. Đang được sử dụng bởi ${vehiclesUsingModel} xe`,
            };
        }

        await VehicleModel.findByIdAndDelete(id);

        return {
            success: true,
            statusCode: 200,
            message: "Xóa model xe thành công",
        };
    } catch (error) {
        console.error("Delete vehicle model error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi xóa model xe",
        };
    }
};

// Lấy danh sách brand
const getBrands = async () => {
    try {
        const brands = await VehicleModel.distinct("brand");

        return {
            success: true,
            statusCode: 200,
            message: "Lấy danh sách hãng xe thành công",
            data: brands.sort(),
        };
    } catch (error) {
        console.error("Get brands error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi lấy danh sách hãng xe",
        };
    }
};

// Lấy model xe theo brand
const getModelsByBrand = async (brand) => {
    try {
        const models = await VehicleModel.find({ brand })
            .select("modelName yearFrom yearTo batteryType batteryCapacity motorPower")
            .sort({ modelName: 1 });

        return {
            success: true,
            statusCode: 200,
            message: `Lấy danh sách model xe ${brand} thành công`,
            data: models,
        };
    } catch (error) {
        console.error("Get models by brand error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi lấy danh sách model xe theo hãng",
        };
    }
};

// Tạo dữ liệu mẫu
const createSampleData = async () => {
    try {
        const sampleModels = [
            {
                brand: "VinFast",
                modelName: "VF e34",
                yearFrom: 2021,
                yearTo: 2023,
                batteryType: "Li-ion",
                batteryCapacity: 42,
                motorPower: 110,
                maintenanceIntervals: {
                    "10000km": "Bảo dưỡng định kỳ - Kiểm tra pin, hệ thống sạc",
                    "20000km": "Thay dầu hộp số, kiểm tra phanh",
                    "12months": "Kiểm tra toàn diện hệ thống điện"
                }
            },
            {
                brand: "VinFast",
                modelName: "VF e36",
                yearFrom: 2022,
                yearTo: 2024,
                batteryType: "Li-ion",
                batteryCapacity: 90,
                motorPower: 150,
                maintenanceIntervals: {
                    "15000km": "Bảo dưỡng định kỳ - Kiểm tra pin, hệ thống sạc",
                    "30000km": "Thay dầu hộp số, kiểm tra phanh",
                    "12months": "Kiểm tra toàn diện hệ thống điện"
                }
            },
            {
                brand: "Tesla",
                modelName: "Model 3",
                yearFrom: 2020,
                yearTo: 2024,
                batteryType: "Li-ion",
                batteryCapacity: 75,
                motorPower: 283,
                maintenanceIntervals: {
                    "20000km": "Bảo dưỡng định kỳ",
                    "40000km": "Thay dầu hộp số",
                    "24months": "Kiểm tra toàn diện"
                }
            },
            {
                brand: "Tesla",
                modelName: "Model Y",
                yearFrom: 2021,
                yearTo: 2024,
                batteryType: "Li-ion",
                batteryCapacity: 75,
                motorPower: 283,
                maintenanceIntervals: {
                    "20000km": "Bảo dưỡng định kỳ",
                    "40000km": "Thay dầu hộp số",
                    "24months": "Kiểm tra toàn diện"
                }
            },
            {
                brand: "BYD",
                modelName: "Atto 3",
                yearFrom: 2022,
                yearTo: 2024,
                batteryType: "Li-ion",
                batteryCapacity: 60,
                motorPower: 150,
                maintenanceIntervals: {
                    "10000km": "Bảo dưỡng định kỳ",
                    "20000km": "Thay dầu hộp số",
                    "12months": "Kiểm tra hệ thống điện"
                }
            },
            {
                brand: "BYD",
                modelName: "Dolphin",
                yearFrom: 2023,
                yearTo: 2024,
                batteryType: "Li-ion",
                batteryCapacity: 44,
                motorPower: 70,
                maintenanceIntervals: {
                    "10000km": "Bảo dưỡng định kỳ",
                    "20000km": "Thay dầu hộp số",
                    "12months": "Kiểm tra hệ thống điện"
                }
            }
        ];

        // Check if data already exists
        const existingCount = await VehicleModel.countDocuments();
        if (existingCount > 0) {
            return {
                success: false,
                statusCode: 400,
                message: "Dữ liệu mẫu đã tồn tại",
            };
        }

        const createdModels = await VehicleModel.insertMany(sampleModels);

        return {
            success: true,
            statusCode: 201,
            message: "Tạo dữ liệu mẫu thành công",
            data: {
                count: createdModels.length,
                models: createdModels,
            },
        };
    } catch (error) {
        console.error("Create sample data error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi tạo dữ liệu mẫu",
        };
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
