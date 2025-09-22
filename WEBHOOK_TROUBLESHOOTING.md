# 🔧 Webhook Troubleshooting Guide

## 🚨 Vấn đề: PayOS báo lỗi 400 thay vì 200

### **Nguyên nhân:**

1. **PayOS test webhook** không gửi signature
2. **Signature verification** fail
3. **Method không được hỗ trợ** (PayOS có thể test bằng GET)

### **Giải pháp đã implement:**

#### 1. **Hỗ trợ cả GET và POST:**

```javascript
// Route hỗ trợ cả GET (test) và POST (webhook thật)
router.all("/api/payment/webhook", paymentController.handleWebhook);
```

#### 2. **Xử lý GET request (PayOS test):**

```javascript
// Handle PayOS webhook test (GET request)
if (req.method === "GET") {
  return res.status(200).json({
    success: true,
    message: "Webhook endpoint is working",
    timestamp: new Date().toISOString(),
  });
}
```

#### 3. **Endpoint health check riêng:**

```javascript
// URL: /api/payment/webhook/health
// Hỗ trợ mọi method (GET, POST, HEAD, OPTIONS)
```

## 🧪 Cách test webhook:

### **1. Test với curl:**

```bash
# Test GET (PayOS test)
curl -X GET https://dolphin-app-pwai8.ondigitalocean.app/api/payment/webhook

# Test POST (webhook thật)
curl -X POST https://dolphin-app-pwai8.ondigitalocean.app/api/payment/webhook \
  -H "Content-Type: application/json" \
  -d '{"orderCode": 123456, "status": "PAID"}'

# Test health check
curl -X GET https://dolphin-app-pwai8.ondigitalocean.app/api/payment/webhook/health
```

### **2. Test với PowerShell:**

```powershell
# Test GET
Invoke-WebRequest -Uri "https://dolphin-app-pwai8.ondigitalocean.app/api/payment/webhook" -Method GET

# Test health check
Invoke-WebRequest -Uri "https://dolphin-app-pwai8.ondigitalocean.app/api/payment/webhook/health" -Method GET
```

## 🔍 Debug steps:

### **1. Kiểm tra server logs:**

```bash
# Xem logs webhook
tail -f logs/app.log | grep webhook

# Hoặc xem console output
# Logs sẽ có format: [webhook_ID] message
```

### **2. Kiểm tra PayOS dashboard:**

- Vào PayOS merchant dashboard
- Xem webhook URL: `https://dolphin-app-pwai8.ondigitalocean.app/api/payment/webhook`
- Xem webhook logs/history
- Test webhook từ dashboard

### **3. Kiểm tra environment variables:**

```bash
# Kiểm tra PayOS config
echo $PAYOS_CLIENT_ID
echo $PAYOS_API_KEY
echo $PAYOS_CHECKSUM_KEY
echo $PAYOS_WEBHOOK_URL
```

## 🛠️ Các bước sửa lỗi:

### **Bước 1: Deploy code mới**

```bash
# Deploy code với webhook handler mới
git add .
git commit -m "Fix webhook endpoint for PayOS verification"
git push origin main
```

### **Bước 2: Test webhook endpoint**

```bash
# Test GET request (PayOS test)
curl -X GET https://dolphin-app-pwai8.ondigitalocean.app/api/payment/webhook

# Expected response:
# {
#   "success": true,
#   "message": "Webhook endpoint is working",
#   "timestamp": "2024-01-15T10:30:00.000Z"
# }
```

### **Bước 3: Cập nhật PayOS dashboard**

- Vào PayOS merchant dashboard
- Cập nhật webhook URL: `https://dolphin-app-pwai8.ondigitalocean.app/api/payment/webhook`
- Test webhook từ dashboard
- Kiểm tra response phải là 200 OK

### **Bước 4: Verify webhook hoạt động**

```bash
# Test với webhook thật
curl -X POST https://dolphin-app-pwai8.ondigitalocean.app/api/payment/webhook \
  -H "Content-Type: application/json" \
  -H "x-payos-signature: test_signature" \
  -d '{"orderCode": 123456, "status": "PAID", "amount": 100000}'
```

## 📊 Monitoring:

### **Webhook logs format:**

```
[webhook_1234567890_abc123] Webhook received: {
  "timestamp": "2024-01-15T10:30:00.000Z",
  "method": "GET",
  "url": "/api/payment/webhook",
  "headers": {
    "content-type": "application/json",
    "user-agent": "PayOS-Webhook/1.0",
    "x-payos-signature": "Present/Missing"
  }
}
```

### **Success response:**

```json
{
  "success": true,
  "message": "Webhook endpoint is working",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "webhookId": "webhook_1234567890_abc123"
}
```

### **Error response:**

```json
{
  "success": false,
  "message": "Missing webhook signature",
  "webhookId": "webhook_1234567890_abc123"
}
```

## ⚠️ Lưu ý quan trọng:

1. **PayOS test webhook** thường dùng GET request
2. **Webhook thật** sẽ dùng POST với signature
3. **Cần deploy code mới** trước khi test
4. **Kiểm tra server logs** để debug
5. **Verify PayOS dashboard** có đúng URL không

## 🎯 Next steps:

1. **Deploy code mới** với webhook handler cải tiến
2. **Test webhook endpoint** với GET request
3. **Cập nhật PayOS dashboard** với URL đúng
4. **Verify webhook** hoạt động từ PayOS
5. **Monitor logs** để đảm bảo webhook nhận được

---

**Chúc bạn fix webhook thành công! 🚀**
