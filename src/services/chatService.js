import ChatMessage from "../models/chatMessage.js";
import Conversation from "../models/conversation.js";
import User from "../models/user.js";
import mongoose from "mongoose";

const chatService = {
  /**
   * Get bookings that the user can start a chat conversation for
   * @param {string} userId - User ID to get bookings for
   * @param {string} userRole - Role of the requesting user
   * @returns {Promise<Array>} - List of bookings with participants info
   */
  getBookingsForChat: async (userId, userRole = null) => {
    // Get Appointment model
    const Appointment = mongoose.model("Appointment");

    let query = {};

    // Different queries based on user role
    switch (userRole) {
      case "customer":
        // Customers can chat about their own bookings
        query = { customer: new mongoose.Types.ObjectId(userId) };
        break;

      case "staff":
        // Staff can chat about bookings they're assigned to
        query = {
          "inspectionAndQuote.staffId": new mongoose.Types.ObjectId(userId),
        };
        break;

      case "technician":
        // Technicians can chat about bookings they're assigned to
        query = { technician: new mongoose.Types.ObjectId(userId) };
        break;

      case "admin":
        // Admins can see all bookings
        // No additional query needed
        break;

      default:
        throw new Error("Invalid user role");
    }

    // Only include bookings with certain statuses (avoid showing completed/cancelled ones if needed)
    // Adjust the status list according to your business logic
    const relevantStatuses = [
      "pending_confirmation", // thay vì "pending"
      "confirmed",
      "in_progress",
      "inspection_completed",
      "quote_provided",
      "quote_approved",
      "maintenance_in_progress",
      "maintenance_completed",
      "payment_pending",
      "completed",
      // Có thể bỏ qua "cancelled", "rescheduled", "no_show", "quote_rejected"
    ];
    query.status = { $in: relevantStatuses };

    // Populate relevant fields
    console.log("[DEBUG] Query for bookings:", JSON.stringify(query));

    const bookings = await Appointment.find(query)
      .populate("customer", "name")
      .populate("inspectionAndQuote.staffId", "name")
      .populate("technician", "name")
      .populate({
        path: "vehicle",
        select: "vehicleInfo.licensePlate",
        populate: {
          path: "vehicleInfo.vehicleModel",
          select: "brand modelName",
        },
      })
      .populate({
        path: "serviceType",
        select: "name",
      })
      .sort({ "appointmentTime.date": -1 }) // Sort by appointmentTime.date instead of appointmentDate
      .lean();

    console.log("[DEBUG] Raw bookings retrieved:", bookings.length);
    if (bookings.length > 0) {
      // Log detailed info about the first booking to debug populate issues
      const sampleBooking = bookings[0];
      console.log("[DEBUG] Sample booking details:");
      console.log("- ID:", sampleBooking._id);
      console.log(
        "- Customer:",
        sampleBooking.customer ? JSON.stringify(sampleBooking.customer) : "null"
      );
      console.log(
        "- Technician:",
        sampleBooking.technician
          ? JSON.stringify(sampleBooking.technician)
          : "null"
      );
      console.log(
        "- Staff:",
        sampleBooking.inspectionAndQuote?.staffId
          ? JSON.stringify(sampleBooking.inspectionAndQuote.staffId)
          : "null"
      );
      console.log(
        "- Vehicle:",
        sampleBooking.vehicle ? JSON.stringify(sampleBooking.vehicle) : "null"
      );
    }

    // Check which bookings already have conversations
    const bookingIds = bookings.map((booking) => booking._id);
    const existingConversations = await Conversation.find({
      bookingId: { $in: bookingIds },
    }).lean();

    // Create a map of booking IDs to conversation IDs
    const bookingToConversationMap = {};
    existingConversations.forEach((conv) => {
      bookingToConversationMap[conv.bookingId.toString()] = conv._id;
    });

    // Transform data for frontend
    const result = bookings.map((booking) => {
      const bookingId = booking._id.toString();
      const hasConversation = !!bookingToConversationMap[bookingId];

      // Determine other participants based on user role
      let otherParticipants = [];

      if (userRole === "customer") {
        // For customers, show staff and technician
        if (booking.inspectionAndQuote?.staffId) {
          otherParticipants.push({
            userId: booking.inspectionAndQuote.staffId._id,
            name: booking.inspectionAndQuote.staffId.name,
            role: "staff",
          });
        }

        if (booking.technician) {
          otherParticipants.push({
            userId: booking.technician._id,
            name: booking.technician.name,
            role: "technician",
          });
        }

        // If no technician or staff is assigned, add default service center support contact
        if (otherParticipants.length === 0 && booking.serviceCenter) {
          // Add generic service center contact
          otherParticipants.push({
            userId: null,
            name: "Service Support",
            role: "support",
            isDefault: true,
            pendingAssignment: true,
          });
        }
      } else if (userRole === "staff" || userRole === "technician") {
        // For staff/technician, show customer
        if (booking.customer) {
          otherParticipants.push({
            userId: booking.customer._id,
            name: booking.customer.name,
            role: "customer",
          });
        }
      } else if (userRole === "admin") {
        // For admin, show all parties (customer, staff, technician)
        if (booking.customer) {
          otherParticipants.push({
            userId: booking.customer._id,
            name: booking.customer.name,
            role: "customer",
          });
        }

        if (booking.inspectionAndQuote?.staffId) {
          otherParticipants.push({
            userId: booking.inspectionAndQuote.staffId._id,
            name: booking.inspectionAndQuote.staffId.name,
            role: "staff",
          });
        }

        if (booking.technician) {
          otherParticipants.push({
            userId: booking.technician._id,
            name: booking.technician.name,
            role: "technician",
          });
        }
      }

      // Format vehicle info to be more user-friendly
      let formattedVehicle = {};
      if (booking.vehicle) {
        formattedVehicle = {
          id: booking.vehicle._id,
          brand: booking.vehicle.vehicleInfo?.vehicleModel?.brand || "Unknown",
          model:
            booking.vehicle.vehicleInfo?.vehicleModel?.modelName || "Unknown",
          licensePlate: booking.vehicle.vehicleInfo?.licensePlate || "Unknown",
        };
      }

      // Format service type
      let formattedServiceType = null;
      if (booking.serviceType) {
        formattedServiceType = {
          id: booking.serviceType._id,
          name: booking.serviceType.name || "Unknown Service",
        };
      }

      return {
        bookingId: booking._id,
        appointmentDate: booking.appointmentTime?.date, // Sửa thành appointmentTime.date theo đúng schema
        appointmentStartTime: booking.appointmentTime?.startTime,
        status: booking.status,
        serviceType: formattedServiceType,
        vehicle: formattedVehicle,
        hasConversation,
        conversationId: hasConversation
          ? bookingToConversationMap[bookingId]
          : null,
        otherParticipants,
      };
    });

    return result;
  },

  /**
   * Get all conversations for a user
   * @param {string} userId - User ID to get conversations for
   * @param {string} userRole - Role of the requesting user
   * @returns {Promise<Array>} - List of conversations with latest message and participants info
   */
  getConversationsForUser: async (userId, userRole = null) => {
    // Find all conversations where the user is a participant
    const conversations = await Conversation.find({
      "participants.userId": new mongoose.Types.ObjectId(userId),
    })
      .populate("participants.userId", "name role")
      .populate("bookingId", "status")
      .populate({
        path: "bookingId",
        populate: {
          path: "appointmentTime",
        },
      })
      .sort({ updatedAt: -1 });

    // Transform data for frontend
    const result = conversations.map((conv) => {
      // Get participant info
      const currentUserParticipant = conv.participants.find(
        (p) => p.userId._id.toString() === userId.toString()
      );

      return {
        conversationId: conv._id,
        bookingId: conv.bookingId?._id,
        bookingStatus: conv.bookingId?.status,
        bookingDate: conv.bookingId?.appointmentTime?.date,
        participants: conv.participants.map((p) => ({
          userId: p.userId._id,
          name: p.userId.name,
          role: p.userId.role,
        })),
        lastMessage: conv.lastMessage
          ? {
              content: conv.lastMessage.content,
              senderId: conv.lastMessage.senderId,
              sentAt: conv.lastMessage.sentAt,
              messageType: conv.lastMessage.messageType,
            }
          : null,
        unreadCount: currentUserParticipant?.unreadCount || 0,
        updatedAt: conv.updatedAt,
      };
    });

    return result;
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
    // Check if user has access to this conversation
    const conversation = await Conversation.findById(conversationId).populate(
      "participants.userId",
      "name role"
    );
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Check if user is a participant of this conversation
    const isParticipant = conversation.participants.some((p) => {
      // Handle both populated and non-populated userId
      const participantId = p.userId._id
        ? p.userId._id.toString()
        : p.userId.toString();
      return participantId === userId.toString();
    });

    console.log(
      `[DEBUG] Checking user access to conversation: ${conversationId}`
    );
    console.log(
      `[DEBUG] User ID: ${userId}, isParticipant: ${isParticipant}, role: ${userRole}`
    );
    console.log(`[DEBUG] Participants:`, conversation.participants);

    if (!isParticipant && userRole !== "admin") {
      throw new Error("User not authorized to access this conversation");
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get messages with pagination, sorted by most recent first
    const messages = await ChatMessage.find({
      conversationId: new mongoose.Types.ObjectId(conversationId),
    })
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("senderId", "name role")
      .lean();

    // Get total count for pagination info
    const totalCount = await ChatMessage.countDocuments({
      conversationId: new mongoose.Types.ObjectId(conversationId),
    });

    // Mark messages as read - use this instead of chatService to avoid self-reference issues
    await this.markMessagesAsRead(conversationId, userId);

    // Return messages and participants info
    return {
      messages: messages.reverse(), // Reverse to show oldest first
      participants: conversation.participants.map((p) => ({
        userId: p.userId._id || p.userId,
        name: p.userId.name || "Unknown",
        role: p.userId.role || p.role,
      })),
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
   * @param {string} userId - User starting the conversation
   * @param {string} bookingId - Booking ID this conversation is related to
   * @param {string} initialMessage - First message content (optional)
   * @returns {Promise<Object>} - Conversation details with first message
   */
  createOrGetConversation: async (userId, bookingId, initialMessage = null) => {
    // Validate input
    if (!bookingId) {
      throw new Error("Booking ID is required");
    }

    // Check if conversation already exists for this booking
    let conversation = await Conversation.findOne({
      bookingId: new mongoose.Types.ObjectId(bookingId),
    }).populate("participants.userId", "name role");

    if (conversation) {
      // Return existing conversation
      return {
        conversationId: conversation._id,
        bookingId: conversation.bookingId,
        participants: conversation.participants.map((p) => ({
          userId: p.userId._id,
          name: p.userId.name,
          role: p.userId.role,
        })),
        isNew: false,
      };
    }

    // If no conversation exists, create a new one with participants from the booking
    const Appointment = mongoose.model("Appointment");
    const booking = await Appointment.findById(bookingId)
      .populate("customer", "name role")
      .populate("inspectionAndQuote.staffId", "name role")
      .populate("technician", "name role");

    if (!booking) {
      throw new Error("Booking not found");
    }

    // Create new conversation
    conversation = new Conversation({
      bookingId: new mongoose.Types.ObjectId(bookingId),
      participants: [],
    });

    // Add customer to participants
    if (booking.customer) {
      conversation.addParticipant(booking.customer._id, "customer");
    }

    // Add staff to participants if assigned
    if (booking.inspectionAndQuote && booking.inspectionAndQuote.staffId) {
      conversation.addParticipant(
        booking.inspectionAndQuote.staffId._id,
        "staff"
      );
    }

    // Add technician to participants if assigned
    if (booking.technician) {
      conversation.addParticipant(booking.technician._id, "technician");
    }

    // Save the conversation
    await conversation.save();

    // If initial message is provided, create it
    if (initialMessage) {
      const message = await chatService.createMessage(
        conversation._id.toString(),
        userId,
        initialMessage
      );

      // Update conversation with last message
      conversation.updateWithNewMessage(message, userId);
      await conversation.save();
    }

    // Get full participant details
    await conversation.populate("participants.userId", "name role");

    // Return new conversation
    return {
      conversationId: conversation._id,
      bookingId: conversation.bookingId,
      participants: conversation.participants.map((p) => ({
        userId: p.userId._id,
        name: p.userId.name,
        role: p.userId.role,
      })),
      isNew: true,
      message: initialMessage
        ? {
            content: initialMessage,
            sentAt: new Date(),
          }
        : null,
    };
  },

  /**
   * Create a new chat message
   * @param {string} conversationId - Conversation ID
   * @param {string} senderId - Sender user ID
   * @param {string} content - Message content
   * @param {string} messageType - Type of message (text, image, etc.)
   * @param {string} attachmentUrl - URL of attachment (if applicable)
   * @returns {Promise<Object>} - Created message
   */
  createMessage: async (
    conversationId,
    senderId,
    content,
    messageType = "text",
    attachmentUrl = null
  ) => {
    // Validate sender is part of the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const isParticipant = conversation.participants.some(
      (p) => p.userId.toString() === senderId.toString()
    );

    if (!isParticipant) {
      throw new Error("Sender is not a participant of this conversation");
    }

    // Create and save the message
    const message = new ChatMessage({
      conversationId: new mongoose.Types.ObjectId(conversationId),
      senderId: new mongoose.Types.ObjectId(senderId),
      content,
      messageType,
      attachmentUrl,
      sentAt: new Date(),
    });

    await message.save();

    // Update conversation with last message and increment unread count for other participants
    conversation.updateWithNewMessage(message, senderId);
    await conversation.save();

    // Populate sender info
    await message.populate("senderId", "name role");

    return message;
  },

  /**
   * Mark all unread messages in a conversation as read for a specific user
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID marking messages as read
   * @returns {Promise<Object>} - Update result
   */
  markMessagesAsRead: async (conversationId, userId) => {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Mark as read in the conversation model
    const marked = conversation.markAsRead(userId);

    if (marked) {
      await conversation.save();
      return { success: true, unreadCount: 0 };
    }

    return {
      success: false,
      message: "User is not a participant of this conversation",
    };
  },

  /**
   * Get count of all unread messages for a user across all conversations
   * @param {string} userId - User ID to check unread messages for
   * @returns {Promise<number>} - Count of unread messages
   */
  getUnreadMessageCount: async (userId) => {
    const conversations = await Conversation.find({
      "participants.userId": new mongoose.Types.ObjectId(userId),
    });

    let totalUnread = 0;
    conversations.forEach((conversation) => {
      const participant = conversation.participants.find(
        (p) => p.userId.toString() === userId.toString()
      );

      if (participant) {
        totalUnread += participant.unreadCount;
      }
    });

    return totalUnread;
  },

  /**
   * Update participants of a conversation (e.g., when technician is reassigned)
   * @param {string} bookingId - Booking ID to update conversation for
   * @returns {Promise<Object>} - Updated conversation
   */
  updateConversationParticipants: async (bookingId) => {
    // Find conversation for this booking
    const conversation = await Conversation.findOne({
      bookingId: new mongoose.Types.ObjectId(bookingId),
    });

    if (!conversation) {
      // No conversation exists for this booking yet
      return null;
    }

    // Get updated booking info
    const Appointment = mongoose.model("Appointment");
    const booking = await Appointment.findById(bookingId)
      .populate("customer", "name role")
      .populate("inspectionAndQuote.staffId", "name role")
      .populate("technician", "name role");

    if (!booking) {
      throw new Error("Booking not found");
    }

    // Update customer if needed
    if (booking.customer) {
      conversation.addParticipant(booking.customer._id, "customer");
    }

    // Update staff if needed
    if (booking.inspectionAndQuote && booking.inspectionAndQuote.staffId) {
      conversation.addParticipant(
        booking.inspectionAndQuote.staffId._id,
        "staff"
      );
    }

    // Update technician if needed
    if (booking.technician) {
      conversation.addParticipant(booking.technician._id, "technician");
    }

    // Save changes
    await conversation.save();

    return conversation;
  },

  /**
   * Migrate legacy conversations to new format
   * @returns {Promise<Object>} - Migration results
   */
  migrateLegacyConversations: async () => {
    // Get all distinct legacy conversation IDs
    const legacyConvIds = await ChatMessage.distinct("conversationId", {
      conversationId: { $type: "string" }, // Only string type conversation IDs (legacy)
    });

    let migratedCount = 0;
    let errorCount = 0;

    // For each legacy conversation
    for (const legacyId of legacyConvIds) {
      try {
        // Get all messages in this conversation
        const messages = await ChatMessage.find({
          conversationId: legacyId,
        }).sort({ sentAt: 1 });

        if (messages.length === 0) continue;

        // Extract user IDs from legacy format (userId1_userId2)
        const [userId1, userId2] = legacyId.split("_");

        // Check for booking ID in any of the messages
        const bookingId = messages.find((m) => m.bookingId)?.bookingId;

        // Create new conversation
        const conversation = new Conversation({
          bookingId: bookingId || null,
          participants: [],
        });

        // Add participants
        if (userId1) {
          const user1 = await User.findById(userId1);
          if (user1) {
            conversation.addParticipant(user1._id, user1.role);
          }
        }

        if (userId2) {
          const user2 = await User.findById(userId2);
          if (user2) {
            conversation.addParticipant(user2._id, user2.role);
          }
        }

        // Set last message
        const lastMessage = messages[messages.length - 1];
        conversation.lastMessage = {
          content: lastMessage.content,
          messageType: lastMessage.messageType,
          senderId: lastMessage.senderId,
          sentAt: lastMessage.sentAt,
        };

        // Save the conversation
        await conversation.save();

        // Update all messages to point to the new conversation
        await ChatMessage.updateMany(
          { conversationId: legacyId },
          { $set: { conversationId: conversation._id } }
        );

        migratedCount++;
      } catch (error) {
        console.error(`Error migrating conversation ${legacyId}:`, error);
        errorCount++;
      }
    }

    return {
      total: legacyConvIds.length,
      migrated: migratedCount,
      errors: errorCount,
    };
  },

  /**
   * Get conversation by ID
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Object>} - Conversation details
   */
  getConversationById: async (conversationId) => {
    const conversation = await Conversation.findById(conversationId)
      .populate("participants.userId", "name role")
      .populate("bookingId", "status");

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    return conversation;
  },
};

export default chatService;
