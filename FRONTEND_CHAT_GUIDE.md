# Frontend Chat Implementation Guide

## Tổng quan

Hệ thống chat trong EVCare cho phép khách hàng, nhân viên và kỹ thuật viên trao đổi về các booking/appointment. Mỗi cuộc trò chuyện được liên kết với một booking cụ thể.

## Kiến trúc Chat System

### 1. Models chính:

- **Conversation**: Đại diện cho một cuộc trò chuyện liên quan đến một booking
- **ChatMessage**: Các tin nhắn trong conversation

### 2. Participants (Người tham gia):

- **Customer**: Khách hàng đặt lịch
- **Staff**: Nhân viên thực hiện inspection & quote
- **Technician**: Kỹ thuật viên thực hiện maintenance
- **Admin**: Quản trị viên (có thể xem tất cả)

## API Endpoints

### Base URL: `/api/chat`

### 1. **GET /api/chat/bookings**

Lấy danh sách bookings mà user có thể chat

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "bookingId": "674015c4f6f123456789abcd",
      "appointmentDate": "2024-11-23",
      "appointmentStartTime": "09:00",
      "status": "confirmed",
      "serviceType": {
        "id": "673def123456789abcdef12",
        "name": "General Maintenance"
      },
      "vehicle": {
        "id": "673def123456789abcdef34",
        "brand": "Toyota",
        "model": "Camry",
        "licensePlate": "30A-12345"
      },
      "hasConversation": true,
      "conversationId": "674015c4f6f123456789abef",
      "otherParticipants": [
        {
          "userId": "673def123456789abcdef56",
          "name": "John Staff",
          "role": "staff"
        }
      ]
    }
  ],
  "message": "Bookings for chat retrieved successfully"
}
```

### 2. **GET /api/chat/conversations**

Lấy danh sách conversations của user

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "conversationId": "674015c4f6f123456789abef",
      "bookingId": "674015c4f6f123456789abcd",
      "bookingStatus": "confirmed",
      "bookingDate": "2024-11-23",
      "participants": [
        {
          "userId": "673def123456789abcdef56",
          "name": "John Customer",
          "role": "customer"
        },
        {
          "userId": "673def123456789abcdef78",
          "name": "Jane Staff",
          "role": "staff"
        }
      ],
      "lastMessage": {
        "content": "Hi, I have a question about the service.",
        "senderId": "673def123456789abcdef56",
        "sentAt": "2024-11-22T10:30:00.000Z",
        "messageType": "text"
      },
      "unreadCount": 2,
      "updatedAt": "2024-11-22T10:30:00.000Z"
    }
  ],
  "message": "Conversations retrieved successfully"
}
```

### 3. **GET /api/chat/conversations/:conversationId/messages**

Lấy messages trong một conversation

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `page` (optional): Trang hiện tại (default: 1)
- `limit` (optional): Số messages per page (default: 20)

**Response:**

```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "_id": "674015c4f6f123456789ab01",
        "conversationId": "674015c4f6f123456789abef",
        "senderId": {
          "_id": "673def123456789abcdef56",
          "name": "John Customer",
          "role": "customer"
        },
        "messageType": "text",
        "content": "Hi, I have a question about the service.",
        "attachmentUrl": null,
        "sentAt": "2024-11-22T10:30:00.000Z"
      }
    ],
    "participants": [
      {
        "userId": "673def123456789abcdef56",
        "name": "John Customer",
        "role": "customer"
      },
      {
        "userId": "673def123456789abcdef78",
        "name": "Jane Staff",
        "role": "staff"
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 20,
      "pages": 2
    }
  },
  "message": "Messages retrieved successfully"
}
```

### 4. **POST /api/chat/conversations**

Tạo conversation mới hoặc lấy conversation đã tồn tại

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**

```json
{
  "bookingId": "674015c4f6f123456789abcd",
  "initialMessage": "Hi, I need help with my booking."
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "conversationId": "674015c4f6f123456789abef",
    "bookingId": "674015c4f6f123456789abcd",
    "participants": [
      {
        "userId": "673def123456789abcdef56",
        "name": "John Customer",
        "role": "customer"
      },
      {
        "userId": "673def123456789abcdef78",
        "name": "Jane Staff",
        "role": "staff"
      }
    ],
    "isNew": true,
    "message": {
      "content": "Hi, I need help with my booking.",
      "sentAt": "2024-11-22T10:30:00.000Z"
    }
  },
  "message": "Conversation started successfully"
}
```

