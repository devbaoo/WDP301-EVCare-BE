# API Quy trình Kiểm tra và Báo giá (Inspection & Quote)

## Giới thiệu

Tài liệu này mô tả chi tiết về quy trình API cho tính năng "Kiểm tra và Báo giá" trong hệ thống EVCare. Quy trình này cho phép kỹ thuật viên kiểm tra xe, cung cấp báo giá, khách hàng phản hồi, và nhân viên xử lý thanh toán sau khi hoàn thành dịch vụ.

## Quy trình tổng quan

1. **Khách hàng đặt lịch kiểm tra**: Khách hàng đặt lịch với option `isInspectionOnly: true`
2. **Kỹ thuật viên kiểm tra xe**: Kỹ thuật viên thực hiện kiểm tra xe và gửi kết quả kèm báo giá
3. **Khách hàng phản hồi báo giá**: Khách hàng chấp nhận hoặc từ chối báo giá
4. **Kỹ thuật viên thực hiện bảo dưỡng**: Nếu khách hàng chấp nhận báo giá, kỹ thuật viên tiến hành bảo dưỡng
5. **Kỹ thuật viên hoàn thành bảo dưỡng**: Kỹ thuật viên xác nhận hoàn thành công việc
6. **Thanh toán**: Nhân viên xử lý thanh toán tiền mặt từ khách hàng

## Trạng thái trong quy trình

### Trạng thái của WorkProgressTracking

- `not_started`: Chưa bắt đầu
- `in_progress`: Đang thực hiện (kiểm tra hoặc bảo dưỡng)
- `inspection_completed`: Đã hoàn thành kiểm tra, chưa báo giá
- `quote_provided`: Đã cung cấp báo giá, chờ phản hồi từ khách hàng
- `quote_approved`: Khách hàng đã chấp nhận báo giá
- `quote_rejected`: Khách hàng đã từ chối báo giá
- `completed`: Đã hoàn thành toàn bộ quy trình
- `paused`: Tạm dừng
- `delayed`: Bị trì hoãn

### Trạng thái của Appointment

- `confirmed`: Đã xác nhận lịch hẹn
- `in_progress`: Đang thực hiện
- `inspection_completed`: Đã hoàn thành kiểm tra
- `quote_provided`: Đã cung cấp báo giá
- `quote_approved`: Khách hàng đã chấp nhận báo giá
- `quote_rejected`: Khách hàng đã từ chối báo giá
- `maintenance_in_progress`: Đang thực hiện bảo dưỡng
- `maintenance_completed`: Đã hoàn thành bảo dưỡng
- `payment_pending`: Chờ thanh toán
- `completed`: Đã hoàn thành và thanh toán

## Chi tiết API

### 1. Kỹ thuật viên gửi kết quả kiểm tra và báo giá

**Endpoint**: `POST /api/work-progress/:id/inspection-quote`

**Quyền truy cập**: Kỹ thuật viên (Technician)

**Request Body**:

```json
{
  "vehicleCondition": "Mô tả tình trạng xe",
  "diagnosisDetails": "Chi tiết chẩn đoán",
  "inspectionNotes": "Ghi chú kiểm tra (không bắt buộc)",
  "quoteAmount": 1500000,
  "quoteDetails": "Chi tiết báo giá"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "_id": "work_progress_id",
    "technicianId": {
      "_id": "technician_id",
      "firstName": "Tên",
      "lastName": "Họ"
    },
    "appointmentId": "appointment_id",
    "currentStatus": "quote_provided",
    "inspection": {
      "vehicleCondition": "Mô tả tình trạng xe",
      "diagnosisDetails": "Chi tiết chẩn đoán",
      "inspectionNotes": "Ghi chú kiểm tra",
      "inspectionCompletedAt": "2025-09-15T10:30:00.000Z",
      "isInspectionOnly": true
    },
    "quote": {
      "quoteAmount": 1500000,
      "quoteDetails": "Chi tiết báo giá",
      "quotedAt": "2025-09-15T10:30:00.000Z",
      "quoteStatus": "pending"
    }
  },
  "message": "Inspection completed and quote provided successfully"
}
```

**Lưu ý**:

- Nếu không cung cấp `quoteAmount` và `quoteDetails`, trạng thái sẽ chỉ cập nhật thành `inspection_completed`
- Nếu cung cấp đầy đủ thông tin báo giá, trạng thái sẽ cập nhật thành `quote_provided`

### 2. Khách hàng phản hồi báo giá

**Endpoint**: `PUT /api/work-progress/:id/quote-response`

