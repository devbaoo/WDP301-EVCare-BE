# 🚗 Vehicle Model API Documentation

## 📋 Tổng quan

API quản lý model xe điện, bao gồm thông tin kỹ thuật, lịch bảo dưỡng và tương thích với các dịch vụ.

## 🔗 Base URL

```
http://localhost:8080/api/vehicle-models
```

## 📚 Endpoints

### 1. Lấy danh sách model xe

**GET** `/api/vehicle-models`

**Query Parameters:**

- `brand` (string, optional): Lọc theo hãng xe
- `search` (string, optional): Tìm kiếm theo tên hãng hoặc model
- `batteryType` (string, optional): Lọc theo loại pin
- `yearFrom` (number, optional): Năm sản xuất từ
- `yearTo` (number, optional): Năm sản xuất đến
- `page` (number, optional): Trang (mặc định 1)
- `limit` (number, optional): Số lượng/trang (mặc định 20)
- `sortBy` (string, optional): Sắp xếp theo (mặc định "brand")
- `sortOrder` (string, optional): Thứ tự sắp xếp "asc"/"desc" (mặc định "asc")

**Example Request:**

```
GET /api/vehicle-models?brand=VinFast&search=VF&page=1&limit=10
```

**Response:**

```json
{
  "success": true,
  "message": "Lấy danh sách model xe thành công",
  "data": {
    "vehicleModels": [
      {
        "_id": "64f8b1234567890abcdef123",
        "brand": "VinFast",
        "modelName": "VF e34",
        "yearFrom": 2021,
        "yearTo": 2023,
        "batteryType": "Li-ion",
        "batteryCapacity": 42,
        "motorPower": 110,
        "maintenanceIntervals": {
          "10000km": "Bảo dưỡng định kỳ - Kiểm tra pin, hệ thống sạc",
          "20000km": "Thay dầu hộp số, kiểm tra phanh",
          "12months": "Kiểm tra toàn diện hệ thống điện"
        },
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 12,
      "itemsPerPage": 10
    }
  }
}
```

### 2. Lấy model xe theo ID

**GET** `/api/vehicle-models/:id`

**Path Parameters:**

- `id` (string, required): ID của model xe

**Example Request:**

```
GET /api/vehicle-models/64f8b1234567890abcdef123
```

**Response:**

