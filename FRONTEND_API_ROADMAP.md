# EVCare Frontend API Roadmap

## 📋 Tổng quan

Tài liệu này cung cấp lộ trình phát triển frontend dựa trên các API hiện có trong hệ thống EVCare. Tài liệu được tổ chức theo các luồng người dùng chính và các chức năng của hệ thống.

## 🔑 Xác thực và Quản lý người dùng

### Xác thực (Authentication)

| Endpoint                          | Method | Mô tả                  | Quyền truy cập |
| --------------------------------- | ------ | ---------------------- | -------------- |
| `/api/auth/register`              | POST   | Đăng ký tài khoản mới  | Public         |
| `/api/auth/login`                 | POST   | Đăng nhập              | Public         |
| `/api/auth/google-login`          | POST   | Đăng nhập bằng Google  | Public         |
| `/api/auth/refresh-token`         | POST   | Làm mới access token   | Public         |
| `/api/auth/forgot-password`       | POST   | Quên mật khẩu          | Public         |
| `/api/auth/reset-password/:token` | POST   | Đặt lại mật khẩu       | Public         |
| `/api/auth/change-password`       | POST   | Đổi mật khẩu           | Authenticated  |
| `/api/auth/verify-email/:token`   | GET    | Xác thực email         | Public         |
| `/api/auth/resend-verification`   | POST   | Gửi lại email xác thực | Public         |

### Quản lý người dùng (User Management)

| Endpoint                  | Method | Mô tả                    | Quyền truy cập |
| ------------------------- | ------ | ------------------------ | -------------- |
| `/api/user/profile`       | GET    | Lấy thông tin profile    | Authenticated  |
| `/api/user/profile`       | PUT    | Cập nhật profile         | Authenticated  |
| `/api/user/upload-avatar` | POST   | Upload avatar            | Authenticated  |
| `/api/user/:id`           | DELETE | Xóa người dùng           | Admin          |
| `/api/user/:userId/role`  | PUT    | Cập nhật role người dùng | Admin          |

## 🚗 Quản lý xe và Model xe

### Model xe (Vehicle Models)

| Endpoint                           | Method | Mô tả                          | Quyền truy cập |
| ---------------------------------- | ------ | ------------------------------ | -------------- |
| `/api/vehicle-models`              | GET    | Lấy danh sách model xe         | Public         |
| `/api/vehicle-models/:id`          | GET    | Lấy thông tin model xe theo ID | Public         |
| `/api/vehicle-models/brands/list`  | GET    | Lấy danh sách hãng xe          | Public         |
| `/api/vehicle-models/brand/:brand` | GET    | Lấy model xe theo hãng         | Public         |
| `/api/vehicle-models`              | POST   | Tạo model xe mới               | Admin          |
| `/api/vehicle-models/:id`          | PUT    | Cập nhật model xe              | Admin          |
| `/api/vehicle-models/:id`          | DELETE | Xóa model xe                   | Admin          |
| `/api/vehicle-models/sample-data`  | POST   | Tạo dữ liệu mẫu                | Admin          |

### Xe của khách hàng (Customer Vehicles)

| Endpoint                      | Method | Mô tả                              | Quyền truy cập |
| ----------------------------- | ------ | ---------------------------------- | -------------- |
| `/api/booking/vehicles`       | GET    | Lấy danh sách xe của khách hàng    | Authenticated  |
| `/api/booking/vehicles`       | POST   | Thêm xe mới cho khách hàng         | Authenticated  |
| `/api/booking/vehicle-models` | GET    | Lấy danh sách model xe cho booking | Public         |

## 🏢 Trung tâm dịch vụ (Service Centers)

### Quản lý trung tâm

| Endpoint                             | Method | Mô tả                           | Quyền truy cập |
| ------------------------------------ | ------ | ------------------------------- | -------------- |
| `/api/service-centers`               | GET    | Lấy danh sách trung tâm dịch vụ | Public         |
| `/api/service-centers/:id`           | GET    | Lấy thông tin trung tâm theo ID | Public         |
| `/api/service-centers/nearby/search` | GET    | Tìm trung tâm gần nhất          | Public         |
| `/api/service-centers`               | POST   | Tạo trung tâm mới               | Admin          |
| `/api/service-centers/:id`           | PUT    | Cập nhật trung tâm              | Admin          |
| `/api/service-centers/:id`           | DELETE | Xóa trung tâm                   | Admin          |

### Quản lý dịch vụ và nhân viên tại trung tâm

