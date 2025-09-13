import crypto from "crypto";
import Payment from "../models/payment.js";
import Appointment from "../models/appointment.js";

// PayOS configuration
const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID;
const PAYOS_API_KEY = process.env.PAYOS_API_KEY;
const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY;
const PAYOS_BASE_URL = process.env.PAYOS_BASE_URL || "https://api-merchant.payos.vn";

// Generate order code (6 digits)
const generateOrderCode = () => {
    return Math.floor(100000 + Math.random() * 900000);
};

// Generate checksum for PayOS (theo format query string như code cũ)
const generateChecksum = (data) => {
    // Format theo code cũ: amount=...&cancelUrl=...&description=...&orderCode=...&returnUrl=...
    const query = `amount=${data.amount}&cancelUrl=${data.cancelUrl}&description=${data.description}&orderCode=${data.orderCode}&returnUrl=${data.returnUrl}`;

    console.log("Checksum data (query string):", query);
    console.log("Checksum key:", PAYOS_CHECKSUM_KEY ? "Present" : "Missing");

    const checksum = crypto
        .createHmac("sha256", PAYOS_CHECKSUM_KEY)
        .update(query)
        .digest("hex")
        .toLowerCase();

    console.log("Generated checksum:", checksum);

    return checksum;
};

// Create payment link
const createPaymentLink = async (paymentData) => {
    try {
        // Check if PayOS credentials are configured
        if (!PAYOS_CLIENT_ID || !PAYOS_API_KEY || !PAYOS_CHECKSUM_KEY) {
            console.warn("PayOS credentials not configured, using mock payment link");
            return createMockPaymentLink(paymentData);
        }

        const orderCode = generateOrderCode();

        const returnUrl = `${process.env.FRONTEND_URL || "http://localhost:8080"}/payment/success`;
        const cancelUrl = `${process.env.FRONTEND_URL || "http://localhost:8080"}/payment/cancel`;

        // Truncate description nếu vượt 25 ký tự (theo code cũ)
        let description = String(paymentData.description).trim();
        if (description.length > 25) {
            console.warn("Description vượt 25 ký tự, tự động cắt bớt");
            description = description.substring(0, 25);
        }

        // Đảm bảo amount là số nguyên
        const roundedAmount = Math.round(Number(paymentData.amount));

        const paymentInfo = {
            orderCode: orderCode,
            amount: roundedAmount,
            description: description,
            returnUrl: String(returnUrl).trim(),
            cancelUrl: String(cancelUrl).trim(),
            expiredAt: Math.floor(Date.now() / 1000) + 15 * 60, // 15 phút từ bây giờ
        };

        // Generate checksum theo format query string
        const checksum = generateChecksum({
            orderCode: orderCode,
            amount: roundedAmount,
            description: description,
            returnUrl: String(returnUrl).trim(),
            cancelUrl: String(cancelUrl).trim(),
        });

        paymentInfo.signature = checksum;

        // Log request để debug
        console.log("PayOS Request:", JSON.stringify(paymentInfo, null, 2));

        // Call PayOS API
        const response = await fetch(`${PAYOS_BASE_URL}/v2/payment-requests`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-client-id": PAYOS_CLIENT_ID,
                "x-api-key": PAYOS_API_KEY,
            },
            body: JSON.stringify(paymentInfo),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("PayOS API Error:", errorData);

            // Handle specific PayOS error codes
            if (errorData.code === "20") {
                throw new Error("PayOS: Thông tin truyền lên không đúng. Vui lòng kiểm tra lại credentials và request format.");
            } else if (errorData.code === "01") {
                throw new Error("PayOS: Không tìm thấy thông tin merchant.");
            } else if (errorData.code === "02") {
                throw new Error("PayOS: Checksum không hợp lệ.");
            }

            throw new Error(`PayOS API error (${errorData.code}): ${errorData.desc || response.statusText}`);
        }

        const result = await response.json();

        // Log response để debug
        console.log("PayOS API Response:", JSON.stringify(result, null, 2));

        // Kiểm tra cấu trúc response
        if (!result.data) {
            throw new Error("Invalid PayOS response structure");
        }

        return {
            success: true,
            data: {
                orderCode: result.data.orderCode || orderCode,
                paymentLinkId: result.data.paymentLinkId || result.data.id,
                paymentLink: result.data.paymentLink || result.data.checkoutUrl,
                qrCode: result.data.qrCode || result.data.qr,
                checkoutUrl: result.data.checkoutUrl || result.data.paymentLink,
                deepLink: result.data.deepLink || result.data.mobileUrl,
            },
        };
    } catch (error) {
        console.error("Create payment link error:", error);
        // Fallback to mock payment if PayOS fails
        console.warn("PayOS API failed, using mock payment link");
        return createMockPaymentLink(paymentData);
    }
};

