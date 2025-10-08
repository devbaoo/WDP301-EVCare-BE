import ServicePackage from "../models/servicePackage.js";
import ServiceType from "../models/serviceType.js";

// Lấy danh sách tất cả gói dịch vụ
const getAllServicePackages = async (filters = {}) => {
    try {
        const { page = 1, limit = 10, isActive = true } = filters;
        const skip = (page - 1) * limit;

        const filter = {};
        if (isActive !== undefined) {
            filter.isActive = isActive === 'true';
        }

        const packages = await ServicePackage.find(filter)
            .populate('includedServices', 'name category pricing')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await ServicePackage.countDocuments(filter);

        return {
            success: true,
            statusCode: 200,
            message: "Lấy danh sách gói dịch vụ thành công",
            data: {
                packages,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                }
            }
        };
    } catch (error) {
        console.error("Get all service packages error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi lấy danh sách gói dịch vụ"
        };
    }
};

// Lấy chi tiết gói dịch vụ
const getServicePackageById = async (packageId) => {
    try {
        const packageData = await ServicePackage.findById(packageId)
            .populate('includedServices', 'name category pricing serviceDetails');

        if (!packageData) {
            return {
                success: false,
                statusCode: 404,
                message: "Không tìm thấy gói dịch vụ"
            };
        }

        return {
            success: true,
            statusCode: 200,
            message: "Lấy chi tiết gói dịch vụ thành công",
            data: packageData
        };
    } catch (error) {
        console.error("Get service package by id error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi lấy chi tiết gói dịch vụ"
        };
    }
};

// Tạo gói dịch vụ mới
const createServicePackage = async (packageData) => {
    try {
        const {
            packageName,
            description,
            durationMonths,
            price,
            includedServices,
            maxServicesPerMonth
        } = packageData;

        // Validate required fields
        if (!packageName || !durationMonths || !price || !includedServices?.length) {
            return {
                success: false,
                statusCode: 400,
                message: "Thiếu thông tin bắt buộc"
            };
        }

        // Validate included services exist
        const services = await ServiceType.find({ _id: { $in: includedServices } });
        if (services.length !== includedServices.length) {
            return {
                success: false,
                statusCode: 400,
                message: "Một số loại dịch vụ không tồn tại"
            };
        }

        const newPackage = new ServicePackage({
            packageName,
            description,
            durationMonths,
            price,
            includedServices,
            maxServicesPerMonth: maxServicesPerMonth || 1
        });

        await newPackage.save();

        // Populate for response
        await newPackage.populate('includedServices', 'name category pricing');

        return {
            success: true,
            statusCode: 201,
            message: "Tạo gói dịch vụ thành công",
            data: newPackage
        };
    } catch (error) {
        console.error("Create service package error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi tạo gói dịch vụ"
        };
    }
};

// Cập nhật gói dịch vụ
const updateServicePackage = async (packageId, updateData) => {
    try {
        // Validate included services if provided
        if (updateData.includedServices) {
            const services = await ServiceType.find({ _id: { $in: updateData.includedServices } });
            if (services.length !== updateData.includedServices.length) {
                return {
                    success: false,
                    statusCode: 400,
                    message: "Một số loại dịch vụ không tồn tại"
                };
            }
        }

        const updatedPackage = await ServicePackage.findByIdAndUpdate(
            packageId,
            updateData,
            { new: true, runValidators: true }
        ).populate('includedServices', 'name category pricing');

        if (!updatedPackage) {
            return {
                success: false,
                statusCode: 404,
                message: "Không tìm thấy gói dịch vụ"
            };
        }

        return {
            success: true,
            statusCode: 200,
            message: "Cập nhật gói dịch vụ thành công",
            data: updatedPackage
        };
    } catch (error) {
        console.error("Update service package error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi cập nhật gói dịch vụ"
        };
    }
};

// Xóa gói dịch vụ
const deleteServicePackage = async (packageId) => {
    try {
        const deletedPackage = await ServicePackage.findByIdAndDelete(packageId);

        if (!deletedPackage) {
            return {
                success: false,
                statusCode: 404,
                message: "Không tìm thấy gói dịch vụ"
            };
        }

        return {
            success: true,
            statusCode: 200,
            message: "Xóa gói dịch vụ thành công"
        };
    } catch (error) {
        console.error("Delete service package error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi xóa gói dịch vụ"
        };
    }
};

// Lấy gói dịch vụ phù hợp với xe
const getCompatiblePackages = async (vehicleId) => {
    try {
        // Get vehicle details
        const Vehicle = (await import("../models/vehicle.js")).default;
        const vehicle = await Vehicle.findById(vehicleId)
            .populate('vehicleInfo.vehicleModel', 'brand modelName batteryType');

        if (!vehicle) {
            return {
                success: false,
                statusCode: 404,
                message: "Không tìm thấy xe"
            };
        }

        // Ensure vehicle model data is present
        const vehicleModel = vehicle?.vehicleInfo?.vehicleModel;
        if (!vehicleModel || typeof vehicleModel !== 'object') {
            return {
                success: false,
                statusCode: 400,
                message: "Xe chưa có thông tin model hoặc model chưa được populate"
            };
        }

        const vehicleBrand = vehicleModel.brand;
        const vehicleModelName = vehicleModel.modelName;

        // Helper normalizers: trim, lowercase; for model remove spaces for looser matching
        const normalize = (s) => (s || "").toString().trim().toLowerCase();
        const normalizeModel = (s) => normalize(s).replace(/\s+/g, "");

        const vehicleBrandKey = normalize(vehicleBrand);
        const vehicleModelKey = normalizeModel(vehicleModelName);

        // Get all active packages
        const packages = await ServicePackage.find({ isActive: true })
            .populate('includedServices', 'name category pricing compatibleVehicles');

        // Filter compatible packages (exact brand+model with normalization)
        let compatiblePackages = packages.filter(pkg => {
            return (pkg.includedServices || []).some(service => {
                const list = service?.compatibleVehicles || [];
                return list.some(cv => {
                    if (!cv) return false;
                    const cvBrandKey = normalize(cv.brand);
                    const cvModelKey = normalizeModel(cv.model);
                    return cvBrandKey === vehicleBrandKey && cvModelKey === vehicleModelKey;
                });
            });
        });

        // Fallback: if no exact brand+model matches, return packages that match brand only
        if ((!compatiblePackages || compatiblePackages.length === 0) && vehicleBrandKey) {
            const brandOnly = packages.filter(pkg => {
                return (pkg.includedServices || []).some(service => {
                    const list = service?.compatibleVehicles || [];
                    return list.some(cv => cv && normalize(cv.brand) === vehicleBrandKey);
                });
            });
            if (brandOnly && brandOnly.length > 0) {
                compatiblePackages = brandOnly;
            }
        }

        return {
            success: true,
            statusCode: 200,
            message: "Lấy gói dịch vụ phù hợp thành công",
            data: compatiblePackages
        };
    } catch (error) {
        console.error("Get compatible packages error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi lấy gói dịch vụ phù hợp"
        };
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
