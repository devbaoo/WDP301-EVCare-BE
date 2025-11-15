import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import jwtConfig from "../config/jwtConfig.js";
import moment from "moment-timezone";
import emailService from "./emailService.js";

const register = async (userData, baseUrl) => {
  const { username, email, password, fullName, phone, address, avatar } =
    userData;

  // Check existing email or username
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    return {
      success: false,
      statusCode: 400,
      message: "Email hoặc username đã được sử dụng",
    };
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = new User({
    username,
    email,
    password: hashedPassword,
    fullName,
    phone,
    address,
    avatar,
    isVerified: false,
  });

  await user.save();

  // Send verification email
  if (baseUrl) {
    const emailResult = await emailService.sendVerificationEmail(user, baseUrl);
    if (!emailResult.success) {
      return {
        success: false,
        statusCode: 500,
        message: "Không thể gửi email xác thực",
      };
    }
  }

  const { accessToken, refreshToken } = generateToken(user);

  return {
    success: true,
    statusCode: 201,
    message: "Đăng ký thành công. Vui lòng xác thực tài khoản qua email.",
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role,
      avatar: user.avatar,
      isVerified: user.isVerified,
    },
  };
};

let login = async (email, password) => {
  console.log("🔐 Login attempt:", { email, passwordLength: password?.length });

  let user = await User.findOne({ email });
  console.log("👤 User found:", user ? "YES" : "NO");

  if (!user) {
    console.log("❌ User not found for email:", email);
    return {
      success: false,
      statusCode: 400,
      message: "Thông tin đăng nhập không hợp lệ",
    };
  }

  console.log("🔑 Comparing password...");
  let isMatch = await bcrypt.compare(password, user.password);
  console.log("🔐 Password match:", isMatch);

  if (!isMatch) {
    console.log("❌ Password mismatch for user:", email);
    return {
      success: false,
      statusCode: 400,
      message: "Thông tin đăng nhập không hợp lệ",
    };
  }

  // Optional: update timestamps automatically

  let { accessToken, refreshToken } = generateToken(user);

  return {
    success: true,
    statusCode: 200,
    message: "Đăng nhập thành công",
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role,
      avatar: user.avatar,
    },
    needVerification: !user.isVerified,
  };
};

let generateToken = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    jwtConfig.secret,
    {
      expiresIn: jwtConfig.expiresIn,
    }
  );

  const refreshToken = jwt.sign({ id: user._id }, jwtConfig.refreshSecret, {
    expiresIn: jwtConfig.refreshExpiresIn,
  });

  return { accessToken, refreshToken };
};

const verifyToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.id) {
      return {
        success: false,
        statusCode: 401,
        message: "Token không chứa ID người dùng",
      };
    }

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return {
        success: false,
        statusCode: 401,
        message: "Không tìm thấy người dùng",
      };
    }

    return {
      success: true,
      statusCode: 200,
      user: {
        id: user._id.toString(),
        role: user.role,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
      },
    };
  } catch (error) {
    console.error("Verify token error:", error);
    return {
      success: false,
      statusCode: 401,
      message: "Token không hợp lệ hoặc đã hết hạn",
    };
  }
};

// Verify user email
const verifyEmailToken = async (token, returnUrl) => {
  const result = await emailService.verifyEmail(token);
  if (result.success && returnUrl) {
    result.returnUrl = returnUrl;
  }
  return result;
};

// Resend verification email
const resendVerificationEmail = async (email, baseUrl) => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return {
        success: false,
        statusCode: 404,
        message: "Không tìm thấy người dùng",
      };
    }
    if (user.isVerified) {
      return {
        success: false,
        statusCode: 400,
        message: "Người dùng đã được xác thực",
      };
    }
    const emailResult = await emailService.sendVerificationEmail(user, baseUrl);
    if (!emailResult.success) {
      return {
        success: false,
        statusCode: 500,
        message: "Không thể gửi email xác thực",
        error: emailResult.error,
      };
    }
    return {
      success: true,
      statusCode: 200,
      message: "Đã gửi email xác thực thành công",
    };
  } catch (error) {
    console.error("Resend verification error:", error);
    return {
      success: false,
      statusCode: 500,
      message: "Lỗi máy chủ",
      error: error.message,
    };
  }
};

// Khởi tạo quá trình reset password
const forgotPassword = async (email, baseUrl) => {
  try {
    // 1. Tìm user (nếu tồn tại) nhưng KHÔNG phản hồi cho client biết
    const user = await User.findOne({ email });

    if (user) {
      // Gửi email reset password (không dùng cooldown trên model)
      const { default: emailService } = await import("./emailService.js");
      await emailService.sendResetPasswordEmail(user, baseUrl);
    }

    // 4. Phản hồi luôn giống nhau (ngay cả khi user không tồn tại)
    return {
      success: true,
      statusCode: 200,
      message: "Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu.",
    };
  } catch (error) {
    console.error("Forgot password error:", error);
    return {
      success: false,
      statusCode: 500,
      message: "Lỗi hệ thống",
      error: error.message,
    };
  }
};

