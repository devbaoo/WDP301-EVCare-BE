# TECHNICIAN SCHEDULE API

## Tổng quan

Tài liệu này mô tả các API liên quan đến lịch làm việc của kỹ thuật viên (Technician Schedule) trong hệ thống EVCare. Hệ thống quản lý lịch làm việc mặc định của kỹ thuật viên từ 8h sáng đến 5h chiều, từ thứ 2 đến thứ 7 hàng tuần, và cung cấp các API để xin nghỉ phép, phê duyệt nghỉ phép.

## Luồng làm việc

1. Kỹ thuật viên có lịch làm việc mặc định từ 8h sáng đến 5h chiều, từ thứ 2 đến thứ 7
2. Kỹ thuật viên có thể xin nghỉ phép thông qua API
3. Quản lý/Admin/Staff có thể phê duyệt hoặc từ chối yêu cầu xin nghỉ
4. Kỹ thuật viên có thể xem lịch sử xin nghỉ của mình

## Các API

### 1. Tạo lịch làm việc mặc định

Tạo lịch làm việc mặc định cho kỹ thuật viên trong một khoảng thời gian.

```
POST /api/technician-schedules/default
```

**Headers:**

```
Authorization: Bearer {token}
```

**Body:**

```json
{
  "technicianId": "65f2a9b3c543a123456789ab",
  "centerId": "65f2a9b3c543a123456789cd",
  "startDate": "2025-09-23",
  "endDate": "2025-10-23"
}
```

**Response thành công (201):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "65f2a9b3c543a123456789ef",
      "technicianId": {
        "_id": "65f2a9b3c543a123456789ab",
        "firstName": "Nguyễn",
        "lastName": "Văn A",
        "email": "nguyenvana@example.com",
        "phoneNumber": "0901234567"
      },
      "centerId": {
        "_id": "65f2a9b3c543a123456789cd",
        "name": "EVCare Quận 1",
        "address": {
          "street": "123 Nguyễn Huệ",
          "ward": "Bến Nghé",
          "district": "Quận 1",
          "city": "TP. Hồ Chí Minh"
        }
      },
      "workDate": "2025-09-23T00:00:00.000Z",
      "shiftStart": "08:00",
      "shiftEnd": "17:00",
      "status": "scheduled",
      "availability": "available"
    }
    // Các lịch làm việc khác...
  ],
  "message": "Successfully created 25 default schedules"
}
```

### 2. Xin nghỉ phép

Kỹ thuật viên gửi yêu cầu xin nghỉ phép.

```
POST /api/technicians/:technicianId/leave-request
```

**Headers:**

```
Authorization: Bearer {token}
```

**Params:**

- `technicianId`: ID của kỹ thuật viên

**Body:**

```json
{
  "startDate": "2025-09-25",
  "endDate": "2025-09-27",
  "reason": "Lý do xin nghỉ phép"
}
```

**Response thành công (200):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "65f2a9b3c543a123456789ef",
      "technicianId": {
        "_id": "65f2a9b3c543a123456789ab",
        "firstName": "Nguyễn",
        "lastName": "Văn A",
        "email": "nguyenvana@example.com",
        "phoneNumber": "0901234567"
      },
      "centerId": {
        "_id": "65f2a9b3c543a123456789cd",
        "name": "EVCare Quận 1",
        "address": {
          "street": "123 Nguyễn Huệ",
          "ward": "Bến Nghé",
          "district": "Quận 1",
          "city": "TP. Hồ Chí Minh"
        }
      },
      "workDate": "2025-09-25T00:00:00.000Z",
      "status": "leave_requested",
      "leaveRequest": {
        "startDate": "2025-09-25T00:00:00.000Z",
        "endDate": "2025-09-27T23:59:59.999Z",
        "reason": "Lý do xin nghỉ phép",
        "status": "pending",
        "requestedAt": "2025-09-22T10:30:00.000Z"
      }
    }
    // Các lịch làm việc khác trong khoảng thời gian xin nghỉ...
  ],
  "message": "Leave request submitted successfully"
}
```

