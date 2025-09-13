import ServiceCenter from "../models/serviceCenter.js";
import ServiceType from "../models/serviceType.js";

// Lấy danh sách trung tâm dịch vụ
const getAllServiceCenters = async (filters = {}) => {
    try {
        const {
            city,
            district,
            status = "active",
            hasService,
            page = 1,
            limit = 10,
            sortBy = "createdAt",
            sortOrder = "desc",
        } = filters;

        // Build query
        const query = {};

        if (status) query.status = status;
        if (city) query["address.city"] = new RegExp(city, "i");
        if (district) query["address.district"] = new RegExp(district, "i");
        if (hasService) query.services = { $exists: true, $not: { $size: 0 } };

        // Build sort
        const sort = {};
        sort[sortBy] = sortOrder === "desc" ? -1 : 1;

        // Execute query
        const serviceCenters = await ServiceCenter.find(query)
            .populate("services", "name category pricing.basePrice")
            .populate("staff.user", "username fullName email avatar")
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await ServiceCenter.countDocuments(query);

        return {
            success: true,
            statusCode: 200,
            message: "Lấy danh sách trung tâm dịch vụ thành công",
            data: {
                serviceCenters,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: limit,
                },
            },
        };
    } catch (error) {
        console.error("Get all service centers error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi lấy danh sách trung tâm dịch vụ",
        };
    }
};

// Lấy trung tâm dịch vụ theo ID
const getServiceCenterById = async (id) => {
    try {
        const serviceCenter = await ServiceCenter.findById(id)
            .populate("services", "name category pricing.basePrice description")
            .populate("staff.user", "username fullName email avatar role");

        if (!serviceCenter) {
            return {
                success: false,
                statusCode: 404,
                message: "Không tìm thấy trung tâm dịch vụ",
            };
        }

        return {
            success: true,
            statusCode: 200,
            message: "Lấy thông tin trung tâm dịch vụ thành công",
            data: serviceCenter,
        };
    } catch (error) {
        console.error("Get service center by ID error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi lấy thông tin trung tâm dịch vụ",
        };
    }
};

// Tạo trung tâm dịch vụ mới
const createServiceCenter = async (serviceCenterData) => {
    try {
        // Validate required fields
        const requiredFields = ["name", "address", "contact"];
        for (const field of requiredFields) {
            if (!serviceCenterData[field]) {
                return {
                    success: false,
                    statusCode: 400,
                    message: `Thiếu trường bắt buộc: ${field}`,
                };
            }
        }

        // Check if service center with same name already exists
        const existingCenter = await ServiceCenter.findOne({
            name: serviceCenterData.name,
            "address.city": serviceCenterData.address.city,
        });

        if (existingCenter) {
            return {
                success: false,
                statusCode: 400,
                message: "Trung tâm dịch vụ với tên này đã tồn tại trong thành phố",
            };
        }

        const serviceCenter = new ServiceCenter(serviceCenterData);
        await serviceCenter.save();

        return {
            success: true,
            statusCode: 201,
            message: "Tạo trung tâm dịch vụ thành công",
            data: serviceCenter,
        };
    } catch (error) {
        console.error("Create service center error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi tạo trung tâm dịch vụ",
        };
    }
};

// Cập nhật trung tâm dịch vụ
const updateServiceCenter = async (id, updateData) => {
    try {
        const serviceCenter = await ServiceCenter.findById(id);

        if (!serviceCenter) {
            return {
                success: false,
                statusCode: 404,
                message: "Không tìm thấy trung tâm dịch vụ",
            };
        }

        // Update fields
        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined) {
                serviceCenter[key] = updateData[key];
            }
        });

        await serviceCenter.save();

        return {
            success: true,
            statusCode: 200,
            message: "Cập nhật trung tâm dịch vụ thành công",
            data: serviceCenter,
        };
    } catch (error) {
        console.error("Update service center error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi cập nhật trung tâm dịch vụ",
        };
    }
};

// Xóa trung tâm dịch vụ (soft delete)
const deleteServiceCenter = async (id) => {
    try {
        const serviceCenter = await ServiceCenter.findById(id);

        if (!serviceCenter) {
            return {
                success: false,
                statusCode: 404,
                message: "Không tìm thấy trung tâm dịch vụ",
            };
        }

        // Soft delete by changing status
        serviceCenter.status = "inactive";
        await serviceCenter.save();

        return {
            success: true,
            statusCode: 200,
            message: "Xóa trung tâm dịch vụ thành công",
        };
    } catch (error) {
        console.error("Delete service center error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi xóa trung tâm dịch vụ",
        };
    }
};

// Thêm dịch vụ vào trung tâm
const addServiceToCenter = async (centerId, serviceId) => {
    try {
        const serviceCenter = await ServiceCenter.findById(centerId);
        const serviceType = await ServiceType.findById(serviceId);

        if (!serviceCenter) {
            return {
                success: false,
                statusCode: 404,
                message: "Không tìm thấy trung tâm dịch vụ",
            };
        }

        if (!serviceType) {
            return {
                success: false,
                statusCode: 404,
                message: "Không tìm thấy loại dịch vụ",
            };
        }

        // Check if service already exists
        if (serviceCenter.services.includes(serviceId)) {
            return {
                success: false,
                statusCode: 400,
                message: "Dịch vụ đã tồn tại trong trung tâm",
            };
        }

        serviceCenter.services.push(serviceId);
        await serviceCenter.save();

        return {
            success: true,
            statusCode: 200,
            message: "Thêm dịch vụ vào trung tâm thành công",
            data: serviceCenter,
        };
    } catch (error) {
        console.error("Add service to center error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi thêm dịch vụ vào trung tâm",
        };
    }
};

// Thêm nhân viên vào trung tâm
const addStaffToCenter = async (centerId, staffData) => {
    try {
        const serviceCenter = await ServiceCenter.findById(centerId);

        if (!serviceCenter) {
            return {
                success: false,
                statusCode: 404,
                message: "Không tìm thấy trung tâm dịch vụ",
            };
        }

        // Check if staff already exists
        const existingStaff = serviceCenter.staff.find(
            staff => staff.user.toString() === staffData.user
        );

        if (existingStaff) {
            return {
                success: false,
                statusCode: 400,
                message: "Nhân viên đã tồn tại trong trung tâm",
            };
        }

        serviceCenter.staff.push(staffData);
        await serviceCenter.save();

        return {
            success: true,
            statusCode: 200,
            message: "Thêm nhân viên vào trung tâm thành công",
            data: serviceCenter,
        };
    } catch (error) {
        console.error("Add staff to center error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi thêm nhân viên vào trung tâm",
        };
    }
};

// Tìm kiếm trung tâm dịch vụ gần nhất
const findNearestCenters = async (lat, lng, radius = 10) => {
    try {
        const serviceCenters = await ServiceCenter.find({
            status: "active",
            "address.coordinates.lat": {
                $gte: lat - radius / 111, // Approximate km to degrees
                $lte: lat + radius / 111,
            },
            "address.coordinates.lng": {
                $gte: lng - radius / 111,
                $lte: lng + radius / 111,
            },
        })
            .populate("services", "name category pricing.basePrice")
            .populate("staff.user", "username fullName email avatar");

        return {
            success: true,
            statusCode: 200,
            message: "Tìm kiếm trung tâm dịch vụ gần nhất thành công",
            data: serviceCenters,
        };
    } catch (error) {
        console.error("Find nearest centers error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi tìm kiếm trung tâm dịch vụ gần nhất",
        };
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
