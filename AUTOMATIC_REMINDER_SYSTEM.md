# Hệ thống Tự động Gửi Nhắc nhở (Automatic Reminder System)

## 🎯 Tổng quan

Hệ thống tự động gửi nhắc nhở sẽ **tự động chạy** các reminder APIs dựa trên lịch trình đã định sẵn, không cần admin gọi thủ công.

## ⏰ Lịch trình Tự động

### 1. **Maintenance Reminders (Nhắc nhở Bảo dưỡng)**

- **Thời gian**: Hàng ngày lúc **9:00 AM** (GMT+7)
- **Cron**: `0 9 * * *`
- **Chức năng**:
  - Nhắc nhở xe cần bảo dưỡng theo thời gian (1 tháng trước)
  - Nhắc nhở xe cần bảo dưỡng theo km (500km trước)
  - Chỉ gửi cho user đã bật `email.maintenanceReminders: true`

### 2. **Package Renewal Reminders (Nhắc nhở Gia hạn Gói)**

- **Thời gian**: Hàng ngày lúc **10:00 AM** (GMT+7)
- **Cron**: `0 10 * * *`
- **Chức năng**:
  - Nhắc nhở gói sắp hết hạn (7 ngày trước)
  - Nhắc nhở gói hết dịch vụ (còn 1 dịch vụ)
  - Nhắc nhở gói chưa thanh toán
  - Chỉ gửi cho user đã bật `email.packageRenewalReminders: true`

### 3. **Weekly Maintenance Check (Kiểm tra Bảo dưỡng Hàng tuần)**

- **Thời gian**: Chủ nhật lúc **8:00 AM** (GMT+7)
- **Cron**: `0 8 * * 0`
- **Chức năng**:
  - Kiểm tra xe cần bảo dưỡng gấp (2 tuần trước)
  - Kiểm tra xe cần bảo dưỡng gấp (200km trước)
  - Bổ sung cho daily reminders

## 🚀 Khởi động Tự động

Khi server khởi động, cron service sẽ **tự động bắt đầu**:

```javascript
// server.js
cronService.start();
```

**Log khi khởi động:**

```
🚀 Backend Nodejs is running on port: 8080
📅 Automated reminder system is active
⏰ Maintenance reminders: Daily at 9:00 AM
⏰ Package renewal reminders: Daily at 10:00 AM
⏰ Weekly maintenance check: Sundays at 8:00 AM
```

## 🔧 API Quản lý Cron (Admin Only)

### Lấy trạng thái cron service

```http
GET /api/cron/status
Authorization: Bearer <admin_token>
```

### Khởi động cron service

```http
POST /api/cron/start
Authorization: Bearer <admin_token>
```

### Dừng cron service

```http
POST /api/cron/stop
Authorization: Bearer <admin_token>
```

### Chạy thủ công một job

```http
POST /api/cron/run/{jobName}
Authorization: Bearer <admin_token>
```

**Available job names:**

- `maintenance-daily` - Chạy maintenance reminders
- `package-daily` - Chạy package renewal reminders
- `maintenance-weekly` - Chạy weekly maintenance check

### Lấy danh sách jobs

```http
GET /api/cron/jobs
Authorization: Bearer <admin_token>
```

## 📊 Cách hoạt động

### 1. **Tự động chạy theo lịch**

- Server khởi động → Cron service tự động start
- Mỗi ngày 9:00 AM → Chạy maintenance reminders
- Mỗi ngày 10:00 AM → Chạy package renewal reminders
- Chủ nhật 8:00 AM → Chạy weekly maintenance check

### 2. **Kiểm tra Email Preferences**

- Mỗi lần chạy, hệ thống sẽ:
  - Lấy danh sách vehicles/packages cần nhắc nhở
  - Kiểm tra `notificationSettings.email` của từng user
  - Chỉ gửi email cho user đã bật notification
  - Bỏ qua user đã tắt notification

### 3. **Logging chi tiết**

```
Running daily maintenance reminders...
Found 5 active vehicles to check for maintenance reminders
Vehicle 68c520b70d7c29c4611c2a58 owner has disabled maintenance reminder emails, skipping
Sent maintenance reminder for vehicle 68c520b70d7c29c4611c2a59 to user@example.com
Maintenance reminders result: { success: true, data: { remindersSent: 3 } }
```

## 🧪 Test Hệ thống

### Test 1: Kiểm tra trạng thái

```bash
GET /api/cron/status
```

### Test 2: Chạy thủ công maintenance reminders

```bash
POST /api/cron/run/maintenance-daily
```

### Test 3: Chạy thủ công package renewal reminders

```bash
POST /api/cron/run/package-daily
```

### Test 4: Dừng và khởi động lại

```bash
POST /api/cron/stop
POST /api/cron/start
```

## ⚙️ Cấu hình

### Thay đổi lịch trình

Sửa file `src/services/cronService.js`:

```javascript
// Thay đổi từ 9:00 AM thành 8:00 AM
const maintenanceJob = cron.schedule("0 8 * * *", async () => {
  // ...
});

// Thay đổi từ hàng ngày thành mỗi 2 ngày
const maintenanceJob = cron.schedule("0 9 */2 * *", async () => {
  // ...
});
```

### Thay đổi tham số nhắc nhở

```javascript
const result = await reminderService.runMaintenanceReminders({
  monthsThreshold: 2, // Thay đổi từ 1 thành 2 tháng
  kmThreshold: 1000, // Thay đổi từ 500 thành 1000km
  limit: 2000, // Thay đổi từ 1000 thành 2000
});
```

## 🎯 Kết quả

**Trước đây:**

- ❌ Admin phải gọi thủ công `/api/reminders/maintenance/run`
- ❌ Admin phải gọi thủ công `/api/reminders/packages/run`
- ❌ Dễ quên, không đều đặn

**Bây giờ:**

- ✅ **Tự động chạy** theo lịch trình
- ✅ **Tôn trọng email preferences** của từng user
- ✅ **Đều đặn, không bỏ sót**
- ✅ **Có thể quản lý** qua API
- ✅ **Logging chi tiết** để debug

## 🔍 Monitoring

Để theo dõi hệ thống hoạt động:

1. **Xem logs server** - sẽ thấy các job chạy theo lịch
2. **Gọi API status** - kiểm tra trạng thái jobs
3. **Kiểm tra email** - xem user có nhận được nhắc nhở không
4. **Test thủ công** - chạy jobs để kiểm tra

Hệ thống giờ đây **hoàn toàn tự động** và **thông minh**! 🚗⚡