| Endpoint                                               | Method | Mô tả                                 | Quyền truy cập |
| ------------------------------------------------------ | ------ | ------------------------------------- | -------------- |
| `/api/service-centers/:id/services`                    | POST   | Thêm dịch vụ vào trung tâm            | Admin          |
| `/api/service-centers/:id/staff`                       | POST   | Thêm nhân viên vào trung tâm          | Admin          |
| `/api/service-centers/:centerId/staff`                 | GET    | Lấy danh sách nhân viên của trung tâm | Admin, Manager |
| `/api/service-centers/:centerId/schedules`             | GET    | Lấy lịch của trung tâm                | Admin, Manager |
| `/api/service-centers/:centerId/available-technicians` | GET    | Lấy danh sách kỹ thuật viên có sẵn    | Admin, Manager |
| `/api/service-centers/:centerId/performance`           | GET    | Lấy hiệu suất của trung tâm           | Admin, Manager |

## 🔧 Loại dịch vụ (Service Types)

### Quản lý loại dịch vụ

| Endpoint                                | Method | Mô tả                              | Quyền truy cập |
| --------------------------------------- | ------ | ---------------------------------- | -------------- |
| `/api/service-types`                    | GET    | Lấy danh sách loại dịch vụ         | Public         |
| `/api/service-types/:id`                | GET    | Lấy thông tin loại dịch vụ theo ID | Public         |
| `/api/service-types/category/:category` | GET    | Lấy dịch vụ theo danh mục          | Public         |
| `/api/service-types/popular/list`       | GET    | Lấy dịch vụ phổ biến               | Public         |
| `/api/service-types/compatible/search`  | POST   | Tìm dịch vụ tương thích với xe     | Public         |
| `/api/service-types`                    | POST   | Tạo loại dịch vụ mới               | Admin          |
| `/api/service-types/:id`                | PUT    | Cập nhật loại dịch vụ              | Admin          |
| `/api/service-types/:id`                | DELETE | Xóa loại dịch vụ                   | Admin          |
| `/api/service-types/:id/ai-data`        | PUT    | Cập nhật dữ liệu AI                | Admin          |

## 📅 Đặt lịch (Booking)

### Luồng đặt lịch cho khách hàng

| Endpoint                                                                      | Method | Mô tả                                  | Quyền truy cập |
| ----------------------------------------------------------------------------- | ------ | -------------------------------------- | -------------- |
| `/api/booking/service-centers`                                                | GET    | Lấy danh sách trung tâm dịch vụ có sẵn | Public         |
| `/api/booking/vehicles/:vehicleId/services`                                   | GET    | Lấy dịch vụ tương thích với xe         | Public         |
| `/api/booking/service-centers/:serviceCenterId/services/:serviceTypeId/slots` | GET    | Lấy lịch trống của trung tâm           | Public         |
| `/api/booking`                                                                | POST   | Tạo booking mới                        | Authenticated  |
| `/api/booking/my-bookings`                                                    | GET    | Lấy danh sách booking của khách hàng   | Authenticated  |
| `/api/booking/:bookingId`                                                     | GET    | Lấy chi tiết booking                   | Authenticated  |
| `/api/booking/:bookingId/cancel`                                              | PUT    | Hủy booking                            | Authenticated  |
| `/api/booking/:bookingId/reschedule`                                          | PUT    | Đổi lịch hẹn                           | Authenticated  |
| `/api/appointments/:appointmentId/progress`                                   | GET    | Lấy tiến độ của lịch hẹn               | Authenticated  |

## 💰 Thanh toán (Payment)

### Quản lý thanh toán

| Endpoint                              | Method | Mô tả                          | Quyền truy cập |
| ------------------------------------- | ------ | ------------------------------ | -------------- |
| `/api/payment/booking/:appointmentId` | POST   | Tạo thanh toán cho booking     | Authenticated  |
| `/api/payment/:paymentId/status`      | GET    | Kiểm tra trạng thái thanh toán | Authenticated  |
| `/api/payment/:orderCode/cancel`      | PUT    | Hủy thanh toán                 | Authenticated  |
| `/api/payment/my-payments`            | GET    | Lấy lịch sử thanh toán         | Authenticated  |
| `/api/payment/webhook`                | POST   | Webhook từ cổng thanh toán     | Public         |
| `/api/payment/sync/:orderCode`        | POST   | Đồng bộ trạng thái thanh toán  | Public         |

### Trang thanh toán

| Endpoint           | Method | Mô tả                       | Quyền truy cập |
| ------------------ | ------ | --------------------------- | -------------- |
| `/payment/success` | GET    | Trang thanh toán thành công | Public         |
| `/payment/cancel`  | GET    | Trang hủy thanh toán        | Public         |

