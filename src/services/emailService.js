import crypto from "crypto";
import {
  sendEmail,
  verificationEmailTemplate,
  resetPasswordEmailTemplate,
} from "../config/emailConfig.js";
import Token from "../models/token.js";
import User from "../models/user.js";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();

// Tạo token xác thực
const generateVerificationToken = async (userId) => {
  // Tạo token ngẫu nhiên
  const token = crypto.randomBytes(32).toString("hex");

  // Lưu token vào database
  await Token.create({
    userId,
    token,
    type: "verification",
  });

  return token;
};

// Gửi email xác thực tài khoản
const sendVerificationEmail = async (user, baseUrl) => {
  try {
    // Tạo token xác thực
    const token = await generateVerificationToken(user._id);

    const frontendUrl = process.env.FRONTEND_URL || baseUrl;

    // Tạo link xác thực
    const verificationLink = `${frontendUrl}/verify-email/${token}`;

    // Thiết lập thông tin email
    const emailContent = verificationEmailTemplate(
      user.firstName,
      verificationLink
    );

    // Thông tin người nhận
    const mailOptions = {
      from: `"MarxEdu" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
    };

    // Gửi email
    await sendEmail(mailOptions);

    return {
      success: true,
      message: "Email xác thực đã được gửi",
    };
  } catch (error) {
    console.error("Send verification email error:", error);
    return {
      success: false,
      message: "Không thể gửi email xác thực",
      error: error.message,
    };
  }
};

// Xác thực email bằng token
const verifyEmail = async (token) => {
  try {
    // Tìm token trong database
    const verificationToken = await Token.findOne({
      token,
      type: "verification",
    });

    if (!verificationToken) {
      return {
        success: false,
        statusCode: 400,
        message: "Token không hợp lệ hoặc đã hết hạn",
      };
    }

    // Cập nhật trạng thái xác thực của người dùng
    const user = await User.findByIdAndUpdate(
      verificationToken.userId,
      { isVerified: true },
      { new: true }
    );

    if (!user) {
      return {
        success: false,
        statusCode: 404,
        message: "Không tìm thấy người dùng",
      };
    }

    // Xóa token sau khi đã sử dụng
    await Token.findByIdAndDelete(verificationToken._id);

    return {
      success: true,
      statusCode: 200,
      message: "Xác thực email thành công",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isVerified: user.isVerified,
      },
    };
  } catch (error) {
    console.error("Verify email error:", error);
    return {
      success: false,
      statusCode: 500,
      message: "Lỗi hệ thống",
      error: error.message,
    };
  }
};

// Tạo token reset password
const generateResetPasswordToken = async (userId) => {
  // Tạo token ngẫu nhiên
  const token = crypto.randomBytes(32).toString("hex");

  // Lưu token vào database với thời hạn 1 giờ
  await Token.create({
    userId,
    token,
    type: "reset-password",
  });

  return token;
};

// Gửi email reset password
const sendResetPasswordEmail = async (user, baseUrl) => {
  try {
    // Tạo token reset password
    const token = await generateResetPasswordToken(user._id);

    const frontendUrl = process.env.FRONTEND_URL || baseUrl;

    // Tạo link reset password
    const resetLink = `${frontendUrl}/reset-password/${token}`;

    // Thiết lập thông tin email
    const emailContent = resetPasswordEmailTemplate(user.firstName, resetLink);

    // Thông tin người nhận
    const mailOptions = {
      from: `"MarxEdu" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
    };

    // Gửi email
    await sendEmail(mailOptions);

    return {
      success: true,
      message: "Email đặt lại mật khẩu đã được gửi",
    };
  } catch (error) {
    console.error("Send reset password email error:", error);
    return {
      success: false,
      message: "Không thể gửi email đặt lại mật khẩu",
      error: error.message,
    };
  }
};

