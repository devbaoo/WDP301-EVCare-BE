import Vehicle from "../models/vehicle.js";
import VehicleModel from "../models/vehicleModel.js";

// Lấy danh sách xe của customer
const getCustomerVehicles = async (customerId) => {
    try {
        const vehicles = await Vehicle.find({
            owner: customerId,
            status: "active"
        })
            .populate("vehicleInfo.vehicleModel", "brand modelName batteryType batteryCapacity motorPower maintenanceIntervals")
            .sort({ createdAt: -1 });

        return {
            success: true,
            statusCode: 200,
            message: "Lấy danh sách xe thành công",
            data: vehicles,
        };
    } catch (error) {
        console.error("Get customer vehicles error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi lấy danh sách xe",
        };
    }
};

// Thêm xe mới cho customer
const addCustomerVehicle = async (customerId, vehicleData) => {
    try {
        // Validate required fields
        const requiredFields = ["vehicleInfo"];
        for (const field of requiredFields) {
            if (!vehicleData[field]) {
                return {
                    success: false,
                    statusCode: 400,
                    message: `Thiếu trường bắt buộc: ${field}`,
                };
            }
        }

        // Validate vehicleInfo has required fields
        const { vehicleInfo } = vehicleData;
        if (!vehicleInfo.licensePlate || !vehicleInfo.brand || !vehicleInfo.modelName || !vehicleInfo.year) {
            return {
                success: false,
                statusCode: 400,
                message: "Thiếu thông tin bắt buộc: licensePlate, brand, modelName, year",
            };
        }

        // Check if vehicle already exists
        const existingVehicle = await Vehicle.findOne({
            "vehicleInfo.licensePlate": vehicleInfo.licensePlate,
        });

        if (existingVehicle) {
            return {
                success: false,
                statusCode: 400,
                message: "Biển số xe đã tồn tại trong hệ thống",
            };
        }

        // Find or create VehicleModel
        let vehicleModel = await VehicleModel.findOne({
            brand: vehicleInfo.brand,
            modelName: vehicleInfo.modelName,
            yearFrom: { $lte: vehicleInfo.year },
            yearTo: { $gte: vehicleInfo.year }
        });

        if (!vehicleModel) {
            // Create new VehicleModel
            vehicleModel = new VehicleModel({
                brand: vehicleInfo.brand,
                modelName: vehicleInfo.modelName,
                yearFrom: vehicleInfo.year,
                yearTo: vehicleInfo.year,
                batteryType: vehicleInfo.batteryType || "Li-ion",
                batteryCapacity: vehicleInfo.batteryCapacity || 0,
                motorPower: vehicleInfo.motorPower || 0,
                maintenanceIntervals: {
                    "10000km": "Bảo dưỡng định kỳ - Kiểm tra pin, hệ thống sạc",
                    "20000km": "Thay dầu hộp số, kiểm tra phanh",
                    "6months": "Kiểm tra toàn diện hệ thống điện",
                    "12months": "Bảo dưỡng tổng thể"
                }
            });
            await vehicleModel.save();
            console.log(`Created new vehicle model: ${vehicleInfo.brand} ${vehicleInfo.modelName} ${vehicleInfo.year}`);
        }

        // Create new vehicle
        // Create new vehicle
        const newVehicleData = {
            owner: customerId,
            vehicleInfo: {
                vehicleModel: vehicleModel._id,
                year: vehicleInfo.year,
                color: vehicleInfo.color || "Unknown",
                licensePlate: vehicleInfo.licensePlate
            },
            currentStatus: {
                mileage: vehicleInfo.mileage || 0,
                batteryHealth: vehicleInfo.batteryHealth || 100,
                isActive: true
            },
            status: "active"
        };

        // Only add VIN if provided
        if (vehicleInfo.vin && vehicleInfo.vin.trim() !== '') {
            newVehicleData.vehicleInfo.vin = vehicleInfo.vin;
        }

        const vehicle = new Vehicle(newVehicleData);

        await vehicle.save();
        await vehicle.populate(
            'vehicleInfo.vehicleModel',
            'brand modelName yearFrom yearTo batteryType maintenanceIntervals'
        );

        return {
            success: true,
            statusCode: 201,
            message: "Thêm xe thành công",
            data: vehicle,
        };
    } catch (error) {
        console.error("Add customer vehicle error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi thêm xe",
        };
    }
};

// Cập nhật thông tin xe
const updateVehicle = async (vehicleId, customerId, updateData) => {
    try {
        // Check if vehicle belongs to customer
        const vehicle = await Vehicle.findOne({
            _id: vehicleId,
            owner: customerId
        });

        if (!vehicle) {
            return {
                success: false,
                statusCode: 404,
                message: "Không tìm thấy xe hoặc không có quyền truy cập"
            };
        }

        // Update vehicle
        const updatedVehicle = await Vehicle.findByIdAndUpdate(
            vehicleId,
            {
                $set: updateData,
                updatedAt: new Date()
            },
            { new: true }
        ).populate('vehicleInfo.vehicleModel', 'brand modelName yearFrom yearTo batteryType maintenanceIntervals');

        return {
            success: true,
            statusCode: 200,
            message: "Cập nhật thông tin xe thành công",
            data: updatedVehicle
        };
    } catch (error) {
        console.error("Update vehicle error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi cập nhật thông tin xe"
        };
    }
};

// Xóa xe (soft delete)
const deleteVehicle = async (vehicleId, customerId) => {
    try {
        // Check if vehicle belongs to customer
        const vehicle = await Vehicle.findOne({
            _id: vehicleId,
            owner: customerId
        });

        if (!vehicle) {
            return {
                success: false,
                statusCode: 404,
                message: "Không tìm thấy xe hoặc không có quyền truy cập"
            };
        }

        // Soft delete - mark as inactive
        await Vehicle.findByIdAndUpdate(vehicleId, {
            status: "inactive",
            updatedAt: new Date()
        });

        return {
            success: true,
            statusCode: 200,
            message: "Xóa xe thành công"
        };
    } catch (error) {
        console.error("Delete vehicle error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi xóa xe"
        };
    }
};

// Lấy thông tin chi tiết xe
const getVehicleDetails = async (vehicleId, customerId) => {
    try {
        const vehicle = await Vehicle.findOne({
            _id: vehicleId,
            owner: customerId,
            status: "active"
        }).populate('vehicleInfo.vehicleModel', 'brand modelName yearFrom yearTo batteryType maintenanceIntervals');

        if (!vehicle) {
            return {
                success: false,
                statusCode: 404,
                message: "Không tìm thấy xe"
            };
        }

        return {
            success: true,
            statusCode: 200,
            message: "Lấy thông tin xe thành công",
            data: vehicle
        };
    } catch (error) {
        console.error("Get vehicle details error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi lấy thông tin xe"
        };
    }
};

export default {
    getCustomerVehicles,
    addCustomerVehicle,
    updateVehicle,
    deleteVehicle,
    getVehicleDetails
};
