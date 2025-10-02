# Tài Liệu API Quản Lý Phụ Tùng

Tài liệu này cung cấp tài liệu toàn diện cho các endpoint API Quản lý Phụ tùng, bao gồm quản lý tồn kho phụ tùng và các tính năng tối ưu hóa kho hàng dựa trên AI.

## Mục Lục

1. [Xác Thực](#xác-thực)
2. [Quản Lý Phụ Tùng](#quản-lý-phụ-tùng)
3. [Quản Lý Tồn Kho](#quản-lý-tồn-kho)
4. [Dự Đoán và Tối Ưu Hóa AI](#dự-đoán-và-tối-ưu-hóa-ai)
5. [Ví Dụ Quy Trình](#ví-dụ-quy-trình)

## Xác Thực

Tất cả các endpoint API đều yêu cầu xác thực bằng JWT token. Bao gồm token trong header Authorization:

```
Authorization: Bearer <your_token>
```

Hệ thống kiểm soát truy cập dựa trên vai trò được triển khai:

- `admin`: Truy cập đầy đủ vào tất cả các endpoint
- `staff`: Truy cập để xem phụ tùng, tồn kho và tạo giao dịch
- `technician`: Truy cập hạn chế để xem phụ tùng tương thích

## Quản Lý Phụ Tùng

### Lấy Tất Cả Phụ Tùng

Lấy danh sách tất cả phụ tùng với tùy chọn lọc.

- **URL**: `/api/parts`
- **Method**: `GET`
- **Yêu Cầu Xác Thực**: Có
- **Quyền**: admin, staff
- **Tham Số Truy Vấn**:
  - `partNumber`: Lọc theo số phụ tùng (khớp một phần)
  - `partName`: Lọc theo tên phụ tùng (khớp một phần)
  - `category`: Lọc theo danh mục (khớp chính xác)
  - `isCritical`: Lọc theo trạng thái quan trọng (true/false)
  - `compatibleModel`: Lọc theo ID mẫu xe tương thích

**Ví Dụ Phản Hồi**:

```json
{
  "success": true,
  "message": "Lấy phụ tùng thành công",
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c85",
      "partNumber": "BT-12345",
      "partName": "Mô-đun Pin EV",
      "category": "battery",
      "description": "Mô-đun pin 48V cho xe điện",
      "compatibleModels": [
        {
          "_id": "60d21b4667d0d8992e610c80",
          "brand": "Tesla",
          "model": "Model 3",
          "year": 2022
        }
      ],
      "unitPrice": 1200,
      "supplierInfo": {
        "name": "EV Parts Co.",
        "contact": "contact@evparts.com",
        "leadTimeDays": 14
      },
      "isCritical": true,
      "createdAt": "2023-06-18T10:00:00.000Z",
      "updatedAt": "2023-06-18T10:00:00.000Z"
    }
  ]
}
```

### Lấy Phụ Tùng Theo ID

Lấy một phụ tùng cụ thể theo ID của nó.

- **URL**: `/api/parts/:id`
- **Method**: `GET`
- **Yêu Cầu Xác Thực**: Có
- **Quyền**: admin, staff
- **Tham Số URL**:
  - `id`: ID phụ tùng

**Ví Dụ Phản Hồi**: Giống như đối tượng phụ tùng đơn lẻ từ endpoint danh sách.

### Lấy Phụ Tùng Theo Danh Mục

Lấy phụ tùng được lọc theo danh mục.

- **URL**: `/api/parts/category/:category`
- **Method**: `GET`
- **Yêu Cầu Xác Thực**: Có
- **Quyền**: admin, staff
- **Tham Số URL**:
  - `category`: Danh mục phụ tùng (ví dụ: "battery", "motor", "brake")

**Ví Dụ Phản Hồi**: Cùng định dạng với Lấy Tất Cả Phụ Tùng.

### Lấy Phụ Tùng Tương Thích Cho Mẫu Xe

Lấy phụ tùng tương thích với một mẫu xe cụ thể.

- **URL**: `/api/vehicle-models/:vehicleModelId/compatible-parts`
- **Method**: `GET`
- **Yêu Cầu Xác Thực**: Có
- **Quyền**: admin, staff, technician
- **Tham Số URL**:
  - `vehicleModelId`: ID mẫu xe

**Ví Dụ Phản Hồi**: Cùng định dạng với Lấy Tất Cả Phụ Tùng.

### Tạo Phụ Tùng

Tạo một phụ tùng mới.

- **URL**: `/api/parts`
- **Method**: `POST`
- **Yêu Cầu Xác Thực**: Có
- **Quyền**: admin, staff
- **Nội Dung Yêu Cầu**:

```json
{
  "partNumber": "BT-12345",
  "partName": "Mô-đun Pin EV",
  "category": "battery",
  "description": "Mô-đun pin 48V cho xe điện",
  "compatibleModels": ["60d21b4667d0d8992e610c80"],
  "unitPrice": 1200,
  "supplierInfo": {
    "name": "EV Parts Co.",
    "contact": "contact@evparts.com",
    "leadTimeDays": 14
  },
  "isCritical": true
}
```

**Ví Dụ Phản Hồi**:

```json
{
  "success": true,
  "message": "Tạo phụ tùng thành công",
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "partNumber": "BT-12345",
    "partName": "Mô-đun Pin EV",
    "category": "battery",
    "description": "Mô-đun pin 48V cho xe điện",
    "compatibleModels": ["60d21b4667d0d8992e610c80"],
    "unitPrice": 1200,
    "supplierInfo": {
      "name": "EV Parts Co.",
      "contact": "contact@evparts.com",
      "leadTimeDays": 14
    },
    "isCritical": true,
    "createdAt": "2023-06-18T10:00:00.000Z",
    "updatedAt": "2023-06-18T10:00:00.000Z"
  }
}
```

### Cập Nhật Phụ Tùng

Cập nhật một phụ tùng hiện có.

- **URL**: `/api/parts/:id`
- **Method**: `PUT`
- **Yêu Cầu Xác Thực**: Có
- **Quyền**: admin, staff
- **Tham Số URL**:
  - `id`: ID phụ tùng
- **Nội Dung Yêu Cầu**: Giống như Tạo Phụ Tùng (chỉ bao gồm các trường cần cập nhật)

**Ví Dụ Phản Hồi**: Cùng định dạng với Tạo Phụ Tùng.

### Xóa Phụ Tùng

Xóa một phụ tùng.

- **URL**: `/api/parts/:id`
- **Method**: `DELETE`
- **Yêu Cầu Xác Thực**: Có
- **Quyền**: chỉ admin
- **Tham Số URL**:
  - `id`: ID phụ tùng

**Ví Dụ Phản Hồi**:

```json
{
  "success": true,
  "message": "Xóa phụ tùng thành công"
}
```

## Quản Lý Tồn Kho

### Lấy Tất Cả Tồn Kho

Lấy danh sách tất cả các mục tồn kho với tùy chọn lọc.

- **URL**: `/api/inventory`
- **Method**: `GET`
- **Yêu Cầu Xác Thực**: Có
- **Quyền**: admin, staff
- **Tham Số Truy Vấn**:
  - `centerId`: Lọc theo ID trung tâm dịch vụ
  - `partId`: Lọc theo ID phụ tùng
  - `status`: Lọc theo trạng thái (available, out_of_stock, discontinued)
  - `lowStock`: Đặt thành "true" để chỉ lấy các mục hàng tồn kho thấp

**Ví Dụ Phản Hồi**:

```json
{
  "success": true,
  "message": "Lấy danh sách tồn kho thành công",
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c90",
      "centerId": {
        "_id": "60d21b4667d0d8992e610c70",
        "name": "Trung Tâm Chăm Sóc EV Trung Tâm Thành Phố",
        "location": "123 Main St"
      },
      "partId": {
        "_id": "60d21b4667d0d8992e610c85",
        "partNumber": "BT-12345",
        "partName": "Mô-đun Pin EV",
        "category": "battery",
        "isCritical": true
      },
      "currentStock": 15,
      "minStockLevel": 5,
      "maxStockLevel": 50,
      "reorderPoint": 10,
      "lastRestockDate": "2023-06-15T10:00:00.000Z",
      "costPerUnit": 1000,
      "location": "Kệ A-12",
      "status": "available",
      "updatedAt": "2023-06-18T10:00:00.000Z"
    }
  ]
}
```

### Lấy Mục Tồn Kho Theo ID

Lấy một mục tồn kho cụ thể theo ID của nó.

- **URL**: `/api/inventory/:id`
- **Method**: `GET`
- **Yêu Cầu Xác Thực**: Có
- **Quyền**: admin, staff
- **Tham Số URL**:
  - `id`: ID mục tồn kho

**Ví Dụ Phản Hồi**: Giống như mục tồn kho đơn lẻ từ endpoint danh sách.

### Lấy Cảnh Báo Tồn Kho Thấp

Lấy các mục tồn kho có mức tồn kho dưới điểm đặt hàng lại.

- **URL**: `/api/inventory/alerts/low-stock`
- **Method**: `GET`
- **Yêu Cầu Xác Thực**: Có
- **Quyền**: admin, staff
- **Tham Số Truy Vấn**:
  - `centerId`: Lọc tùy chọn theo ID trung tâm dịch vụ

**Ví Dụ Phản Hồi**: Cùng định dạng với Lấy Tất Cả Tồn Kho.

### Lấy Thống Kê Tồn Kho

Lấy thống kê tồn kho cho một trung tâm dịch vụ.

- **URL**: `/api/service-centers/:centerId/inventory-stats`
- **Method**: `GET`
- **Yêu Cầu Xác Thực**: Có
- **Quyền**: admin, staff
- **Tham Số URL**:
  - `centerId`: ID trung tâm dịch vụ

**Ví Dụ Phản Hồi**:

```json
{
  "success": true,
  "message": "Lấy thống kê tồn kho thành công",
  "data": {
    "totalItems": 150,
    "totalStock": 2500,
    "lowStockItems": 12,
    "outOfStockItems": 3,
    "totalValue": 350000
  }
}
```

### Tạo Mục Tồn Kho

Tạo một mục tồn kho mới cho một phụ tùng tại trung tâm dịch vụ.

- **URL**: `/api/inventory`
- **Method**: `POST`
- **Yêu Cầu Xác Thực**: Có
- **Quyền**: admin, staff
- **Nội Dung Yêu Cầu**:

```json
{
  "centerId": "60d21b4667d0d8992e610c70",
  "partId": "60d21b4667d0d8992e610c85",
  "currentStock": 15,
  "minStockLevel": 5,
  "maxStockLevel": 50,
  "reorderPoint": 10,
  "costPerUnit": 1000,
  "location": "Kệ A-12"
}
```

**Ví Dụ Phản Hồi**:

```json
{
  "success": true,
  "message": "Tạo mục tồn kho thành công",
  "data": {
    "_id": "60d21b4667d0d8992e610c90",
    "centerId": "60d21b4667d0d8992e610c70",
    "partId": "60d21b4667d0d8992e610c85",
    "currentStock": 15,
    "minStockLevel": 5,
    "maxStockLevel": 50,
    "reorderPoint": 10,
    "costPerUnit": 1000,
    "location": "Kệ A-12",
    "status": "available",
    "updatedAt": "2023-06-18T10:00:00.000Z"
  }
}
```

### Cập Nhật Mục Tồn Kho

Cập nhật một mục tồn kho hiện có.

- **URL**: `/api/inventory/:id`
- **Method**: `PUT`
- **Yêu Cầu Xác Thực**: Có
- **Quyền**: admin, staff
- **Tham Số URL**:
  - `id`: ID mục tồn kho
- **Nội Dung Yêu Cầu**: Giống như Tạo Mục Tồn Kho (chỉ bao gồm các trường cần cập nhật)

**Ví Dụ Phản Hồi**: Cùng định dạng với Tạo Mục Tồn Kho.

### Tạo Giao Dịch Tồn Kho

Ghi lại một giao dịch cho một mục tồn kho (nhập kho, xuất kho hoặc điều chỉnh).

- **URL**: `/api/inventory/transactions`
- **Method**: `POST`
- **Yêu Cầu Xác Thực**: Có
- **Quyền**: admin, staff
- **Nội Dung Yêu Cầu**:

```json
{
  "inventoryId": "60d21b4667d0d8992e610c90",
  "transactionType": "in",
  "quantity": 10,
  "unitCost": 1000,
  "referenceType": "purchase",
  "referenceId": "60d21b4667d0d8992e610c95",
  "notes": "Nhập hàng từ nhà cung cấp"
}
```

**Ví Dụ Phản Hồi**:

```json
{
  "success": true,
  "message": "Tạo giao dịch và cập nhật tồn kho thành công",
  "data": {
    "_id": "60d21b4667d0d8992e610c99",
    "inventoryId": "60d21b4667d0d8992e610c90",
    "transactionType": "in",
    "quantity": 10,
    "unitCost": 1000,
    "referenceType": "purchase",
    "referenceId": "60d21b4667d0d8992e610c95",
    "notes": "Nhập hàng từ nhà cung cấp",
    "performedBy": "60d21b4667d0d8992e610c60",
    "transactionDate": "2023-06-18T10:00:00.000Z"
  }
}
```

### Lấy Giao Dịch Tồn Kho

Lấy danh sách các giao dịch tồn kho với tùy chọn lọc.

- **URL**: `/api/inventory/transactions`
- **Method**: `GET`
- **Yêu Cầu Xác Thực**: Có
- **Quyền**: admin, staff
- **Tham Số Truy Vấn**:
  - `inventoryId`: Lọc theo ID mục tồn kho
  - `transactionType`: Lọc theo loại giao dịch (in, out, adjustment, transfer)
  - `referenceType`: Lọc theo loại tham chiếu (service, purchase, adjustment, transfer)
  - `performedBy`: Lọc theo ID người dùng thực hiện giao dịch
  - `startDate`: Lọc theo ngày giao dịch (bắt đầu)
  - `endDate`: Lọc theo ngày giao dịch (kết thúc)

**Ví Dụ Phản Hồi**:

```json
{
  "success": true,
  "message": "Lấy giao dịch thành công",
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c99",
      "inventoryId": {
        "_id": "60d21b4667d0d8992e610c90",
        "centerId": {
          "_id": "60d21b4667d0d8992e610c70",
          "name": "Trung Tâm Chăm Sóc EV Trung Tâm Thành Phố",
          "location": "123 Main St"
        },
        "partId": {
          "_id": "60d21b4667d0d8992e610c85",
          "partNumber": "BT-12345",
          "partName": "Mô-đun Pin EV"
        }
      },
      "transactionType": "in",
      "quantity": 10,
      "unitCost": 1000,
      "referenceType": "purchase",
      "referenceId": "60d21b4667d0d8992e610c95",
      "notes": "Nhập hàng từ nhà cung cấp",
      "performedBy": {
        "_id": "60d21b4667d0d8992e610c60",
        "username": "staff1",
        "fullName": "John Staff"
      },
      "transactionDate": "2023-06-18T10:00:00.000Z"
    }
  ]
}
```

## Dự Đoán và Tối Ưu Hóa AI

### Lấy Tất Cả Dự Đoán

Lấy danh sách các dự đoán AI với tùy chọn lọc.

- **URL**: `/api/ai/predictions`
- **Method**: `GET`
- **Yêu Cầu Xác Thực**: Có
- **Quyền**: admin, staff
- **Tham Số Truy Vấn**:
  - `centerId`: Lọc theo ID trung tâm dịch vụ
  - `partId`: Lọc theo ID phụ tùng
  - `predictionType`: Lọc theo loại dự đoán (demand_forecast, failure_prediction, stock_optimization)
  - `predictionPeriod`: Lọc theo thời kỳ dự đoán (1_month, 3_months, 6_months)
  - `startDate`: Lọc theo ngày dự đoán (bắt đầu)
  - `endDate`: Lọc theo ngày dự đoán (kết thúc)

**Ví Dụ Phản Hồi**:

```json
{
  "success": true,
  "message": "Lấy dự đoán thành công",
  "data": [
    {
      "_id": "60d21b4667d0d8992e610ca0",
      "centerId": {
        "_id": "60d21b4667d0d8992e610c70",
        "name": "Trung Tâm Chăm Sóc EV Trung Tâm Thành Phố",
        "location": "123 Main St"
      },
      "partId": {
        "_id": "60d21b4667d0d8992e610c85",
        "partNumber": "BT-12345",
        "partName": "Mô-đun Pin EV",
        "category": "battery"
      },
      "predictionType": "demand_forecast",
      "predictedValue": 25,
      "confidenceScore": 0.85,
      "predictionPeriod": "1_month",
      "modelVersion": "1.0",
      "inputData": {
        "transactionCount": 45,
        "historicalPeriod": "1_month",
        "currentStock": 15
      },
      "createdAt": "2023-06-18T10:00:00.000Z"
    }
  ]
}
```

### Lấy Dự Đoán Theo ID

Lấy một dự đoán cụ thể theo ID của nó.

- **URL**: `/api/ai/predictions/:id`
- **Method**: `GET`
- **Yêu Cầu Xác Thực**: Có
- **Quyền**: admin, staff
- **Tham Số URL**:
  - `id`: ID dự đoán

**Ví Dụ Phản Hồi**: Giống như dự đoán đơn lẻ từ endpoint danh sách.

### Tạo Dự Báo Nhu Cầu

Tạo dự đoán dự báo nhu cầu cho các phụ tùng tại trung tâm dịch vụ.

- **URL**: `/api/ai/demand-forecast`
- **Method**: `POST`
- **Yêu Cầu Xác Thực**: Có
- **Quyền**: admin, staff
- **Nội Dung Yêu Cầu**:

```json
{
  "centerId": "60d21b4667d0d8992e610c70",
  "predictionPeriod": "1_month"
}
```

**Ví Dụ Phản Hồi**:

```json
{
  "success": true,
  "message": "Tạo dự đoán dự báo nhu cầu thành công",
  "data": [
    {
      "_id": "60d21b4667d0d8992e610ca0",
      "centerId": "60d21b4667d0d8992e610c70",
      "partId": "60d21b4667d0d8992e610c85",
      "predictionType": "demand_forecast",
      "predictedValue": 25,
      "confidenceScore": 0.85,
      "predictionPeriod": "1_month",
      "modelVersion": "1.0",
      "inputData": {
        "transactionCount": 45,
        "historicalPeriod": "1_month",
        "currentStock": 15
      },
      "createdAt": "2023-06-18T10:00:00.000Z"
    }
  ]
}
```

### Tạo Tối Ưu Hóa Tồn Kho

Tạo khuyến nghị tối ưu hóa tồn kho dựa trên dự báo nhu cầu.

- **URL**: `/api/ai/stock-optimization`
- **Method**: `POST`
- **Yêu Cầu Xác Thực**: Có
- **Quyền**: admin, staff
- **Nội Dung Yêu Cầu**:

```json
{
  "centerId": "60d21b4667d0d8992e610c70"
}
```

**Ví Dụ Phản Hồi**:

```json
{
  "success": true,
  "message": "Tạo dự đoán tối ưu hóa tồn kho thành công",
  "data": [
    {
      "_id": "60d21b4667d0d8992e610ca5",
      "centerId": "60d21b4667d0d8992e610c70",
      "partId": "60d21b4667d0d8992e610c85",
      "predictionType": "stock_optimization",
      "predictedValue": 15,
      "confidenceScore": 0.75,
      "predictionPeriod": "1_month",
      "modelVersion": "1.0",
      "inputData": {
        "forecastId": "60d21b4667d0d8992e610ca0",
        "leadTimeDays": 14,
        "dailyUsage": 0.83,
        "recommendedMinStock": 15,
        "recommendedReorderPoint": 18,
        "recommendedMaxStock": 50,
        "currentMinStock": 5,
        "currentReorderPoint": 10,
        "currentMaxStock": 50
      },
      "createdAt": "2023-06-18T10:00:00.000Z"
    }
  ]
}
```

### Áp Dụng Khuyến Nghị AI

Áp dụng khuyến nghị mức tồn kho được tạo bởi AI vào cài đặt tồn kho.

- **URL**: `/api/ai/apply-recommendations`
- **Method**: `POST`
- **Yêu Cầu Xác Thực**: Có
- **Quyền**: admin, staff
- **Nội Dung Yêu Cầu**:

```json
{
  "centerId": "60d21b4667d0d8992e610c70",
  "predictionIds": ["60d21b4667d0d8992e610ca5"]
}
```

**Ví Dụ Phản Hồi**:

```json
{
  "success": true,
  "message": "Áp dụng khuyến nghị AI thành công",
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c90",
      "centerId": "60d21b4667d0d8992e610c70",
      "partId": "60d21b4667d0d8992e610c85",
      "currentStock": 15,
      "minStockLevel": 15,
      "maxStockLevel": 50,
      "reorderPoint": 18,
      "costPerUnit": 1000,
      "location": "Kệ A-12",
      "status": "available",
      "updatedAt": "2023-06-18T10:00:00.000Z"
    }
  ]
}
```

## Ví Dụ Quy Trình

### 1. Quy Trình Quản Lý Phụ Tùng Cơ Bản

1. **Xem tất cả phụ tùng**

   ```
   GET /api/parts
   ```

2. **Thêm phụ tùng mới**

   ```
   POST /api/parts
   ```

3. **Xem phụ tùng theo danh mục**

   ```
   GET /api/parts/category/battery
   ```

4. **Cập nhật thông tin phụ tùng**
   ```
   PUT /api/parts/:id
   ```

### 2. Quy Trình Quản Lý Tồn Kho

1. **Xem tồn kho tại trung tâm dịch vụ**

   ```
   GET /api/inventory?centerId=60d21b4667d0d8992e610c70
   ```

2. **Kiểm tra các mục tồn kho thấp**

   ```
   GET /api/inventory/alerts/low-stock?centerId=60d21b4667d0d8992e610c70
   ```

3. **Thêm tồn kho cho phụ tùng mới**

   ```
   POST /api/inventory
   ```

4. **Ghi lại giao dịch nhập hàng**

   ```
   POST /api/inventory/transactions
   ```

   Với nội dung:

   ```json
   {
     "inventoryId": "60d21b4667d0d8992e610c90",
     "transactionType": "in",
     "quantity": 10,
     "unitCost": 1000,
     "referenceType": "purchase",
     "notes": "Nhập hàng hàng tháng"
   }
   ```

5. **Ghi lại giao dịch sử dụng tồn kho**
   ```
   POST /api/inventory/transactions
   ```
   Với nội dung:
   ```json
   {
     "inventoryId": "60d21b4667d0d8992e610c90",
     "transactionType": "out",
     "quantity": 2,
     "referenceType": "service",
     "referenceId": "60d21b4667d0d8992e610d10",
     "notes": "Sử dụng để sửa chữa xe"
   }
   ```

### 3. Quy Trình Tối Ưu Hóa Tồn Kho Dựa Trên AI

1. **Tạo dự báo nhu cầu**

   ```
   POST /api/ai/demand-forecast
   ```

   Với nội dung:

   ```json
   {
     "centerId": "60d21b4667d0d8992e610c70",
     "predictionPeriod": "1_month"
   }
   ```

2. **Tạo khuyến nghị tối ưu hóa tồn kho**

   ```
   POST /api/ai/stock-optimization
   ```

   Với nội dung:

   ```json
   {
     "centerId": "60d21b4667d0d8992e610c70"
   }
   ```

3. **Xem dự đoán được tạo**

   ```
   GET /api/ai/predictions?centerId=60d21b4667d0d8992e610c70&predictionType=stock_optimization
   ```

4. **Áp dụng khuyến nghị vào cài đặt tồn kho**

   ```
   POST /api/ai/apply-recommendations
   ```

   Với nội dung:

   ```json
   {
     "centerId": "60d21b4667d0d8992e610c70"
   }
   ```

5. **Xác minh cài đặt tồn kho đã cập nhật**
   ```
   GET /api/inventory?centerId=60d21b4667d0d8992e610c70
   ```

### 4. Quy Trình Sử Dụng Phụ Tùng Của Kỹ Thuật Viên

1. **Kỹ thuật viên tìm kiếm phụ tùng tương thích**

   ```
   GET /api/vehicle-models/:vehicleModelId/compatible-parts
   ```

2. **Kiểm tra tồn kho cho phụ tùng cần thiết**

   ```
   GET /api/inventory?partId=60d21b4667d0d8992e610c85&centerId=60d21b4667d0d8992e610c70
   ```

3. **Nhân viên ghi lại giao dịch sử dụng phụ tùng**

   ```
   POST /api/inventory/transactions
   ```

   Với nội dung:

   ```json
   {
     "inventoryId": "60d21b4667d0d8992e610c90",
     "transactionType": "out",
     "quantity": 1,
     "referenceType": "service",
     "referenceId": "60d21b4667d0d8992e610d10",
     "notes": "Sử dụng để thay thế pin"
   }
   ```

4. **Kiểm tra xem tồn kho có dưới điểm đặt hàng lại không**
   ```
   GET /api/inventory/alerts/low-stock?centerId=60d21b4667d0d8992e610c70
   ```
