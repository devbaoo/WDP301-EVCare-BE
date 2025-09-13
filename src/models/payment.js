import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
    {
        // Thông tin booking liên quan
        appointment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Appointment",
            required: true,
        },

        // Thông tin khách hàng
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // Thông tin thanh toán
        paymentInfo: {
            amount: { type: Number, required: true }, // Số tiền (VND)
            currency: { type: String, default: "VND" },
            description: { type: String, required: true }, // Mô tả thanh toán
            orderCode: { type: Number, required: true, unique: true }, // Mã đơn hàng PayOS
        },

        // Thông tin PayOS
        payosInfo: {
            orderCode: { type: Number, required: true }, // Mã đơn hàng PayOS
            paymentLinkId: { type: String }, // ID link thanh toán
            paymentLink: { type: String }, // Link thanh toán
            qrCode: { type: String }, // QR code
            checkoutUrl: { type: String }, // URL checkout
            deepLink: { type: String }, // Deep link mobile
        },

        // Trạng thái thanh toán
        status: {
            type: String,
            enum: [
                "pending", // Chờ thanh toán
                "paid", // Đã thanh toán
                "failed", // Thanh toán thất bại
                "cancelled", // Đã hủy
                "expired", // Hết hạn
                "refunded", // Đã hoàn tiền
            ],
            default: "pending",
        },

        // Phương thức thanh toán
        paymentMethod: {
            type: String,
            enum: ["payos", "cash", "card", "banking", "ewallet"],
            required: true,
        },

        // Thông tin giao dịch
        transaction: {
            transactionId: { type: String }, // ID giao dịch từ PayOS
            transactionTime: { type: Date }, // Thời gian giao dịch
            amount: { type: Number }, // Số tiền thực tế
            fee: { type: Number, default: 0 }, // Phí giao dịch
            netAmount: { type: Number }, // Số tiền thực nhận
            currency: { type: String, default: "VND" },
        },

        // Thông tin hoàn tiền
        refund: {
            isRefunded: { type: Boolean, default: false },
            refundAmount: { type: Number, default: 0 },
            refundReason: { type: String },
            refundedAt: { type: Date },
            refundTransactionId: { type: String },
        },

        // Thông tin webhook từ PayOS
        webhook: {
            received: { type: Boolean, default: false },
            receivedAt: { type: Date },
            data: { type: mongoose.Schema.Types.Mixed }, // Dữ liệu webhook
        },

        // Thời gian hết hạn
        expiresAt: { type: Date, required: true },

        // Ghi chú
        notes: { type: String },

        // Metadata
        metadata: {
            userAgent: { type: String },
            ipAddress: { type: String },
            deviceInfo: { type: String },
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
PaymentSchema.index({ appointment: 1 });
PaymentSchema.index({ customer: 1 });
PaymentSchema.index({ "paymentInfo.orderCode": 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ "payosInfo.orderCode": 1 });
PaymentSchema.index({ expiresAt: 1 });

// Virtual for is expired
PaymentSchema.virtual("isExpired").get(function () {
    return new Date() > this.expiresAt;
});

// Virtual for payment status display
PaymentSchema.virtual("statusDisplay").get(function () {
    const statusMap = {
        pending: "Chờ thanh toán",
        paid: "Đã thanh toán",
        failed: "Thanh toán thất bại",
        cancelled: "Đã hủy",
        expired: "Hết hạn",
        refunded: "Đã hoàn tiền",
    };
    return statusMap[this.status] || this.status;
});

// Method to mark as paid
PaymentSchema.methods.markAsPaid = function (transactionData) {
    this.status = "paid";
    this.transaction = {
        ...this.transaction,
        ...transactionData,
        transactionTime: new Date(),
    };
    this.webhook.received = true;
    this.webhook.receivedAt = new Date();
    return this.save();
};

// Method to mark as failed
PaymentSchema.methods.markAsFailed = function (reason) {
    this.status = "failed";
    this.notes = reason;
    return this.save();
};

// Method to mark as expired
PaymentSchema.methods.markAsExpired = function () {
    this.status = "expired";
    return this.save();
};

// Method to process refund
PaymentSchema.methods.processRefund = function (refundAmount, reason) {
    this.refund.isRefunded = true;
    this.refund.refundAmount = refundAmount;
    this.refund.refundReason = reason;
    this.refund.refundedAt = new Date();
    this.status = "refunded";
    return this.save();
};

// Pre-save middleware to set expiresAt
PaymentSchema.pre("save", function (next) {
    if (this.isNew && !this.expiresAt) {
        // Set expiration to 15 minutes from now
        this.expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    }
    next();
});

const Payment = mongoose.model("Payment", PaymentSchema);

export default Payment;