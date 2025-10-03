import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import chatService from "./chatService.js";
import User from "../models/user.js";

dotenv.config();

// Map to store online users: { userId: socketId }
const onlineUsers = new Map();

// Verify JWT token
const verifyToken = async (token) => {
  try {
    if (!token) return null;

    // Remove 'Bearer ' prefix if present
    if (token.startsWith("Bearer ")) {
      token = token.slice(7);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return null;

    return {
      id: user._id,
      name: user.name,
      role: user.role,
    };
  } catch (error) {
    console.error("Socket authentication error:", error);
    return null;
  }
};

/**
 * Initialize Socket.IO server and set up event listeners
 * @param {Object} io - Socket.IO server instance
 */
const initSocketServer = (io) => {
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token || socket.handshake.headers.authorization;
      const user = await verifyToken(token);

      if (!user) {
        return next(new Error("Authentication failed"));
      }

      // Attach user data to socket for later use
      socket.user = user;
      next();
    } catch (error) {
      console.error("Socket middleware error:", error);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user.id;
    console.log(`User connected: ${socket.user.name} (${userId})`);

    // Add user to online users map
    onlineUsers.set(userId.toString(), socket.id);

    // Broadcast online status update
    io.emit("user_status_changed", {
      userId: userId.toString(),
      status: "online",
    });

    // Handle joining a conversation
    socket.on("join_conversation", (conversationId) => {
      socket.join(conversationId);
      console.log(`User ${userId} joined conversation: ${conversationId}`);
    });

    // Handle leaving a conversation
    socket.on("leave_conversation", (conversationId) => {
      socket.leave(conversationId);
      console.log(`User ${userId} left conversation: ${conversationId}`);
    });

    // Handle new messages
    socket.on("send_message", async (data) => {
      try {
        const {
          conversationId,
          recipientId,
          content,
          messageType,
          attachmentUrl,
        } = data;

        // Create message in database
        const message = await chatService.createMessage(
          conversationId,
          userId,
          recipientId,
          content,
          messageType,
          attachmentUrl
        );

        // Broadcast message to conversation room
        io.to(conversationId).emit("receive_message", {
          message: {
            _id: message._id,
            conversationId,
            senderId: {
              _id: socket.user.id,
              name: socket.user.name,
              role: socket.user.role,
            },
            content,
            messageType,
            attachmentUrl,
            isRead: false,
            sentAt: message.sentAt,
          },
        });

        // If recipient is online but not in the conversation room, send notification
        const recipientSocketId = onlineUsers.get(recipientId.toString());
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("new_message_notification", {
            conversationId,
            message: {
              _id: message._id,
              senderId: {
                _id: socket.user.id,
                name: socket.user.name,
                role: socket.user.role,
              },
              content:
                content.length > 30
                  ? `${content.substring(0, 30)}...`
                  : content,
              sentAt: message.sentAt,
            },
          });
        }
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Handle typing indicator
    socket.on("typing", ({ conversationId, isTyping }) => {
      socket.to(conversationId).emit("user_typing", {
        userId: socket.user.id,
        name: socket.user.name,
        isTyping,
      });
    });

    // Handle read receipts
    socket.on("mark_read", async ({ conversationId }) => {
      try {
        await chatService.markMessagesAsRead(conversationId, userId);

        // Broadcast read status to conversation
        socket.to(conversationId).emit("messages_read", {
          conversationId,
          userId,
        });
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.user.name} (${userId})`);

      // Remove from online users map
      onlineUsers.delete(userId.toString());

      // Broadcast offline status
      io.emit("user_status_changed", {
        userId: userId.toString(),
        status: "offline",
      });
    });
  });

  console.log("Socket.IO server initialized");
};

export default initSocketServer;
