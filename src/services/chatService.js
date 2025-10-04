import ChatMessage from "../models/chatMessage.js";
import User from "../models/user.js";
import mongoose from "mongoose";

const chatService = {
  /**
   * Get all conversations for a user
   * @param {string} userId - User ID to get conversations for
   * @param {string} userRole - Role of the requesting user
   * @returns {Promise<Array>} - List of conversations with latest message and recipient info
   */
  getConversationsForUser: async (userId, userRole = null) => {
    let conversationIds = [];

    // Get unique conversation IDs where the user is directly involved
    const directConversationIds = await ChatMessage.distinct("conversationId", {
      $or: [
        { senderId: new mongoose.Types.ObjectId(userId) },
        { recipientId: new mongoose.Types.ObjectId(userId) },
      ],
    });

    conversationIds = [...directConversationIds];

    // If user is a technician, also get conversations related to their bookings
    if (userRole === "technician") {
      // Get all bookings assigned to this technician
      const Appointment = mongoose.model("Appointment");
      const technicianBookings = await Appointment.find({
        technician: new mongoose.Types.ObjectId(userId),
      });

      if (technicianBookings.length > 0) {
        const bookingIds = technicianBookings.map((booking) => booking._id);

        // Find conversations that have these booking IDs
        const bookingRelatedConversations = await ChatMessage.distinct(
          "conversationId",
          {
            bookingId: { $in: bookingIds },
          }
        );

        // Add these conversation IDs to the list (avoid duplicates)
        bookingRelatedConversations.forEach((convId) => {
          if (!conversationIds.includes(convId)) {
            conversationIds.push(convId);
          }
        });
      }
    }

    const conversations = [];

    // For each conversation, get the latest message and other participant info
    for (const convId of conversationIds) {
      // Get latest message in this conversation
      const latestMessage = await ChatMessage.findOne({
        conversationId: convId,
      })
        .sort({ sentAt: -1 })
        .populate("senderId", "name avatar role")
        .populate("recipientId", "name avatar role");

      if (!latestMessage) continue;

      // Determine the other participant (not the current user)
      const otherParticipant =
        String(latestMessage.senderId._id) === String(userId)
          ? latestMessage.recipientId
          : latestMessage.senderId;

      // Get unread message count for this conversation
      const unreadCount = await ChatMessage.countDocuments({
        conversationId: convId,
        recipientId: new mongoose.Types.ObjectId(userId),

        isRead: false,
      });

      conversations.push({
        conversationId: convId,
        participant: otherParticipant,
        lastMessage: {
          content: latestMessage.content,
          messageType: latestMessage.messageType,
          sentAt: latestMessage.sentAt,
          senderId: latestMessage.senderId._id,
          isRead: latestMessage.isRead,
        },
        unreadCount,
      });
    }

    // Sort conversations by the time of the latest message
    conversations.sort((a, b) => b.lastMessage.sentAt - a.lastMessage.sentAt);

    return conversations;
  },

  /**
   * Get messages for a specific conversation with pagination
   * @param {string} conversationId - ID of the conversation to get messages for
   * @param {string} userId - ID of the requesting user (for access control)
   * @param {number} page - Page number for pagination
   * @param {number} limit - Number of messages per page
   * @param {string} userRole - Role of the requesting user
   * @returns {Promise<Object>} - Paginated list of messages
   */
  getMessagesForConversation: async (
    conversationId,
    userId,
    page = 1,
    limit = 20,
    userRole = null
  ) => {
    // First check if user is directly part of this conversation
    let isUserInConversation = await ChatMessage.exists({
      conversationId,
      $or: [
        { senderId: new mongoose.Types.ObjectId(userId) },
        { recipientId: new mongoose.Types.ObjectId(userId) },
      ],
    });

    // If user is not directly in conversation but is a technician, check if they are assigned to the related booking
    if (!isUserInConversation && userRole === "technician") {
      const message = await ChatMessage.findOne({
        conversationId,
        bookingId: { $exists: true, $ne: null },
      });

      if (message && message.bookingId) {
        // Import dynamically to avoid circular dependency
        const Appointment = mongoose.model("Appointment");
        const booking = await Appointment.findOne({
          _id: message.bookingId,
          technician: new mongoose.Types.ObjectId(userId),
        });

        if (booking) {
          isUserInConversation = true;
        }
      }
    }

    if (!isUserInConversation) {
      throw new Error("User not authorized to access this conversation");
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get messages with pagination, sorted by most recent first
    const messages = await ChatMessage.find({ conversationId })
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("senderId", "name avatar role")
      .lean();

    // Get total count for pagination info
    const totalCount = await ChatMessage.countDocuments({ conversationId });

    return {
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    };
  },

  /**
   * Create a new conversation or get existing one
   * @param {string} senderId - User starting the conversation
   * @param {string} recipientId - User to chat with
   * @param {string} initialMessage - First message content (optional)
   * @param {string} bookingId - Optional booking ID to link this conversation
   * @returns {Promise<Object>} - Conversation details with first message
   */
  createOrGetConversation: async (
    senderId,
    recipientId,
    initialMessage,
    bookingId = null
  ) => {
    // Check if users exist
    const [sender, recipient] = await Promise.all([
      User.findById(senderId),
      User.findById(recipientId),
    ]);

    if (!sender || !recipient) {
      throw new Error("One or both users do not exist");
    }

    // Create conversation ID (consistently ordered to ensure uniqueness)
    const participants = [senderId, recipientId].sort();
    const conversationId = `${participants[0]}_${participants[1]}`;

    // Check if conversation already exists
    const existingConversation = await ChatMessage.findOne({ conversationId });

    // If initial message is provided, create it
    let newMessage;
    if (initialMessage) {
      newMessage = new ChatMessage({
        conversationId,
        senderId,
        recipientId,
        bookingId, // Add booking ID if provided
        content: initialMessage,
        messageType: "text",
        isRead: false,
        sentAt: new Date(),
      });

      await newMessage.save();
    }

    return {
      conversationId,
      isNew: !existingConversation,
      message: newMessage
        ? {
            id: newMessage._id,
            content: newMessage.content,
            sentAt: newMessage.sentAt,
          }
        : null,
      participant: {
        id: recipient._id,
        name: recipient.name,
        avatar: recipient.avatar,
        role: recipient.role,
      },
    };
  },

  /**
   * Create a new chat message
   * @param {string} conversationId - Conversation ID
   * @param {string} senderId - Sender user ID
   * @param {string} recipientId - Recipient user ID
   * @param {string} content - Message content
   * @param {string} messageType - Type of message (text, image, etc.)
   * @param {string} attachmentUrl - URL of attachment (if applicable)
   * @param {string} bookingId - Optional booking ID to link this message to
   * @returns {Promise<Object>} - Created message
   */
  createMessage: async (
    conversationId,
    senderId,
    recipientId,
    content,
    messageType = "text",
    attachmentUrl = null,
    bookingId = null
  ) => {
    // If this is the first message for a conversation with bookingId,
    // check if any previous message has bookingId and use that
    let existingBookingId = bookingId;
    if (!existingBookingId) {
      const existingMessage = await ChatMessage.findOne({
        conversationId,
        bookingId: { $exists: true, $ne: null },
      });
      if (existingMessage && existingMessage.bookingId) {
        existingBookingId = existingMessage.bookingId;
      }
    }

    const message = new ChatMessage({
      conversationId,
      senderId,
      recipientId,
      bookingId: existingBookingId,
      content,
      messageType,
      attachmentUrl,
      isRead: false,
      sentAt: new Date(),
    });

    await message.save();

    // Populate sender info
    await message.populate("senderId", "name avatar role");

    return message;
  },

  /**
   * Mark all unread messages in a conversation as read
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID marking messages as read
   * @returns {Promise<Object>} - Update result
   */
  markMessagesAsRead: async (conversationId, userId) => {
    const result = await ChatMessage.updateMany(
      {
        conversationId,

        recipientId: new mongoose.Types.ObjectId(userId),

        isRead: false,
      },
      { isRead: true }
    );

    return result;
  },

  /**
   * Get count of all unread messages for a user
   * @param {string} userId - User ID to check unread messages for
   * @returns {Promise<number>} - Count of unread messages
   */
  getUnreadMessageCount: async (userId) => {
    const count = await ChatMessage.countDocuments({
      recipientId: new mongoose.Types.ObjectId(userId),
      isRead: false,
    });

    return count;
  },
};

export default chatService;