### 3. Phê duyệt/Từ chối yêu cầu xin nghỉ

Quản lý/Admin/Staff phê duyệt hoặc từ chối yêu cầu xin nghỉ.

```
PUT /api/technician-schedules/:scheduleId/leave-request
```

**Headers:**

```
Authorization: Bearer {token}
```

**Params:**

- `scheduleId`: ID của lịch làm việc có yêu cầu xin nghỉ

**Body:**

```json
{
  "action": "approve" // hoặc "reject"
}
```

**Response thành công (200):**

```json
{
  "success": true,
  "data": {
    "_id": "65f2a9b3c543a123456789ef",
    "technicianId": {
      "_id": "65f2a9b3c543a123456789ab",
      "firstName": "Nguyễn",
      "lastName": "Văn A",
      "email": "nguyenvana@example.com",
      "phoneNumber": "0901234567"
    },
    "centerId": {
      "_id": "65f2a9b3c543a123456789cd",
      "name": "EVCare Quận 1",
      "address": {
        "street": "123 Nguyễn Huệ",
        "ward": "Bến Nghé",
        "district": "Quận 1",
        "city": "TP. Hồ Chí Minh"
      }
    },
    "workDate": "2025-09-25T00:00:00.000Z",
    "status": "on_leave", // hoặc "scheduled" nếu từ chối
    "availability": "unavailable", // hoặc "available" nếu từ chối
    "leaveRequest": {
      "startDate": "2025-09-25T00:00:00.000Z",
      "endDate": "2025-09-27T23:59:59.999Z",
      "reason": "Lý do xin nghỉ phép",
      "status": "approved", // hoặc "rejected"
      "requestedAt": "2025-09-22T10:30:00.000Z",
      "approvedAt": "2025-09-22T14:20:00.000Z",
      "approvedBy": {
        "_id": "65f2a9b3c543a123456789gh",
        "firstName": "Trần",
        "lastName": "Văn B",
        "email": "tranvanb@example.com"
      }
    }
  },
  "message": "Leave request approved successfully" // hoặc "Leave request rejected successfully"
}
```

### 4. Lấy danh sách yêu cầu xin nghỉ đang chờ duyệt

Quản lý/Admin/Staff lấy danh sách các yêu cầu xin nghỉ đang chờ duyệt.

```
GET /api/leave-requests/pending
```

**Headers:**

```
Authorization: Bearer {token}
```

**Query Params (tùy chọn):**

- `centerId`: Lọc theo trung tâm dịch vụ

**Response thành công (200):**

```json
{
  "success": true,
  "data": [
    {
      "technicianId": "65f2a9b3c543a123456789ab",
      "technicianName": "Nguyễn Văn A",
      "startDate": "2025-09-25T00:00:00.000Z",
      "endDate": "2025-09-27T23:59:59.999Z",
      "reason": "Lý do xin nghỉ phép",
      "requestedAt": "2025-09-22T10:30:00.000Z",
      "centerId": "65f2a9b3c543a123456789cd",
      "centerName": "EVCare Quận 1",
      "scheduleIds": [
        "65f2a9b3c543a123456789ef",
        "65f2a9b3c543a123456789fg",
        "65f2a9b3c543a123456789fh"
      ]
    }
    // Các yêu cầu xin nghỉ khác...
  ]
}
```

### 5. Lấy lịch sử xin nghỉ của kỹ thuật viên

Lấy lịch sử xin nghỉ của một kỹ thuật viên.

```
GET /api/technicians/:technicianId/leave-history
```

**Headers:**

```
Authorization: Bearer {token}
```

**Params:**

- `technicianId`: ID của kỹ thuật viên

**Query Params (tùy chọn):**

- `status`: Lọc theo trạng thái ("pending", "approved", "rejected")

**Response thành công (200):**

