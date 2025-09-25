import User from "../models/user.js";
import moment from "moment-timezone";

// Lấy profile người dùng
const getUserProfile = async (userId) => {
  try {
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return {
        success: false,
        statusCode: 404,
        message: "Không tìm thấy người dùng",
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: "Lấy profile thành công",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        address: user.address,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  } catch (error) {
    console.error("Get user profile error:", error);
    return {
      success: false,
      statusCode: 500,
      message: "Lỗi khi lấy profile",
    };
  }
};

// Cập nhật profile người dùng
const updateUserProfile = async (userId, updateData) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return {
        success: false,
        statusCode: 404,
        message: "Không tìm thấy người dùng",
      };
    }

    // Update allowed fields
    if (updateData.username) user.username = updateData.username;
    if (updateData.fullName) user.fullName = updateData.fullName;
    if (updateData.phone) user.phone = updateData.phone;
    if (updateData.address) user.address = updateData.address;
    if (updateData.avatar) user.avatar = updateData.avatar;

    await user.save();

    return {
      success: true,
      statusCode: 200,
      message: "Cập nhật profile thành công",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        address: user.address,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
    };
  } catch (error) {
    console.error("Update user profile error:", error);
    return {
      success: false,
      statusCode: 500,
      message: "Lỗi khi cập nhật profile",
    };
  }
};
// Xóa mềm user (admin)
const softDeleteUser = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return {
        success: false,
        statusCode: 404,
        message: "Không tìm thấy người dùng",
      };
    }

    user.deleted = true;
    await user.save();

    return {
      success: true,
      statusCode: 200,
      message: "Xóa người dùng thành công",
    };
  } catch (error) {
    console.error("Soft delete user error:", error);
    return {
      success: false,
      statusCode: 500,
      message: "Lỗi khi xóa người dùng",
    };
  }
};

const updateUserRole = async (userId, newRole) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return {
        success: false,
        statusCode: 404,
        message: "Không tìm thấy người dùng",
      };
    }

    // Validate role
    const validRoles = ["customer", "staff", "technician", "admin"];
    if (!validRoles.includes(newRole)) {
      return {
        success: false,
        statusCode: 400,
        message: "Role không hợp lệ",
      };
    }

    user.role = newRole;
    await user.save();

    return {
      success: true,
      statusCode: 200,
      message: "Cập nhật role thành công",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  } catch (error) {
    console.error("Update user role error:", error);
    return {
      success: false,
      statusCode: 500,
      message: "Lỗi khi cập nhật role",
    };
  }
};

// Lấy tất cả người dùng (admin only)
const getAllUsers = async (filters = {}) => {
  try {
    const {
      role,
      search,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    // Build query
    const query = { deleted: { $ne: true } };

    // Filter by role if provided
    if (role) {
      query.role = role;
    }

    // Search by name, email, or username
    if (search) {
      query.$or = [
        { fullName: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
        { username: new RegExp(search, "i") },
      ];
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query with pagination
    const users = await User.find(query)
      .select("-password")
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    return {
      success: true,
      statusCode: 200,
      message: "Lấy danh sách người dùng thành công",
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      },
    };
  } catch (error) {
    console.error("Get all users error:", error);
    return {
      success: false,
      statusCode: 500,
      message: "Lỗi khi lấy danh sách người dùng",
    };
  }
};

// Lấy tất cả nhân viên (staff, technician, admin)
const getAllStaff = async () => {
  try {
    const staff = await User.find({
      role: { $in: ["staff", "technician", "admin"] },
      deleted: { $ne: true },
    }).select("-password");

    return {
      success: true,
      statusCode: 200,
      message: "Lấy danh sách nhân viên thành công",
      staff: staff,
    };
  } catch (error) {
    console.error("Get all staff error:", error);
    return {
      success: false,
      statusCode: 500,
      message: "Lỗi khi lấy danh sách nhân viên",
    };
  }
};

export default {
  getUserProfile,
  updateUserProfile,
  softDeleteUser,
  updateUserRole,
  getAllUsers,
  getAllStaff,
};
