import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Gửi email
const sendEmail = async (mailOptions) => {
  try {
    // Gửi email
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("Email sending error:", error);
    throw error;
  }
};

// Template email xác thực
const verificationEmailTemplate = (name, verificationLink) => {
  return {
    subject: "Xác thực tài khoản EVCare của bạn",
    html: `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Xác thực tài khoản EVCare</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        </style>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Inter', Arial, sans-serif; background-color: #f8fafc; line-height: 1.6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden; margin: 0 auto;">
                
                <!-- Header với gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
                    <div style="font-size: 60px; margin-bottom: 20px;">
                      🔋
                    </div>
                    <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 10px 0; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                      EVCare
                    </h1>
                    <p style="color: rgba(255, 255, 255, 0.9); font-size: 16px; margin: 0; font-weight: 500;">
                      Nền tảng quản lý bảo dưỡng xe điện
                    </p>
                  </td>
                </tr>
                
                <!-- Content chính -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1e293b; font-size: 24px; font-weight: 600; margin: 0 0 20px 0; text-align: center;">
                      Chào ${name}! 👋
                    </h2>
                    
                    <div style="background: #1e293b; padding: 30px; border-radius: 12px; margin: 20px 0; border: 1px solid #475569;">
                      <div style="color: #ffffff; font-size: 16px; line-height: 1.8; font-weight: 500;">
                        Chào mừng bạn đến với EVCare - nền tảng quản lý bảo dưỡng xe điện thông minh! Để bắt đầu sử dụng dịch vụ, vui lòng xác thực tài khoản bằng cách nhấp vào nút bên dưới.
                      </div>
                    </div>
                    
                    <!-- Verification info -->
                    <div style="background: #0f766e; padding: 20px; border-radius: 12px; margin: 25px 0; text-align: center; border: 1px solid #14b8a6;">
                      <div style="font-size: 18px; font-weight: 600; color: #ffffff; margin-bottom: 10px;">
                        🔋 Liên kết sẽ hết hạn sau 24 giờ
                      </div>
                      <div style="font-size: 14px; color: #a7f3d0; font-weight: 500;">
                        Hãy xác thực ngay để trải nghiệm dịch vụ bảo dưỡng xe điện chuyên nghiệp!
                      </div>
                    </div>
                    
                    <!-- Call to Action Button -->
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${verificationLink}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); transition: all 0.3s ease;">
                        ✨ Xác thực tài khoản
                      </a>
                    </div>
                    
                    <!-- Features info -->
                    <div style="background: #f0f9ff; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
                      <div style="color: #0c4a6e; font-size: 14px; line-height: 1.6; margin-bottom: 15px;">
                        <strong>🚗 Customer:</strong> theo dõi xe, đặt lịch bảo dưỡng, thanh toán, quản lý lịch sử & chi phí.<br><br>
                        <strong>👥 Staff:</strong> tiếp nhận lịch hẹn, quản lý khách hàng, hỗ trợ giao tiếp.<br><br>
                        <strong>🔧 Technician:</strong> xử lý phiếu dịch vụ, cập nhật trạng thái, quản lý phụ tùng đã dùng.<br><br>
                        <strong>⚡ Admin:</strong> quản lý tài chính, nhân sự, tồn kho phụ tùng, báo cáo doanh thu & AI dự báo phụ tùng.
                      </div>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="color: #64748b; font-size: 14px; margin: 10px 0;">
                      <strong>🔋 EVCare Team</strong><br>
                      Nền tảng số hóa cho trung tâm bảo dưỡng xe điện!
                    </p>
                    
                    <p style="color: #94a3b8; font-size: 12px; margin: 15px 0 0 0; line-height: 1.5;">
                      Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.<br>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };
};

// Template email reset password
const resetPasswordEmailTemplate = (name, resetLink) => {
  return {
    subject: "Đặt lại mật khẩu EVCare của bạn",
    html: `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Đặt lại mật khẩu EVCare</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        </style>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Inter', Arial, sans-serif; background-color: #f8fafc; line-height: 1.6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden; margin: 0 auto;">
                
                <!-- Header với gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 30px; text-align: center;">
                    <div style="font-size: 60px; margin-bottom: 20px;">
                      🔐
                    </div>
                    <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 10px 0; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                      EVCare
                    </h1>
                    <p style="color: rgba(255, 255, 255, 0.9); font-size: 16px; margin: 0; font-weight: 500;">
                      Đặt lại mật khẩu của bạn
                    </p>
                  </td>
                </tr>
                
                <!-- Content chính -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1e293b; font-size: 24px; font-weight: 600; margin: 0 0 20px 0; text-align: center;">
                      Chào ${name}! 👋
                    </h2>
                    
                    <div style="background: #1e293b; padding: 30px; border-radius: 12px; margin: 20px 0; border: 1px solid #475569;">
                      <div style="color: #ffffff; font-size: 16px; line-height: 1.8; font-weight: 500;">
                        Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản EVCare của bạn. Để tiếp tục, vui lòng nhấp vào nút bên dưới để tạo mật khẩu mới.
                      </div>
                    </div>
                    
                    <!-- Reset warning -->
                    <div style="background: #fef2f2; padding: 20px; border-radius: 12px; margin: 25px 0; text-align: center; border: 1px solid #fee2e2;">
                      <div style="font-size: 18px; font-weight: 600; color: #dc2626; margin-bottom: 10px;">
                        ⚠️ Liên kết sẽ hết hạn sau 1 giờ
                      </div>
                      <div style="font-size: 14px; color: #dc2626;">
                        Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này
                      </div>
                    </div>
                    
                    <!-- Call to Action Button -->
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3); transition: all 0.3s ease;">
                        🔄 Đặt lại mật khẩu
                      </a>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="color: #64748b; font-size: 14px; margin: 10px 0;">
                      <strong>🔋 EVCare Team</strong><br>
                      Nền tảng số hóa cho trung tâm bảo dưỡng xe điện!
                    </p>
                    
                    <p style="color: #94a3b8; font-size: 12px; margin: 15px 0 0 0; line-height: 1.5;">
                      Đây là email đặt lại mật khẩu từ EVCare.<br>
                      Mật khẩu của bạn sẽ không thay đổi cho đến khi bạn truy cập liên kết trên.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };
};

export { sendEmail, verificationEmailTemplate, resetPasswordEmailTemplate };