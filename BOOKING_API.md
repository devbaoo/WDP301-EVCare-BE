# EVCare Booking API - Customer Flow

## 🚗 Booking Flow cho Customer

### 1. Quản lý xe (Vehicle Management)

#### Lấy danh sách model xe có sẵn

```
GET /api/booking/vehicle-models?brand=VinFast&search=VF&page=1&limit=20
```

**Query Parameters:**

- `brand`: Lọc theo hãng xe
- `search`: Tìm kiếm theo tên hãng hoặc model
- `page`: Trang (mặc định 1)
- `limit`: Số lượng/trang (mặc định 20)

**Response:**

```json
{
  "success": true,
  "message": "Lấy danh sách model xe thành công",
  "data": {
    "vehicleModels": [
      {
        "_id": "vehicle_model_id",
        "brand": "VinFast",
        "modelName": "VF e34",
        "yearFrom": 2021,
        "yearTo": 2023,
        "batteryType": "Li-ion",
        "batteryCapacity": 42,
        "motorPower": 110,
        "maintenanceIntervals": {
          "10000km": "Bảo dưỡng định kỳ",
          "12months": "Thay dầu và kiểm tra hệ thống"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 100,
      "itemsPerPage": 20
    }
  }
}
```

#### Lấy danh sách xe của customer

```
GET /api/booking/vehicles
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "success": true,
  "message": "Lấy danh sách xe thành công",
  "data": [
    {
      "_id": "vehicle_id",
      "vehicleInfo": {
        "vehicleModel": {
          "_id": "vehicle_model_id",
          "brand": "VinFast",
          "modelName": "VF e34",
          "batteryType": "Li-ion",
          "batteryCapacity": 42,
          "motorPower": 110
        },
        "year": 2022,
        "color": "Trắng",
        "licensePlate": "30A-12345",
        "vin": "VF123456789"
      },
      "currentStatus": {
        "mileage": 15000,
        "batteryHealth": 95,
        "lastServiceDate": "2024-01-15",
        "nextServiceMileage": 20000
      }
    }
  ]
}
```

#### Thêm xe mới

```
POST /api/booking/vehicles
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "vehicleInfo": {
    "vehicleModel": "vehicle_model_id", // ID của VehicleModel
    "year": 2022,
    "color": "Trắng",
    "licensePlate": "30A-12345",
    "vin": "VF123456789",
    "chassisNumber": "CH123456789"
  }
}
```

**Lưu ý:** Thông tin kỹ thuật (batteryType, batteryCapacity, motorPower, etc.) sẽ được lấy từ VehicleModel được reference.

### 2. Tìm kiếm dịch vụ (Service Discovery)

#### Lấy danh sách trung tâm dịch vụ

```
GET /api/booking/service-centers?city=Hà Nội&district=Đống Đa
```

**Query Parameters:**

- `city`: Thành phố
- `district`: Quận/Huyện
- `lat`: Vĩ độ (tìm gần nhất)
- `lng`: Kinh độ (tìm gần nhất)
- `radius`: Bán kính tìm kiếm (km, mặc định 10)

#### Lấy dịch vụ tương thích với xe

```
GET /api/booking/vehicles/:vehicleId/services?serviceCenterId=center_id
```

**Response:**

```json
{
  "success": true,
  "message": "Lấy danh sách dịch vụ tương thích thành công",
  "data": [
    {
      "_id": "service_type_id",
      "name": "Bảo dưỡng định kỳ 10,000km",
      "category": "maintenance",
      "pricing": {
        "basePrice": 500000,
        "currency": "VND"
      },
      "serviceDetails": {
        "duration": 120,
        "complexity": "medium"
      }
    }
  ]
}
```

#### Lấy lịch trống của trung tâm

```
GET /api/booking/service-centers/:serviceCenterId/services/:serviceTypeId/slots?date=2024-02-15
```

**Response:**

```json
{
  "success": true,
  "message": "Lấy lịch trống thành công",
  "data": {
    "date": "2024-02-15",
    "serviceCenter": "EVCare Center Hà Nội",
    "serviceType": "Bảo dưỡng định kỳ 10,000km",
    "availableSlots": [
      {
        "startTime": "08:00",
        "endTime": "10:00",
        "duration": 120,
        "availableTechnicians": ["tech_id_1", "tech_id_2"]
      },
      {
        "startTime": "10:30",
        "endTime": "12:30",
        "duration": 120,
        "availableTechnicians": ["tech_id_1"]
      }
    ],
    "totalSlots": 8
  }
}
```

### 3. Tạo Booking

#### Tạo booking mới

