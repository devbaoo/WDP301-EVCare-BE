# Quy trình phân công kỹ thuật viên và xử lý booking

## Tổng quan

Tài liệu này mô tả quy trình phân công kỹ thuật viên từ trung tâm dịch vụ để xử lý booking từ khi nhận đến khi hoàn thành. Quy trình này bao gồm các bước từ việc phân công kỹ thuật viên, kiểm tra xe, cung cấp báo giá, thực hiện bảo dưỡng, đến xử lý thanh toán.

## Luồng làm việc

1. **Phân công kỹ thuật viên vào trung tâm dịch vụ**
2. **Quản lý lịch làm việc của kỹ thuật viên**
3. **Tiếp nhận và xử lý booking**
4. **Kiểm tra xe và cung cấp báo giá**
5. **Thực hiện bảo dưỡng**
6. **Hoàn thành dịch vụ và xử lý thanh toán**

## Chi tiết quy trình

### 1. Phân công kỹ thuật viên vào trung tâm dịch vụ

#### API liên quan:

```
POST /api/staff-assignments
```

**Body:**

```json
{
  "userId": "68c9376cb7fbfbca01bb1ca2",
  "centerId": "68c5dacb5977c4da3844c89c",
  "position": "technician",
  "startDate": "2025-09-15T00:00:00.000Z",
  "endDate": "2026-09-15T00:00:00.000Z"
}
```

**Lưu ý:**

- API này sẽ tự động cập nhật role của user thành "technician" trong bảng User
- Kỹ thuật viên sẽ được gán vào trung tâm dịch vụ và có thể được phân công xử lý booking

#### Màn hình Frontend:

- **Quản lý nhân viên**: Hiển thị danh sách nhân viên và cho phép phân công vào trung tâm dịch vụ
- **Form phân công**: Cho phép chọn nhân viên, trung tâm dịch vụ, vị trí, ngày bắt đầu và kết thúc

### 2. Quản lý lịch làm việc của kỹ thuật viên

#### API liên quan:

```
POST /api/technician-schedules/default
```

**Body:**

```json
{
  "technicianId": "68c9376cb7fbfbca01bb1ca2",
  "centerId": "68c5dacb5977c4da3844c89c",
  "startDate": "2025-09-23",
  "endDate": "2025-10-23"
}
```

#### Màn hình Frontend:

- **Lịch làm việc**: Hiển thị lịch làm việc của kỹ thuật viên theo ngày/tuần/tháng
- **Quản lý nghỉ phép**: Cho phép kỹ thuật viên xin nghỉ phép và quản lý/admin/staff phê duyệt

### 3. Tiếp nhận và xử lý booking

#### API liên quan:

```
GET /api/service-centers/:centerId/available-technicians
```

**Query Params:**

- `date`: Ngày cần tìm kỹ thuật viên có sẵn
- `timeSlot`: Khung giờ cần tìm kỹ thuật viên có sẵn

```
POST /api/work-progress
```

**Body:**

```json
{
  "technicianId": "68c9376cb7fbfbca01bb1ca2",
  "appointmentId": "68c9376cb7fbfbca01bb1ca5",
  "serviceDate": "2025-09-20"
}
```

#### Màn hình Frontend:

- **Danh sách booking**: Hiển thị danh sách booking chờ xử lý
- **Phân công kỹ thuật viên**: Cho phép chọn kỹ thuật viên có sẵn để xử lý booking
- **Chi tiết booking**: Hiển thị thông tin chi tiết về booking và khách hàng

### 4. Kiểm tra xe và cung cấp báo giá

#### API liên quan:

```
POST /api/work-progress/:id/inspection-quote
```

**Body:**

```json
{
  "vehicleCondition": "Xe có dấu hiệu hao mòn ắc quy, đèn báo động cơ sáng",
  "diagnosisDetails": "Hệ thống điện yếu, cần thay thế ắc quy và kiểm tra toàn bộ hệ thống điện",
  "inspectionNotes": "Khách hàng báo xe khó khởi động vào buổi sáng",
  "quoteAmount": 1500000,
  "quoteDetails": {
    "items": [
      {
        "partId": "68c9376cb7fbfbca01bb1ca8",
        "quantity": 1,
        "unitPrice": 1200000,
        "name": "Ắc quy"
      },
      {
        "partId": "68c9376cb7fbfbca01bb1ca9",
        "quantity": 1,
        "unitPrice": 300000,
        "name": "Kiểm tra hệ thống điện"
      }
    ],
    "labor": { "minutes": 60, "rate": 0 }
  }
}
```

#### Màn hình Frontend:

- **Form kiểm tra xe**: Cho phép kỹ thuật viên nhập kết quả kiểm tra và báo giá
- **Chọn phụ tùng**: Cho phép chọn phụ tùng cần thay thế từ kho
- **Tính toán chi phí**: Tự động tính toán chi phí dựa trên phụ tùng và công lao động

### 5. Thực hiện bảo dưỡng

#### API liên quan:

```
PUT /api/work-progress/:id/quote-response
```