// Xác thực token reset password và cập nhật mật khẩu
const resetPassword = async (token, newPassword) => {
  try {
    // Tìm token trong database
    const resetToken = await Token.findOne({
      token,
      type: "reset-password",
    });

    if (!resetToken) {
      return {
        success: false,
        statusCode: 400,
        message: "Token không hợp lệ hoặc đã hết hạn",
      };
    }

    // Mã hóa mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Cập nhật mật khẩu người dùng
    const user = await User.findByIdAndUpdate(
      resetToken.userId,
      { password: hashedPassword },
      { new: true }
    );

    if (!user) {
      return {
        success: false,
        statusCode: 404,
        message: "Không tìm thấy người dùng",
      };
    }

    // Xóa token sau khi đã sử dụng
    await Token.findByIdAndDelete(resetToken._id);

    return {
      success: true,
      statusCode: 200,
      message: "Đặt lại mật khẩu thành công",
    };
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

// Gửi email xác nhận booking
const sendBookingConfirmation = async (appointment) => {
  try {
    const customer = appointment.customer;
    const vehicle = appointment.vehicle;
    const serviceCenter = appointment.serviceCenter;
    const serviceType = appointment.serviceType;

    const appointmentDate = new Date(appointment.appointmentTime.date).toLocaleDateString('vi-VN');
    const appointmentTime = appointment.appointmentTime.startTime;

    // Tạo nội dung email
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">EVCare</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Xác nhận đặt lịch bảo dưỡng</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Xin chào ${customer.fullName || customer.username}!</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Cảm ơn bạn đã đặt lịch bảo dưỡng tại EVCare. Chúng tôi đã nhận được yêu cầu của bạn và đang xử lý.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #333; margin-bottom: 15px;">Thông tin đặt lịch</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; width: 120px;">Xe:</td>
                <td style="padding: 8px 0; color: #333; font-weight: 500;">${vehicle.vehicleInfo.vehicleModel.brand} ${vehicle.vehicleInfo.vehicleModel.modelName} ${vehicle.vehicleInfo.year}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Biển số:</td>
                <td style="padding: 8px 0; color: #333; font-weight: 500;">${vehicle.vehicleInfo.licensePlate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Dịch vụ:</td>
                <td style="padding: 8px 0; color: #333; font-weight: 500;">${serviceType.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Trung tâm:</td>
                <td style="padding: 8px 0; color: #333; font-weight: 500;">${serviceCenter.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Ngày:</td>
                <td style="padding: 8px 0; color: #333; font-weight: 500;">${appointmentDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Giờ:</td>
                <td style="padding: 8px 0; color: #333; font-weight: 500;">${appointmentTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Trạng thái:</td>
                <td style="padding: 8px 0; color: #ff9800; font-weight: 500;">Chờ xác nhận</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #1976d2; font-weight: 500;">
              📞 Liên hệ: ${serviceCenter.contact.phone} | ${serviceCenter.contact.email}
            </p>
            <p style="margin: 5px 0 0 0; color: #1976d2;">
              📍 Địa chỉ: ${serviceCenter.address.street}, ${serviceCenter.address.ward}, ${serviceCenter.address.district}, ${serviceCenter.address.city}
            </p>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Trung tâm sẽ liên hệ với bạn trong vòng 24 giờ để xác nhận lịch hẹn. 
            Vui lòng giữ điện thoại để nhận cuộc gọi xác nhận.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'https://evcare.com'}/my-bookings" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
              Xem lịch hẹn của tôi
            </a>
          </div>
        </div>
        
        <div style="background: #f1f3f4; padding: 20px; text-align: center; color: #666; font-size: 14px;">
          <p style="margin: 0;">© 2024 EVCare. Tất cả quyền được bảo lưu.</p>
          <p style="margin: 5px 0 0 0;">Hệ thống quản lý bảo dưỡng xe điện thông minh</p>
        </div>
      </div>
    `;

    // Thông tin người nhận
    const mailOptions = {
      from: `"EVCare" <${process.env.EMAIL_USER}>`,
      to: customer.email,
      subject: `Xác nhận đặt lịch bảo dưỡng - ${appointmentDate} ${appointmentTime}`,
      html: emailContent,
    };

    // Gửi email
    await sendEmail(mailOptions);

    return {
      success: true,
      message: "Email xác nhận booking đã được gửi",
    };
  } catch (error) {
    console.error("Send booking confirmation email error:", error);
    return {
      success: false,
      message: "Không thể gửi email xác nhận booking",
      error: error.message,
    };
  }
};

export default {
  sendVerificationEmail,
  verifyEmail,
  sendResetPasswordEmail,
  resetPassword,
  sendBookingConfirmation,
};