```
POST /api/booking
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "vehicleId": "vehicle_id",
  "serviceCenterId": "service_center_id",
  "serviceTypeId": "service_type_id",
  "appointmentDate": "2024-02-15",
  "appointmentTime": "08:00",
  "serviceDescription": "Xe có tiếng kêu lạ khi phanh",
  "priority": "medium"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Tạo booking thành công. Vui lòng chờ xác nhận từ trung tâm.",
  "data": {
    "_id": "appointment_id",
    "customer": {
      "username": "customer123",
      "fullName": "Nguyễn Văn A",
      "email": "customer@example.com"
    },
    "vehicle": {
      "vehicleInfo": {
        "brand": "VinFast",
        "model": "VF e34",
        "year": 2022
      }
    },
    "serviceCenter": {
      "name": "EVCare Center Hà Nội",
      "address": {
        "street": "123 Đường Láng",
        "ward": "Láng Thượng",
        "district": "Đống Đa",
        "city": "Hà Nội"
      }
    },
    "serviceType": {
      "name": "Bảo dưỡng định kỳ 10,000km",
      "category": "maintenance",
      "pricing": {
        "basePrice": 500000
      }
    },
    "appointmentTime": {
      "date": "2024-02-15T00:00:00.000Z",
      "startTime": "08:00",
      "endTime": "10:00",
      "duration": 120
    },
    "status": "pending_confirmation",
    "serviceDetails": {
      "description": "Xe có tiếng kêu lạ khi phanh",
      "priority": "medium",
      "estimatedCost": 500000
    }
  }
}
```

### 4. Quản lý Booking

#### Lấy danh sách booking của customer

```
GET /api/booking/my-bookings?status=confirmed&page=1&limit=10
Authorization: Bearer <access_token>
```

**Query Parameters:**

- `status`: Trạng thái booking (pending_confirmation, confirmed, in_progress, completed, cancelled)
- `page`: Trang (mặc định 1)
- `limit`: Số lượng/trang (mặc định 10)
- `sortBy`: Sắp xếp theo (mặc định createdAt)
- `sortOrder`: Thứ tự (asc/desc, mặc định desc)

#### Hủy booking

```
PUT /api/booking/:bookingId/cancel
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "reason": "Thay đổi kế hoạch"
}
```

## 📱 Flow hoàn chỉnh cho Customer

### Bước 1: Đăng nhập

```bash
POST /api/auth/login
{
  "email": "customer@example.com",
  "password": "password123"
}
```

### Bước 2: Lấy danh sách xe hoặc thêm xe mới

```bash
# Lấy xe hiện có
GET /api/booking/vehicles

# Lấy danh sách model xe để chọn
GET /api/booking/vehicle-models?brand=VinFast

# Thêm xe mới (sử dụng vehicleModelId từ bước trên)
POST /api/booking/vehicles
{
  "vehicleInfo": {
    "vehicleModel": "vehicle_model_id",
    "year": 2022,
    "color": "Trắng",
    "licensePlate": "30A-12345"
  }
}
```

### Bước 3: Tìm trung tâm dịch vụ

```bash
GET /api/booking/service-centers?city=Hà Nội
```

### Bước 4: Chọn dịch vụ tương thích

```bash
GET /api/booking/vehicles/:vehicleId/services?serviceCenterId=center_id
```

### Bước 5: Xem lịch trống

```bash
GET /api/booking/service-centers/:serviceCenterId/services/:serviceTypeId/slots?date=2024-02-15
```

### Bước 6: Tạo booking

```bash
POST /api/booking
{
  "vehicleId": "vehicle_id",
  "serviceCenterId": "service_center_id",
  "serviceTypeId": "service_type_id",
  "appointmentDate": "2024-02-15",
  "appointmentTime": "08:00",
  "serviceDescription": "Mô tả vấn đề cần sửa chữa"
}
```

### Bước 7: Nhận email xác nhận

- Hệ thống tự động gửi email xác nhận
- Trung tâm sẽ liên hệ trong 24h để xác nhận

### Bước 8: Theo dõi trạng thái booking

```bash
GET /api/booking/my-bookings
```

## 🔄 Trạng thái Booking

1. **pending_confirmation**: Chờ xác nhận từ trung tâm
2. **confirmed**: Đã xác nhận, chờ thực hiện
3. **in_progress**: Đang thực hiện dịch vụ
4. **completed**: Hoàn thành
5. **cancelled**: Đã hủy
6. **rescheduled**: Đã dời lịch
7. **no_show**: Khách không đến

## 📧 Email Notifications

- **Booking Confirmation**: Gửi ngay sau khi tạo booking
- **Status Updates**: Cập nhật trạng thái qua email
- **Reminders**: Nhắc nhở trước ngày hẹn

## 🚨 Error Handling

Tất cả API đều trả về format chuẩn:

```json
{
  "success": false,
  "message": "Mô tả lỗi",
  "statusCode": 400
}
```

**Common Error Codes:**

- `400`: Bad Request - Dữ liệu không hợp lệ
- `401`: Unauthorized - Chưa đăng nhập
- `403`: Forbidden - Không có quyền
- `404`: Not Found - Không tìm thấy
- `500`: Server Error - Lỗi hệ thống
