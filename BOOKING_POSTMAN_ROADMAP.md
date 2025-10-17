## EVCare Booking End-to-End – Postman Roadmap

Lưu ý chung

- Tất cả endpoint base: http://localhost:8080 (điều chỉnh theo server của bạn)
- Header xác thực (ví dụ):
  Authorization: Bearer <JWT>
- Vai trò: Customer tạo booking; Admin/Staff xác nhận; Technician/Staff thực hiện quy trình bảo dưỡng

Lưu ý: trong các ví dụ dưới đây tôi dùng các placeholders như `<vehicleId>` hoặc `<appointmentId>` — bạn cần lấy các ID tương ứng từ các endpoint list (ví dụ: GET /api/vehicles, /api/service-centers).

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

- Lưu `accessToken` (hoặc `accessToken` trong response) và gửi trong header `Authorization` cho các request cần xác thực.

2. (Tuỳ chọn) Cấu hình chính sách hệ thống (Admin/Staff)

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

Ghi chú về `appointmentTime`:

- Một số endpoints/khung code trong repo dùng dạng đơn giản: `"appointmentDate": "YYYY-MM-DD"` và `"appointmentTime": "HH:mm"` (ví dụ trên).
- Một số chỗ khác (ví dụ trong email templates) có thể đọc `appointment.appointmentTime.date` và `appointment.appointmentTime.startTime`. Nếu API của bạn hỗ trợ định dạng nested, bạn có thể gửi:
  "appointmentTime": { "date": "2025-09-20", "startTime": "09:00" }
  Hãy dùng format mà backend của bạn đang xử lý; cả hai mẫu được ghi trong tài liệu này để tham khảo.

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

Ghi chú về `transactionTime`: giá trị ví dụ là epoch (seconds). Nếu PayOS gửi milliseconds hoặc ISO string, backend có thể cần parse tương ứng — kiểm tra spec webhook bên bạn.

### 2) Admin/Manager – Confirm Booking (Confirm gate)

```
POST /api/booking/:bookingId/confirm
Authorization: Bearer <admin_or_staff_token>
```

- Nếu booking có upfront (amount>0) nhưng `payment.status != paid` → 400 "Chưa thanh toán đặt cọc/phí kiểm tra"

Gợi ý lỗi: 400 response thường trả JSON dạng:
{
"success": false,
"message": "Chưa thanh toán đặt cọc/phí kiểm tra"
}

### 3) Technician – Tạo Work Progress cho appointment

```
POST /api/work-progress
Authorization: Bearer <technician_token|staff_token>
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
Authorization: Bearer <technician_token|staff_token>
{
  "vehicleCondition": "Ổn định",
  "diagnosisDetails": "Cần thay dầu và lọc",
  "inspectionNotes": "Không lỗi nghiêm trọng",
  "quoteDetails": {
    "items": [
      { "partId": "<partId1>", "quantity": 1, "unitPrice": 200000, "name": "Dầu" },
      { "partId": "<partId2>", "quantity": 1, "unitPrice": 300000, "name": "Lọc dầu" }
    ]
  }
}
```

**Lưu ý:**

- `quoteAmount` **không cần truyền** - hệ thống tự động tính từ items
- `quoteDetails` chỉ cần object với `items[]` array:
  - `partId`: ID của part trong inventory (optional, để tự động reservation)
  - `name`: Tên item (required)
  - `quantity`: Số lượng (required, > 0)
  - `unitPrice`: Giá đơn vị (required, >= 0) - lấy từ parts database
- Hệ thống sẽ tự động tính: `quoteAmount = sum(quantity * unitPrice)`
- UX tối ưu: Technician chỉ cần select parts và quantity, giá tự động load
- Khi customer approve quote, hệ thống sẽ tự động tạo inventory reservation cho các items có `partId`

Ghi chú về reservation:

- Luồng hiện tại (the repo branch này) dùng chiến lược "Reserve-on-booking" cho các phụ tùng có `partId` — nghĩa là hệ thống sẽ giữ (hold) số lượng khi booking được tạo hoặc khi quote được approved (tùy luồng). Nếu stock không đủ, hệ thống sẽ:
  - Vẫn cho phép duyệt báo giá / tạo booking,
  - Tạo reservation không thành công cho item thiếu và gửi email thông báo backorder (dự kiến có hàng trong 5–7 ngày),
  - Ghi note nội bộ trên appointment để staff kiểm tra.

Nếu bạn muốn thay đổi luồng này (ví dụ chỉ trừ stock khi technician confirm), cập nhật README hoặc coordination với frontend.

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

Chi tiết hoạt động khi thiếu tồn:

- Email backorder sẽ được gửi tới khách hàng với danh sách linh kiện thiếu và ETA (mặc định 7 ngày).
- Appointment vẫn có thể tiếp tục; staff sẽ nhận được note và có thể liên hệ khách hàng để tư vấn phương án thay thế.

### 6) Technician – Bắt đầu bảo dưỡng

```
POST /api/work-progress/:id/start-maintenance
Authorization: Bearer <technician_token|staff_token>
```

### 7) Technician – Hoàn tất bảo dưỡng

```
POST /api/work-progress/:id/complete-maintenance
Authorization: Bearer <technician_token|staff_token>
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
Authorization: Bearer <admin|staff_token>
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

--

Common enums & values

- Payment methods / `payment.method`: `ewallet`, `cash`, `card`, `banking` (use string values in requests)
- Reservation status: `held`, `released`, `consumed`
- Appointment states (example): `pending`, `confirmed`, `in_progress`, `maintenance_completed`, `completed`, `cancelled`

Troubleshooting

- 400 "Chưa thanh toán đặt cọc/phí kiểm tra": nghĩa là booking yêu cầu upfront nhưng payment chưa được webhook/mark as paid.
- Inventory errors: khi reservation không thành công do thiếu hàng, kiểm tra `CenterInventory.currentStock` và `reservedQuantity` ở center tương ứng.
- Webhook issues: nếu webhook không trigger, kiểm tra idempotency (eventId) và logs; gửi payload test với `eventId` mới để tránh bị bỏ qua.

Notes / Recommendations

- Nếu bạn deploy MongoDB standalone and need transactions, enable replica-set to support multi-document transactions — otherwise reservation/consume flows dùng best-effort fallback.
- Add a small section in frontend to surface `appointment.internalNotes` or reservation/backorder state to customers so they see ETA and follow-up.
