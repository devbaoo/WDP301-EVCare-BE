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

// Verify webhook signature from PayOS
const verifyWebhookSignature = (webhookData, signature) => {
    try {
        if (!PAYOS_CHECKSUM_KEY) {
            console.warn("PayOS checksum key not configured, skipping signature verification");
            return true; // Allow in development
        }

        if (!signature) {
            console.error("No signature provided for webhook verification");
            return false;
        }

        // PayOS webhook signature verification
        // PayOS sends signature in format: sha256=<hash>
        const expectedSignature = crypto
            .createHmac("sha256", PAYOS_CHECKSUM_KEY)
            .update(JSON.stringify(webhookData))
            .digest("hex")
            .toLowerCase();

        const providedSignature = signature.toLowerCase().replace('sha256=', '');

        console.log("Webhook signature verification:", {
            expected: expectedSignature,
            provided: providedSignature,
            match: expectedSignature === providedSignature
        });

        return expectedSignature === providedSignature;
    } catch (error) {
        console.error("Webhook signature verification error:", error);
        return false;
    }
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

// Handle PayOS webhook with idempotency
const handleWebhook = async (webhookData, webhookId = null) => {
    try {
        console.log(`[${webhookId || 'webhook'}] Processing webhook:`, {
            rawData: webhookData,
            timestamp: new Date().toISOString()
        });

        // Normalize payload (PayOS có thể bọc trong data)
        const payload = webhookData?.data && typeof webhookData.data === 'object' ? webhookData.data : webhookData;
        let { orderCode, status, transactionTime, amount, fee, netAmount, eventId, transactionId, id, code, desc, success, paymentLinkId, reference, transactionDateTime } = payload;

        // Validate required fields
        if (!orderCode) {
            console.error(`[${webhookId || 'webhook'}] Missing orderCode in webhook data`);
            return {
                success: false,
                message: "Missing orderCode in webhook data",
                webhookId
            };
        }

        // Coerce types
        const numericOrderCode = orderCode !== undefined ? parseInt(orderCode, 10) : NaN;
        const numericAmount = amount !== undefined ? Number(amount) : undefined;
        const numericFee = fee !== undefined ? Number(fee) : 0;
        const numericNet = netAmount !== undefined ? Number(netAmount) : (numericAmount !== undefined ? numericAmount - numericFee : undefined);

        // Map status variants (PayOS can send different shapes)
        let normalizedStatus = (status || '').toUpperCase();
        // Fallbacks: use top-level code/data.code/desc/success
        const topCode = (code || '').toString();
        const dataCode = (payload?.data?.code || '').toString();
        const topDesc = (desc || payload?.data?.desc || '').toString().toLowerCase();
        const topSuccess = Boolean(success || payload?.data?.success);

        if (!normalizedStatus) {
            if (topCode === '00' || dataCode === '00' || topDesc.includes('success') || topSuccess) {
                normalizedStatus = 'PAID';
            }
        }

        const statusMap = {
            SUCCESS: 'PAID',
            COMPLETED: 'PAID',
            DONE: 'PAID',
            PAID: 'PAID',
            '00': 'PAID',
            CANCEL: 'CANCELLED',
            CANCELLED: 'CANCELLED',
            EXPIRED: 'EXPIRED',
            FAILED: 'FAILED',
        };
        const finalStatus = statusMap[normalizedStatus] || normalizedStatus;

        console.log(`[${webhookId || 'webhook'}] Normalized webhook data:`, {
            orderCode: isNaN(numericOrderCode) ? null : numericOrderCode,
            status: finalStatus,
            amount: numericAmount,
            transactionId: transactionId || reference || payload?.data?.reference || null,
            paymentLinkId: id || paymentLinkId || payload?.paymentLinkId || null
        });

        // Find payment by order code or by paymentLinkId when orderCode is missing
        let paymentQuery = null;
        if (!isNaN(numericOrderCode)) {
            paymentQuery = { "payosInfo.orderCode": numericOrderCode };
        } else if (id || paymentLinkId || payload?.paymentLinkId) {
            paymentQuery = { "payosInfo.paymentLinkId": id || paymentLinkId || payload?.paymentLinkId };
        }

        const payment = await Payment.findOne(paymentQuery || {}).populate('appointment', 'status serviceType serviceCenter customer');

        if (!payment) {
            console.error(`[${webhookId || 'webhook'}] Payment not found`, {
                byOrderCode: !isNaN(numericOrderCode) ? numericOrderCode : null,
                byPaymentLinkId: id || null,
                payloadKeys: Object.keys(payload || {})
            });
            return {
                success: false,
                message: `Payment not found by orderCode/paymentLinkId`,
                webhookId
            };
        }

        console.log(`[${webhookId || 'webhook'}] Found payment:`, {
            paymentId: payment._id,
            currentStatus: payment.status,
            appointmentId: payment.appointment?._id
        });

        // Idempotency: if same event already processed (prefer eventId)
        const incomingId = eventId || `${numericOrderCode}|${finalStatus}|${numericAmount}`;
        const prev = payment.webhook?.data || {};
        const existingId = prev.eventId || `${prev.orderCode || prev.payosInfo?.orderCode || ''}|${prev.status}|${prev.amount}`;

        if (existingId && existingId === incomingId) {
            console.log(`[${webhookId || 'webhook'}] Duplicate webhook ignored:`, { incomingId, existingId });
            return {
                success: true,
                message: "Duplicate webhook ignored",
                webhookId
            };
        }

        // Update webhook info
        payment.webhook.received = true;
        payment.webhook.receivedAt = new Date();
        payment.webhook.data = { ...payload, status: finalStatus, webhookId };

        console.log(`[${webhookId || 'webhook'}] Processing status: ${finalStatus}`);

        // Handle different statuses
        switch (finalStatus) {
            case "PAID":
                console.log(`[${webhookId || 'webhook'}] Marking payment as paid`);
                await payment.markAsPaid({
                    transactionId: transactionId || reference || payload?.data?.reference || payload.transactionId,
                    amount: numericAmount,
                    fee: numericFee,
                    netAmount: numericNet,
                });

                // Update appointment status
                if (payment.appointment) {
                    await Appointment.findByIdAndUpdate(payment.appointment._id, {
                        "payment.status": "paid",
                        "payment.paidAt": new Date(),
                        "payment.transactionId": transactionId || reference || payload?.data?.reference || payload.transactionId,
                        "status": "confirmed"
                    });
                    console.log(`[${webhookId || 'webhook'}] Updated appointment status to confirmed`);
                }
                break;

            case "CANCELLED":
                console.log(`[${webhookId || 'webhook'}] Marking payment as cancelled`);
                payment.status = "cancelled";
                await payment.save();

                // Update appointment status
                if (payment.appointment) {
                    await Appointment.findByIdAndUpdate(payment.appointment._id, {
                        "payment.status": "cancelled",
                        "payment.cancelledAt": new Date(),
                        "status": "cancelled",
                        "cancellation": {
                            isCancelled: true,
                            reason: "Payment cancelled on PayOS",
                            cancelledAt: new Date(),
                            cancelledBy: payment.customer
                        }
                    });
                    console.log(`[${webhookId || 'webhook'}] Updated appointment status to cancelled`);
                }
                break;

            case "EXPIRED":
                console.log(`[${webhookId || 'webhook'}] Marking payment as expired`);
                await payment.markAsExpired();
                break;

            case "FAILED":
                console.log(`[${webhookId || 'webhook'}] Marking payment as failed`);
                await payment.markAsFailed("Payment failed on PayOS");
                break;

            default:
                console.warn(`[${webhookId || 'webhook'}] Unknown payment status: ${status} (normalized: ${finalStatus})`);
        }

        console.log(`[${webhookId || 'webhook'}] Webhook processed successfully`);

        return {
            success: true,
            message: "Webhook processed successfully",
            webhookId,
            paymentId: payment._id,
            orderCode: numericOrderCode,
            status: finalStatus
        };
    } catch (error) {
        console.error(`[${webhookId || 'webhook'}] Handle webhook error:`, {
            error: error.message,
            stack: error.stack,
            webhookData
        });
        return {
            success: false,
            message: "Webhook processing failed",
            error: error.message,
            webhookId
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
                    isCancelled: true,
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

// Create payment for subscription
const createSubscriptionPayment = async (subscriptionId, customerId) => {
    try {
        const CustomerPackage = (await import("../models/customerPackage.js")).default;

        // Get subscription details
        const subscription = await CustomerPackage.findById(subscriptionId)
            .populate('customerId', 'username fullName email')
            .populate('vehicleId', 'vehicleInfo')
            .populate('packageId', 'packageName description price');

        if (!subscription) {
            return {
                success: false,
                statusCode: 404,
                message: "Không tìm thấy gói đăng ký",
            };
        }

        // Check if customer owns this subscription
        if (subscription.customerId._id.toString() !== customerId) {
            return {
                success: false,
                statusCode: 403,
                message: "Bạn không có quyền thanh toán cho gói này",
            };
        }

        // Check if payment already exists
        const existingPayment = await Payment.findOne({
            subscription: subscriptionId,
            status: { $in: ["pending", "paid"] },
        });

        if (existingPayment) {
            return {
                success: false,
                statusCode: 400,
                message: "Gói này đã có thanh toán",
                data: existingPayment,
            };
        }

        const amount = subscription.packageId.price;
        const description = `Thanh toán gói dịch vụ ${subscription.packageId.packageName}`;

        // Create payment link
        const paymentLinkResult = await createPaymentLink({
            amount: amount,
            description: description,
            items: [
                {
                    name: subscription.packageId.packageName,
                    quantity: 1,
                    price: amount,
                },
            ],
        });

        if (!paymentLinkResult.success) {
            return {
                success: false,
                statusCode: 400,
                message: "Không thể tạo link thanh toán",
            };
        }

        // Create payment record
        const payment = new Payment({
            subscription: subscriptionId,
            customer: customerId,
            paymentInfo: {
                amount: amount,
                currency: "VND",
                description: description,
                orderCode: paymentLinkResult.data.orderCode,
            },
            payosInfo: paymentLinkResult.data,
            status: "pending",
            paymentMethod: "payos",
        });

        await payment.save();

        return {
            success: true,
            statusCode: 200,
            message: "Tạo thanh toán gói dịch vụ thành công",
            data: {
                payment,
                paymentLink: paymentLinkResult.data.checkoutUrl,
                qrCode: paymentLinkResult.data.qrCode,
            },
        };
    } catch (error) {
        console.error("Create subscription payment error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi tạo thanh toán gói dịch vụ",
        };
    }
};

// Create custom payment for an appointment (e.g., deposit or inspection fee)
const createAppointmentCustomPayment = async (appointmentId, customerId, amount, description) => {
    try {
        // Validate amount
        const roundedAmount = Math.max(0, Math.round(Number(amount || 0)));
        if (roundedAmount <= 0) {
            return {
                success: false,
                statusCode: 400,
                message: "Số tiền thanh toán không hợp lệ",
            };
        }

        // Create payment link
        const paymentLinkResult = await createPaymentLink({
            amount: roundedAmount,
            description: description || `Thanh toán đặt cọc/kiểm tra cho booking #${appointmentId}`,
            items: [
                { name: "EVCare Deposit/Inspection Fee", quantity: 1, price: roundedAmount },
            ],
        });

        if (!paymentLinkResult.success) {
            return {
                success: false,
                statusCode: 500,
                message: paymentLinkResult.message || "Không thể tạo link thanh toán",
            };
        }

        // Create payment record
        const payment = new Payment({
            appointment: appointmentId,
            customer: customerId,
            paymentInfo: {
                amount: roundedAmount,
                currency: "VND",
                description: description || "Deposit/Inspection fee",
                orderCode: paymentLinkResult.data.orderCode,
            },
            payosInfo: paymentLinkResult.data,
            paymentMethod: "payos",
            status: "pending",
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        });

        await payment.save();

        return {
            success: true,
            statusCode: 201,
            message: "Tạo thanh toán đặt cọc/kiểm tra thành công",
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
        console.error("Create appointment custom payment error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi tạo thanh toán đặt cọc/kiểm tra",
        };
    }
};

export default {
    createPaymentLink,
    createMockPaymentLink,
    getPaymentInfo,
    cancelPayment,
    createBookingPayment,
    createSubscriptionPayment,
    createAppointmentCustomPayment,
    handleWebhook,
    verifyWebhookSignature,
    getPaymentStatus,
    cancelBookingPayment,
    getCustomerPayments,
};
