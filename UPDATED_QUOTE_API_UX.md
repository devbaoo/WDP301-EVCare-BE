# Test Quote API với cấu trúc tối ưu UX

## ✅ Changes đã thực hiện:

1. **Model Updates:**

   - `workProgressTracking.js`: `quoteDetails` từ `String` → `Mixed`
   - `appointment.js`: `inspectionAndQuote.quoteDetails` từ `String` → `Mixed`

2. **Service Updates:**

   - Thêm helper function `calculateQuoteAmount()` chỉ tính từ items
   - **Loại bỏ labor** - không cần thiết
   - **Auto-calculate `quoteAmount`** - không cần nhập manual
   - **Always override** quoteAmount với calculated value
   - Support backward compatibility với string format

3. **Controller Updates:**
   - Loại bỏ validation cho labor
   - **Không yêu cầu quoteAmount** từ request
   - Require ít nhất 1 item trong quoteDetails
   - Enhanced validation cho items structure

## 🧪 Test Cases:

### New: Quote BEFORE creating Work Progress (by Appointment)

Request:

```json
POST /api/appointments/:appointmentId/inspection-quote
{
  "vehicleCondition": "Ổn định",
  "diagnosisDetails": "Cần thay dầu và lọc",
  "inspectionNotes": "Không lỗi nghiêm trọng",
  "quoteDetails": {
    "items": [
      { "partId": "6752b1234567890abcdef123", "quantity": 1, "unitPrice": 200000, "name": "Dầu" },
      { "partId": "6752b1234567890abcdef124", "quantity": 1, "unitPrice": 300000, "name": "Lọc dầu" }
    ]
  }
}
```

Response:

```json
200 OK
{
  "success": true,
  "data": {
    "_id": "<appointmentId>",
    "status": "quote_provided",
    "inspectionAndQuote": {
      "vehicleCondition": "Ổn định",
      "diagnosisDetails": "Cần thay dầu và lọc",
      "inspectionNotes": "Không lỗi nghiêm trọng",
      "quoteAmount": 500000,
      "quoteDetails": {
        "items": [
          { "partId": "6752b1234567890abcdef123", "quantity": 1, "unitPrice": 200000, "name": "Dầu" },
          { "partId": "6752b1234567890abcdef124", "quantity": 1, "unitPrice": 300000, "name": "Lọc dầu" }
        ]
      },
      "quoteStatus": "pending",
      "quotedAt": "2025-10-29T07:00:00.000Z",
      "inspectionCompletedAt": "2025-10-29T07:00:00.000Z"
    }
  },
  "message": "Inspection completed and quote provided successfully"
}
```

Approve/Reject quote (by Appointment):

```json
PUT /api/appointments/:appointmentId/quote-response
{ "status": "approved", "notes": "Đồng ý" }

200 OK
{
  "success": true,
  "data": {
    "_id": "<appointmentId>",
    "status": "quote_approved",
    "inspectionAndQuote": {
      "quoteStatus": "approved",
      "customerResponseAt": "2025-10-29T07:05:00.000Z",
      "customerResponseNotes": "Đồng ý"
    }
  },
  "message": "Quote approved successfully"
}
```

View quote (by Appointment):

```json
GET /api/appointments/:appointmentId/quote

200 OK
{
  "success": true,
  "data": {
    "appointmentId": "<appointmentId>",
    "status": "quote_provided",
    "quote": {
      "vehicleCondition": "...",
      "diagnosisDetails": "...",
      "inspectionNotes": "...",
      "quoteAmount": 500000,
      "quoteDetails": { "items": [ /* ... */ ] },
      "quoteStatus": "pending",
      "quotedAt": "...",
      "inspectionCompletedAt": "..."
    }
  }
}
```

Business rule: Work Progress chỉ được tạo khi `appointment.status === "quote_approved"` hoặc `inspectionAndQuote.quoteStatus === "approved"`.

### Test 1: Optimal UX Format (Technician chỉ select parts)

```json
POST /api/work-progress/:id/inspection-quote
{
  "vehicleCondition": "Ổn định",
  "diagnosisDetails": "Cần thay dầu và lọc",
  "inspectionNotes": "Không lỗi nghiêm trọng",
  "quoteDetails": {
    "items": [
      { "partId": "6752b1234567890abcdef123", "quantity": 1, "unitPrice": 200000, "name": "Dầu" },
      { "partId": "6752b1234567890abcdef124", "quantity": 1, "unitPrice": 300000, "name": "Lọc dầu" }
    ]
  }
}
```