## 📊 Phân tích chi phí (Cost Analytics)

| Endpoint             | Method | Mô tả                | Quyền truy cập |
| -------------------- | ------ | -------------------- | -------------- |
| `/api/costs/history` | GET    | Lấy lịch sử chi phí  | Authenticated  |
| `/api/costs/summary` | GET    | Lấy tổng hợp chi phí | Authenticated  |

## 📦 Gói dịch vụ (Service Packages)

### Quản lý gói dịch vụ

| Endpoint                                              | Method | Mô tả                              | Quyền truy cập |
| ----------------------------------------------------- | ------ | ---------------------------------- | -------------- |
| `/api/service-packages`                               | GET    | Lấy danh sách gói dịch vụ          | Public         |
| `/api/service-packages/:id`                           | GET    | Lấy thông tin gói dịch vụ theo ID  | Public         |
| `/api/service-packages/vehicle/:vehicleId/compatible` | GET    | Lấy gói dịch vụ tương thích với xe | Public         |
| `/api/service-packages`                               | POST   | Tạo gói dịch vụ mới                | Admin          |
| `/api/service-packages/:id`                           | PUT    | Cập nhật gói dịch vụ               | Admin          |
| `/api/service-packages/:id`                           | DELETE | Xóa gói dịch vụ                    | Admin          |

## 🔄 Đăng ký gói dịch vụ (Subscriptions)

### Quản lý đăng ký

| Endpoint                                    | Method | Mô tả                     | Quyền truy cập |
| ------------------------------------------- | ------ | ------------------------- | -------------- |
| `/api/subscriptions`                        | GET    | Lấy danh sách đăng ký     | Authenticated  |
| `/api/subscriptions`                        | POST   | Đăng ký gói dịch vụ mới   | Authenticated  |
| `/api/subscriptions/:subscriptionId/renew`  | PUT    | Gia hạn đăng ký           | Authenticated  |
| `/api/subscriptions/:subscriptionId/cancel` | PUT    | Hủy đăng ký               | Authenticated  |
| `/api/subscriptions/:subscriptionId/usage`  | GET    | Xem thông tin sử dụng gói | Authenticated  |

## 👨‍🔧 Quản lý kỹ thuật viên

### Chứng chỉ kỹ thuật viên (Technician Certificates)

| Endpoint                                                      | Method | Mô tả                           | Quyền truy cập |
| ------------------------------------------------------------- | ------ | ------------------------------- | -------------- |
| `/api/technician-certificates`                                | GET    | Lấy danh sách chứng chỉ         | Admin, Manager |
| `/api/technician-certificates/:id`                            | GET    | Lấy thông tin chứng chỉ theo ID | Admin, Manager |
| `/api/technician-certificates`                                | POST   | Tạo chứng chỉ mới               | Admin, Manager |
| `/api/technician-certificates/:id`                            | PUT    | Cập nhật chứng chỉ              | Admin, Manager |
| `/api/technician-certificates/:id`                            | DELETE | Xóa chứng chỉ                   | Admin          |
| `/api/technician-certificates/:id/status`                     | PUT    | Cập nhật trạng thái chứng chỉ   | Admin, Manager |
| `/api/technicians/:technicianId/certificates`                 | GET    | Lấy chứng chỉ của kỹ thuật viên | Authenticated  |
| `/api/technician-certificates/specialization/:specialization` | GET    | Lấy chứng chỉ theo chuyên môn   | Admin, Manager |
| `/api/technician-certificates/expiry/check`                   | GET    | Kiểm tra chứng chỉ hết hạn      | Admin, Manager |
| `/api/technician-certificates/expiry/soon`                    | GET    | Lấy chứng chỉ sắp hết hạn       | Admin, Manager |

### Lịch trình kỹ thuật viên (Technician Schedules)

