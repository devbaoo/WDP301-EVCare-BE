import mongoose from "mongoose";

const ServiceTypeSchema = new mongoose.Schema(
    {
        // Thông tin cơ bản
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        category: {
            type: String,
            required: true,
            enum: ["maintenance", "repair", "inspection", "upgrade", "emergency"],
        },

        // Thông tin dịch vụ
        serviceDetails: {
            duration: { type: Number, required: true }, // Thời gian thực hiện (phút)
            complexity: {
                type: String,
                enum: ["easy", "medium", "hard", "expert"],
                default: "medium"
            },
            requiredSkills: [String], // Kỹ năng cần thiết
            tools: [String], // Dụng cụ cần thiết

            // Yêu cầu về nhân lực
            minTechnicians: {
                type: Number,
                required: true,
                min: 1,
                default: 1,
                description: "Số lượng kỹ thuật viên tối thiểu cần thiết"
            },
            maxTechnicians: {
                type: Number,
                required: true,
                min: 1,
                default: 1,
                description: "Số lượng kỹ thuật viên tối đa có thể tham gia"
            },
        },

        // Giá cả
        pricing: {
            basePrice: { type: Number, required: true }, // Giá cơ bản
            priceType: {
                type: String,
                enum: ["fixed", "hourly", "per_km", "custom"],
                default: "fixed"
            },
            currency: { type: String, default: "VND" },
            isNegotiable: { type: Boolean, default: false },
        },

        // Phụ tùng cần thiết
        requiredParts: [{
            partName: { type: String, required: true },
            partType: { type: String, required: true },
            quantity: { type: Number, default: 1 },
            isOptional: { type: Boolean, default: false },
            estimatedCost: { type: Number, default: 0 },
        }],

        // Xe điện tương thích
        compatibleVehicles: [{
            brand: { type: String, required: true },
            model: { type: String, required: true },
            year: { type: String },
            batteryType: { type: String },
        }],

        // Quy trình thực hiện
        procedure: {
            steps: [{
                stepNumber: { type: Number, required: true },
                title: { type: String, required: true },
                description: { type: String, required: true },
                estimatedTime: { type: Number, required: true }, // phút
                requiredTools: [String],
                safetyNotes: [String],
            }],
            totalSteps: { type: Number, required: true },
        },

        // Yêu cầu đặc biệt
        requirements: {
            minBatteryLevel: { type: Number, default: 0 }, // % pin tối thiểu
            maxMileage: { type: Number }, // km tối đa
            specialConditions: [String], // Điều kiện đặc biệt
            safetyRequirements: [String], // Yêu cầu an toàn
        },

        // Trạng thái
        status: {
            type: String,
            enum: ["active", "inactive", "maintenance"],
            default: "active",
        },

        // Hình ảnh minh họa
        images: [{
            url: { type: String, required: true },
            caption: { type: String },
            isPrimary: { type: Boolean, default: false },
        }],

        // Thông tin AI
        aiData: {
            averageCompletionTime: { type: Number }, // Thời gian hoàn thành trung bình
            successRate: { type: Number, min: 0, max: 100 }, // Tỷ lệ thành công
            commonIssues: [String], // Vấn đề thường gặp
            recommendations: [String], // Khuyến nghị
        },

        // Metadata
        tags: [String], // Tags để tìm kiếm
        priority: { type: Number, default: 1 }, // Độ ưu tiên (1-5)
        isPopular: { type: Boolean, default: false }, // Dịch vụ phổ biến
    },
    {
        timestamps: true,
    }
);

// Validation middleware
ServiceTypeSchema.pre('save', function (next) {
    // Validate technician requirements
    if (this.serviceDetails.maxTechnicians < this.serviceDetails.minTechnicians) {
        return next(new Error('maxTechnicians must be greater than or equal to minTechnicians'));
    }
    next();
});

// Indexes
ServiceTypeSchema.index({ name: 1 });
ServiceTypeSchema.index({ category: 1 });
ServiceTypeSchema.index({ status: 1 });
ServiceTypeSchema.index({ tags: 1 });
ServiceTypeSchema.index({ "pricing.basePrice": 1 });
ServiceTypeSchema.index({ "serviceDetails.minTechnicians": 1 });
ServiceTypeSchema.index({ "serviceDetails.maxTechnicians": 1 });

// Virtual for total estimated time
ServiceTypeSchema.virtual("totalEstimatedTime").get(function () {
    return this.serviceDetails.duration;
});

// Virtual for total estimated cost
ServiceTypeSchema.virtual("totalEstimatedCost").get(function () {
    const partsCost = this.requiredParts.reduce((total, part) => {
        return total + (part.estimatedCost * part.quantity);
    }, 0);
    return this.pricing.basePrice + partsCost;
});

const ServiceType = mongoose.model("ServiceType", ServiceTypeSchema);

export default ServiceType;