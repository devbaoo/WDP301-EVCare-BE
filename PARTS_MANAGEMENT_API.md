# Parts Management API Documentation

This document provides comprehensive documentation for the Parts Management API endpoints, including parts inventory management and AI-driven stock optimization features.

## Table of Contents

1. [Authentication](#authentication)
2. [Parts Management](#parts-management)
3. [Inventory Management](#inventory-management)
4. [AI Prediction and Optimization](#ai-prediction-and-optimization)
5. [Workflow Examples](#workflow-examples)

## Authentication

All API endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_token>
```

Role-based access control is implemented:

- `admin`: Full access to all endpoints
- `manager`: Access to most endpoints except deletion operations
- `staff`: Access to view parts, inventory, and create transactions
- `technician`: Limited access to view compatible parts

## Parts Management

### Get All Parts

Retrieves a list of all parts with optional filtering.

- **URL**: `/api/parts`
- **Method**: `GET`
- **Auth Required**: Yes
- **Permissions**: admin, manager, staff
- **Query Parameters**:
  - `partNumber`: Filter by part number (partial match)
  - `partName`: Filter by part name (partial match)
  - `category`: Filter by category (exact match)
  - `isCritical`: Filter by critical status (true/false)
  - `compatibleModel`: Filter by compatible vehicle model ID

**Response Example**:

```json
{
  "success": true,
  "message": "Parts retrieved successfully",
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c85",
      "partNumber": "BT-12345",
      "partName": "EV Battery Module",
      "category": "battery",
      "description": "48V battery module for electric vehicles",
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

### Get Part by ID

Retrieves a specific part by its ID.

- **URL**: `/api/parts/:id`
- **Method**: `GET`
- **Auth Required**: Yes
- **Permissions**: admin, manager, staff
- **URL Parameters**:
  - `id`: Part ID

**Response Example**: Same as single part object from the list endpoint.

### Get Parts by Category

Retrieves parts filtered by category.

- **URL**: `/api/parts/category/:category`
- **Method**: `GET`
- **Auth Required**: Yes
- **Permissions**: admin, manager, staff
- **URL Parameters**:
  - `category`: Part category (e.g., "battery", "motor", "brake")

**Response Example**: Same format as Get All Parts.

### Get Compatible Parts for Vehicle Model

Retrieves parts compatible with a specific vehicle model.

- **URL**: `/api/vehicle-models/:vehicleModelId/compatible-parts`
- **Method**: `GET`
- **Auth Required**: Yes
- **Permissions**: admin, manager, staff, technician
- **URL Parameters**:
  - `vehicleModelId`: Vehicle model ID

**Response Example**: Same format as Get All Parts.

### Create Part

Creates a new part.

- **URL**: `/api/parts`
- **Method**: `POST`
- **Auth Required**: Yes
- **Permissions**: admin, manager
- **Request Body**:

```json
{
  "partNumber": "BT-12345",
  "partName": "EV Battery Module",
  "category": "battery",
  "description": "48V battery module for electric vehicles",
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

**Response Example**:

```json
{
  "success": true,
  "message": "Part created successfully",
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "partNumber": "BT-12345",
    "partName": "EV Battery Module",
    "category": "battery",
    "description": "48V battery module for electric vehicles",
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

### Update Part

Updates an existing part.

- **URL**: `/api/parts/:id`
- **Method**: `PUT`
- **Auth Required**: Yes
- **Permissions**: admin, manager
- **URL Parameters**:
  - `id`: Part ID
- **Request Body**: Same as Create Part (only include fields to update)

**Response Example**: Same format as Create Part.

### Delete Part

Deletes a part.

- **URL**: `/api/parts/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes
- **Permissions**: admin only
- **URL Parameters**:
  - `id`: Part ID

**Response Example**:

```json
{
  "success": true,
  "message": "Part deleted successfully"
}
```

## Inventory Management

### Get All Inventory

Retrieves a list of all inventory items with optional filtering.

- **URL**: `/api/inventory`
- **Method**: `GET`
- **Auth Required**: Yes
- **Permissions**: admin, manager, staff
- **Query Parameters**:
  - `centerId`: Filter by service center ID
  - `partId`: Filter by part ID
  - `status`: Filter by status (available, out_of_stock, discontinued)
  - `lowStock`: Set to "true" to get only low stock items

**Response Example**:

```json
{
  "success": true,
  "message": "Inventory items retrieved successfully",
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c90",
      "centerId": {
        "_id": "60d21b4667d0d8992e610c70",
        "name": "EV Care Center Downtown",
        "location": "123 Main St"
      },
      "partId": {
        "_id": "60d21b4667d0d8992e610c85",
        "partNumber": "BT-12345",
        "partName": "EV Battery Module",
        "category": "battery",
        "isCritical": true
      },
      "currentStock": 15,
      "minStockLevel": 5,
      "maxStockLevel": 50,
      "reorderPoint": 10,
      "lastRestockDate": "2023-06-15T10:00:00.000Z",
      "costPerUnit": 1000,
      "location": "Shelf A-12",
      "status": "available",
      "updatedAt": "2023-06-18T10:00:00.000Z"
    }
  ]
}
```

### Get Inventory Item by ID

Retrieves a specific inventory item by its ID.

- **URL**: `/api/inventory/:id`
- **Method**: `GET`
- **Auth Required**: Yes
- **Permissions**: admin, manager, staff
- **URL Parameters**:
  - `id`: Inventory item ID

**Response Example**: Same as single inventory item from the list endpoint.

### Get Low Stock Alerts

Retrieves inventory items with stock levels below their reorder points.

- **URL**: `/api/inventory/alerts/low-stock`
- **Method**: `GET`
- **Auth Required**: Yes
- **Permissions**: admin, manager, staff
- **Query Parameters**:
  - `centerId`: Optional filter by service center ID

**Response Example**: Same format as Get All Inventory.

### Get Inventory Statistics

Retrieves inventory statistics for a service center.

- **URL**: `/api/service-centers/:centerId/inventory-stats`
- **Method**: `GET`
- **Auth Required**: Yes
- **Permissions**: admin, manager, staff
- **URL Parameters**:
  - `centerId`: Service center ID

**Response Example**:

```json
{
  "success": true,
  "message": "Inventory statistics retrieved successfully",
  "data": {
    "totalItems": 150,
    "totalStock": 2500,
    "lowStockItems": 12,
    "outOfStockItems": 3,
    "totalValue": 350000
  }
}
```

### Create Inventory Item

Creates a new inventory item for a part at a service center.

- **URL**: `/api/inventory`
- **Method**: `POST`
- **Auth Required**: Yes
- **Permissions**: admin, manager
- **Request Body**:

```json
{
  "centerId": "60d21b4667d0d8992e610c70",
  "partId": "60d21b4667d0d8992e610c85",
  "currentStock": 15,
  "minStockLevel": 5,
  "maxStockLevel": 50,
  "reorderPoint": 10,
  "costPerUnit": 1000,
  "location": "Shelf A-12"
}
```

**Response Example**:

```json
{
  "success": true,
  "message": "Inventory item created successfully",
  "data": {
    "_id": "60d21b4667d0d8992e610c90",
    "centerId": "60d21b4667d0d8992e610c70",
    "partId": "60d21b4667d0d8992e610c85",
    "currentStock": 15,
    "minStockLevel": 5,
    "maxStockLevel": 50,
    "reorderPoint": 10,
    "costPerUnit": 1000,
    "location": "Shelf A-12",
    "status": "available",
    "updatedAt": "2023-06-18T10:00:00.000Z"
  }
}
```

### Update Inventory Item

Updates an existing inventory item.

- **URL**: `/api/inventory/:id`
- **Method**: `PUT`
- **Auth Required**: Yes
- **Permissions**: admin, manager
- **URL Parameters**:
  - `id`: Inventory item ID
- **Request Body**: Same as Create Inventory Item (only include fields to update)

**Response Example**: Same format as Create Inventory Item.

### Create Inventory Transaction

Records a transaction for an inventory item (stock in, out, or adjustment).

- **URL**: `/api/inventory/transactions`
- **Method**: `POST`
- **Auth Required**: Yes
- **Permissions**: admin, manager, staff
- **Request Body**:

```json
{
  "inventoryId": "60d21b4667d0d8992e610c90",
  "transactionType": "in",
  "quantity": 10,
  "unitCost": 1000,
  "referenceType": "purchase",
  "referenceId": "60d21b4667d0d8992e610c95",
  "notes": "Restocking from supplier"
}
```

**Response Example**:

```json
{
  "success": true,
  "message": "Transaction created and inventory updated successfully",
  "data": {
    "_id": "60d21b4667d0d8992e610c99",
    "inventoryId": "60d21b4667d0d8992e610c90",
    "transactionType": "in",
    "quantity": 10,
    "unitCost": 1000,
    "referenceType": "purchase",
    "referenceId": "60d21b4667d0d8992e610c95",
    "notes": "Restocking from supplier",
    "performedBy": "60d21b4667d0d8992e610c60",
    "transactionDate": "2023-06-18T10:00:00.000Z"
  }
}
```

### Get Inventory Transactions

Retrieves a list of inventory transactions with optional filtering.

- **URL**: `/api/inventory/transactions`
- **Method**: `GET`
- **Auth Required**: Yes
- **Permissions**: admin, manager, staff
- **Query Parameters**:
  - `inventoryId`: Filter by inventory item ID
  - `transactionType`: Filter by transaction type (in, out, adjustment, transfer)
  - `referenceType`: Filter by reference type (service, purchase, adjustment, transfer)
  - `performedBy`: Filter by user ID who performed the transaction
  - `startDate`: Filter by transaction date (start)
  - `endDate`: Filter by transaction date (end)

**Response Example**:

```json
{
  "success": true,
  "message": "Transactions retrieved successfully",
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c99",
      "inventoryId": {
        "_id": "60d21b4667d0d8992e610c90",
        "centerId": {
          "_id": "60d21b4667d0d8992e610c70",
          "name": "EV Care Center Downtown",
          "location": "123 Main St"
        },
        "partId": {
          "_id": "60d21b4667d0d8992e610c85",
          "partNumber": "BT-12345",
          "partName": "EV Battery Module"
        }
      },
      "transactionType": "in",
      "quantity": 10,
      "unitCost": 1000,
      "referenceType": "purchase",
      "referenceId": "60d21b4667d0d8992e610c95",
      "notes": "Restocking from supplier",
      "performedBy": {
        "_id": "60d21b4667d0d8992e610c60",
        "username": "manager1",
        "fullName": "John Manager"
      },
      "transactionDate": "2023-06-18T10:00:00.000Z"
    }
  ]
}
```

## AI Prediction and Optimization

### Get All Predictions

Retrieves a list of AI predictions with optional filtering.

- **URL**: `/api/ai/predictions`
- **Method**: `GET`
- **Auth Required**: Yes
- **Permissions**: admin, manager, staff
- **Query Parameters**:
  - `centerId`: Filter by service center ID
  - `partId`: Filter by part ID
  - `predictionType`: Filter by prediction type (demand_forecast, failure_prediction, stock_optimization)
  - `predictionPeriod`: Filter by prediction period (1_month, 3_months, 6_months)
  - `startDate`: Filter by prediction date (start)
  - `endDate`: Filter by prediction date (end)

**Response Example**:

```json
{
  "success": true,
  "message": "Predictions retrieved successfully",
  "data": [
    {
      "_id": "60d21b4667d0d8992e610ca0",
      "centerId": {
        "_id": "60d21b4667d0d8992e610c70",
        "name": "EV Care Center Downtown",
        "location": "123 Main St"
      },
      "partId": {
        "_id": "60d21b4667d0d8992e610c85",
        "partNumber": "BT-12345",
        "partName": "EV Battery Module",
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

### Get Prediction by ID

Retrieves a specific prediction by its ID.

- **URL**: `/api/ai/predictions/:id`
- **Method**: `GET`
- **Auth Required**: Yes
- **Permissions**: admin, manager, staff
- **URL Parameters**:
  - `id`: Prediction ID

**Response Example**: Same as single prediction from the list endpoint.

### Generate Demand Forecast

Generates demand forecast predictions for parts at a service center.

- **URL**: `/api/ai/demand-forecast`
- **Method**: `POST`
- **Auth Required**: Yes
- **Permissions**: admin, manager
- **Request Body**:

```json
{
  "centerId": "60d21b4667d0d8992e610c70",
  "predictionPeriod": "1_month"
}
```

**Response Example**:

```json
{
  "success": true,
  "message": "Demand forecast predictions generated successfully",
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

### Generate Stock Optimization

Generates stock optimization recommendations based on demand forecasts.

- **URL**: `/api/ai/stock-optimization`
- **Method**: `POST`
- **Auth Required**: Yes
- **Permissions**: admin, manager
- **Request Body**:

```json
{
  "centerId": "60d21b4667d0d8992e610c70"
}
```

**Response Example**:

```json
{
  "success": true,
  "message": "Stock optimization predictions generated successfully",
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

### Apply AI Recommendations

Applies AI-generated stock level recommendations to inventory settings.

- **URL**: `/api/ai/apply-recommendations`
- **Method**: `POST`
- **Auth Required**: Yes
- **Permissions**: admin, manager
- **Request Body**:

```json
{
  "centerId": "60d21b4667d0d8992e610c70",
  "predictionIds": ["60d21b4667d0d8992e610ca5"]
}
```

**Response Example**:

```json
{
  "success": true,
  "message": "AI recommendations applied successfully",
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
      "location": "Shelf A-12",
      "status": "available",
      "updatedAt": "2023-06-18T10:00:00.000Z"
    }
  ]
}
```

## Workflow Examples

### 1. Basic Parts Management Workflow

1. **View all parts**

   ```
   GET /api/parts
   ```

2. **Add a new part**

   ```
   POST /api/parts
   ```

3. **View parts by category**

   ```
   GET /api/parts/category/battery
   ```

4. **Update part information**
   ```
   PUT /api/parts/:id
   ```

### 2. Inventory Management Workflow

1. **View inventory at a service center**

   ```
   GET /api/inventory?centerId=60d21b4667d0d8992e610c70
   ```

2. **Check for low stock items**

   ```
   GET /api/inventory/alerts/low-stock?centerId=60d21b4667d0d8992e610c70
   ```

3. **Add inventory for a new part**

   ```
   POST /api/inventory
   ```

4. **Record a stock receipt transaction**

   ```
   POST /api/inventory/transactions
   ```

   With body:

   ```json
   {
     "inventoryId": "60d21b4667d0d8992e610c90",
     "transactionType": "in",
     "quantity": 10,
     "unitCost": 1000,
     "referenceType": "purchase",
     "notes": "Monthly restock"
   }
   ```

5. **Record a stock usage transaction**
   ```
   POST /api/inventory/transactions
   ```
   With body:
   ```json
   {
     "inventoryId": "60d21b4667d0d8992e610c90",
     "transactionType": "out",
     "quantity": 2,
     "referenceType": "service",
     "referenceId": "60d21b4667d0d8992e610d10",
     "notes": "Used for vehicle repair"
   }
   ```

### 3. AI-Driven Inventory Optimization Workflow

1. **Generate demand forecasts**

   ```
   POST /api/ai/demand-forecast
   ```

   With body:

   ```json
   {
     "centerId": "60d21b4667d0d8992e610c70",
     "predictionPeriod": "1_month"
   }
   ```

2. **Generate stock optimization recommendations**

   ```
   POST /api/ai/stock-optimization
   ```

   With body:

   ```json
   {
     "centerId": "60d21b4667d0d8992e610c70"
   }
   ```

3. **View generated predictions**

   ```
   GET /api/ai/predictions?centerId=60d21b4667d0d8992e610c70&predictionType=stock_optimization
   ```

4. **Apply recommendations to inventory settings**

   ```
   POST /api/ai/apply-recommendations
   ```

   With body:

   ```json
   {
     "centerId": "60d21b4667d0d8992e610c70"
   }
   ```

5. **Verify updated inventory settings**
   ```
   GET /api/inventory?centerId=60d21b4667d0d8992e610c70
   ```

### 4. Technician Parts Usage Workflow

1. **Technician searches for compatible parts**

   ```
   GET /api/vehicle-models/:vehicleModelId/compatible-parts
   ```

2. **Check inventory for the required part**

   ```
   GET /api/inventory?partId=60d21b4667d0d8992e610c85&centerId=60d21b4667d0d8992e610c70
   ```

3. **Staff records part usage transaction**

   ```
   POST /api/inventory/transactions
   ```

   With body:

   ```json
   {
     "inventoryId": "60d21b4667d0d8992e610c90",
     "transactionType": "out",
     "quantity": 1,
     "referenceType": "service",
     "referenceId": "60d21b4667d0d8992e610d10",
     "notes": "Used for battery replacement"
   }
   ```

4. **Check if stock is now below reorder point**
   ```
   GET /api/inventory/alerts/low-stock?centerId=60d21b4667d0d8992e610c70
   ```
