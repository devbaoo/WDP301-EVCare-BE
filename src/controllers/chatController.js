import chatService from "../services/chatService.js";

const chatController = {
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
   * @param {Object} req - Express request object with recipientId in body
   * @param {Object} res - Express response object
   */
  startConversation: async (req, res) => {
    try {
      const { recipientId, initialMessage, bookingId } = req.body;
      const senderId = req.user.id;

      if (!recipientId) {
        return res.status(400).json({
          success: false,
          message: "Recipient ID is required",
        });
      }

      const result = await chatService.createOrGetConversation(
        senderId,
        recipientId,
        initialMessage,
        bookingId
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
};

export default chatController;
