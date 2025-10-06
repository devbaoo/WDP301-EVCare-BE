# Test Multiple Technicians Feature

## 🔧 **Service Types với Min/Max Technicians:**

### 1. Small Services (1 technician)

```json
{
  "name": "Oil Change",
  "category": "maintenance",
  "serviceDetails": {
    "duration": 30,
    "complexity": "easy",
    "minTechnicians": 1,
    "maxTechnicians": 1
  },
  "pricing": { "basePrice": 200000 }
}
```

### 2. Medium Services (1-2 technicians)

```json
{
  "name": "Battery Replacement",
  "category": "maintenance",
  "serviceDetails": {
    "duration": 90,
    "complexity": "medium",
    "minTechnicians": 1,
    "maxTechnicians": 2
  },
  "pricing": { "basePrice": 1500000 }
}
```

### 3. Large Services (2-4 technicians)

```json
{
  "name": "Full Vehicle Overhaul",
  "category": "repair",
  "serviceDetails": {
    "duration": 480,
    "complexity": "expert",
    "minTechnicians": 2,
    "maxTechnicians": 4
  },
  "pricing": { "basePrice": 10000000 }
}
```

## 🧪 **Test Cases:**

### Test 1: Create Work Progress with Team

```json
POST /api/work-progress
{
  "technicianId": "primary_tech_id",
  "appointmentId": "appointment_id",
  "serviceDate": "2025-10-06",
  "technicians": [
    {
      "technicianId": "assistant_tech_id",
      "role": "assistant"
    },
    {
      "technicianId": "specialist_tech_id",
      "role": "specialist"
    }
  ]
}
```

### Test 2: Add Technician to Existing Progress

```json
POST /api/work-progress/:id/technicians
{
  "technicianId": "new_tech_id",
  "role": "assistant"
}
```

### Test 3: Remove Technician (with validation)

```json
DELETE /api/work-progress/:id/technicians/:technicianId
```

## ⚠️ **Validation Rules:**

1. **Minimum Requirements**: Không thể giảm dưới `minTechnicians`
2. **Maximum Limits**: Không thể vượt quá `maxTechnicians`
3. **Primary Protection**: Không thể xóa primary technician
4. **Duplicate Prevention**: Không thể assign cùng technician 2 lần
5. **Existence Check**: Tất cả technicians phải tồn tại trong database

## 🎯 **Benefits:**

- ✅ **Flexible Team Size** cho các loại dịch vụ khác nhau
- ✅ **Validation** đảm bảo đủ nhân lực
- ✅ **Role Management** (lead, assistant, specialist)
- ✅ **Backward Compatibility** với single technician
- ✅ **Real-time Team Updates** trong quá trình làm việc

## 📋 **API Endpoints:**

| Method | Endpoint                                           | Description                                  |
| ------ | -------------------------------------------------- | -------------------------------------------- |
| POST   | `/api/work-progress`                               | Create với team (new field: `technicians[]`) |
| POST   | `/api/work-progress/:id/technicians`               | Add technician to team                       |
| DELETE | `/api/work-progress/:id/technicians/:technicianId` | Remove from team                             |
| GET    | `/api/work-progress/:id`                           | Get với team info populated                  |

## 🔄 **Migration Notes:**

- Existing work progress records vẫn hoạt động (chỉ primary technician)
- New records có thể sử dụng team feature
- API backward compatible với single technician workflow