```json
{
  "success": true,
  "data": [
    {
      "startDate": "2025-09-25T00:00:00.000Z",
      "endDate": "2025-09-27T23:59:59.999Z",
      "reason": "Lý do xin nghỉ phép",
      "status": "approved",
      "requestedAt": "2025-09-22T10:30:00.000Z",
      "approvedAt": "2025-09-22T14:20:00.000Z",
      "approvedBy": {
        "_id": "65f2a9b3c543a123456789gh",
        "firstName": "Trần",
        "lastName": "Văn B",
        "email": "tranvanb@example.com"
      },
      "scheduleIds": [
        "65f2a9b3c543a123456789ef",
        "65f2a9b3c543a123456789fg",
        "65f2a9b3c543a123456789fh"
      ]
    }
    // Các lịch sử xin nghỉ khác...
  ]
}
```

### 6. Lấy lịch làm việc của kỹ thuật viên

Lấy lịch làm việc của một kỹ thuật viên trong khoảng thời gian.

```
GET /api/technicians/:technicianId/schedules
```

**Headers:**

```
Authorization: Bearer {token}
```

**Params:**

- `technicianId`: ID của kỹ thuật viên

**Query Params (tùy chọn):**

- `startDate`: Ngày bắt đầu (YYYY-MM-DD)
- `endDate`: Ngày kết thúc (YYYY-MM-DD)

**Response thành công (200):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "65f2a9b3c543a123456789ef",
      "centerId": {
        "_id": "65f2a9b3c543a123456789cd",
        "name": "EVCare Quận 1",
        "address": {
          "street": "123 Nguyễn Huệ",
          "ward": "Bến Nghé",
          "district": "Quận 1",
          "city": "TP. Hồ Chí Minh"
        }
      },
      "workDate": "2025-09-23T00:00:00.000Z",
      "shiftStart": "08:00",
      "shiftEnd": "17:00",
      "status": "scheduled",
      "availability": "available",
      "assignedAppointments": [
        // Danh sách các cuộc hẹn được gán
      ]
    }
    // Các lịch làm việc khác...
  ]
}
```

### 7. Lấy lịch làm việc theo trung tâm dịch vụ

Lấy lịch làm việc của tất cả kỹ thuật viên tại một trung tâm dịch vụ trong một ngày cụ thể.

```
GET /api/service-centers/:centerId/schedules
```

**Headers:**

```
Authorization: Bearer {token}
```

**Params:**

- `centerId`: ID của trung tâm dịch vụ

**Query Params (tùy chọn):**

- `date`: Ngày cụ thể (YYYY-MM-DD)

**Response thành công (200):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "65f2a9b3c543a123456789ef",
      "technicianId": {
        "_id": "65f2a9b3c543a123456789ab",
        "firstName": "Nguyễn",
        "lastName": "Văn A",
        "email": "nguyenvana@example.com",
        "phoneNumber": "0901234567"
      },
      "workDate": "2025-09-23T00:00:00.000Z",
      "shiftStart": "08:00",
      "shiftEnd": "17:00",
      "status": "scheduled",
      "availability": "available"
    }
    // Các lịch làm việc khác...
  ]
}
```

### 8. Cập nhật trạng thái check-in

Kỹ thuật viên check-in khi bắt đầu ca làm việc.

```
POST /api/technician-schedules/:id/check-in
```

**Headers:**

```
Authorization: Bearer {token}
```

**Params:**

- `id`: ID của lịch làm việc

**Response thành công (200):**

```json
{
  "success": true,
  "data": {
    "_id": "65f2a9b3c543a123456789ef",
    "technicianId": {
      "_id": "65f2a9b3c543a123456789ab",
      "firstName": "Nguyễn",
      "lastName": "Văn A",
      "email": "nguyenvana@example.com",
      "phoneNumber": "0901234567"
    },
    "centerId": {
      "_id": "65f2a9b3c543a123456789cd",
      "name": "EVCare Quận 1",
      "address": {
        "street": "123 Nguyễn Huệ",
        "ward": "Bến Nghé",
        "district": "Quận 1",
        "city": "TP. Hồ Chí Minh"
      }
    },
    "workDate": "2025-09-23T00:00:00.000Z",
    "shiftStart": "08:00",
    "shiftEnd": "17:00",
    "status": "working",
    "checkInTime": "2025-09-23T08:05:30.000Z"
  },
  "message": "Check-in recorded successfully"
}
```

