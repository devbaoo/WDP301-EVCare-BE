# EVCare Chat API Documentation

This document provides details about the real-time chat system implemented for EVCare, enabling communication between customers and staff.

## Table of Contents

- [RESTful API Endpoints](#restful-api-endpoints)
- [Socket.IO Events](#socketio-events)
- [Data Models](#data-models)
- [Authentication](#authentication)
- [Sample Usage](#sample-usage)

## RESTful API Endpoints

### Get User Conversations

Retrieves all conversations for the authenticated user.

```
GET /api/chat/conversations
```

**Headers:**

- Authorization: Bearer {token}

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "conversationId": "645a1c2b3e5e7a8b9c0d1e2f_645a1c2b3e5e7a8b9c0d1e30",
      "participant": {
        "_id": "645a1c2b3e5e7a8b9c0d1e30",
        "name": "John Doe",
        "avatar": "https://example.com/avatar.jpg",
        "role": "customer"
      },
      "lastMessage": {
        "content": "When will my service be completed?",
        "messageType": "text",
        "sentAt": "2025-10-02T15:30:00.000Z",
        "senderId": "645a1c2b3e5e7a8b9c0d1e30",
        "isRead": false
      },
      "unreadCount": 3
    }
  ],
  "message": "Conversations retrieved successfully"
}
```

### Get Messages for a Conversation

Retrieves messages from a specific conversation with pagination.

```
GET /api/chat/conversations/:conversationId/messages
```

**Parameters:**

- conversationId: ID of the conversation
- page (query, optional): Page number (default: 1)
- limit (query, optional): Messages per page (default: 20)

**Headers:**

- Authorization: Bearer {token}

**Response:**

```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "_id": "645a1c2b3e5e7a8b9c0d1e40",
        "conversationId": "645a1c2b3e5e7a8b9c0d1e2f_645a1c2b3e5e7a8b9c0d1e30",
        "senderId": {
          "_id": "645a1c2b3e5e7a8b9c0d1e2f",
          "name": "Staff Member",
          "avatar": "https://example.com/staff.jpg",
          "role": "staff"
        },
        "content": "Hello! How can I help you today?",
        "messageType": "text",
        "sentAt": "2025-10-02T15:25:00.000Z",
        "isRead": true
      },
      {
        "_id": "645a1c2b3e5e7a8b9c0d1e41",
        "conversationId": "645a1c2b3e5e7a8b9c0d1e2f_645a1c2b3e5e7a8b9c0d1e30",
        "senderId": {
          "_id": "645a1c2b3e5e7a8b9c0d1e30",
          "name": "John Doe",
          "avatar": "https://example.com/avatar.jpg",
          "role": "customer"
        },
        "content": "When will my service be completed?",
        "messageType": "text",
        "sentAt": "2025-10-02T15:30:00.000Z",
        "isRead": false
      }
    ],
    "pagination": {
      "total": 2,
      "page": 1,
      "limit": 20,
      "pages": 1
    }
  },
  "message": "Messages retrieved successfully"
}
```

### Start a New Conversation

Creates a new conversation with another user or returns an existing one.

```
POST /api/chat/conversations
```

**Headers:**

- Authorization: Bearer {token}
- Content-Type: application/json

**Request Body:**

```json
{
  "recipientId": "645a1c2b3e5e7a8b9c0d1e2f",
  "initialMessage": "Hello, I need help with my booking"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "conversationId": "645a1c2b3e5e7a8b9c0d1e2f_645a1c2b3e5e7a8b9c0d1e30",
    "isNew": true,
    "message": {
      "id": "645a1c2b3e5e7a8b9c0d1e42",
      "content": "Hello, I need help with my booking",
      "sentAt": "2025-10-03T09:00:00.000Z"
    },
    "participant": {
      "id": "645a1c2b3e5e7a8b9c0d1e2f",
      "name": "Staff Member",
      "avatar": "https://example.com/staff.jpg",
      "role": "staff"
    }
  },
  "message": "Conversation started successfully"
}
```

### Mark Messages as Read

Marks all unread messages in a conversation as read.

```
PUT /api/chat/conversations/:conversationId/read
```

**Parameters:**

- conversationId: ID of the conversation

**Headers:**

- Authorization: Bearer {token}

**Response:**

```json
{
  "success": true,
  "message": "Messages marked as read"
}
```

### Get Unread Message Count

Returns the total count of unread messages for the user.

```
GET /api/chat/unread-count
```

**Headers:**

- Authorization: Bearer {token}

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

## Socket.IO Events

### Client to Server Events

#### Authentication

```javascript
// Connect with authentication token
socket.connect({
  auth: {
    token: "your-jwt-token",
  },
});
```

#### Join Conversation

```javascript
socket.emit("join_conversation", "conversationId");
```

#### Leave Conversation

```javascript
socket.emit("leave_conversation", "conversationId");
```

#### Send Message

```javascript
socket.emit("send_message", {
  conversationId: "conversationId",
  recipientId: "recipientUserId",
  content: "Hello there!",
  messageType: "text", // 'text', 'image', 'document'
  attachmentUrl: null, // Optional URL for attachments
});
```

#### Typing Indicator

```javascript
socket.emit("typing", {
  conversationId: "conversationId",
  isTyping: true, // or false when stopped typing
});
```

#### Mark Messages as Read

```javascript
socket.emit("mark_read", {
  conversationId: "conversationId",
});
```

### Server to Client Events

#### Receive Message

```javascript
socket.on("receive_message", (data) => {
  console.log("New message:", data.message);
});
```

#### Message Notification

```javascript
socket.on("new_message_notification", (data) => {
  console.log("New message notification:", data);
});
```

#### User Typing

```javascript
socket.on("user_typing", (data) => {
  console.log(
    `${data.name} is ${data.isTyping ? "typing..." : "stopped typing"}`
  );
});
```

#### Messages Read

```javascript
socket.on("messages_read", (data) => {
  console.log(
    `User ${data.userId} has read messages in conversation ${data.conversationId}`
  );
});
```

#### User Status Changed

```javascript
socket.on("user_status_changed", (data) => {
  console.log(`User ${data.userId} is now ${data.status}`);
});
```

#### Error

```javascript
socket.on("error", (error) => {
  console.error("Socket error:", error.message);
});
```

## Data Models

### Chat Message Schema

```javascript
{
  conversationId: String, // Format: "userId1_userId2" (sorted alphanumerically)
  senderId: ObjectId (ref: 'User'),
  recipientId: ObjectId (ref: 'User'),
  messageType: String, // 'text', 'image', 'document', 'system'
  content: String,
  attachmentUrl: String, // Optional
  isRead: Boolean,
  sentAt: Date
}
```

## Authentication

All API endpoints and socket connections require authentication:

1. **REST API**: Use JWT token in the Authorization header

   ```
   Authorization: Bearer your-jwt-token
   ```

2. **Socket.IO**: Pass the JWT token during connection
   ```javascript
   const socket = io("http://your-server-url", {
     auth: {
       token: "your-jwt-token",
     },
   });
   ```

## Sample Usage

### Frontend Example (React + Socket.IO client)

```javascript
import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import axios from "axios";