```json
{
  "success": true,
  "message": "Lấy thông tin model xe thành công",
  "data": {
    "_id": "64f8b1234567890abcdef123",
    "brand": "VinFast",
    "modelName": "VF e34",
    "yearFrom": 2021,
    "yearTo": 2023,
    "batteryType": "Li-ion",
    "batteryCapacity": 42,
    "motorPower": 110,
    "maintenanceIntervals": {
      "10000km": "Bảo dưỡng định kỳ - Kiểm tra pin, hệ thống sạc",
      "20000km": "Thay dầu hộp số, kiểm tra phanh",
      "12months": "Kiểm tra toàn diện hệ thống điện"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 3. Lấy danh sách hãng xe

**GET** `/api/vehicle-models/brands/list`

**Response:**

```json
{
  "success": true,
  "message": "Lấy danh sách hãng xe thành công",
  "data": ["BYD", "Hyundai", "Kia", "Tesla", "VinFast"]
}
```

### 4. Lấy model xe theo hãng

**GET** `/api/vehicle-models/brand/:brand`

**Path Parameters:**

- `brand` (string, required): Tên hãng xe

**Example Request:**

```
GET /api/vehicle-models/brand/VinFast
```

**Response:**

```json
{
  "success": true,
  "message": "Lấy danh sách model xe VinFast thành công",
  "data": [
    {
      "_id": "64f8b1234567890abcdef123",
      "modelName": "VF e34",
      "yearFrom": 2021,
      "yearTo": 2023,
      "batteryType": "Li-ion",
      "batteryCapacity": 42,
      "motorPower": 110
    },
    {
      "_id": "64f8b1234567890abcdef124",
      "modelName": "VF e36",
      "yearFrom": 2022,
      "yearTo": 2024,
      "batteryType": "Li-ion",
      "batteryCapacity": 90,
      "motorPower": 150
    }
  ]
}
```

## 🔐 Admin Endpoints (Yêu cầu authentication + admin role)

### 5. Tạo model xe mới

**POST** `/api/vehicle-models`

**Headers:**

```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "brand": "VinFast",
  "modelName": "VF e35",
  "yearFrom": 2024,
  "yearTo": 2026,
  "batteryType": "Li-ion",
  "batteryCapacity": 60,
  "motorPower": 130,
  "maintenanceIntervals": {
    "12000km": "Bảo dưỡng định kỳ - Kiểm tra pin, hệ thống sạc",
    "24000km": "Thay dầu hộp số, kiểm tra phanh",
    "12months": "Kiểm tra toàn diện hệ thống điện"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Tạo model xe thành công",
  "data": {
    "_id": "64f8b1234567890abcdef125",
    "brand": "VinFast",
    "modelName": "VF e35",
    "yearFrom": 2024,
    "yearTo": 2026,
    "batteryType": "Li-ion",
    "batteryCapacity": 60,
    "motorPower": 130,
    "maintenanceIntervals": {
      "12000km": "Bảo dưỡng định kỳ - Kiểm tra pin, hệ thống sạc",
      "24000km": "Thay dầu hộp số, kiểm tra phanh",
      "12months": "Kiểm tra toàn diện hệ thống điện"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 6. Cập nhật model xe

**PUT** `/api/vehicle-models/:id`

**Headers:**

```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "batteryCapacity": 65,
  "motorPower": 140,
  "maintenanceIntervals": {
    "12000km": "Bảo dưỡng định kỳ - Kiểm tra pin, hệ thống sạc",
    "24000km": "Thay dầu hộp số, kiểm tra phanh",
    "12months": "Kiểm tra toàn diện hệ thống điện",
    "36000km": "Thay phụ tùng chính"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Cập nhật model xe thành công",
  "data": {
    "_id": "64f8b1234567890abcdef125",
    "brand": "VinFast",
    "modelName": "VF e35",
    "yearFrom": 2024,
    "yearTo": 2026,
    "batteryType": "Li-ion",
    "batteryCapacity": 65,
    "motorPower": 140,
    "maintenanceIntervals": {
      "12000km": "Bảo dưỡng định kỳ - Kiểm tra pin, hệ thống sạc",
      "24000km": "Thay dầu hộp số, kiểm tra phanh",
      "12months": "Kiểm tra toàn diện hệ thống điện",
      "36000km": "Thay phụ tùng chính"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

### 7. Xóa model xe

**DELETE** `/api/vehicle-models/:id`

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Response:**

```json
{
  "success": true,
  "message": "Xóa model xe thành công"
}
```

**Error Response (nếu model đang được sử dụng):**

```json
{
  "success": false,
  "message": "Không thể xóa model xe. Đang được sử dụng bởi 5 xe",
  "statusCode": 400
}
```

### 8. Tạo dữ liệu mẫu

**POST** `/api/vehicle-models/sample-data`

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Response:**

```json
{
  "success": true,
  "message": "Tạo dữ liệu mẫu thành công",
  "data": {
    "count": 12,
    "models": [
      {
        "_id": "64f8b1234567890abcdef123",
        "brand": "VinFast",
        "modelName": "VF e34",
        "yearFrom": 2021,
        "yearTo": 2023,
        "batteryType": "Li-ion",
        "batteryCapacity": 42,
        "motorPower": 110
      }
      // ... more models
    ]
  }
}
```

## 🚨 Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Thiếu trường bắt buộc: brand",
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
  "message": "Access denied. Admin role required",
  "statusCode": 403
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Không tìm thấy model xe",
  "statusCode": 404
}
```

### 500 Server Error

```json
{
  "success": false,
  "message": "Lỗi khi lấy danh sách model xe",
  "statusCode": 500
}
```

## 📝 Data Model

### VehicleModel Schema

```javascript
{
  brand: String,           // Hãng xe (required, max 50 chars)
  modelName: String,       // Tên model (required, max 100 chars)
  yearFrom: Number,        // Năm sản xuất từ (required)
  yearTo: Number,          // Năm sản xuất đến (optional)
  batteryType: String,     // Loại pin (max 50 chars)
  batteryCapacity: Number, // Dung lượng pin (kWh, min 0)
  motorPower: Number,      // Công suất động cơ (kW, min 0)
  maintenanceIntervals: {  // Lịch bảo dưỡng (JSON object)
    "10000km": "Bảo dưỡng định kỳ",
    "12months": "Kiểm tra toàn diện"
  },
  createdAt: Date,         // Ngày tạo
  updatedAt: Date          // Ngày cập nhật
}
```

## 🧪 Test với Postman

### 1. Lấy danh sách model xe

```
GET http://localhost:8080/api/vehicle-models
```

### 2. Tìm kiếm model VinFast

```
GET http://localhost:8080/api/vehicle-models?brand=VinFast&search=VF
```

### 3. Lấy model theo hãng

```
GET http://localhost:8080/api/vehicle-models/brand/Tesla
```

### 4. Tạo model mới (Admin)

```
POST http://localhost:8080/api/vehicle-models
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "brand": "Test Brand",
  "modelName": "Test Model",
  "yearFrom": 2024,
  "batteryType": "Li-ion",
  "batteryCapacity": 50,
  "motorPower": 100
}
```

## 🚀 Setup dữ liệu mẫu

### Cách 1: Sử dụng API

```bash
# Đăng nhập với tài khoản admin
POST /api/auth/login
{
  "email": "admin@evcare.com",
  "password": "admin123"
}

# Tạo dữ liệu mẫu
POST /api/vehicle-models/sample-data
Authorization: Bearer <admin_token>
```

### Cách 2: Sử dụng script

```bash
npm run create-sample-data
```

Script sẽ tạo 12 model xe mẫu từ các hãng:

- VinFast (VF e34, VF e36, VF 8)
- Tesla (Model 3, Model Y, Model S)
- BYD (Atto 3, Dolphin, Seal)
- Hyundai (Ioniq 5, Kona Electric)
- Kia (EV6)

## 🔗 Liên kết với Vehicle

Model xe được sử dụng trong Vehicle schema:

```javascript
// Vehicle schema
{
  vehicleInfo: {
    vehicleModel: ObjectId, // Reference đến VehicleModel
    year: Number,
    color: String,
    licensePlate: String,
    vin: String
  }
}
```

Khi lấy thông tin xe, VehicleModel sẽ được populate:

```javascript
// Populate VehicleModel
const vehicle = await Vehicle.findById(vehicleId).populate(
  "vehicleInfo.vehicleModel",
  "brand modelName batteryType batteryCapacity motorPower"
);
```

Chúc bạn sử dụng API thành công! 🎉