| Endpoint                                                    | Method | Mô tả                            | Quyền truy cập             |
| ----------------------------------------------------------- | ------ | -------------------------------- | -------------------------- |
| `/api/technician-schedules`                                 | GET    | Lấy danh sách lịch trình         | Admin, Manager             |
| `/api/technician-schedules/:id`                             | GET    | Lấy thông tin lịch trình theo ID | Admin, Manager, Technician |
| `/api/technician-schedules`                                 | POST   | Tạo lịch trình mới               | Admin, Manager             |
| `/api/technician-schedules/:id`                             | PUT    | Cập nhật lịch trình              | Admin, Manager             |
| `/api/technician-schedules/:id`                             | DELETE | Xóa lịch trình                   | Admin, Manager             |
| `/api/technicians/:technicianId/schedules`                  | GET    | Lấy lịch trình của kỹ thuật viên | Authenticated              |
| `/api/technician-schedules/:id/status`                      | PUT    | Cập nhật trạng thái lịch trình   | Admin, Manager, Technician |
| `/api/technician-schedules/:id/check-in`                    | POST   | Ghi nhận check-in                | Admin, Manager, Technician |
| `/api/technician-schedules/:id/check-out`                   | POST   | Ghi nhận check-out               | Admin, Manager, Technician |
| `/api/technician-schedules/:id/availability`                | PUT    | Cập nhật tình trạng sẵn sàng     | Admin, Manager, Technician |
| `/api/technician-schedules/:id/appointments`                | POST   | Thêm lịch hẹn vào lịch trình     | Admin, Manager             |
| `/api/technician-schedules/:id/appointments/:appointmentId` | DELETE | Xóa lịch hẹn khỏi lịch trình     | Admin, Manager             |
| `/api/technician-schedules/reports/overtime`                | GET    | Lấy báo cáo làm thêm giờ         | Admin, Manager             |

## 👥 Phân công nhân viên (Staff Assignment)

| Endpoint                              | Method | Mô tả                           | Quyền truy cập |
| ------------------------------------- | ------ | ------------------------------- | -------------- |
| `/api/staff-assignments`              | GET    | Lấy danh sách phân công         | Admin, Manager |
| `/api/staff-assignments/:id`          | GET    | Lấy thông tin phân công theo ID | Admin, Manager |
| `/api/staff-assignments`              | POST   | Tạo phân công mới               | Admin          |
| `/api/staff-assignments/:id`          | PUT    | Cập nhật phân công              | Admin          |
| `/api/staff-assignments/:id`          | DELETE | Xóa phân công                   | Admin          |
| `/api/staff-assignments/:id/position` | PUT    | Cập nhật vị trí nhân viên       | Admin, Manager |
| `/api/users/:userId/centers`          | GET    | Lấy trung tâm của nhân viên     | Authenticated  |

## 📊 Theo dõi tiến độ công việc (Work Progress Tracking)

| Endpoint                                                  | Method | Mô tả                           | Quyền truy cập             |
| --------------------------------------------------------- | ------ | ------------------------------- | -------------------------- |
| `/api/work-progress`                                      | GET    | Lấy danh sách tiến độ           | Admin, Manager             |
| `/api/work-progress/:id`                                  | GET    | Lấy thông tin tiến độ theo ID   | Admin, Manager, Technician |
| `/api/work-progress`                                      | POST   | Tạo tiến độ mới                 | Admin, Manager, Technician |
| `/api/work-progress/:id`                                  | PUT    | Cập nhật tiến độ                | Admin, Manager, Technician |
| `/api/work-progress/:id`                                  | DELETE | Xóa tiến độ                     | Admin, Manager             |
| `/api/technicians/:technicianId/work-progress`            | GET    | Lấy tiến độ của kỹ thuật viên   | Admin, Manager, Technician |
| `/api/work-progress/:id/status`                           | PUT    | Cập nhật trạng thái tiến độ     | Admin, Manager, Technician |
| `/api/work-progress/:id/milestones`                       | POST   | Thêm mốc tiến độ                | Admin, Manager, Technician |
| `/api/work-progress/:id/milestones/:milestoneId/complete` | PUT    | Hoàn thành mốc tiến độ          | Admin, Manager, Technician |
| `/api/work-progress/:id/issues`                           | POST   | Báo cáo vấn đề                  | Admin, Manager, Technician |
| `/api/work-progress/:id/issues/:issueId/resolve`          | PUT    | Giải quyết vấn đề               | Admin, Manager, Technician |
| `/api/work-progress/:id/supervisor-notes`                 | POST   | Thêm ghi chú của giám sát       | Admin, Manager             |
| `/api/work-progress/:id/calculate-efficiency`             | POST   | Tính toán hiệu suất             | Admin, Manager             |
| `/api/technicians/:technicianId/performance`              | GET    | Lấy hiệu suất của kỹ thuật viên | Admin, Manager             |

## 📊 Quy trình kiểm tra và báo giá (Inspection & Quote)

| Endpoint                                      | Method | Mô tả                                | Quyền truy cập           |
| --------------------------------------------- | ------ | ------------------------------------ | ------------------------ |
| `/api/work-progress/:id/inspection-quote`     | POST   | Gửi kết quả kiểm tra và báo giá      | Technician               |
| `/api/work-progress/:id/quote-response`       | PUT    | Phản hồi báo giá (chấp nhận/từ chối) | Authenticated (Customer) |
| `/api/work-progress/:id/start-maintenance`    | POST   | Bắt đầu bảo dưỡng sau khi chấp nhận  | Technician               |
| `/api/work-progress/:id/complete-maintenance` | POST   | Hoàn thành bảo dưỡng                 | Technician               |
| `/api/work-progress/:id/process-payment`      | POST   | Xử lý thanh toán tiền mặt            | Admin, Manager, Staff    |