### 5. **PUT /api/chat/conversations/:conversationId/read**

Đánh dấu messages đã đọc

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "message": "Messages marked as read"
}
```

### 6. **GET /api/chat/unread-count**

Lấy tổng số messages chưa đọc

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "count": 5
  },
  "message": "Unread count retrieved successfully"
}
```

## Frontend Implementation

### 1. Chat Service (chatService.js)

```javascript
class ChatService {
  constructor(baseURL, authToken) {
    this.baseURL = baseURL;
    this.authToken = authToken;
  }

  // Headers helper
  getHeaders() {
    return {
      Authorization: `Bearer ${this.authToken}`,
      "Content-Type": "application/json",
    };
  }

  // Lấy danh sách bookings có thể chat
  async getBookingsForChat() {
    const response = await fetch(`${this.baseURL}/api/chat/bookings`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch bookings");
    }

    return await response.json();
  }

  // Lấy danh sách conversations
  async getConversations() {
    const response = await fetch(`${this.baseURL}/api/chat/conversations`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch conversations");
    }

    return await response.json();
  }

  // Lấy messages trong conversation
  async getMessages(conversationId, page = 1, limit = 20) {
    const response = await fetch(
      `${this.baseURL}/api/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
      {
        method: "GET",
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch messages");
    }

    return await response.json();
  }

  // Tạo conversation mới
  async startConversation(bookingId, initialMessage) {
    const response = await fetch(`${this.baseURL}/api/chat/conversations`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        bookingId,
        initialMessage,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to start conversation");
    }

    return await response.json();
  }

  // Đánh dấu đã đọc
  async markAsRead(conversationId) {
    const response = await fetch(
      `${this.baseURL}/api/chat/conversations/${conversationId}/read`,
      {
        method: "PUT",
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to mark as read");
    }

    return await response.json();
  }

  // Lấy số messages chưa đọc
  async getUnreadCount() {
    const response = await fetch(`${this.baseURL}/api/chat/unread-count`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch unread count");
    }

    return await response.json();
  }
}

export default ChatService;
```

### 2. React Components

#### ChatList Component

```jsx
import React, { useState, useEffect } from "react";
import ChatService from "../services/chatService";

