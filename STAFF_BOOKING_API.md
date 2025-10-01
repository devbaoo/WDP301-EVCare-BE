# EVCare Staff Booking Management API

## 🔐 Authentication Required

Tất cả các API này yêu cầu:

- **Bearer Token** trong header `Authorization`
- **Role**: `admin` hoặc `staff`

## 📋 Booking Management APIs

### 1. Lấy danh sách booking đã thanh toán online - chờ xác nhận

```http
GET /api/bookings/awaiting-confirmation
```

**Query Parameters:**

- `serviceCenterId` (optional): ID trung tâm dịch vụ
- `dateFrom` (optional): Từ ngày (YYYY-MM-DD)
- `dateTo` (optional): Đến ngày (YYYY-MM-DD)
- `page` (optional): Trang (default: 1)
- `limit` (optional): Số lượng/trang (default: 10)
- `sortBy` (optional): Sắp xếp theo field (default: "createdAt")
- `sortOrder` (optional): "asc" hoặc "desc" (default: "desc")

**Response:**

```json
{
  "success": true,
  "message": "Lấy danh sách booking đã thanh toán - chờ xác nhận thành công",
  "data": {
    "appointments": [
      {
        "_id": "booking_id",
        "customer": {
          "fullName": "Nguyễn Văn A",
          "phone": "0123456789",
          "email": "customer@example.com"
        },
        "vehicle": {
          "vehicleInfo": {
            "vehicleModel": {
              "brand": "VinFast",
              "modelName": "VF e34"
            }
          }
        },
        "serviceCenter": {
          "name": "EVCare Center Hà Nội",
          "address": "123 Đường Láng, Hà Nội"
        },
        "serviceType": {
          "name": "Bảo dưỡng 10.000km",
          "pricing": {
            "basePrice": 500000
          }
        },
        "appointmentTime": {
          "date": "2024-02-15T00:00:00.000Z",
          "startTime": "08:00",
          "endTime": "10:00"
        },
        "status": "confirmed",
        "payment": {
          "status": "paid",
          "amount": 500000,
          "method": "banking"
        },
        "confirmation": {
          "isConfirmed": false
        },
        "createdAt": "2024-02-10T07:30:00.000Z"
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

---

### 2. ⭐ [MỚI] Lấy danh sách booking thanh toán offline - chờ xác nhận

```http
GET /api/bookings/pending-offline-payment
```

**Mô tả:**
API này dành cho Staff/Admin để lấy danh sách các booking có thanh toán offline (cash) đang ở trạng thái pending và chưa được staff confirm. Điều này giúp staff có thể xem và xác nhận các booking offline trước khi hệ thống tự động cancel sau 30 phút.

**Điều kiện lọc:**

- `payment.method = "cash"` (thanh toán bằng tiền mặt)
- `payment.status = "pending"` (chưa thanh toán)
- `status` trong ["pending_confirmation", "pending"] (chờ xác nhận)
- `confirmation.isConfirmed != true` (chưa được staff confirm)**Query Parameters:**

- `serviceCenterId` (optional): ID trung tâm dịch vụ
- `dateFrom` (optional): Từ ngày (YYYY-MM-DD)
- `dateTo` (optional): Đến ngày (YYYY-MM-DD)
- `page` (optional): Trang (default: 1)
- `limit` (optional): Số lượng/trang (default: 10)
- `sortBy` (optional): Sắp xếp theo field (default: "createdAt")
- `sortOrder` (optional): "asc" hoặc "desc" (default: "desc")

**Response:**

```json
{
  "success": true,
  "message": "Lấy danh sách booking thanh toán offline - chờ xác nhận thành công",
  "data": {
    "appointments": [
      {
        "_id": "booking_id",
        "customer": {
          "fullName": "Trần Thị B",
          "phone": "0987654321",
          "email": "customer2@example.com"
        },
        "vehicle": {
          "vehicleInfo": {
            "vehicleModel": {
              "brand": "VinFast",
              "modelName": "VF 8"
            }
          }
        },
        "serviceCenter": {
          "name": "EVCare Center HCM",
          "address": "456 Nguyễn Văn Cừ, TP.HCM"
        },
        "serviceType": {
          "name": "Thay dầu phanh",
          "pricing": {
            "basePrice": 300000
          }
        },
        "appointmentTime": {
          "date": "2024-02-16T00:00:00.000Z",
          "startTime": "14:00",
          "endTime": "15:30"
        },
        "status": "pending_confirmation",
        "payment": {
          "status": "pending",
          "amount": 300000,
          "method": "cash"
        },
        "confirmation": {
          "isConfirmed": false
        },
        "createdAt": "2024-02-10T08:15:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 15,
      "itemsPerPage": 10
    }
  }
}
```

---

### 3. Xác nhận booking

```http
POST /api/booking/:bookingId/confirm
```

**Mô tả:**
API này cho phép staff/admin xác nhận lịch hẹn với khách hàng. **ĐÂY KHÔNG PHẢI là bước thanh toán chính**.

**Mục đích:** Xác nhận rằng trung tâm sẽ phục vụ khách hàng vào thời gian đã đặt.

**Thanh toán chính:** Sẽ diễn ra ở cuối workflow sau khi hoàn thành service.

**Path Parameters:**

- `bookingId`: ID của booking cần xác nhận

**Logic xử lý:**

1. **Booking có phí đặt cọc/kiểm tra (`payment.amount > 0`):**

   - **Online payment:** Phải thanh toán phí này trước khi confirm
   - **Offline payment:** Staff có thể confirm ngay, phí này sẽ thu khi khách đến

2. **Booking không có phí đặt cọc (`payment.amount = 0`):**
   - Staff confirm trực tiếp

**Response:**

```json
{
  "success": true,
  "message": "Xác nhận lịch hẹn thành công",
  "data": {
    "_id": "booking_id",
    "status": "confirmed",
    "confirmation": {
      "isConfirmed": true,
      "confirmedAt": "2024-02-10T09:00:00.000Z",
      "confirmedBy": "staff_user_id"
    }
  }
}
```

**Error Responses:**

```json
// Booking online chưa thanh toán phí đặt cọc/kiểm tra
{
  "success": false,
  "message": "Chưa thanh toán phí đặt cọc/kiểm tra online",
  "statusCode": 400
}

// Booking không tồn tại
{
  "success": false,
  "message": "Không tìm thấy booking",
  "statusCode": 404
}

// Trung tâm ngưng hoạt động
{
  "success": false,
  "message": "Trung tâm đang tạm ngưng hoạt động",
  "statusCode": 400
}
```

---

### 4. Lấy danh sách booking đã xác nhận

```http
GET /api/bookings/confirmed
```

**Mô tả:** Lấy danh sách các booking đã được staff confirm để đưa vào work-progress tracking.

**Query Parameters:** (giống như các API khác)

**Response:**

```json
{
  "success": true,
  "message": "Lấy danh sách booking đã xác nhận thành công",
  "data": {
    "appointments": [
      {
        "_id": "booking_id",
        "status": "confirmed",
        "confirmation": {
          "isConfirmed": true,
          "confirmedAt": "2024-02-10T09:00:00.000Z"
        }
        // ... other fields
      }
    ],
    "pagination": {
      /* ... */
    }
  }
}
```

## 🚨 Lưu ý quan trọng

### Workflow xử lý booking:

1. **Online Payment Bookings (có phí đặt cọc/kiểm tra):**

   - Customer tạo booking → thanh toán phí đặt cọc/kiểm tra online
   - Payment success → có thể confirm được
   - Staff dùng `/api/bookings/awaiting-confirmation` để xem và confirm
   - **Thanh toán chính:** Diễn ra sau khi hoàn thành service

2. **Offline Payment Bookings (có phí đặt cọc/kiểm tra):**

   - Customer tạo booking → chọn thanh toán offline
   - Status = "pending_confirmation", payment.status = "pending"
   - Staff dùng `/api/bookings/pending-offline-payment` để xem và confirm
   - **Quan trọng:** Phải confirm trong 30 phút, nếu không sẽ bị auto-cancel
   - **Thanh toán chính:** Diễn ra sau khi hoàn thành service

3. **Free Bookings (không có phí đặt cọc):**

   - Customer tạo booking → không cần thanh toán trước
   - Staff có thể confirm ngay
   - **Thanh toán chính:** Diễn ra sau khi hoàn thành service (nếu có)

4. **Auto-cancel system:**
   - Hệ thống tự động cancel các booking pending có phí đặt cọc quá 30 phút
   - Chỉ áp dụng với offline payment bookings có phí đặt cọc

## 🔄 Flow hoàn chỉnh

```
Customer tạo booking → Staff confirm lịch hẹn → Thực hiện service → Thanh toán chính → Hoàn thành
      ↓                      ↓                      ↓                  ↓               ↓
pending_confirmation → confirmed → in_progress → maintenance_completed → payment_pending → completed
```

## 🔄 Trạng thái Booking

- `pending_confirmation`: Chờ staff xác nhận (offline payment)
- `confirmed`: Đã xác nhận, sẵn sàng thực hiện
- `cancelled`: Đã hủy (có thể do auto-cancel)

## 🛡️ Error Handling

```json
{
  "success": false,
  "message": "Mô tả lỗi cụ thể",
  "statusCode": 400
}
```

**Common Errors:**

- `401`: Chưa đăng nhập
- `403`: Không có quyền staff/admin
- `404`: Không tìm thấy booking
- `400`: Booking đã được xác nhận hoặc đã hủy
- `500`: Lỗi hệ thống
