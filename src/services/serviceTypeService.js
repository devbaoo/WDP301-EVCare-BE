import ServiceType from "../models/serviceType.js";

// Lấy danh sách loại dịch vụ
const getAllServiceTypes = async (filters = {}) => {
    try {
        const {
            category,
            status = "active",
            minPrice,
            maxPrice,
            complexity,
            page = 1,
            limit = 10,
            sortBy = "createdAt",
            sortOrder = "desc",
            search,
        } = filters;

        // Build query
        const query = {};

        if (status) query.status = status;
        if (category) query.category = category;
        if (complexity) query["serviceDetails.complexity"] = complexity;
        if (search) {
            query.$or = [
                { name: new RegExp(search, "i") },
                { description: new RegExp(search, "i") },
                { tags: { $in: [new RegExp(search, "i")] } },
            ];
        }

        // Price range filter
        if (minPrice || maxPrice) {
            query["pricing.basePrice"] = {};
            if (minPrice) query["pricing.basePrice"].$gte = minPrice;
            if (maxPrice) query["pricing.basePrice"].$lte = maxPrice;
        }

        // Build sort
        const sort = {};
        sort[sortBy] = sortOrder === "desc" ? -1 : 1;

        // Execute query
        const serviceTypes = await ServiceType.find(query)
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await ServiceType.countDocuments(query);

        return {
            success: true,
            statusCode: 200,
            message: "Lấy danh sách loại dịch vụ thành công",
            data: {
                serviceTypes,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: limit,
                },
            },
        };
    } catch (error) {
        console.error("Get all service types error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi lấy danh sách loại dịch vụ",
        };
    }
};

// Lấy loại dịch vụ theo ID
const getServiceTypeById = async (id) => {
    try {
        const serviceType = await ServiceType.findById(id);

        if (!serviceType) {
            return {
                success: false,
                statusCode: 404,
                message: "Không tìm thấy loại dịch vụ",
            };
        }

        return {
            success: true,
            statusCode: 200,
            message: "Lấy thông tin loại dịch vụ thành công",
            data: serviceType,
        };
    } catch (error) {
        console.error("Get service type by ID error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi lấy thông tin loại dịch vụ",
        };
    }
};

// Tạo loại dịch vụ mới
const createServiceType = async (serviceTypeData) => {
    try {
        // Validate required fields
        const requiredFields = ["name", "category", "serviceDetails", "pricing"];
        for (const field of requiredFields) {
            if (!serviceTypeData[field]) {
                return {
                    success: false,
                    statusCode: 400,
                    message: `Thiếu trường bắt buộc: ${field}`,
                };
            }
        }

        // Check if service type with same name already exists
        const existingService = await ServiceType.findOne({
            name: serviceTypeData.name,
            category: serviceTypeData.category,
        });

        if (existingService) {
            return {
                success: false,
                statusCode: 400,
                message: "Loại dịch vụ với tên này đã tồn tại trong danh mục",
            };
        }

        const serviceType = new ServiceType(serviceTypeData);
        await serviceType.save();

        return {
            success: true,
            statusCode: 201,
            message: "Tạo loại dịch vụ thành công",
            data: serviceType,
        };
    } catch (error) {
        console.error("Create service type error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi tạo loại dịch vụ",
        };
    }
};

// Cập nhật loại dịch vụ
const updateServiceType = async (id, updateData) => {
    try {
        const serviceType = await ServiceType.findById(id);

        if (!serviceType) {
            return {
                success: false,
                statusCode: 404,
                message: "Không tìm thấy loại dịch vụ",
            };
        }

        // Update fields
        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined) {
                serviceType[key] = updateData[key];
            }
        });

        await serviceType.save();

        return {
            success: true,
            statusCode: 200,
            message: "Cập nhật loại dịch vụ thành công",
            data: serviceType,
        };
    } catch (error) {
        console.error("Update service type error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi cập nhật loại dịch vụ",
        };
    }
};

// Xóa loại dịch vụ (soft delete)
const deleteServiceType = async (id) => {
    try {
        const serviceType = await ServiceType.findById(id);

        if (!serviceType) {
            return {
                success: false,
                statusCode: 404,
                message: "Không tìm thấy loại dịch vụ",
            };
        }

        // Soft delete by changing status
        serviceType.status = "inactive";
        await serviceType.save();

        return {
            success: true,
            statusCode: 200,
            message: "Xóa loại dịch vụ thành công",
        };
    } catch (error) {
        console.error("Delete service type error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi xóa loại dịch vụ",
        };
    }
};

// Lấy dịch vụ theo danh mục
const getServiceTypesByCategory = async (category) => {
    try {
        const serviceTypes = await ServiceType.find({
            category,
            status: "active",
        }).sort({ priority: -1, name: 1 });

        return {
            success: true,
            statusCode: 200,
            message: `Lấy danh sách dịch vụ ${category} thành công`,
            data: serviceTypes,
        };
    } catch (error) {
        console.error("Get service types by category error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi lấy danh sách dịch vụ theo danh mục",
        };
    }
};

// Lấy dịch vụ phổ biến
const getPopularServiceTypes = async (limit = 10) => {
    try {
        const serviceTypes = await ServiceType.find({
            status: "active",
            isPopular: true,
        })
            .sort({ "aiData.successRate": -1, "rating.average": -1 })
            .limit(limit);

        return {
            success: true,
            statusCode: 200,
            message: "Lấy danh sách dịch vụ phổ biến thành công",
            data: serviceTypes,
        };
    } catch (error) {
        console.error("Get popular service types error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi lấy danh sách dịch vụ phổ biến",
        };
    }
};

// Tìm kiếm dịch vụ tương thích với xe
const getCompatibleServices = async (vehicleInfo) => {
    try {
        const { brand, model, year, batteryType } = vehicleInfo;

        const query = {
            status: "active",
            $or: [
                { "compatibleVehicles.brand": brand },
                { "compatibleVehicles.model": model },
                { "compatibleVehicles.year": year },
                { "compatibleVehicles.batteryType": batteryType },
            ],
        };

        const serviceTypes = await ServiceType.find(query).sort({
            "rating.average": -1,
            "aiData.successRate": -1,
        });

        return {
            success: true,
            statusCode: 200,
            message: "Lấy danh sách dịch vụ tương thích thành công",
            data: serviceTypes,
        };
    } catch (error) {
        console.error("Get compatible services error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi lấy danh sách dịch vụ tương thích",
        };
    }
};

// Cập nhật dữ liệu AI cho dịch vụ
const updateAIData = async (id, aiData) => {
    try {
        const serviceType = await ServiceType.findById(id);

        if (!serviceType) {
            return {
                success: false,
                statusCode: 404,
                message: "Không tìm thấy loại dịch vụ",
            };
        }

        serviceType.aiData = { ...serviceType.aiData, ...aiData };
        await serviceType.save();

        return {
            success: true,
            statusCode: 200,
            message: "Cập nhật dữ liệu AI thành công",
            data: serviceType,
        };
    } catch (error) {
        console.error("Update AI data error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi cập nhật dữ liệu AI",
        };
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
