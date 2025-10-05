import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

/**
 * Notification service for sending various types of notifications
 * including email, push notifications, and in-app notifications
 */
const notificationService = {
  /**
   * Send an email notification for a new chat message
   * @param {string} recipientEmail - Email of the recipient
   * @param {Object} data - Message data including bookingId, senderName, etc.
   * @returns {Promise<Object>} - Result of the email sending operation
   */
  sendChatNotificationEmail: async (recipientEmail, data) => {
    try {
      // Check if email is provided
      if (!recipientEmail) {
        console.error("Recipient email is required");
        return { success: false, message: "Recipient email is required" };
      }

      // Create a test transport if no SMTP settings are available
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === "true",
        auth: {
          user: process.env.EMAIL_USER || "your-email@example.com",
          pass: process.env.EMAIL_PASS || "your-password",
        },
      });

      // Build the email content
      const emailOptions = {
        from: `"EVCare Support" <${
          process.env.EMAIL_USER || "no-reply@evcare.com"
        }>`,
        to: recipientEmail,
        subject: `New message regarding booking #${data.bookingId}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e6e6e6; border-radius: 8px;">
            <h2 style="color: #0066cc;">New message from ${data.senderName}</h2>
            <p>You have received a new message regarding your booking #${
              data.bookingId
            }.</p>
            <div style="background-color: #f5f5f5; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; font-style: italic;">"${
                data.messagePreview
              }"</p>
              <p style="color: #666; font-size: 14px; margin-top: 10px;">- ${
                data.senderName
              } (${data.senderRole})</p>
            </div>
            <p>Login to your EVCare account to view and reply to this message.</p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${
                process.env.FRONTEND_URL || "https://evcare.example.com"
              }/bookings/${data.bookingId}/chat" 
                 style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                View Message
              </a>
            </div>
          </div>
        `,
      };

      // Send the email (log only in development/test environment)
      if (
        process.env.NODE_ENV === "development" ||
        process.env.NODE_ENV === "test"
      ) {
        console.log("Email notification would be sent with:", emailOptions);
        return {
          success: true,
          message: "Email notification logged (dev mode)",
        };
      } else {
        const info = await transporter.sendMail(emailOptions);
        console.log("Email notification sent:", info.messageId);
        return { success: true, messageId: info.messageId };
      }
    } catch (error) {
      console.error("Error sending chat notification email:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Send a push notification
   * @param {string} deviceToken - Device token for push notification
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @param {Object} data - Additional data for the notification
   * @returns {Promise<Object>} - Result of the push notification operation
   */
  sendPushNotification: async (deviceToken, title, body, data = {}) => {
    try {
      // In a real implementation, this would use Firebase Cloud Messaging
      // or another push notification service

      // Log the notification in dev/test environment
      if (
        process.env.NODE_ENV === "development" ||
        process.env.NODE_ENV === "test"
      ) {
        console.log("Push notification would be sent:", {
          deviceToken,
          title,
          body,
          data,
        });
        return {
          success: true,
          message: "Push notification logged (dev mode)",
        };
      }

      // For production, implement actual push notification service
      // Example with Firebase (would require firebase-admin package)
      /*
      const message = {
        notification: {
          title,
          body
        },
        data,
        token: deviceToken
      };
      
      const response = await admin.messaging().send(message);
      return { success: true, messageId: response };
      */

      return { success: true, message: "Push notification placeholder" };
    } catch (error) {
      console.error("Error sending push notification:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Create an in-app notification
   * @param {string} userId - User ID to receive notification
   * @param {string} type - Notification type (chat, booking, system)
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {Object} data - Additional data for the notification
   * @returns {Promise<Object>} - Created notification
   */
  createInAppNotification: async (userId, type, title, message, data = {}) => {
    try {
      // In a real implementation, this would create a record in a Notification model
      // For now, we'll just log it
      console.log("In-app notification would be created:", {
        userId,
        type,
        title,
        message,
        data,
        createdAt: new Date(),
      });

      return {
        success: true,
        notification: {
          id: "placeholder-id",
          userId,
          type,
          title,
          message,
          data,
          isRead: false,
          createdAt: new Date(),
        },
      };
    } catch (error) {
      console.error("Error creating in-app notification:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get unread notifications count for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Count of unread notifications
   */
  getUnreadCount: async (userId) => {
    // Placeholder implementation
    return 0;
  },

  /**
   * Mark notifications as read
   * @param {string} userId - User ID
   * @param {string|Array} notificationIds - Single ID or array of notification IDs to mark as read
   * @returns {Promise<Object>} - Result of the operation
   */
  markAsRead: async (userId, notificationIds) => {
    // Placeholder implementation
    return {
      success: true,
      markedCount: Array.isArray(notificationIds) ? notificationIds.length : 1,
    };
  },
};

export default notificationService;