const API_URL = "http://your-api-url";
const SOCKET_URL = "http://your-socket-url";
const token = "your-jwt-token"; // Get from authentication

const ChatComponent = () => {
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [newMessage, setNewMessage] = useState("");

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      auth: { token },
    });

    newSocket.on("connect", () => {
      console.log("Connected to socket server");
    });

    newSocket.on("receive_message", ({ message }) => {
      if (message.conversationId === currentConversation) {
        setMessages((prev) => [...prev, message]);
      }
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from socket server");
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [currentConversation]);

  // Load conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/chat/conversations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setConversations(response.data.data);
      } catch (error) {
        console.error("Error loading conversations:", error);
      }
    };

    fetchConversations();
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (!currentConversation) return;

    const fetchMessages = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/chat/conversations/${currentConversation}/messages`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessages(response.data.data.messages);

        // Join conversation room
        socket?.emit("join_conversation", currentConversation);

        // Mark messages as read
        socket?.emit("mark_read", { conversationId: currentConversation });
        axios.put(
          `${API_URL}/api/chat/conversations/${currentConversation}/read`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (error) {
        console.error("Error loading messages:", error);
      }
    };

    fetchMessages();

    return () => {
      // Leave conversation room when unmounting
      socket?.emit("leave_conversation", currentConversation);
    };
  }, [currentConversation, socket]);

  // Send message
  const sendMessage = () => {
    if (!newMessage.trim() || !currentConversation || !socket) return;

    const recipient = conversations.find(
      (c) => c.conversationId === currentConversation
    )?.participant._id;

    if (!recipient) return;

    socket.emit("send_message", {
      conversationId: currentConversation,
      recipientId: recipient,
      content: newMessage,
      messageType: "text",
    });

    setNewMessage("");
  };

  // Select a conversation
  const selectConversation = (conversationId) => {
    setCurrentConversation(conversationId);
  };

  return (
    <div className="chat-container">
      <div className="conversations-list">
        {conversations.map((conv) => (
          <div
            key={conv.conversationId}
            className={`conversation-item ${
              conv.conversationId === currentConversation ? "active" : ""
            }`}
            onClick={() => selectConversation(conv.conversationId)}
          >
            <img src={conv.participant.avatar} alt={conv.participant.name} />
            <div>
              <h4>{conv.participant.name}</h4>
              <p>{conv.lastMessage.content}</p>
            </div>
            {conv.unreadCount > 0 && (
              <span className="unread-badge">{conv.unreadCount}</span>
            )}
          </div>
        ))}
      </div>

      {currentConversation ? (
        <div className="messages-container">
          <div className="messages-list">
            {messages.map((msg) => (
              <div
                key={msg._id}
                className={`message ${
                  msg.senderId._id === "your-user-id" ? "sent" : "received"
                }`}
              >
                <p>{msg.content}</p>
                <span>{new Date(msg.sentAt).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>

          <div className="message-input">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message..."
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      ) : (
        <div className="no-conversation">
          <p>Select a conversation to start chatting</p>
        </div>
      )}
    </div>
  );
};

export default ChatComponent;
```

### Mobile App Integration (React Native)

For React Native applications, the integration approach is similar, using the Socket.IO client library:

```javascript
import { io } from "socket.io-client";

// In your chat component or service
const setupSocket = (token) => {
  const socket = io("http://your-socket-url", {
    auth: { token },
    transports: ["websocket"], // Recommended for React Native
  });

  // Setup event handlers similar to the React example
  return socket;
};

// The rest of the implementation follows the same pattern as the web example
```
