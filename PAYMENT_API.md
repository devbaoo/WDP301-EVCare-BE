# 💳 Payment API Documentation - PayOS Integration

## 📋 Tổng quan

API tích hợp PayOS để xử lý thanh toán online cho booking dịch vụ bảo dưỡng xe điện.

## 🔗 Base URL

```
http://localhost:8080/api/payment
```

## 🔧 Cấu hình Environment

Thêm các biến môi trường sau vào file `.env`:

```env
# PayOS Configuration
PAYOS_CLIENT_ID=your_client_id
PAYOS_API_KEY=your_api_key
PAYOS_CHECKSUM_KEY=your_checksum_key
PAYOS_BASE_URL=https://api-merchant.payos.vn
PAYOS_WEBHOOK_URL=http://localhost:8080/api/payment/webhook

# Frontend URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8080
```

## 📚 Endpoints

### 1. Tạo thanh toán cho booking

**POST** `/api/payment/booking/:appointmentId`

**Headers:**

```
Authorization: Bearer <customer_token>
```

**Path Parameters:**

- `appointmentId` (string, required): ID của appointment

**Response:**

```json
{
  "success": true,
  "message": "Tạo link thanh toán thành công",
  "data": {
    "paymentId": "64f8b1234567890abcdef123",
    "orderCode": 123456,
    "paymentLink": "https://pay.payos.vn/web/123456",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "checkoutUrl": "https://pay.payos.vn/web/123456",
    "deepLink": "https://pay.payos.vn/app/123456",
    "amount": 500000,
    "expiresAt": "2024-01-15T11:00:00.000Z"
  }
}
```

### 2. Lấy trạng thái thanh toán

**GET** `/api/payment/:paymentId/status`

**Headers:**

```
Authorization: Bearer <customer_token>
```

**Path Parameters:**

- `paymentId` (string, required): ID của payment

**Response:**

```json
{
  "success": true,
  "message": "Lấy trạng thái thanh toán thành công",
  "data": {
    "_id": "64f8b1234567890abcdef123",
    "appointment": "64f8b1234567890abcdef456",
    "customer": "64f8b1234567890abcdef789",
    "paymentInfo": {
      "amount": 500000,
      "currency": "VND",
      "description": "Thanh toán booking #64f8b1234567890abcdef456 - Bảo dưỡng định kỳ",
      "orderCode": 123456
    },
    "payosInfo": {
      "orderCode": 123456,
      "paymentLinkId": "pay_123456",
      "paymentLink": "https://pay.payos.vn/web/123456",
      "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      "checkoutUrl": "https://pay.payos.vn/web/123456",
      "deepLink": "https://pay.payos.vn/app/123456"
    },
    "status": "pending",
    "paymentMethod": "payos",
    "expiresAt": "2024-01-15T11:00:00.000Z",
    "isExpired": false,
    "statusDisplay": "Chờ thanh toán"
  }
}
```

### 3. Hủy thanh toán

**PUT** `/api/payment/:paymentId/cancel`

**Headers:**

```
Authorization: Bearer <customer_token>
```

**Path Parameters:**

- `paymentId` (string, required): ID của payment

**Response:**

```json
{
  "success": true,
  "message": "Hủy thanh toán thành công"
}
```

### 4. Lấy danh sách thanh toán của customer

**GET** `/api/payment/my-payments`

**Headers:**

```
Authorization: Bearer <customer_token>
```

**Query Parameters:**

- `status` (string, optional): Lọc theo trạng thái (pending, paid, failed, cancelled, expired, refunded)
- `page` (number, optional): Trang (mặc định 1)
- `limit` (number, optional): Số lượng/trang (mặc định 10)
- `sortBy` (string, optional): Sắp xếp theo (mặc định createdAt)
- `sortOrder` (string, optional): Thứ tự sắp xếp "asc"/"desc" (mặc định desc)

**Example Request:**

```
GET /api/payment/my-payments?status=paid&page=1&limit=5
```

**Response:**

