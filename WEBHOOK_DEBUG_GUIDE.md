# 🔧 PayOS Webhook Debug Guide

## 🚨 Vấn đề đã sửa

### 1. **Bảo mật webhook**

- ✅ Thêm xác thực chữ ký PayOS
- ✅ Kiểm tra header `x-payos-signature`
- ✅ Sử dụng `PAYOS_CHECKSUM_KEY` để verify

### 2. **Logging chi tiết**

- ✅ Thêm webhook ID cho tracking
- ✅ Log request/response đầy đủ
- ✅ Log processing time
- ✅ Log error stack trace

### 3. **Xử lý lỗi nâng cao**

- ✅ Validate required fields
- ✅ Better error messages
- ✅ Idempotency handling
- ✅ Status mapping đầy đủ

### 4. **Testing tools**

- ✅ Test webhook endpoint
- ✅ Manual sync endpoint
- ✅ Duplicate body parsing fix

## 🧪 Cách test webhook

### 1. **Test với endpoint test**

```bash
# Test webhook với orderCode có sẵn
curl -X POST http://localhost:8080/api/payment/test-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "orderCode": 123456,
    "status": "PAID",
    "amount": 100000
  }'
```

### 2. **Test với PayOS thật**

```bash
# Tạo payment trước
curl -X POST http://localhost:8080/api/payment/booking/APPOINTMENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Sau đó test webhook với orderCode thật
curl -X POST http://localhost:8080/api/payment/test-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "orderCode": ORDER_CODE_FROM_PAYMENT,
    "status": "PAID"
  }'
```

### 3. **Manual sync từ PayOS**

```bash
curl -X POST http://localhost:8080/api/payment/sync/ORDER_CODE
```

## 🔍 Debug steps

### 1. **Kiểm tra logs**

```bash
# Xem logs webhook
tail -f logs/app.log | grep webhook

# Hoặc xem console output
# Logs sẽ có format: [webhook_ID] message
```

### 2. **Kiểm tra database**

```javascript
// Kiểm tra payment record
db.payments.findOne({ "payosInfo.orderCode": 123456 });

// Kiểm tra webhook data
db.payments.findOne({ "payosInfo.orderCode": 123456 }, { webhook: 1 });
```

### 3. **Kiểm tra PayOS config**

```bash
# Kiểm tra env variables
echo $PAYOS_CLIENT_ID
echo $PAYOS_API_KEY
echo $PAYOS_CHECKSUM_KEY
echo $PAYOS_WEBHOOK_URL
```

## 🛠️ Troubleshooting

### **Webhook không nhận được**

1. Kiểm tra `PAYOS_WEBHOOK_URL` trong PayOS dashboard
2. Kiểm tra server có accessible từ internet không
3. Kiểm tra firewall/port forwarding
4. Sử dụng ngrok cho local testing:
   ```bash
   ngrok http 8080
   # Copy URL và cập nhật PAYOS_WEBHOOK_URL
   ```

### **Webhook nhận được nhưng lỗi**

1. Kiểm tra logs với webhook ID
2. Kiểm tra signature verification
3. Kiểm tra orderCode có tồn tại trong DB không
4. Kiểm tra PayOS credentials

### **Payment không update**

1. Kiểm tra appointment có tồn tại không
2. Kiểm tra payment status mapping
3. Kiểm tra database transaction
4. Sử dụng manual sync endpoint

## 📊 Monitoring

### **Health check endpoint**

```bash
curl http://localhost:8080/api/payment/health
```

### **Webhook statistics**

- Số lượng webhook nhận được
- Tỷ lệ thành công/thất bại
- Thời gian xử lý trung bình
- Lỗi phổ biến

## 🔐 Security checklist

- [ ] `PAYOS_CHECKSUM_KEY` được set
- [ ] Webhook signature verification enabled
- [ ] Rate limiting cho webhook endpoint
- [ ] Logs không chứa sensitive data
- [ ] HTTPS cho production webhook URL

## 🚀 Production deployment

### **Environment variables**

```bash
PAYOS_CLIENT_ID=your_client_id
PAYOS_API_KEY=your_api_key
PAYOS_CHECKSUM_KEY=your_checksum_key
PAYOS_WEBHOOK_URL=https://yourdomain.com/api/payment/webhook
NODE_ENV=production
```

### **Monitoring setup**

- Set up alerts cho webhook failures
- Monitor webhook response times
- Track payment success rates
- Log analysis cho debugging

## 📝 Test cases

### **Happy path**

1. Tạo payment → PayOS success → Webhook PAID → Payment updated
2. Tạo payment → PayOS cancel → Webhook CANCELLED → Payment cancelled

### **Edge cases**

1. Duplicate webhook → Should be ignored
2. Invalid signature → Should be rejected
3. Missing orderCode → Should return error
4. Payment not found → Should return error
5. Invalid status → Should log warning

### **Error scenarios**

1. Database connection error
2. PayOS API timeout
3. Invalid webhook format
4. Network issues

---

## 🎯 Next steps

1. **Test webhook với PayOS sandbox**
2. **Monitor logs trong 24h**
3. **Set up production monitoring**
4. **Document webhook events**
5. **Create webhook retry mechanism**

Chúc bạn debug thành công! 🎉