### 9. Cập nhật trạng thái check-out

Kỹ thuật viên check-out khi kết thúc ca làm việc.

```
POST /api/technician-schedules/:id/check-out
```

**Headers:**

```
Authorization: Bearer {token}
```

**Params:**

- `id`: ID của lịch làm việc

**Response thành công (200):**

```json
{
  "success": true,
  "data": {
    "_id": "65f2a9b3c543a123456789ef",
    "technicianId": {
      "_id": "65f2a9b3c543a123456789ab",
      "firstName": "Nguyễn",
      "lastName": "Văn A",
      "email": "nguyenvana@example.com",
      "phoneNumber": "0901234567"
    },
    "centerId": {
      "_id": "65f2a9b3c543a123456789cd",
      "name": "EVCare Quận 1",
      "address": {
        "street": "123 Nguyễn Huệ",
        "ward": "Bến Nghé",
        "district": "Quận 1",
        "city": "TP. Hồ Chí Minh"
      }
    },
    "workDate": "2025-09-23T00:00:00.000Z",
    "shiftStart": "08:00",
    "shiftEnd": "17:00",
    "status": "completed",
    "checkInTime": "2025-09-23T08:05:30.000Z",
    "checkOutTime": "2025-09-23T17:10:15.000Z",
    "actualWorkHours": 9.08,
    "overtimeHours": 0.17
  },
  "message": "Check-out recorded successfully"
}
```

## Trạng thái lịch làm việc

- `scheduled`: Đã lên lịch
- `working`: Đang làm việc (đã check-in)
- `completed`: Đã hoàn thành (đã check-out)
- `absent`: Vắng mặt
- `on_leave`: Nghỉ phép (đã được duyệt)
- `leave_requested`: Đã yêu cầu nghỉ phép (đang chờ duyệt)

## Trạng thái khả dụng

- `available`: Có thể nhận cuộc hẹn mới
- `busy`: Đang bận (đã được gán cuộc hẹn)
- `unavailable`: Không khả dụng (nghỉ phép, vắng mặt)

## Trạng thái yêu cầu nghỉ phép

- `pending`: Đang chờ duyệt
- `approved`: Đã được duyệt
- `rejected`: Đã bị từ chối

## Lưu ý triển khai Frontend

1. **Lịch làm việc mặc định**:

   - Hiển thị lịch làm việc mặc định từ 8h sáng đến 5h chiều, từ thứ 2 đến thứ 7
   - Có thể sử dụng component Calendar để hiển thị lịch làm việc

2. **Xin nghỉ phép**:

   - Cung cấp form để kỹ thuật viên nhập ngày bắt đầu, ngày kết thúc và lý do xin nghỉ
   - Hiển thị thông báo kết quả sau khi gửi yêu cầu

3. **Quản lý yêu cầu nghỉ phép**:

   - Hiển thị danh sách yêu cầu xin nghỉ đang chờ duyệt cho quản lý/admin/staff
   - Cung cấp nút phê duyệt/từ chối cho từng yêu cầu

4. **Lịch sử xin nghỉ**:

   - Hiển thị lịch sử xin nghỉ của kỹ thuật viên
   - Cung cấp bộ lọc theo trạng thái (đang chờ, đã duyệt, đã từ chối)

5. **Check-in/Check-out**:

   - Cung cấp nút check-in khi bắt đầu ca làm việc
   - Cung cấp nút check-out khi kết thúc ca làm việc
   - Hiển thị thời gian làm việc thực tế và giờ làm thêm sau khi check-out

6. **Tích hợp với hệ thống đặt lịch**:
   - Kiểm tra tính khả dụng của kỹ thuật viên trước khi gán cuộc hẹn
   - Cập nhật trạng thái khả dụng của kỹ thuật viên sau khi gán cuộc hẹn
