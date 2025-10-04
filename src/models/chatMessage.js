import mongoose from "mongoose";

const ChatMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String, // Format: "userId1_userId2" (string, not ObjectId)
      required: true,
      maxlength: 50,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    messageType: {
      type: String,
      enum: ["text", "image", "document", "system"],
      default: "text",
    },
    content: {
      type: String,
      required: true,
    },
    attachmentUrl: {
      type: String,
      maxlength: 255,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: false },
  }
);

export default mongoose.model("ChatMessage", ChatMessageSchema);