**Body (từ phía khách hàng):**

```json
{
  "status": "approved",
  "notes": "Tôi đồng ý với báo giá này"
}
```

```
POST /api/work-progress/:id/start-maintenance
```

**Body:** Không cần body

#### Màn hình Frontend:

- **Thông báo phê duyệt**: Hiển thị thông báo khi khách hàng đã phê duyệt báo giá
- **Bắt đầu bảo dưỡng**: Cho phép kỹ thuật viên bắt đầu quá trình bảo dưỡng
- **Cập nhật tiến độ**: Cho phép cập nhật tiến độ công việc

### 6. Hoàn thành dịch vụ và xử lý thanh toán

#### API liên quan:

```
POST /api/work-progress/:id/complete-maintenance
```

**Body:**

```json
{
  "notes": "Đã hoàn thành bảo dưỡng theo yêu cầu",
  "workDone": "Thay thế ắc quy mới, kiểm tra và cân chỉnh hệ thống điện",
  "recommendations": "Nên kiểm tra lại sau 1 tháng sử dụng"
}
```

```
POST /api/work-progress/:id/process-payment
```

**Body:**

```json
{
  "staffId": "68c9376cb7fbfbca01bb1ca3",
  "paidAmount": 1500000,
  "notes": "Khách hàng đã thanh toán đầy đủ bằng tiền mặt"
}
```

#### Màn hình Frontend:

- **Hoàn thành bảo dưỡng**: Cho phép kỹ thuật viên xác nhận hoàn thành công việc
- **Xử lý thanh toán**: Cho phép nhân viên xử lý thanh toán tiền mặt từ khách hàng
- **Hóa đơn**: Hiển thị và in hóa đơn cho khách hàng

## Sơ đồ luồng trạng thái

```
[Phân công kỹ thuật viên] -> [Quản lý lịch làm việc] -> [Tiếp nhận booking]
                                                            |
                                                            v
[Hoàn thành & Thanh toán] <- [Thực hiện bảo dưỡng] <- [Kiểm tra & Báo giá]
```

## Thiết kế giao diện Frontend

### 1. Trang phân công kỹ thuật viên

![Trang phân công kỹ thuật viên](https://placeholder-image-url.com/technician-assignment)

**Chức năng:**

- Danh sách nhân viên có thể phân công
- Form phân công với các trường: nhân viên, trung tâm dịch vụ, vị trí, thời gian
- Danh sách phân công hiện tại

### 2. Trang quản lý lịch làm việc

![Trang quản lý lịch làm việc](https://placeholder-image-url.com/schedule-management)

**Chức năng:**

- Lịch làm việc theo ngày/tuần/tháng
- Quản lý nghỉ phép
- Xem lịch sử làm việc

### 3. Trang tiếp nhận booking

![Trang tiếp nhận booking](https://placeholder-image-url.com/booking-reception)

**Chức năng:**

- Danh sách booking chờ xử lý
- Tìm kiếm và lọc booking
- Phân công kỹ thuật viên cho booking

### 4. Trang kiểm tra và báo giá

![Trang kiểm tra và báo giá](https://placeholder-image-url.com/inspection-quote)

**Chức năng:**

- Form nhập kết quả kiểm tra
- Chọn phụ tùng cần thay thế
- Tính toán và gửi báo giá

### 5. Trang theo dõi tiến độ bảo dưỡng

![Trang theo dõi tiến độ](https://placeholder-image-url.com/maintenance-progress)

**Chức năng:**

- Hiển thị trạng thái hiện tại
- Cập nhật tiến độ công việc
- Thêm ghi chú và khuyến nghị

### 6. Trang xử lý thanh toán

![Trang xử lý thanh toán](https://placeholder-image-url.com/payment-processing)

**Chức năng:**

- Xác nhận hoàn thành dịch vụ
- Xử lý thanh toán tiền mặt
- In hóa đơn

## Hướng dẫn triển khai

1. **Phân quyền**:

   - Admin: Có quyền phân công kỹ thuật viên và quản lý toàn bộ quy trình
   - Staff: Có quyền quản lý booking và xử lý thanh toán
   - Technician: Có quyền xử lý booking được phân công, cập nhật tiến độ

2. **Thông báo**:

   - Gửi thông báo cho kỹ thuật viên khi được phân công booking mới
   - Gửi thông báo cho khách hàng khi có báo giá mới hoặc khi dịch vụ hoàn thành
   - Gửi thông báo cho quản lý khi có vấn đề phát sinh

3. **Báo cáo**:
   - Báo cáo hiệu suất kỹ thuật viên
   - Báo cáo số lượng booking đã xử lý
   - Báo cáo doanh thu theo kỹ thuật viên/trung tâm dịch vụ

## Kết luận

Quy trình phân công kỹ thuật viên và xử lý booking này giúp tối ưu hóa việc quản lý nhân sự và đảm bảo chất lượng dịch vụ. Bằng cách tuân theo quy trình này, trung tâm dịch vụ có thể cung cấp dịch vụ chuyên nghiệp và hiệu quả cho khách hàng.
