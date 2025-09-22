import mongoose from "mongoose";

const ServiceCenterSchema = new mongoose.Schema(
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

    // Địa chỉ
    address: {
      street: { type: String, required: true },
      ward: { type: String, required: true },
      district: { type: String, required: true },
      city: { type: String, required: true },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },

    // Thông tin liên hệ
    contact: {
      phone: { type: String, required: true },
      email: { type: String, required: true },
      website: { type: String },
    },

    // Giờ hoạt động
    operatingHours: {
      monday: {
        open: String,
        close: String,
        isOpen: { type: Boolean, default: true },
      },
      tuesday: {
        open: String,
        close: String,
        isOpen: { type: Boolean, default: true },
      },
      wednesday: {
        open: String,
        close: String,
        isOpen: { type: Boolean, default: true },
      },
      thursday: {
        open: String,
        close: String,
        isOpen: { type: Boolean, default: true },
      },
      friday: {
        open: String,
        close: String,
        isOpen: { type: Boolean, default: true },
      },
      saturday: {
        open: String,
        close: String,
        isOpen: { type: Boolean, default: true },
      },
      sunday: {
        open: String,
        close: String,
        isOpen: { type: Boolean, default: false },
      },
    },

    // Dịch vụ cung cấp
    services: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ServiceType",
      },
    ],

    // Nhân sự
    staff: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: { type: String, enum: ["staff", "technician"], required: true },
        isActive: { type: Boolean, default: true },
      },
    ],

    // Năng lực phục vụ
    capacity: {
      maxConcurrentServices: { type: Number, default: 10 },
      maxDailyAppointments: { type: Number, default: 50 },
    },

    // Trạng thái
    status: {
      type: String,
      enum: ["active", "inactive", "maintenance"],
      default: "active",
    },

    // Hình ảnh
    images: [
      {
        url: { type: String, required: true },
        caption: { type: String },
        isPrimary: { type: Boolean, default: false },
      },
    ],

    // Đánh giá
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },

    // Cấu hình thanh toán
    paymentMethods: [
      {
        type: {
          type: String,
          enum: ["cash", "card", "banking", "ewallet"],
          required: true,
        },
        isEnabled: { type: Boolean, default: true },
      },
    ],

    // Cấu hình AI
    aiSettings: {
      enableInventoryPrediction: { type: Boolean, default: true },
      enableMaintenancePrediction: { type: Boolean, default: true },
      enableDemandForecasting: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ServiceCenterSchema.index({ "address.city": 1, "address.district": 1 });
ServiceCenterSchema.index({ "contact.phone": 1 });
ServiceCenterSchema.index({ "contact.email": 1 });
ServiceCenterSchema.index({ status: 1 });

// Virtual for full address
ServiceCenterSchema.virtual("fullAddress").get(function () {
  return `${this.address.street}, ${this.address.ward}, ${this.address.district}, ${this.address.city}`;
});

// Virtual for is currently open
ServiceCenterSchema.virtual("isCurrentlyOpen").get(function () {
  const now = new Date();
  const dayOfWeek = now.toLocaleLowerCase().substring(0, 3);
  const currentTime = now.toTimeString().substring(0, 5);

  const todaySchedule = this.operatingHours[dayOfWeek];
  if (!todaySchedule || !todaySchedule.isOpen) return false;

  return (
    currentTime >= todaySchedule.open && currentTime <= todaySchedule.close
  );
});

const ServiceCenter = mongoose.model("ServiceCenter", ServiceCenterSchema);

export default ServiceCenter;