```json
{
  "success": true,
  "message": "Lấy danh sách thanh toán thành công",
  "data": {
    "payments": [
      {
        "_id": "64f8b1234567890abcdef123",
        "appointment": {
          "_id": "64f8b1234567890abcdef456",
          "serviceType": {
            "name": "Bảo dưỡng định kỳ 10,000km"
          },
          "serviceCenter": {
            "name": "EVCare Center Hà Nội"
          },
          "appointmentTime": {
            "date": "2024-02-15T00:00:00.000Z",
            "startTime": "08:00"
          }
        },
        "paymentInfo": {
          "amount": 500000,
          "currency": "VND",
          "description": "Thanh toán booking #64f8b1234567890abcdef456 - Bảo dưỡng định kỳ"
        },
        "status": "paid",
        "paymentMethod": "payos",
        "transaction": {
          "transactionId": "txn_123456789",
          "transactionTime": "2024-01-15T10:45:00.000Z",
          "amount": 500000,
          "fee": 0,
          "netAmount": 500000
        },
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25,
      "itemsPerPage": 10
    }
  }
}
```

## 🔗 PayOS Webhook

### 5. Webhook từ PayOS

**POST** `/api/payment/webhook`

**Headers:**

```
Content-Type: application/json
```

**Request Body (từ PayOS):**

```json
{
  "orderCode": 123456,
  "status": "PAID",
  "transactionTime": "2024-01-15T10:45:00.000Z",
  "amount": 500000,
  "fee": 0,
  "netAmount": 500000,
  "transactionId": "txn_123456789"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

## 🔧 PayOS API (Testing)

### 6. Lấy thông tin thanh toán từ PayOS

**GET** `/api/payment/payos/:orderCode`

**Path Parameters:**

- `orderCode` (number, required): Mã đơn hàng PayOS

**Response:**

```json
{
  "success": true,
  "message": "Lấy thông tin thanh toán thành công",
  "data": {
    "orderCode": 123456,
    "amount": 500000,
    "description": "Thanh toán booking #64f8b1234567890abcdef456",
    "status": "PAID",
    "transactionTime": "2024-01-15T10:45:00.000Z"
  }
}
```

### 7. Hủy thanh toán trên PayOS

**PUT** `/api/payment/payos/:orderCode/cancel`

**Path Parameters:**

- `orderCode` (number, required): Mã đơn hàng PayOS

**Response:**

```json
{
  "success": true,
  "message": "Hủy thanh toán thành công",
  "data": {
    "orderCode": 123456,
    "status": "CANCELLED"
  }
}
```

## 🔄 Payment Flow

### 1. Customer tạo booking

```json
POST /api/booking
{
  "vehicleId": "vehicle_id",
  "serviceCenterId": "service_center_id",
  "serviceTypeId": "service_type_id",
  "appointmentDate": "2024-02-15",
  "appointmentTime": "08:00",
  "serviceDescription": "Bảo dưỡng định kỳ"
}
```

**Response với payment:**

```json
{
  "success": true,
  "message": "Tạo booking thành công. Vui lòng thanh toán để xác nhận lịch hẹn.",
  "data": {
    "appointment": { ... },
    "payment": {
      "paymentId": "payment_id",
      "orderCode": 123456,
      "paymentLink": "https://pay.payos.vn/web/123456",
      "amount": 500000,
      "expiresAt": "2024-01-15T11:00:00.000Z"
    },
    "requiresPayment": true
  }
}
```

### 2. Customer thanh toán

- Customer click vào `paymentLink` hoặc scan `qrCode`
- Chuyển đến trang thanh toán PayOS
- Thực hiện thanh toán

### 3. PayOS gửi webhook

- PayOS gửi webhook về `/api/payment/webhook`
- Hệ thống cập nhật trạng thái payment và appointment

### 4. Customer kiểm tra trạng thái

```json
GET /api/payment/payment_id/status
```

## 📊 Payment Status

| Status      | Mô tả               | Hành động                    |
| ----------- | ------------------- | ---------------------------- |
| `pending`   | Chờ thanh toán      | Customer cần thanh toán      |
| `paid`      | Đã thanh toán       | Booking được xác nhận        |
| `failed`    | Thanh toán thất bại | Customer có thể thử lại      |
| `cancelled` | Đã hủy              | Payment bị hủy               |
| `expired`   | Hết hạn             | Payment hết hạn, cần tạo mới |
| `refunded`  | Đã hoàn tiền        | Payment đã được hoàn tiền    |

## 🚨 Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Booking này đã có thanh toán",
  "statusCode": 400
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Access token is required",
  "statusCode": 401
}
```