// Thực hiện reset password
const resetPasswordWithToken = async (token, newPassword) => {
  try {
    // Kiểm tra độ mạnh của mật khẩu (tùy chọn)
    if (newPassword.length < 6) {
      return {
        success: false,
        statusCode: 400,
        message: "Mật khẩu phải có ít nhất 6 ký tự",
      };
    }

    const result = await emailService.resetPassword(token, newPassword);
    return result;
  } catch (error) {
    console.error("Reset password error:", error);
    return {
      success: false,
      statusCode: 500,
      message: "Lỗi hệ thống",
      error: error.message,
    };
  }
};

const changePassword = async (userId, oldPassword, newPassword) => {
  try {
    if (!oldPassword || !newPassword) {
      return {
        success: false,
        statusCode: 400,
        message: "Vui lòng nhập đầy đủ mật khẩu cũ và mật khẩu mới",
      };
    }

    if (newPassword.length < 6) {
      return {
        success: false,
        statusCode: 400,
        message: "Mật khẩu mới phải có ít nhất 6 ký tự",
      };
    }

    const user = await User.findById(userId);
    if (!user) {
      return {
        success: false,
        statusCode: 404,
        message: "Không tìm thấy người dùng",
      };
    }

    const isValidPassword = await bcrypt.compare(oldPassword, user.password);
    if (!isValidPassword) {
      return {
        success: false,
        statusCode: 400,
        message: "Mật khẩu cũ không chính xác",
      };
    }

    if (oldPassword === newPassword) {
      return {
        success: false,
        statusCode: 400,
        message: "Mật khẩu mới không được trùng với mật khẩu cũ",
      };
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    return {
      success: true,
      statusCode: 200,
      message: "Mật khẩu đã được thay đổi thành công",
    };
  } catch (error) {
    console.error("Change password error:", error);
    return {
      success: false,
      statusCode: 500,
      message: "Lỗi khi thay đổi mật khẩu",
      error: error.message,
    };
  }
};

const refreshToken = async (refreshToken) => {
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, jwtConfig.refreshSecret);

    // Find user
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return {
        success: false,
        statusCode: 404,
        message: "Không tìm thấy người dùng",
      };
    }

    // Generate new tokens
    const tokens = generateToken(user);

    return {
      success: true,
      statusCode: 200,
      message: "Làm mới token thành công",
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  } catch (error) {
    console.error("Refresh token error:", error);
    return {
      success: false,
      statusCode: 401,
      message: "Refresh token không hợp lệ hoặc đã hết hạn",
    };
  }
};

// Đăng nhập Google với dữ liệu user từ frontend (phù hợp schema hiện tại)
const googleLogin = async (userData) => {
  try {
    const { email, name, picture } = userData;

    if (!email) {
      return {
        success: false,
        statusCode: 400,
        message: "Không lấy được email từ Google",
      };
    }

    // Tìm user theo email
    let user = await User.findOne({ email });

    if (!user) {
      // Nếu chưa có user, tạo mới phù hợp với UserSchema
      const salt = await bcrypt.genSalt(10);
      const randomPassword = Math.random().toString(36).slice(-10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      // Tạo username từ email (trước ký tự @)
      const baseUsername = (email.split("@")[0] || "google_user").toLowerCase();

      user = new User({
        username: baseUsername,
        fullName: name || baseUsername,
        email,
        password: hashedPassword,
        isVerified: true,
        avatar: picture || "",
        role: "customer",
      });

      await user.save();
    } else {
      // Cập nhật thông tin cơ bản nếu còn thiếu
      let changed = false;
      if (!user.fullName && name) {
        user.fullName = name;
        changed = true;
      }
      if (!user.avatar && picture) {
        user.avatar = picture;
        changed = true;
      }
      if (!user.isVerified) {
        user.isVerified = true;
        changed = true;
      }
      if (changed) await user.save();
    }

    // Đăng nhập thành công, tạo token
    const { accessToken, refreshToken } = generateToken(user);

    return {
      success: true,
      statusCode: 200,
      message: "Đăng nhập Google thành công",
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
      needVerification: false,
    };
  } catch (error) {
    console.error("Google login error:", error);
    return {
      success: false,
      statusCode: 500,
      message: "Lỗi server khi đăng nhập Google",
      error: error.message,
    };
  }
};

export default {
  register,
  login,
  generateToken,
  verifyToken,
  verifyEmailToken,
  resendVerificationEmail,
  forgotPassword,
  resetPasswordWithToken,
  changePassword,
  refreshToken,
  googleLogin,
};