*Expected: Auto-calculate quoteAmount = 1*200000 + 1*300000 = 500000*

### Test 2: Frontend workflow - Load parts từ API

```json
// 1. GET /api/parts để load parts list
GET /api/parts?category=oil,filter

Response:
{
  "data": [
    {
      "_id": "6752b1234567890abcdef123",
      "partName": "Dầu synthetic 5W-30",
      "unitPrice": 200000,
      "category": "oil"
    },
    {
      "_id": "6752b1234567890abcdef124",
      "partName": "Lọc dầu premium",
      "unitPrice": 300000,
      "category": "filter"
    }
  ]
}

// 2. Technician select parts trên UI → auto-fill request
POST /api/work-progress/:id/inspection-quote
{
  "vehicleCondition": "Cần bảo dưỡng định kỳ",
  "diagnosisDetails": "Thay dầu và lọc",
  "quoteDetails": {
    "items": [
      { "partId": "6752b1234567890abcdef123", "quantity": 1, "unitPrice": 200000, "name": "Dầu synthetic 5W-30" },
      { "partId": "6752b1234567890abcdef124", "quantity": 1, "unitPrice": 300000, "name": "Lọc dầu premium" }
    ]
  }
}
```

### Test 3: Legacy Format (vẫn hoạt động)

```json
POST /api/work-progress/:id/inspection-quote
{
  "vehicleCondition": "Xe có vấn đề",
  "diagnosisDetails": "Cần sửa chữa",
  "quoteDetails": "Chi phí sửa chữa: 1,500,000 VND"
}
```

### Test 4: Validation Errors

```json
POST /api/work-progress/:id/inspection-quote
{
  "vehicleCondition": "Test",
  "diagnosisDetails": "Test",
  "quoteDetails": {
    "items": []
  }
}
```

_Expected: Error "Quote must have at least one item"_

## 🎯 Frontend UX Flow:

### **Step 1**: Load parts dropdown

```javascript
fetch("/api/parts")
  .then((res) => res.json())
  .then((data) => {
    const parts = data.data;
    // Populate select dropdown with parts
  });
```

### **Step 2**: User-friendly selection UI

```html
<div class="parts-selector">
  <h3>Chọn linh kiện cần thay:</h3>

  <div class="part-item" v-for="part in availableParts" :key="part._id">
    <input type="checkbox" :value="part._id" v-model="selectedParts" />
    <label>
      <strong>{{part.partName}}</strong> - {{part.unitPrice.toLocaleString()}}
      VND
    </label>
    <input
      type="number"
      placeholder="Số lượng"
      min="1"
      v-model="quantities[part._id]"
    />
  </div>
</div>

<div class="total-display">
  <h3>Tổng cộng: {{calculatedTotal.toLocaleString()}} VND</h3>
</div>
```

### **Step 3**: Auto-submit optimized request

```javascript
const submitQuote = () => {
  const items = selectedParts.map((partId) => {
    const part = availableParts.find((p) => p._id === partId);
    return {
      partId: partId,
      quantity: quantities[partId] || 1,
      unitPrice: part.unitPrice,
      name: part.partName,
    };
  });

  const requestBody = {
    vehicleCondition: form.vehicleCondition,
    diagnosisDetails: form.diagnosisDetails,
    inspectionNotes: form.inspectionNotes,
    quoteDetails: { items },
    // No quoteAmount needed - auto-calculated!
  };

  fetch(`/api/work-progress/${workProgressId}/inspection-quote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(requestBody),
  });
};
```

## 🚀 UX Benefits:

1. **✅ Zero manual pricing** - All prices from database
2. **✅ Real-time calculation** - Total updates as user selects
3. **✅ Error prevention** - No manual number entry for amounts
4. **✅ Consistent pricing** - Always uses current database prices
5. **✅ Auto inventory** - Parts reserved on approval
6. **✅ Mobile friendly** - Simple checkboxes and dropdowns

## 📝 Notes:

- ✅ Technician chỉ cần: Select parts + Enter quantities
- ✅ Price tự động load từ database
- ✅ Total tự động calculate
- ✅ Labor removed - simplify workflow
- ✅ Backward compatibility maintained
