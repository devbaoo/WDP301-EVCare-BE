import userService from "../services/userService.js";
import cloudinaryService from "../services/cloudinaryService.js";

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const result = await userService.getUserProfile(req.user.id);
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      user: result.user,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const result = await userService.updateUserProfile(req.user.id, req.body);
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      user: result.user,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Upload avatar - simplified version
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided. Please upload a file.",
      });
    }

    // Upload to Cloudinary using the service
    const uploadResult = await cloudinaryService.uploadImage(req.file);

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        message: uploadResult.message,
      });
    }

    // Update user profile with new avatar URL
    const updateResult = await userService.updateUserProfile(req.user.id, {
      avatar: uploadResult.imageUrl,
    });

    if (!updateResult.success) {
      return res.status(500).json({
        success: false,
        message: updateResult.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully",
      user: updateResult.user,
      imageDetails: {
        imageUrl: uploadResult.imageUrl,
        imageId: uploadResult.imageId,
      },
    });
  } catch (error) {
    console.error("Upload avatar error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Delete user (admin only)
const deleteUser = async (req, res) => {
  try {
    const result = await userService.softDeleteUser(req.params.id);
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        message: "UserId và role là bắt buộc",
      });
    }

    const result = await userService.updateUserRole(userId, role);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error("Update user role error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const filters = req.query;
    const result = await userService.getAllUsers(filters);
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get all staff (staff, technician, admin)
const getAllStaff = async (req, res) => {
  try {
    const result = await userService.getAllStaff();
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      staff: result.staff,
    });
  } catch (error) {
    console.error("Get all staff error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export default {
  getUserProfile,
  updateUserProfile,
  uploadAvatar,
  deleteUser,
  updateUserRole,
  getAllUsers,
  getAllStaff,
};