const ChatList = ({ onSelectConversation }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const chatService = new ChatService(
    process.env.REACT_APP_API_URL,
    localStorage.getItem("token")
  );

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await chatService.getConversations();
      setConversations(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) return <div>Đang tải...</div>;
  if (error) return <div>Lỗi: {error}</div>;

  return (
    <div className="chat-list">
      <h3>Cuộc trò chuyện</h3>
      {conversations.map((conv) => (
        <div
          key={conv.conversationId}
          className={`conversation-item ${
            conv.unreadCount > 0 ? "unread" : ""
          }`}
          onClick={() => onSelectConversation(conv.conversationId)}
        >
          <div className="conversation-header">
            <span className="booking-date">
              {new Date(conv.bookingDate).toLocaleDateString("vi-VN")}
            </span>
            {conv.unreadCount > 0 && (
              <span className="unread-badge">{conv.unreadCount}</span>
            )}
          </div>

          <div className="participants">
            {conv.participants
              .filter((p) => p.role !== "customer") // Ẩn customer khỏi danh sách nếu current user là customer
              .map((p) => p.name)
              .join(", ")}
          </div>

          {conv.lastMessage && (
            <div className="last-message">
              <span className="content">{conv.lastMessage.content}</span>
              <span className="time">
                {formatTime(conv.lastMessage.sentAt)}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ChatList;
```

#### ChatWindow Component

```jsx
import React, { useState, useEffect, useRef } from "react";
import ChatService from "../services/chatService";

const ChatWindow = ({ conversationId, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const chatService = new ChatService(
    process.env.REACT_APP_API_URL,
    localStorage.getItem("token")
  );
  const currentUserId = localStorage.getItem("userId"); // Assuming you store user ID

  useEffect(() => {
    if (conversationId) {
      loadMessages();
      markAsRead();
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await chatService.getMessages(conversationId);
      setMessages(response.data.messages);
      setParticipants(response.data.participants);
    } catch (err) {
      console.error("Error loading messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await chatService.markAsRead(conversationId);
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      // Note: Backend chưa có API send message, cần implement thêm
      // Tạm thời có thể sử dụng WebSocket hoặc tạo API mới

      // Giả lập gửi message thành công
      const tempMessage = {
        _id: Date.now().toString(),
        senderId: {
          _id: currentUserId,
          name: "You",
          role: "customer",
        },
        content: newMessage,
        messageType: "text",
        sentAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, tempMessage]);
      setNewMessage("");
      scrollToBottom();
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) return <div>Đang tải tin nhắn...</div>;

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h4>Cuộc trò chuyện</h4>
        <div className="participants">
          {participants.map((p) => p.name).join(", ")}
        </div>
        <button onClick={onClose} className="close-btn">
          ×
        </button>
      </div>

      <div className="messages-container">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`message ${
              message.senderId._id === currentUserId ? "sent" : "received"
            }`}
          >
            <div className="message-sender">
              {message.senderId.name} ({message.senderId.role})
            </div>
            <div className="message-content">{message.content}</div>
            <div className="message-time">{formatTime(message.sentAt)}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="message-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Nhập tin nhắn..."
          disabled={sending}
        />
        <button type="submit" disabled={sending || !newMessage.trim()}>
          {sending ? "Đang gửi..." : "Gửi"}
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
```

#### BookingChatList Component

```jsx
import React, { useState, useEffect } from "react";
import ChatService from "../services/chatService";

const BookingChatList = ({ onStartChat }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const chatService = new ChatService(
    process.env.REACT_APP_API_URL,
    localStorage.getItem("token")
  );

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await chatService.getBookingsForChat();
      setBookings(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (booking) => {
    if (booking.hasConversation) {
      // Mở conversation đã tồn tại
      onStartChat(booking.conversationId);
    } else {
      // Tạo conversation mới
      try {
        const response = await chatService.startConversation(
          booking.bookingId,
          "Xin chào, tôi có câu hỏi về lịch hẹn này."
        );
        onStartChat(response.data.conversationId);
      } catch (err) {
        console.error("Error starting conversation:", err);
      }
    }
  };

  if (loading) return <div>Đang tải danh sách booking...</div>;
  if (error) return <div>Lỗi: {error}</div>;

  return (
    <div className="booking-chat-list">
      <h3>Danh sách lịch hẹn</h3>
      {bookings.map((booking) => (
        <div key={booking.bookingId} className="booking-item">
          <div className="booking-info">
            <div className="date-time">
              {new Date(booking.appointmentDate).toLocaleDateString("vi-VN")} -
              {booking.appointmentStartTime}
            </div>
            <div className="service">{booking.serviceType?.name}</div>
            <div className="vehicle">
              {booking.vehicle?.brand} {booking.vehicle?.model} -
              {booking.vehicle?.licensePlate}
            </div>
            <div className="status">Trạng thái: {booking.status}</div>
            <div className="participants">
              Có thể chat với:{" "}
              {booking.otherParticipants.map((p) => p.name).join(", ")}
            </div>
          </div>

          <button onClick={() => handleStartChat(booking)} className="chat-btn">
            {booking.hasConversation ? "Tiếp tục chat" : "Bắt đầu chat"}
          </button>
        </div>
      ))}
    </div>
  );
};

export default BookingChatList;
```

### 3. CSS Styles (chat.css)

```css
.chat-list {
  max-width: 400px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.chat-list h3 {
  background: #f5f5f5;
  margin: 0;
  padding: 15px;
  border-bottom: 1px solid #ddd;
}

.conversation-item {
  padding: 15px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.2s;
}

.conversation-item:hover {
  background-color: #f9f9f9;
}

.conversation-item.unread {
  background-color: #e3f2fd;
  font-weight: 600;
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.booking-date {
  font-weight: 500;
  color: #333;
}

.unread-badge {
  background: #2196f3;
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 12px;
  min-width: 18px;
  text-align: center;
}

.participants {
  color: #666;
  font-size: 14px;
  margin-bottom: 8px;
}

.last-message {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.last-message .content {
  color: #888;
  font-size: 14px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.last-message .time {
  color: #aaa;
  font-size: 12px;
  margin-left: 10px;
}

.chat-window {
  display: flex;
  flex-direction: column;
  height: 600px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.chat-header {
  background: #2196f3;
  color: white;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-header h4 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  background: #f9f9f9;
}

.message {
  margin-bottom: 20px;
  max-width: 70%;
}

.message.sent {
  margin-left: auto;
  text-align: right;
}

.message.received {
  margin-right: auto;
}

.message-sender {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.message-content {
  background: white;
  padding: 10px 15px;
  border-radius: 15px;
  word-wrap: break-word;
}

.message.sent .message-content {
  background: #2196f3;
  color: white;
}

.message-time {
  font-size: 11px;
  color: #aaa;
  margin-top: 5px;
}

.message-form {
  display: flex;
  padding: 15px;
  border-top: 1px solid #ddd;
  background: white;
}

.message-form input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 20px;
  margin-right: 10px;
  outline: none;
}

.message-form button {
  padding: 10px 20px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}

.message-form button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.booking-chat-list {
  max-width: 600px;
}

.booking-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 10px;
}

.booking-info {
  flex: 1;
}

.booking-info > div {
  margin-bottom: 5px;
}

.date-time {
  font-weight: 600;
  color: #333;
}

.service {
  color: #2196f3;
  font-weight: 500;
}

.vehicle,
.status,
.participants {
  color: #666;
  font-size: 14px;
}

.chat-btn {
  padding: 10px 20px;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-left: 15px;
}

.chat-btn:hover {
  background: #45a049;
}
```

### 4. Main Chat Component

```jsx
import React, { useState } from "react";
import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";
import BookingChatList from "./BookingChatList";
import "./chat.css";

const ChatMain = () => {
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [activeTab, setActiveTab] = useState("conversations"); // 'conversations' or 'bookings'

  return (
    <div className="chat-main">
      <div className="chat-tabs">
        <button
          className={activeTab === "conversations" ? "active" : ""}
          onClick={() => setActiveTab("conversations")}
        >
          Cuộc trò chuyện
        </button>
        <button
          className={activeTab === "bookings" ? "active" : ""}
          onClick={() => setActiveTab("bookings")}
        >
          Lịch hẹn
        </button>
      </div>

      <div className="chat-content">
        <div className="chat-sidebar">
          {activeTab === "conversations" ? (
            <ChatList onSelectConversation={setSelectedConversationId} />
          ) : (
            <BookingChatList onStartChat={setSelectedConversationId} />
          )}
        </div>

        <div className="chat-main-area">
          {selectedConversationId ? (
            <ChatWindow
              conversationId={selectedConversationId}
              onClose={() => setSelectedConversationId(null)}
            />
          ) : (
            <div className="no-conversation">
              Chọn một cuộc trò chuyện để bắt đầu
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMain;
```

## Ghi chú quan trọng

### 1. **API cần bổ sung:**

- **Send Message API**: Backend hiện chưa có API để gửi tin nhắn mới
- **WebSocket**: Để real-time messaging

### 2. **Quyền truy cập:**

- **Customer**: Chỉ thấy bookings của mình
- **Staff**: Thấy bookings được assign cho mình
- **Technician**: Thấy bookings được assign cho mình
- **Admin**: Thấy tất cả bookings

### 3. **Message Types:**

- `text`: Tin nhắn văn bản
- `image`: Hình ảnh
- `document`: Tài liệu
- `system`: Tin nhắn hệ thống

### 4. **Error Handling:**

Luôn kiểm tra response status và handle errors appropriately.

### 5. **Security:**

- Sử dụng JWT token trong Authorization header
- Validate user permissions trên backend

## Next Steps

1. **Implement Send Message API** trên backend
2. **Setup WebSocket** cho real-time messaging
3. **Add file upload** cho attachments
4. **Implement push notifications**
5. **Add message search functionality**

Hướng dẫn này cung cấp foundation hoàn chỉnh để implement chat system. Frontend developers có thể customize UI/UX theo yêu cầu cụ thể của dự án.