// Create mock payment link for testing
const createMockPaymentLink = (paymentData) => {
    const orderCode = generateOrderCode();
    const mockPaymentLink = `https://pay.payos.vn/web/${orderCode}`;

    return {
        success: true,
        data: {
            orderCode: orderCode,
            paymentLinkId: `mock_${orderCode}`,
            paymentLink: mockPaymentLink,
            qrCode: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`, // 1x1 transparent PNG
            checkoutUrl: mockPaymentLink,
            deepLink: `https://pay.payos.vn/app/${orderCode}`,
        },
    };
};

// Get payment information
const getPaymentInfo = async (orderCode) => {
    try {
        const response = await fetch(`${PAYOS_BASE_URL}/v2/payment-requests/${orderCode}`, {
            method: "GET",
            headers: {
                "x-client-id": PAYOS_CLIENT_ID,
                "x-api-key": PAYOS_API_KEY,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`PayOS API error: ${errorData.message || response.statusText}`);
        }

        const result = await response.json();
        return {
            success: true,
            data: result.data,
        };
    } catch (error) {
        console.error("Get payment info error:", error);
        return {
            success: false,
            message: "Lỗi khi lấy thông tin thanh toán",
            error: error.message,
        };
    }
};

// Cancel payment
const cancelPayment = async (orderCode) => {
    try {
        const response = await fetch(`${PAYOS_BASE_URL}/v2/payment-requests/${orderCode}/cancel`, {
            method: "POST",
            headers: {
                "x-client-id": PAYOS_CLIENT_ID,
                "x-api-key": PAYOS_API_KEY,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`PayOS API error: ${errorData.message || response.statusText}`);
        }

        const result = await response.json();
        return {
            success: true,
            data: result.data,
        };
    } catch (error) {
        console.error("Cancel payment error:", error);
        return {
            success: false,
            message: "Lỗi khi hủy thanh toán",
            error: error.message,
        };
    }
};

// Create payment for booking
const createBookingPayment = async (appointmentId, customerId) => {
    try {
        // Get appointment details
        const appointment = await Appointment.findById(appointmentId)
            .populate("customer", "username fullName email")
            .populate("vehicle", "vehicleInfo")
            .populate("serviceCenter", "name")
            .populate("serviceType", "name pricing");

        if (!appointment) {
            return {
                success: false,
                statusCode: 404,
                message: "Không tìm thấy booking",
            };
        }

        // Check if customer owns this appointment
        if (appointment.customer._id.toString() !== customerId) {
            return {
                success: false,
                statusCode: 403,
                message: "Bạn không có quyền thanh toán cho booking này",
            };
        }

        // Check if payment already exists
        const existingPayment = await Payment.findOne({
            appointment: appointmentId,
            status: { $in: ["pending", "paid"] },
        });

        if (existingPayment) {
            return {
                success: false,
                statusCode: 400,
                message: "Booking này đã có thanh toán",
                data: existingPayment,
            };
        }

        const amount = appointment.serviceDetails.estimatedCost || appointment.serviceType.pricing.basePrice;
        const description = `Thanh toán booking #${appointment._id} - ${appointment.serviceType.name}`;

        // Create payment link
        const paymentLinkResult = await createPaymentLink({
            amount: amount,
            description: description,
            items: [
                {
                    name: appointment.serviceType.name,
                    quantity: 1,
                    price: amount,
                },
            ],
        });

        if (!paymentLinkResult.success) {
            return {
                success: false,
                statusCode: 500,
                message: paymentLinkResult.message,
            };
        }

        // Create payment record
        const payment = new Payment({
            appointment: appointmentId,
            customer: customerId,
            paymentInfo: {
                amount: amount,
                currency: "VND",
                description: description,
                orderCode: paymentLinkResult.data.orderCode,
            },
            payosInfo: paymentLinkResult.data,
            paymentMethod: "payos",
            expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        });

        await payment.save();

        return {
            success: true,
            statusCode: 201,
            message: "Tạo link thanh toán thành công",
            data: {
                paymentId: payment._id,
                orderCode: payment.payosInfo.orderCode,
                paymentLink: payment.payosInfo.paymentLink,
                qrCode: payment.payosInfo.qrCode,
                checkoutUrl: payment.payosInfo.checkoutUrl,
                deepLink: payment.payosInfo.deepLink,
                amount: payment.paymentInfo.amount,
                expiresAt: payment.expiresAt,
            },
        };
    } catch (error) {
        console.error("Create booking payment error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi tạo thanh toán",
        };
    }
};

// Handle PayOS webhook
const handleWebhook = async (webhookData) => {
    try {
        const { orderCode, status, transactionTime, amount, fee, netAmount } = webhookData;

        // Find payment by order code
        const payment = await Payment.findOne({
            "payosInfo.orderCode": orderCode,
        });

        if (!payment) {
            return {
                success: false,
                message: "Payment not found",
            };
        }

        // Update webhook info
        payment.webhook.received = true;
        payment.webhook.receivedAt = new Date();
        payment.webhook.data = webhookData;

        // Handle different statuses
        switch (status) {
            case "PAID":
                await payment.markAsPaid({
                    transactionId: webhookData.transactionId,
                    amount: amount,
                    fee: fee || 0,
                    netAmount: netAmount || amount,
                });

                // Update appointment status
                await Appointment.findByIdAndUpdate(payment.appointment, {
                    "payment.status": "paid",
                    "payment.paidAt": new Date(),
                    "payment.transactionId": webhookData.transactionId,
                });
                break;

            case "CANCELLED":
                payment.status = "cancelled";
                await payment.save();

                // Update appointment status
                await Appointment.findByIdAndUpdate(payment.appointment, {
                    "payment.status": "cancelled",
                    "payment.cancelledAt": new Date(),
                    "status": "cancelled",
                    "cancellation": {
                        reason: "Payment cancelled on PayOS",
                        cancelledAt: new Date(),
                        cancelledBy: "system"
                    }
                });
                break;

            case "EXPIRED":
                await payment.markAsExpired();
                break;

            default:
                console.log(`Unknown payment status: ${status}`);
        }

        return {
            success: true,
            message: "Webhook processed successfully",
        };
    } catch (error) {
        console.error("Handle webhook error:", error);
        return {
            success: false,
            message: "Webhook processing failed",
            error: error.message,
        };
    }
};

// Get payment status
const getPaymentStatus = async (paymentId, customerId) => {
    try {
        const payment = await Payment.findOne({
            _id: paymentId,
            customer: customerId,
        }).populate("appointment", "serviceType serviceCenter");

        if (!payment) {
            return {
                success: false,
                statusCode: 404,
                message: "Không tìm thấy thanh toán",
            };
        }

        return {
            success: true,
            statusCode: 200,
            message: "Lấy trạng thái thanh toán thành công",
            data: payment,
        };
    } catch (error) {
        console.error("Get payment status error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi lấy trạng thái thanh toán",
        };
    }
};

// Cancel payment
const cancelBookingPayment = async (orderCode, customerId) => {
    try {
        const payment = await Payment.findOne({
            "payosInfo.orderCode": orderCode,
            customer: customerId,
            status: "pending",
        });

        if (!payment) {
            return {
                success: false,
                statusCode: 404,
                message: "Không tìm thấy thanh toán hoặc thanh toán không thể hủy",
            };
        }

        // Cancel payment on PayOS
        const cancelResult = await cancelPayment(payment.payosInfo.orderCode);

        if (cancelResult.success) {
            payment.status = "cancelled";
            await payment.save();

            // Update appointment status
            await Appointment.findByIdAndUpdate(payment.appointment, {
                "payment.status": "cancelled",
                "payment.cancelledAt": new Date(),
                "status": "cancelled",
                "cancellation": {
                    reason: "Payment cancelled by customer",
                    cancelledAt: new Date(),
                    cancelledBy: customerId
                }
            });
        }

        return {
            success: true,
            statusCode: 200,
            message: "Hủy thanh toán thành công",
        };
    } catch (error) {
        console.error("Cancel booking payment error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi hủy thanh toán",
        };
    }
};

// Get customer payments
const getCustomerPayments = async (customerId, filters = {}) => {
    try {
        const {
            status,
            page = 1,
            limit = 10,
            sortBy = "createdAt",
            sortOrder = "desc",
        } = filters;

        let query = { customer: customerId };
        if (status) query.status = status;

        const sort = {};
        sort[sortBy] = sortOrder === "desc" ? -1 : 1;

        const payments = await Payment.find(query)
            .populate("appointment", "serviceType serviceCenter appointmentTime")
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Payment.countDocuments(query);

        return {
            success: true,
            statusCode: 200,
            message: "Lấy danh sách thanh toán thành công",
            data: {
                payments,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: limit,
                },
            },
        };
    } catch (error) {
        console.error("Get customer payments error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi lấy danh sách thanh toán",
        };
    }
};

export default {
    createPaymentLink,
    createMockPaymentLink,
    getPaymentInfo,
    cancelPayment,
    createBookingPayment,
    handleWebhook,
    getPaymentStatus,
    cancelBookingPayment,
    getCustomerPayments,
};
