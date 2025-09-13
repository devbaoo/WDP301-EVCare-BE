# EVCare API Endpoints

## 🔐 Authentication Endpoints

### Public Routes

- `POST /api/auth/register` - Đăng ký tài khoản mới
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/google-login` - Đăng nhập bằng Google
- `POST /api/auth/refresh-token` - Làm mới access token
- `GET /api/auth/verify-email/:token` - Xác thực email
- `POST /api/auth/resend-verification` - Gửi lại email xác thực
- `POST /api/auth/forgot-password` - Quên mật khẩu
- `POST /api/auth/reset-password/:token` - Đặt lại mật khẩu

### Protected Routes

- `POST /api/auth/change-password` - Đổi mật khẩu (yêu cầu đăng nhập)

## 👤 User Management Endpoints

### Protected Routes

- `GET /api/user/profile` - Lấy thông tin profile
- `PUT /api/user/profile` - Cập nhật profile
- `POST /api/user/upload-avatar` - Upload avatar (multipart/form-data)
- `DELETE /api/user/:id` - Xóa user (admin only)
- `PUT /api/user/:userId/role` - Cập nhật role user (admin only)

## 🏢 Service Center Endpoints

### Public Routes

- `GET /api/service-centers` - Lấy danh sách trung tâm dịch vụ
  - Query params: `city`, `district`, `status`, `hasService`, `page`, `limit`, `sortBy`, `sortOrder`
- `GET /api/service-centers/:id` - Lấy thông tin trung tâm dịch vụ theo ID
- `GET /api/service-centers/nearby/search` - Tìm trung tâm gần nhất
  - Query params: `lat`, `lng`, `radius`

### Protected Routes (Admin Only)

- `POST /api/service-centers` - Tạo trung tâm dịch vụ mới
- `PUT /api/service-centers/:id` - Cập nhật trung tâm dịch vụ
- `DELETE /api/service-centers/:id` - Xóa trung tâm dịch vụ
- `POST /api/service-centers/:id/services` - Thêm dịch vụ vào trung tâm
- `POST /api/service-centers/:id/staff` - Thêm nhân viên vào trung tâm

## 🔧 Service Type Endpoints

### Public Routes

- `GET /api/service-types` - Lấy danh sách loại dịch vụ
  - Query params: `category`, `status`, `minPrice`, `maxPrice`, `complexity`, `page`, `limit`, `sortBy`, `sortOrder`, `search`
- `GET /api/service-types/:id` - Lấy thông tin loại dịch vụ theo ID
- `GET /api/service-types/category/:category` - Lấy dịch vụ theo danh mục
- `GET /api/service-types/popular/list` - Lấy dịch vụ phổ biến
  - Query params: `limit`
- `POST /api/service-types/compatible/search` - Tìm dịch vụ tương thích với xe

### Protected Routes (Admin Only)

- `POST /api/service-types` - Tạo loại dịch vụ mới
- `PUT /api/service-types/:id` - Cập nhật loại dịch vụ
- `DELETE /api/service-types/:id` - Xóa loại dịch vụ
- `PUT /api/service-types/:id/ai-data` - Cập nhật dữ liệu AI

## 📊 Health Check

- `GET /api/health` - Kiểm tra trạng thái API

## 🔑 Authentication Headers

Đối với các protected routes, cần gửi header:

```
Authorization: Bearer <access_token>
```

## 📝 Example Requests

### Tạo trung tâm dịch vụ mới

```json
POST /api/service-centers
{
  "name": "EVCare Center Hà Nội",
  "description": "Trung tâm bảo dưỡng xe điện hàng đầu",
  "address": {
    "street": "123 Đường Láng",
    "ward": "Láng Thượng",
    "district": "Đống Đa",
    "city": "Hà Nội",
    "coordinates": {
      "lat": 21.0285,
      "lng": 105.8542
    }
  },
  "contact": {
    "phone": "024-1234-5678",
    "email": "hanoi@evcare.com",
    "website": "https://evcare.com"
  },
  "operatingHours": {
    "monday": { "open": "08:00", "close": "18:00", "isOpen": true },
    "tuesday": { "open": "08:00", "close": "18:00", "isOpen": true },
    "wednesday": { "open": "08:00", "close": "18:00", "isOpen": true },
    "thursday": { "open": "08:00", "close": "18:00", "isOpen": true },
    "friday": { "open": "08:00", "close": "18:00", "isOpen": true },
    "saturday": { "open": "08:00", "close": "17:00", "isOpen": true },
    "sunday": { "open": "09:00", "close": "16:00", "isOpen": false }
  },
  "capacity": {
    "maxConcurrentServices": 15,
    "maxDailyAppointments": 60
  },
  "paymentMethods": [
    { "type": "cash", "isEnabled": true },
    { "type": "card", "isEnabled": true },
    { "type": "banking", "isEnabled": true },
    { "type": "ewallet", "isEnabled": true }
  ]
}
```

### Tạo loại dịch vụ mới

```json
POST /api/service-types
{
  "name": "Bảo dưỡng định kỳ 10,000km",
  "description": "Dịch vụ bảo dưỡng định kỳ cho xe điện sau 10,000km",
  "category": "maintenance",
  "serviceDetails": {
    "duration": 120,
    "complexity": "medium",
    "requiredSkills": ["EV Maintenance", "Battery Check", "Motor Inspection"],
    "tools": ["Multimeter", "Battery Tester", "Diagnostic Tool"]
  },
  "pricing": {
    "basePrice": 500000,
    "priceType": "fixed",
    "currency": "VND",
    "isNegotiable": false
  },
  "requiredParts": [
    {
      "partName": "Air Filter",
      "partType": "Filter",
      "quantity": 1,
      "isOptional": false,
      "estimatedCost": 50000
    },
    {
      "partName": "Brake Fluid",
      "partType": "Fluid",
      "quantity": 1,
      "isOptional": false,
      "estimatedCost": 100000
    }
  ],
  "compatibleVehicles": [
    {
      "brand": "VinFast",
      "model": "VF e34",
      "year": "2021-2023",
      "batteryType": "Li-ion"
    }
  ],
  "procedure": {
    "steps": [
      {
        "stepNumber": 1,
        "title": "Kiểm tra pin",
        "description": "Kiểm tra tình trạng pin và hệ thống sạc",
        "estimatedTime": 30,
        "requiredTools": ["Battery Tester"],
        "safetyNotes": ["Tắt nguồn trước khi kiểm tra"]
      }
    ],
    "totalSteps": 5
  },
  "requirements": {
    "minBatteryLevel": 20,
    "maxMileage": 15000,
    "specialConditions": ["Xe phải sạc đầy trước khi bảo dưỡng"],
    "safetyRequirements": ["Mang đồ bảo hộ", "Kiểm tra an toàn trước khi làm việc"]
  },
  "tags": ["maintenance", "10k", "periodic", "battery"],
  "priority": 3,
  "isPopular": true
}
```

### Tìm dịch vụ tương thích

```json
POST /api/service-types/compatible/search
{
  "brand": "VinFast",
  "model": "VF e34",
  "year": "2022",
  "batteryType": "Li-ion"
}
```