**Quyền truy cập**: Khách hàng (Customer)

**Request Body**:

```json
{
  "status": "approved",
  "notes": "Ghi chú phản hồi (không bắt buộc)"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "_id": "work_progress_id",
    "currentStatus": "quote_approved",
    "quote": {
      "quoteAmount": 1500000,
      "quoteDetails": "Chi tiết báo giá",
      "quotedAt": "2025-09-15T10:30:00.000Z",
      "quoteStatus": "approved",
      "customerResponseAt": "2025-09-15T11:00:00.000Z",
      "customerResponseNotes": "Ghi chú phản hồi"
    }
  },
  "message": "Quote approved successfully"
}
```

**Lưu ý**:

- `status` phải là `approved` hoặc `rejected`
- Nếu `approved`, trạng thái sẽ cập nhật thành `quote_approved`
- Nếu `rejected`, trạng thái sẽ cập nhật thành `quote_rejected`

### 3. Kỹ thuật viên bắt đầu bảo dưỡng

**Endpoint**: `POST /api/work-progress/:id/start-maintenance`

**Quyền truy cập**: Kỹ thuật viên (Technician)

**Request Body**: Không cần

**Response**:

```json
{
  "success": true,
  "data": {
    "_id": "work_progress_id",
    "currentStatus": "in_progress",
    "progressPercentage": 25
  },
  "message": "Maintenance started successfully"
}
```

**Lưu ý**:

- API này chỉ có thể gọi khi trạng thái hiện tại là `quote_approved`
- Trạng thái sẽ chuyển thành `in_progress` và cập nhật `progressPercentage` thành 25%

### 4. Kỹ thuật viên hoàn thành bảo dưỡng

**Endpoint**: `POST /api/work-progress/:id/complete-maintenance`

**Quyền truy cập**: Kỹ thuật viên (Technician)

**Request Body**:

```json
{
  "notes": "Ghi chú hoàn thành (không bắt buộc)",
  "workDone": "Công việc đã thực hiện",
  "recommendations": "Khuyến nghị (không bắt buộc)"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "_id": "work_progress_id",
    "currentStatus": "completed",
    "progressPercentage": 100,
    "endTime": "2025-09-15T14:30:00.000Z",
    "notes": "Ghi chú hoàn thành"
  },
  "message": "Maintenance completed successfully"
}
```

**Lưu ý**:

- API này chỉ có thể gọi khi trạng thái hiện tại là `in_progress`
- Trạng thái sẽ chuyển thành `completed` và cập nhật `progressPercentage` thành 100%
- Appointment sẽ chuyển sang trạng thái `maintenance_completed`

### 5. Nhân viên xử lý thanh toán tiền mặt

**Endpoint**: `POST /api/work-progress/:id/process-payment`

**Quyền truy cập**: Nhân viên (Staff)

**Request Body**:

```json
{
  "staffId": "staff_id_here",
  "paidAmount": 1500000,
  "notes": "Ghi chú thanh toán (không bắt buộc)"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "_id": "work_progress_id",
    "paymentDetails": {
      "paymentMethod": "cash",
      "paymentStatus": "paid",
      "paidAmount": 1500000,
      "paidAt": "2025-09-15T15:00:00.000Z",
      "processedBy": {
        "_id": "staff_id",
        "firstName": "Tên",
        "lastName": "Họ"
      }
    }
  },
  "message": "Cash payment processed successfully"
}
```

**Lưu ý**:

- API này chỉ có thể gọi khi trạng thái hiện tại là `completed`
- Appointment sẽ chuyển sang trạng thái `completed` và cập nhật thông tin thanh toán

## Sơ đồ luồng trạng thái

```
[Đặt lịch kiểm tra] -> [confirmed] -> [in_progress] -> [inspection_completed/quote_provided]
                                                          |
                                                          v
[completed] <- [payment_pending] <- [maintenance_completed] <- [maintenance_in_progress] <- [quote_approved/quote_rejected]
```

## Hướng dẫn test API trên Postman

### Chuẩn bị

1. Mở Postman và tạo một collection mới cho việc test (VD: "EVCare - Inspection & Quote Flow")
2. Đảm bảo server đang chạy (thường là `npm start` hoặc `npm run dev`)
3. Chuẩn bị các ID cần thiết:
   - Một ID của WorkProgressTracking đang tồn tại
   - ID của technician
   - ID của staff
   - Token đăng nhập cho các vai trò khác nhau (technician, customer, staff)

### 1. Test API Kỹ thuật viên gửi kết quả kiểm tra và báo giá

