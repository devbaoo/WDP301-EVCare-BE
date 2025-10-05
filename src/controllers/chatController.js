import chatService from "../services/chatService.js";

const chatController = {
  /**
   * Get bookings that the user can chat about
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getBookingsForChat: async (req, res) => {
    try {
      const userId = req.user.id; // Assuming user info is added by auth middleware
      const userRole = req.user.role; // Get user role for access control

      console.log(
        `[DEBUG] Getting bookings for chat - User: ${userId}, Role: ${userRole}`
      );

      const bookings = await chatService.getBookingsForChat(userId, userRole);

      console.log(`[DEBUG] Found ${bookings.length} bookings for chat`);
      if (bookings.length > 0) {
        bookings.forEach((booking, index) => {
          console.log(
            `[DEBUG] Booking ${index + 1}:`,
            JSON.stringify({
              id: booking.bookingId,
              status: booking.status,
              hasConversation: booking.hasConversation,
              participants: booking.otherParticipants.length,
            })
          );
        });
      }

      return res.status(200).json({
        success: true,
        data: bookings,
        message: "Bookings for chat retrieved successfully",
      });
    } catch (error) {
      console.error("Error retrieving bookings for chat:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Error retrieving bookings for chat",
      });
    }
  },

  /**
   * Get all conversations for a user
   * @param {Object} req - Express request object with userId in params
   * @param {Object} res - Express response object
   */
  getConversations: async (req, res) => {
    try {
      const userId = req.user.id; // Assuming user info is added by auth middleware
      const userRole = req.user.role; // Get user role for access control
      const conversations = await chatService.getConversationsForUser(
        userId,
        userRole
      );

      return res.status(200).json({
        success: true,
        data: conversations,
        message: "Conversations retrieved successfully",
      });
    } catch (error) {
      console.error("Error retrieving conversations:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Error retrieving conversations",
      });
    }
  },

  /**
   * Get messages for a specific conversation
   * @param {Object} req - Express request object with conversationId in params
   * @param {Object} res - Express response object
   */
  getMessages: async (req, res) => {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id; // Needed to check if user has access to conversation
      const userRole = req.user.role; // Get user role for access control
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const messages = await chatService.getMessagesForConversation(
        conversationId,
        userId,
        page,
        limit,
        userRole
      );

      return res.status(200).json({
        success: true,
        data: messages,
        message: "Messages retrieved successfully",
      });
    } catch (error) {
      console.error("Error retrieving messages:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Error retrieving messages",
      });
    }
  },

  /**
   * Start a new conversation
   * @param {Object} req - Express request object with bookingId in body
   * @param {Object} res - Express response object
   */
  startConversation: async (req, res) => {
    try {
      const { bookingId, initialMessage } = req.body;
      const userId = req.user.id;

      if (!bookingId) {
        return res.status(400).json({
          success: false,
          message: "Booking ID is required",
        });
      }

      const result = await chatService.createOrGetConversation(
        userId,
        bookingId,
        initialMessage
      );

      return res.status(201).json({
        success: true,
        data: result,
        message: "Conversation started successfully",
      });
    } catch (error) {
      console.error("Error starting conversation:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Error starting conversation",
      });
    }
  },

  /**
   * Mark messages as read
   * @param {Object} req - Express request object with conversationId in params
   * @param {Object} res - Express response object
   */
  markAsRead: async (req, res) => {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      await chatService.markMessagesAsRead(conversationId, userId);

      return res.status(200).json({
        success: true,
        message: "Messages marked as read",
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Error marking messages as read",
      });
    }
  },

  /**
   * Get unread message count
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getUnreadCount: async (req, res) => {
    try {
      const userId = req.user.id;

      const count = await chatService.getUnreadMessageCount(userId);

      return res.status(200).json({
        success: true,
        data: { count },
        message: "Unread count retrieved successfully",
      });
    } catch (error) {
      console.error("Error getting unread count:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Error getting unread count",
      });
    }
  },

  /**
   * Send a new message
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  sendMessage: async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { content, messageType = "text", attachmentUrl } = req.body;
      const senderId = req.user.id;

      if (!content || !content.trim()) {
        return res.status(400).json({
          success: false,
          message: "Message content is required",
        });
      }

      const result = await chatService.createMessage(
        conversationId,
        senderId,
        content,
        messageType,
        attachmentUrl
      );

      // Real-time Socket.IO notification
      const io = req.app.get("io");
      if (io) {
        const conversation = await chatService.getConversationById(
          conversationId
        );

        const payloadData = {
          conversationId,
          message: result,
          conversation: conversation,
        };

        // Emit to conversation room
        io.to(`conversation:${conversationId}`).emit(
          "chat:new-message",
          payloadData
        );

        // Get peer ID to notify individual user
        const getPeerIdFromConversation = (conversation, senderId) => {
          if (!conversation || !conversation.participants) return null;

          const peer = conversation.participants.find(
            (p) => p.userId.toString() !== senderId.toString()
          );

          return peer ? peer.userId.toString() : null;
        };

        const peerIdToNotify = getPeerIdFromConversation(
          conversation,
          senderId
        );

        if (peerIdToNotify) {
          io.to(`user:${peerIdToNotify}`).emit("chat:new-message", payloadData);
        }
      }

      return res.status(201).json({
        success: true,
        data: result,
        message: "Message sent successfully",
      });
    } catch (error) {
      console.error("Error sending message:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Error sending message",
      });
    }
  },
};

export default chatController;
