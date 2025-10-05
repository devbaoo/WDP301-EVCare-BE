import mongoose from "mongoose";

const ChatMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