## 🚨 Xử lý lỗi

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

## 🔑 Authentication Headers

Đối với các protected routes, cần gửi header:

```
Authorization: Bearer <access_token>
```

## 📱 Luồng người dùng chính

### 1. Luồng khách hàng (Customer Flow)

1. **Đăng ký/Đăng nhập**

   - Đăng ký tài khoản mới hoặc đăng nhập
   - Quản lý profile và thông tin cá nhân

2. **Quản lý xe**

   - Thêm xe mới
   - Xem danh sách xe đã đăng ký

3. **Đặt lịch dịch vụ**

   - Tìm trung tâm dịch vụ gần nhất
   - Chọn dịch vụ tương thích với xe
   - Xem lịch trống và đặt lịch
   - Theo dõi trạng thái đặt lịch

4. **Theo dõi tiến độ dịch vụ**
   - Xem tiến độ công việc
   - Nhận thông báo khi hoàn thành
   - Phản hồi báo giá (nếu có)

### 2. Luồng quản lý (Admin/Manager Flow)

1. **Quản lý trung tâm dịch vụ**

   - Thêm/sửa/xóa trung tâm
   - Quản lý dịch vụ tại trung tâm

2. **Quản lý nhân viên**

   - Phân công nhân viên vào trung tâm
   - Quản lý chứng chỉ kỹ thuật viên
   - Quản lý lịch trình kỹ thuật viên

3. **Quản lý dịch vụ**

   - Thêm/sửa/xóa loại dịch vụ
   - Cập nhật thông tin dịch vụ

4. **Theo dõi hiệu suất**
   - Xem báo cáo hiệu suất kỹ thuật viên
   - Xem báo cáo hiệu suất trung tâm

### 3. Luồng kỹ thuật viên (Technician Flow)

1. **Quản lý lịch trình**

   - Xem lịch làm việc
   - Check-in/check-out
   - Cập nhật tình trạng sẵn sàng

2. **Quản lý công việc**
   - Cập nhật tiến độ công việc
   - Thêm mốc tiến độ
   - Báo cáo vấn đề
   - Giải quyết vấn đề
   - Gửi kết quả kiểm tra và báo giá
   - Thực hiện bảo dưỡng sau khi khách hàng chấp nhận báo giá

### 4. Luồng nhân viên (Staff Flow)

1. **Xử lý thanh toán**
   - Xác nhận thanh toán tiền mặt
   - Cập nhật trạng thái thanh toán

## 📱 Gợi ý phát triển Frontend

### 1. Trang chủ và Xác thực

- Trang đăng nhập/đăng ký
- Quên mật khẩu và đặt lại mật khẩu
- Trang chủ với các dịch vụ nổi bật

### 2. Trang quản lý tài khoản

- Thông tin cá nhân
- Đổi mật khẩu
- Upload avatar

### 3. Quản lý xe

- Danh sách xe đã đăng ký
- Form thêm xe mới
- Chi tiết xe

### 4. Đặt lịch dịch vụ

- Tìm kiếm trung tâm dịch vụ
- Chọn dịch vụ
- Chọn lịch trống
- Xác nhận đặt lịch

### 5. Theo dõi đặt lịch

- Danh sách đặt lịch
- Chi tiết đặt lịch
- Theo dõi tiến độ
- Hủy đặt lịch
- Phản hồi báo giá (chấp nhận/từ chối)

### 6. Trang quản lý (Admin/Manager)

- Dashboard tổng quan
- Quản lý trung tâm dịch vụ
- Quản lý nhân viên
- Quản lý dịch vụ
- Báo cáo hiệu suất

### 7. Trang kỹ thuật viên

- Lịch làm việc
- Quản lý công việc
- Cập nhật tiến độ
- Báo cáo vấn đề
- Gửi kết quả kiểm tra và báo giá
- Hoàn thành bảo dưỡng

### 8. Trang nhân viên (Staff)

- Xử lý thanh toán
- Xem lịch hẹn hiện tại
- Quản lý khách hàng

## 🔍 Health Check

| Endpoint      | Method | Mô tả                   | Quyền truy cập |
| ------------- | ------ | ----------------------- | -------------- |
| `/api/health` | GET    | Kiểm tra trạng thái API | Public         |
