import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import chatService from "./chatService.js";
import User from "../models/user.js";
import ChatMessage from "../models/chatMessage.js";
import Conversation from "../models/conversation.js";
import mongoose from "mongoose";
import notificationService from "./notificationService.js";

dotenv.config();

/**
 * Check if a user can access a conversation
 * @param {string} conversationId - Conversation ID to check
 * @param {string} userId - User ID
 * @param {string} userRole - User role (customer, staff, technician, admin)
 * @returns {Promise<boolean>} - Whether the user can access the conversation
 */
const canUserAccessConversation = async (conversationId, userId, userRole) => {
  try {
    // Admin can access all conversations
    if (userRole === "admin") return true;

    // Check if user is a participant in this conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return false;

    const isParticipant = conversation.participants.some(
      (p) => p.userId.toString() === userId.toString()
    );

    return isParticipant;
  } catch (error) {
    console.error("Error checking conversation access:", error);
    return false;
  }
};

// Map to store online users: { userId: socketId }
const onlineUsers = new Map();

// Map to store user's active rooms
const userRooms = new Map();

// Track user activity for "away" status
const userActivity = new Map();

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
    const userName = socket.user.name || "Anonymous";
    console.log(`User connected: ${userName} (${userId})`);

    // Add user to online users map
    onlineUsers.set(userId.toString(), socket.id);

    // Initialize user's activity tracking
    userActivity.set(userId.toString(), {
      lastActive: Date.now(),
      status: "online",
    });

    // Initialize user's room list if not exists
    if (!userRooms.has(userId.toString())) {
      userRooms.set(userId.toString(), new Set());
    }

    // Find user's conversations and automatically join their rooms
    (async () => {
      try {
        const conversations = await Conversation.find({
          "participants.userId": new mongoose.Types.ObjectId(userId),
        });

        conversations.forEach((conversation) => {
          socket.join(conversation._id.toString());
          userRooms.get(userId.toString()).add(conversation._id.toString());
          console.log(
            `User ${userId} auto-joined conversation: ${conversation._id}`
          );
        });
      } catch (error) {
        console.error("Error auto-joining user conversations:", error);
      }
    })();

    // Broadcast online status update
    io.emit("user_status_changed", {
      userId: userId.toString(),
      name: socket.user.name,
      role: socket.user.role,
      status: "online",
    });

    // Handle joining a conversation
    socket.on("join_conversation", async (conversationId) => {
      try {
        // Check if user has access to this conversation
        const canJoin = await canUserAccessConversation(
          conversationId,
          userId,
          socket.user.role
        );

        if (canJoin) {
          socket.join(conversationId);
          userRooms.get(userId.toString()).add(conversationId);

          // Update user's activity
          userActivity.set(userId.toString(), {
            ...userActivity.get(userId.toString()),
            lastActive: Date.now(),
            currentConversation: conversationId,
          });

          // Notify other participants that user joined
          socket.to(conversationId).emit("user_joined_conversation", {
            userId: userId.toString(),
            name: socket.user.name,
            role: socket.user.role,
            conversationId,
          });

          console.log(
            `User ${userId} (${socket.user.role}) joined conversation: ${conversationId}`
          );

          // Mark messages as read when joining a conversation
          await chatService.markMessagesAsRead(conversationId, userId);

          // Notify others that messages were read
          socket.to(conversationId).emit("messages_read", {
            conversationId,
            userId: userId.toString(),
          });
        } else {
          socket.emit("error", {
            message: "Not authorized to join this conversation",
          });
          console.log(
            `Access denied: User ${userId} (${socket.user.role}) tried to join conversation: ${conversationId}`
          );
        }
      } catch (error) {
        console.error("Error joining conversation:", error);
        socket.emit("error", { message: "Failed to join conversation" });
      }
    });

    // Handle leaving a conversation
    socket.on("leave_conversation", (conversationId) => {
      socket.leave(conversationId);

      // Update user rooms tracking
      const userRoomSet = userRooms.get(userId.toString());
      if (userRoomSet) {
        userRoomSet.delete(conversationId);
      }

      // Update user activity
      const userActivityData = userActivity.get(userId.toString());
      if (
        userActivityData &&
        userActivityData.currentConversation === conversationId
      ) {
        userActivity.set(userId.toString(), {
          ...userActivityData,
          currentConversation: null,
        });
      }

      // Notify others that user left the conversation
      socket.to(conversationId).emit("user_left_conversation", {
        userId: userId.toString(),
        name: socket.user.name,
        conversationId,
      });

      console.log(`User ${userId} left conversation: ${conversationId}`);
    });

    // Handle new messages
    socket.on("send_message", async (data) => {
      try {
        const { conversationId, content, messageType, attachmentUrl } = data;

        // Update user's activity timestamp
        userActivity.set(userId.toString(), {
          ...userActivity.get(userId.toString()),
          lastActive: Date.now(),
        });

        // Create message in database
        const message = await chatService.createMessage(
          conversationId,
          userId,
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
            sentAt: message.sentAt,
            delivered: true,
          },
        });

        // Get conversation to find other participants
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          // Retrieve booking info for notifications
          const bookingId = conversation.bookingId;

          // Notify other participants who are online but not in the conversation room
          for (const participant of conversation.participants) {
            // Skip sender
            if (participant.userId.toString() === userId.toString()) {
              continue;
            }

            // Get participant details
            const participantUser = await User.findById(participant.userId);
            if (!participantUser) continue;

            // Check if participant is online
            const participantSocketId = onlineUsers.get(
              participant.userId.toString()
            );

            // Check if participant is active in this conversation
            const isActiveInConversation = userRooms
              .get(participant.userId.toString())
              ?.has(conversationId);

            if (participantSocketId && !isActiveInConversation) {
              // User is online but not in this conversation - send in-app notification
              io.to(participantSocketId).emit("new_message_notification", {
                conversationId,
                bookingId: bookingId,
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
            } else if (!participantSocketId) {
              // User is offline - send email/push notification if enabled
              try {
                // Check if participant has notifications enabled
                if (participantUser.notificationSettings?.chat?.email) {
                  // Send email notification
                  await notificationService.sendChatNotificationEmail(
                    participantUser.email,
                    {
                      bookingId: bookingId,
                      senderName: socket.user.name,
                      senderRole: socket.user.role,
                      messagePreview:
                        content.length > 50
                          ? `${content.substring(0, 50)}...`
                          : content,
                    }
                  );
                }

                if (
                  participantUser.notificationSettings?.chat?.push &&
                  participantUser.deviceToken
                ) {
                  // Send push notification
                  await notificationService.sendPushNotification(
                    participantUser.deviceToken,
                    `New message from ${socket.user.name}`,
                    content.length > 50
                      ? `${content.substring(0, 50)}...`
                      : content,
                    {
                      type: "chat",
                      conversationId: conversationId.toString(),
                      bookingId: bookingId.toString(),
                    }
                  );
                }
              } catch (notifError) {
                console.error(
                  "Error sending offline notifications:",
                  notifError
                );
              }
            }
          }
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

    // Handle user activity update (for presence awareness)
    socket.on("update_activity", (status) => {
      const validStatuses = ["online", "away", "busy"];
      if (validStatuses.includes(status)) {
        userActivity.set(userId.toString(), {
          ...userActivity.get(userId.toString()),
          lastActive: Date.now(),
          status: status,
        });

        // Broadcast status change to all relevant conversations
        const userRoomSet = userRooms.get(userId.toString());
        if (userRoomSet) {
          userRoomSet.forEach((roomId) => {
            io.to(roomId).emit("user_status_changed", {
              userId: userId.toString(),
              name: socket.user.name,
              role: socket.user.role,
              status: status,
            });
          });
        }
      }
    });

    // Get active participants in a conversation
    socket.on("get_active_participants", async (conversationId) => {
      try {
        const conversation = await Conversation.findById(
          conversationId
        ).populate("participants.userId", "name avatar role");

        if (!conversation) {
          return socket.emit("error", { message: "Conversation not found" });
        }

        // Get online status for all participants
        const participants = conversation.participants.map((p) => {
          const isOnline = onlineUsers.has(p.userId._id.toString());
          const activityData = userActivity.get(p.userId._id.toString());

          return {
            userId: p.userId._id,
            name: p.userId.name,
            avatar: p.userId.avatar,
            role: p.userId.role,
            status: isOnline ? activityData?.status || "online" : "offline",
            lastActive: activityData?.lastActive || null,
          };
        });

        socket.emit("active_participants", {
          conversationId,
          participants,
        });
      } catch (error) {
        console.error("Error getting active participants:", error);
        socket.emit("error", { message: "Failed to get participants" });
      }
    });

    // Handle image/file upload notification
    socket.on(
      "upload_started",
      ({ conversationId, messageId, fileName, fileSize }) => {
        socket.to(conversationId).emit("upload_progress", {
          messageId,
          senderId: userId.toString(),
          fileName,
          fileSize,
          status: "started",
          progress: 0,
        });
      }
    );

    socket.on("upload_progress", ({ conversationId, messageId, progress }) => {
      socket.to(conversationId).emit("upload_progress", {
        messageId,
        senderId: userId.toString(),
        status: "progress",
        progress,
      });
    });

    socket.on("upload_complete", ({ conversationId, messageId, url }) => {
      socket.to(conversationId).emit("upload_progress", {
        messageId,
        senderId: userId.toString(),
        status: "complete",
        url,
      });
    });

    socket.on("upload_error", ({ conversationId, messageId, error }) => {
      socket.to(conversationId).emit("upload_progress", {
        messageId,
        senderId: userId.toString(),
        status: "error",
        error,
      });
    });

    // Handle group chat features
    socket.on("add_participant", async ({ conversationId, participantId }) => {
      try {
        // Check if user has permission to add participants (admin, staff)
        if (!["admin", "staff"].includes(socket.user.role)) {
          return socket.emit("error", {
            message: "Not authorized to add participants",
          });
        }

        // Get participant details
        const participantUser = await User.findById(participantId);
        if (!participantUser) {
          return socket.emit("error", { message: "User not found" });
        }

        // Add participant to conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          return socket.emit("error", { message: "Conversation not found" });
        }

        const added = conversation.addParticipant(
          participantId,
          participantUser.role
        );
        if (!added) {
          return socket.emit("error", {
            message: "User is already in this conversation",
          });
        }

        await conversation.save();

        // Notify all participants about the new member
        io.to(conversationId).emit("participant_added", {
          conversationId,
          participant: {
            userId: participantUser._id,
            name: participantUser.name,
            role: participantUser.role,
            avatar: participantUser.avatar,
          },
          addedBy: {
            userId: socket.user.id,
            name: socket.user.name,
          },
        });

        // If participant is online, add them to the room
        const participantSocketId = onlineUsers.get(participantId.toString());
        if (participantSocketId) {
          const participantSocket = io.sockets.sockets.get(participantSocketId);
          if (participantSocket) {
            participantSocket.join(conversationId);
            userRooms.get(participantId.toString()).add(conversationId);

            // Notify the added user
            participantSocket.emit("added_to_conversation", {
              conversationId,
              bookingId: conversation.bookingId,
              addedBy: {
                userId: socket.user.id,
                name: socket.user.name,
              },
            });
          }
        }
      } catch (error) {
        console.error("Error adding participant:", error);
        socket.emit("error", { message: "Failed to add participant" });
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      const userName = socket.user?.name || "Anonymous";
      console.log(`User disconnected: ${userName} (${userId})`);

      // Remove from online users map
      onlineUsers.delete(userId.toString());

      // Clean up user rooms tracking
      userRooms.delete(userId.toString());

      // Clean up activity tracking
      userActivity.delete(userId.toString());

      // Broadcast offline status to all rooms user was in
      const userRoomSet = userRooms.get(userId.toString());
      if (userRoomSet) {
        userRoomSet.forEach((roomId) => {
          io.to(roomId).emit("user_status_changed", {
            userId: userId.toString(),
            name: socket.user.name,
            status: "offline",
          });
        });
      } else {
        // Global broadcast if no rooms are tracked
        io.emit("user_status_changed", {
          userId: userId.toString(),
          name: socket.user.name,
          status: "offline",
        });
      }
    });
  });

  // Set up periodic activity check for auto-away status
  setInterval(() => {
    const now = Date.now();
    userActivity.forEach((data, userId) => {
      // If user hasn't been active for 5 minutes but is still online, set to away
      if (data.status === "online" && now - data.lastActive > 5 * 60 * 1000) {
        userActivity.set(userId, {
          ...data,
          status: "away",
        });

        // Get socket ID
        const socketId = onlineUsers.get(userId);
        if (socketId) {
          // Broadcast away status to all user's rooms
          const userRoomSet = userRooms.get(userId);
          if (userRoomSet) {
            const user = io.sockets.sockets.get(socketId)?.user;
            if (user) {
              userRoomSet.forEach((roomId) => {
                io.to(roomId).emit("user_status_changed", {
                  userId: userId,
                  name: user.name,
                  role: user.role,
                  status: "away",
                });
              });
            }
          }
        }
      }
    });
  }, 60000); // Check every minute

  console.log("Socket.IO server initialized with enhanced chat features");
};

export default initSocketServer;