**Request:**

- Method: POST
- URL: `http://localhost:3000/api/work-progress/:id/inspection-quote`
- Headers:
  - Content-Type: application/json
  - Authorization: Bearer [token_của_kỹ_thuật_viên]
- Body:

```json
{
  "vehicleCondition": "Xe có dấu hiệu hao mòn ắc quy, đèn báo động cơ sáng",
  "diagnosisDetails": "Hệ thống điện yếu, cần thay thế ắc quy và kiểm tra toàn bộ hệ thống điện",
  "inspectionNotes": "Khách hàng báo xe khó khởi động vào buổi sáng",
  "quoteAmount": 1500000,
  "quoteDetails": "Chi phí bao gồm: Ắc quy mới (1,200,000 VND), kiểm tra hệ thống điện (300,000 VND)"
}
```

### 2. Test API Khách hàng phản hồi báo giá

**Request:**

- Method: PUT
- URL: `http://localhost:3000/api/work-progress/:id/quote-response`
- Headers:
  - Content-Type: application/json
  - Authorization: Bearer [token_của_khách_hàng]
- Body (Chấp nhận báo giá):

```json
{
  "status": "approved",
  "notes": "Tôi đồng ý với báo giá này, vui lòng tiến hành sửa chữa"
}
```

### 3. Test API Kỹ thuật viên bắt đầu bảo dưỡng

**Request:**

- Method: POST
- URL: `http://localhost:3000/api/work-progress/:id/start-maintenance`
- Headers:
  - Content-Type: application/json
  - Authorization: Bearer [token_của_kỹ_thuật_viên]
- Body: Không cần body

### 4. Test API Kỹ thuật viên hoàn thành bảo dưỡng

**Request:**

- Method: POST
- URL: `http://localhost:3000/api/work-progress/:id/complete-maintenance`
- Headers:
  - Content-Type: application/json
  - Authorization: Bearer [token_của_kỹ_thuật_viên]
- Body:

```json
{
  "notes": "Đã hoàn thành bảo dưỡng theo yêu cầu",
  "workDone": "Thay thế ắc quy mới, kiểm tra và cân chỉnh hệ thống điện",
  "recommendations": "Nên kiểm tra lại sau 1 tháng sử dụng"
}
```

### 5. Test API Nhân viên xử lý thanh toán tiền mặt

**Request:**

- Method: POST
- URL: `http://localhost:3000/api/work-progress/:id/process-payment`
- Headers:
  - Content-Type: application/json
  - Authorization: Bearer [token_của_nhân_viên]
- Body:

```json
{
  "staffId": "staff_id_here",
  "paidAmount": 1500000,
  "notes": "Khách hàng đã thanh toán đầy đủ bằng tiền mặt"
}
```

## Lưu ý triển khai

1. **Bảo mật**: Đảm bảo kiểm tra quyền truy cập cho mỗi API
2. **Xác thực trạng thái**: Kiểm tra trạng thái hiện tại trước khi cho phép chuyển sang trạng thái mới
3. **Đồng bộ dữ liệu**: Cập nhật đồng thời cả WorkProgressTracking và Appointment để đảm bảo tính nhất quán
4. **Xử lý lỗi**: Cung cấp thông báo lỗi rõ ràng khi không thể thực hiện hành động
5. **Thông báo**: Triển khai thông báo cho khách hàng khi có cập nhật quan trọng (ví dụ: báo giá mới)

## Tích hợp với Frontend

Frontend cần triển khai các màn hình sau:

1. **Màn hình kiểm tra xe**: Cho phép kỹ thuật viên nhập kết quả kiểm tra và báo giá
2. **Màn hình phản hồi báo giá**: Cho phép khách hàng xem và phản hồi báo giá
3. **Màn hình theo dõi tiến độ**: Hiển thị trạng thái hiện tại của quy trình
4. **Màn hình xác nhận hoàn thành**: Cho phép kỹ thuật viên xác nhận hoàn thành bảo dưỡng
5. **Màn hình thanh toán**: Cho phép nhân viên xử lý thanh toán tiền mặt

## Kết luận

Quy trình Kiểm tra và Báo giá cung cấp một luồng công việc linh hoạt và minh bạch cho việc kiểm tra xe, báo giá, và xử lý thanh toán. Các API được thiết kế để hỗ trợ từng bước trong quy trình, đảm bảo rằng tất cả các bên liên quan (khách hàng, kỹ thuật viên, nhân viên) có thể tương tác hiệu quả với hệ thống.
