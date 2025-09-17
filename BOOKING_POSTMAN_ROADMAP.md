## EVCare Booking End-to-End – Postman Roadmap

Lưu ý chung

- Tất cả endpoint base: http://localhost:8080 (điều chỉnh theo server của bạn)
- Gửi header Authorization: Bearer <JWT> cho các route yêu cầu xác thực
- Vai trò: Customer tạo booking; Admin/Manager confirm; Technician/Manager thực hiện quy trình bảo dưỡng

### 0) Chuẩn bị

1. Đăng nhập để lấy token

```
POST /api/auth/login
{
  "email": "customer@example.com",
  "password": "123456"
}
```

- Lưu `accessToken` để dùng cho các request của Customer

2. (Tuỳ chọn) Cấu hình chính sách hệ thống (Admin/Manager)

```
PUT /api/settings/policies
Authorization: Bearer <admin_token>
{
  "depositRate": 0.2,
  "inspectionFee": 200000,
  "cancellationWindowHours": 24,
  "autoCancelUnpaidMinutes": 30,
  "currency": "VND"
}
```

### 1) Customer – Tạo booking

- Trường hợp A: Chọn serviceType, thanh toán upfront online (nếu depositRate>0)

```
POST /api/booking
Authorization: Bearer <customer_token>
{
  "vehicleId": "<vehicleId>",
  "serviceCenterId": "<serviceCenterId>",
  "serviceTypeId": "<serviceTypeId>",
  "appointmentDate": "2025-09-20",
  "appointmentTime": "09:00",
  "serviceDescription": "Thay dầu định kỳ",
  "priority": "high",
  "paymentPreference": "online"
}
```

Kết quả: data.appointment + (nếu có upfront) data.payment.checkoutUrl (mock nếu chưa cấu hình PayOS)

- Trường hợp B: Inspection-only (không chọn dịch vụ/gói)

```
POST /api/booking
Authorization: Bearer <customer_token>
{
  "vehicleId": "<vehicleId>",
  "serviceCenterId": "<serviceCenterId>",
  "appointmentDate": "2025-09-20",
  "appointmentTime": "10:00",
  "serviceDescription": "Kiểm tra tổng quát",
  "isInspectionOnly": true,
  "paymentPreference": "online"
}
```

Nếu có `inspectionFee` > 0 sẽ trả link thanh toán upfront tương tự.

3. (Tuỳ chọn) Giả lập webhook PayOS (đánh dấu upfront đã trả)

```
POST /api/payment/webhook
{
  "eventId": "wh_123",
  "orderCode": 123456,
  "status": "PAID",
  "amount": 40000,
  "transactionTime": 1737096000
}
```

- Idempotency: nếu gửi lại cùng `eventId` (hoặc cùng bộ `orderCode|status|amount`) sẽ bị bỏ qua

### 2) Admin/Manager – Confirm Booking (Confirm gate)

```
POST /api/booking/:bookingId/confirm
Authorization: Bearer <admin_or_manager_token>
```

- Nếu booking có upfront (amount>0) nhưng `payment.status != paid` → 400 "Chưa thanh toán đặt cọc/phí kiểm tra"

### 3) Technician – Tạo Work Progress cho appointment

```
POST /api/work-progress
Authorization: Bearer <technician_token|manager_token>
{
  "technicianId": "<techUserId>",
  "appointmentId": "<appointmentId>",
  "serviceDate": "2025-09-20"
}
```

Lưu `workProgressId` để dùng các bước tiếp theo

### 4) Technician – Inspection và cung cấp Quote

```
POST /api/work-progress/:id/inspection-quote
Authorization: Bearer <technician_token|manager_token>
{
  "vehicleCondition": "Ổn định",
  "diagnosisDetails": "Cần thay dầu và lọc",
  "inspectionNotes": "Không lỗi nghiêm trọng",
  "quoteAmount": 500000,
  "quoteDetails": {
    "items": [
      { "partId": "<partId1>", "quantity": 1, "unitPrice": 200000, "name": "Dầu" },
      { "partId": "<partId2>", "quantity": 1, "unitPrice": 300000, "name": "Lọc dầu" }
    ],
    "labor": { "minutes": 60, "rate": 0 }
  }
}
```

### 5) Customer – Duyệt báo giá

```
PUT /api/work-progress/:id/quote-response
Authorization: Bearer <customer_token>
{
  "status": "approved",
  "notes": "OK"
}
```

- Hệ thống sẽ tự động tạo reservation từ `quoteDetails.items` nếu có và tồn kho đủ
- Nếu thiếu tồn: controller vẫn approved nhưng reservation riêng sẽ báo thiếu khi gọi hold bằng tay (luồng auto đã validate; xem log server nếu cần)

### 6) Technician – Bắt đầu bảo dưỡng

```
POST /api/work-progress/:id/start-maintenance
Authorization: Bearer <technician_token|manager_token>
```

### 7) Technician – Hoàn tất bảo dưỡng

```
POST /api/work-progress/:id/complete-maintenance
Authorization: Bearer <technician_token|manager_token>
{
  "notes": "Đã thay dầu/lọc",
  "workDone": "Thay dầu, thay lọc",
  "recommendations": "Tái kiểm tra sau 5000km"
}
```

- Hệ thống sẽ tự động: tạo Invoice (không tax/discount) theo thứ tự: quoteApproved → basePrice → estimatedCost; gửi email HTML invoice cho khách

### 8) Thanh toán hóa đơn cuối (hiện hỗ trợ offline qua staff)

```
POST /api/work-progress/:id/process-payment
Authorization: Bearer <admin|manager|staff_token>
{
  "staffId": "<staffUserId>",
  "paidAmount": 500000,
  "notes": "Khách trả tiền mặt"
}
```

- Kết thúc: Appointment.status = completed, mở quyền Feedback

### 9) Customer – Feedback/Rating (chỉ khi maintenance_completed/completed)

```
POST /api/appointments/:appointmentId/feedback
Authorization: Bearer <customer_token>
{
  "overall": 5,
  "service": 5,
  "technician": 5,
  "facility": 4,
  "comment": "Dịch vụ tốt"
}
```

### Phụ lục – Một số API hữu ích

- Xem slot trống (không cần serviceTypeId):

```
GET /api/booking/service-centers/:serviceCenterId/slots?date=2025-09-20
```

- Xem/chỉnh settings:

```
GET /api/settings/policies
PUT /api/settings/policies
```

- Inventory reservations (Admin/Manager):

```
POST /api/inventory/reservations
{
  "appointmentId": "<appointmentId>",
  "serviceCenterId": "<centerId>",
  "items": [ {"partId": "<partId>", "quantity": 1} ],
  "expiresAt": "2025-09-22T00:00:00.000Z",
  "notes": "Manual hold"
}
```

Ghi chú

- Confirm gate: chỉ xác nhận khi upfront đã paid (nếu có)
- Webhook idempotency: ưu tiên `eventId`. Nếu thiếu, hệ thống fallback theo `orderCode|status|amount`
- Cron auto-cancel: sẽ huỷ booking chưa thanh toán upfront sau `autoCancelUnpaidMinutes` (mặc định 30’)