### 403 Forbidden

```json
{
  "success": false,
  "message": "Bạn không có quyền thanh toán cho booking này",
  "statusCode": 403
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Không tìm thấy thanh toán",
  "statusCode": 404
}
```

### 500 Server Error

```json
{
  "success": false,
  "message": "Lỗi khi tạo thanh toán",
  "statusCode": 500
}
```

## 📝 Data Model

### Payment Schema

```javascript
{
  appointment: ObjectId,        // Reference đến Appointment
  customer: ObjectId,           // Reference đến User
  paymentInfo: {
    amount: Number,             // Số tiền (VND)
    currency: String,           // Tiền tệ (VND)
    description: String,        // Mô tả thanh toán
    orderCode: Number,          // Mã đơn hàng PayOS
  },
  payosInfo: {
    orderCode: Number,          // Mã đơn hàng PayOS
    paymentLinkId: String,      // ID link thanh toán
    paymentLink: String,        // Link thanh toán
    qrCode: String,             // QR code
    checkoutUrl: String,        // URL checkout
    deepLink: String,           // Deep link mobile
  },
  status: String,               // Trạng thái thanh toán
  paymentMethod: String,        // Phương thức thanh toán
  transaction: {
    transactionId: String,      // ID giao dịch
    transactionTime: Date,      // Thời gian giao dịch
    amount: Number,             // Số tiền thực tế
    fee: Number,                // Phí giao dịch
    netAmount: Number,          // Số tiền thực nhận
  },
  expiresAt: Date,              // Thời gian hết hạn
  webhook: {
    received: Boolean,          // Đã nhận webhook
    receivedAt: Date,           // Thời gian nhận webhook
    data: Mixed,                // Dữ liệu webhook
  }
}
```

## 🧪 Test với Postman

### 1. Tạo thanh toán

```
POST http://localhost:8080/api/payment/booking/appointment_id
Authorization: Bearer <customer_token>
```

### 2. Kiểm tra trạng thái

```
GET http://localhost:8080/api/payment/payment_id/status
Authorization: Bearer <customer_token>
```

### 3. Lấy danh sách thanh toán

```
GET http://localhost:8080/api/payment/my-payments?status=paid
Authorization: Bearer <customer_token>
```

### 4. Test webhook (simulate PayOS)

```
POST http://localhost:8080/api/payment/webhook
Content-Type: application/json

{
  "orderCode": 123456,
  "status": "PAID",
  "transactionTime": "2024-01-15T10:45:00.000Z",
  "amount": 500000,
  "transactionId": "txn_123456789"
}
```

## 🔐 Security

1. **Webhook Verification**: Có thể thêm signature verification cho webhook
2. **Rate Limiting**: Giới hạn số lần tạo payment
3. **Token Validation**: Kiểm tra quyền truy cập payment
4. **Amount Validation**: Kiểm tra số tiền thanh toán

## 🚀 Production Setup

1. **Environment Variables**: Cấu hình đầy đủ PayOS credentials
2. **Webhook URL**: Cấu hình webhook URL cho production
3. **SSL Certificate**: Sử dụng HTTPS cho webhook
4. **Monitoring**: Theo dõi webhook và payment status
5. **Error Handling**: Xử lý lỗi và retry mechanism

Chúc bạn tích hợp PayOS thành công! 🎉
