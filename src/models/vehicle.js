import mongoose from "mongoose";

const VehicleSchema = new mongoose.Schema(
    {
        // Thông tin chủ xe
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // Thông tin cơ bản xe
        vehicleInfo: {
            vehicleModel: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "VehicleModel",
                required: true
            }, // Reference đến VehicleModel
            year: { type: Number, required: true }, // Năm sản xuất
            color: { type: String, required: true }, // Màu sắc
            licensePlate: { type: String, required: true, unique: true }, // Biển số xe
            vin: { type: String, unique: true, sparse: true }, // VIN number
            chassisNumber: { type: String }, // Số khung
        },

        // Lịch sử bảo dưỡng
        maintenanceHistory: [{
            date: { type: Date, required: true },
            mileage: { type: Number, required: true }, // Số km tại thời điểm bảo dưỡng
            serviceType: { type: String, required: true }, // Loại dịch vụ
            serviceCenter: { type: String }, // Trung tâm thực hiện
            cost: { type: Number }, // Chi phí
            description: { type: String }, // Mô tả công việc
            nextMaintenance: { type: Number }, // Km bảo dưỡng tiếp theo
            documents: [{ type: String }], // Tài liệu liên quan
        }],

        // Thông tin hiện tại
        currentStatus: {
            mileage: { type: Number, default: 0 }, // Số km hiện tại
            batteryHealth: { type: Number, min: 0, max: 100, default: 100 }, // Tình trạng pin (%)
            lastServiceDate: { type: Date }, // Ngày bảo dưỡng cuối
            lastServiceMileage: { type: Number }, // Km bảo dưỡng cuối
            nextServiceMileage: { type: Number }, // Km bảo dưỡng tiếp theo
            isActive: { type: Boolean, default: true }, // Xe còn hoạt động
        },

        // Cảnh báo và nhắc nhở
        alerts: [{
            type: {
                type: String,
                enum: ["maintenance", "battery", "inspection", "insurance", "registration"],
                required: true
            },
            message: { type: String, required: true },
            priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
            dueDate: { type: Date },
            dueMileage: { type: Number },
            isRead: { type: Boolean, default: false },
            createdAt: { type: Date, default: Date.now },
        }],

        // Hình ảnh xe
        images: [{
            url: { type: String, required: true },
            type: { type: String, enum: ["exterior", "interior", "engine", "battery", "document"], required: true },
            caption: { type: String },
            isPrimary: { type: Boolean, default: false },
        }],

        // Bảo hiểm và đăng kiểm
        insurance: {
            provider: { type: String }, // Nhà cung cấp bảo hiểm
            policyNumber: { type: String }, // Số hợp đồng
            startDate: { type: Date }, // Ngày bắt đầu
            endDate: { type: Date }, // Ngày kết thúc
            coverage: { type: String }, // Phạm vi bảo hiểm
        },

        registration: {
            registrationNumber: { type: String }, // Số đăng ký
            registrationDate: { type: Date }, // Ngày đăng ký
            expiryDate: { type: Date }, // Ngày hết hạn
            registrationCenter: { type: String }, // Trung tâm đăng ký
        },

        // Trạng thái
        status: {
            type: String,
            enum: ["active", "inactive", "maintenance", "sold"],
            default: "active",
        },

        // Ghi chú
        notes: { type: String },
    },
    {
        timestamps: true,
    }
);

// Indexes
VehicleSchema.index({ owner: 1 });
VehicleSchema.index({ "vehicleInfo.licensePlate": 1 });
VehicleSchema.index({ "vehicleInfo.vin": 1 });
VehicleSchema.index({ "currentStatus.mileage": 1 });
VehicleSchema.index({ "currentStatus.nextServiceMileage": 1 });

// Virtual for full vehicle name (sẽ cần populate vehicleModel)
VehicleSchema.virtual("fullName").get(function () {
    if (this.vehicleInfo.vehicleModel && typeof this.vehicleInfo.vehicleModel === 'object') {
        return `${this.vehicleInfo.vehicleModel.brand} ${this.vehicleInfo.vehicleModel.modelName} ${this.vehicleInfo.year}`;
    }
    return `${this.vehicleInfo.year}`;
});

// Virtual for maintenance status
VehicleSchema.virtual("maintenanceStatus").get(function () {
    const currentMileage = this.currentStatus.mileage;
    const nextServiceMileage = this.currentStatus.nextServiceMileage;

    if (!nextServiceMileage) return "unknown";

    const remainingKm = nextServiceMileage - currentMileage;

    if (remainingKm <= 0) return "overdue";
    if (remainingKm <= 500) return "due_soon";
    if (remainingKm <= 1000) return "approaching";
    return "good";
});

// Method to add maintenance record
VehicleSchema.methods.addMaintenanceRecord = function (record) {
    this.maintenanceHistory.push(record);
    this.currentStatus.lastServiceDate = record.date;
    this.currentStatus.lastServiceMileage = record.mileage;
    this.currentStatus.nextServiceMileage = record.nextMaintenance;
    return this.save();
};

// Method to add alert
VehicleSchema.methods.addAlert = function (alert) {
    this.alerts.push(alert);
    return this.save();
};

// Method to mark alert as read
VehicleSchema.methods.markAlertAsRead = function (alertId) {
    const alert = this.alerts.id(alertId);
    if (alert) {
        alert.isRead = true;
        return this.save();
    }
    return Promise.reject(new Error("Alert not found"));
};

const Vehicle = mongoose.model("Vehicle", VehicleSchema);

export default Vehicle;