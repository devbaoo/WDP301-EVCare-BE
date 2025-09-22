import payosService from "../services/payosService.js";
import Payment from "../models/payment.js";
import Appointment from "../models/appointment.js";

// Tạo thanh toán cho booking
const createBookingPayment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const customerId = req.user.id;

        const result = await payosService.createBookingPayment(appointmentId, customerId);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        console.error("Create booking payment error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// Lấy trạng thái thanh toán
const getPaymentStatus = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const customerId = req.user.id;

        const result = await payosService.getPaymentStatus(paymentId, customerId);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        console.error("Get payment status error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// Hủy thanh toán
const cancelBookingPayment = async (req, res) => {
    try {
        const { orderCode } = req.params;
        const customerId = req.user.id;

        const result = await payosService.cancelBookingPayment(orderCode, customerId);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
        });
    } catch (error) {
        console.error("Cancel booking payment error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// Lấy danh sách thanh toán của customer
const getCustomerPayments = async (req, res) => {
    try {
        const customerId = req.user.id;
        const filters = req.query;

        const result = await payosService.getCustomerPayments(customerId, filters);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        console.error("Get customer payments error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// Webhook từ PayOS
const handleWebhook = async (req, res) => {
    const startTime = Date.now();
    const webhookId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
        const webhookData = req.body;
        const headers = req.headers;

        // Log webhook request for debugging
        console.log(`[${webhookId}] Webhook received:`, {
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.url,
            headers: {
                'content-type': headers['content-type'],
                'user-agent': headers['user-agent'],
                'x-payos-signature': headers['x-payos-signature'] ? 'Present' : 'Missing',
                'x-payos-event': headers['x-payos-event'] || 'N/A'
            },
            body: webhookData
        });

        // Handle PayOS webhook test (GET request)
        if (req.method === 'GET') {
            console.log(`[${webhookId}] PayOS webhook test request`);
            return res.status(200).json({
                success: true,
                message: "Webhook endpoint is working",
                timestamp: new Date().toISOString(),
                webhookId
            });
        }

        // Handle POST webhook with signature verification
        if (req.method === 'POST') {
            // Verify webhook signature (PayOS security)
            const signature = headers['x-payos-signature'];
            if (!signature) {
                console.warn(`[${webhookId}] Missing PayOS signature`);
                return res.status(400).json({
                    success: false,
                    message: "Missing webhook signature",
                    webhookId
                });
            }

            // Verify signature using PayOS checksum key
            const isValidSignature = payosService.verifyWebhookSignature(webhookData, signature);
            if (!isValidSignature) {
                console.error(`[${webhookId}] Invalid webhook signature`);
                return res.status(400).json({
                    success: false,
                    message: "Invalid webhook signature",
                    webhookId
                });
            }

            // Process webhook
            const result = await payosService.handleWebhook(webhookData, webhookId);

            const processingTime = Date.now() - startTime;
            console.log(`[${webhookId}] Webhook processed in ${processingTime}ms:`, {
                success: result.success,
                message: result.message,
                orderCode: webhookData?.orderCode || webhookData?.data?.orderCode
            });

            if (result.success) {
                return res.status(200).json({
                    success: true,
                    message: "Webhook processed successfully",
                    webhookId,
                    processingTime: `${processingTime}ms`
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: result.message,
                    webhookId
                });
            }
        }

        // Handle other methods
        return res.status(405).json({
            success: false,
            message: "Method not allowed",
            webhookId
        });

    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error(`[${webhookId}] Webhook processing failed after ${processingTime}ms:`, {
            error: error.message,
            stack: error.stack,
            body: req.body
        });

        res.status(500).json({
            success: false,
            message: "Webhook processing failed",
            webhookId,
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};


// Handle payment success page
const handlePaymentSuccess = async (req, res) => {
    try {
        const { code, id, status, orderCode } = req.query;

        console.log("Payment success page accessed:", { code, id, status, orderCode });

        // If payment was successful, update database
        if (code === "00" && status === "PAID" && orderCode) {
            // Find payment by order code
            const payment = await Payment.findOne({
                "payosInfo.orderCode": parseInt(orderCode)
            });

            if (payment && payment.status === "pending") {
                // Update payment status
                payment.status = "paid";
                payment.transaction = {
                    transactionId: id,
                    transactionTime: new Date(),
                    amount: payment.paymentInfo.amount,
                    fee: 0,
                    netAmount: payment.paymentInfo.amount
                };
                payment.webhook.received = true;
                payment.webhook.receivedAt = new Date();
                payment.webhook.data = { code, id, status, orderCode };

                await payment.save();

                // Update appointment status
                await Appointment.findByIdAndUpdate(payment.appointment, {
                    "payment.status": "paid",
                    "payment.paidAt": new Date(),
                    "payment.transactionId": id,
                    "status": "confirmed"
                });

                console.log("Payment and appointment updated successfully");
            }
        }

        // Return success page
        res.status(200).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Thanh toán thành công - EVCare</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
                    .success { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
                    .success h1 { color: #28a745; margin-bottom: 20px; }
                    .success p { color: #666; margin-bottom: 15px; }
                    .btn { background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="success">
                    <h1>✅ Thanh toán thành công!</h1>
                    <p>Cảm ơn bạn đã sử dụng dịch vụ EVCare</p>
                    <p>Mã đơn hàng: ${orderCode || 'N/A'}</p>
                    <p>Trạng thái: ${status || 'N/A'}</p>
                    <a href="/" class="btn">Về trang chủ</a>
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        console.error("Handle payment success error:", error);
        res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Lỗi - EVCare</title>
                <meta charset="UTF-8">
            </head>
            <body>
                <h1>❌ Có lỗi xảy ra</h1>
                <p>Vui lòng liên hệ hỗ trợ</p>
            </body>
            </html>
        `);
    }
};

// Handle payment cancel page
const handlePaymentCancel = async (req, res) => {
    try {
        const { code, id, status, orderCode } = req.query;

        console.log("Payment cancel page accessed:", { code, id, status, orderCode });

        // If payment was cancelled, update database
        if (orderCode) {
            // Find payment by order code
            const payment = await Payment.findOne({
                "payosInfo.orderCode": parseInt(orderCode)
            });

            if (payment && payment.status === "pending") {
                // Update payment status
                payment.status = "cancelled";
                payment.webhook.received = true;
                payment.webhook.receivedAt = new Date();
                payment.webhook.data = { code, id, status, orderCode };

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
                        cancelledBy: payment.customer
                    }
                });

                console.log("Payment and appointment cancelled successfully");
            }
        }

        // Return cancel page
        res.status(200).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Hủy thanh toán - EVCare</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
                    .cancel { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
                    .cancel h1 { color: #dc3545; margin-bottom: 20px; }
                    .cancel p { color: #666; margin-bottom: 15px; }
                    .btn { background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="cancel">
                    <h1>❌ Thanh toán đã bị hủy</h1>
                    <p>Bạn đã hủy thanh toán</p>
                    <p>Mã đơn hàng: ${orderCode || 'N/A'}</p>
                    <p>Trạng thái: ${status || 'N/A'}</p>
                    <a href="/" class="btn">Về trang chủ</a>
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        console.error("Handle payment cancel error:", error);
        res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Lỗi - EVCare</title>
                <meta charset="UTF-8">
            </head>
            <body>
                <h1>❌ Có lỗi xảy ra</h1>
                <p>Vui lòng liên hệ hỗ trợ</p>
            </body>
            </html>
        `);
    }
};

// Manual sync payment status from PayOS
const syncPaymentStatus = async (req, res) => {
    try {
        const { orderCode } = req.params;

        // Get payment info from PayOS
        const payosResult = await payosService.getPaymentInfo(orderCode);

        if (!payosResult.success) {
            return res.status(400).json({
                success: false,
                message: "Không thể lấy thông tin từ PayOS",
                error: payosResult.message
            });
        }

        // Find payment in database
        const payment = await Payment.findOne({
            "payosInfo.orderCode": parseInt(orderCode)
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy payment trong database"
            });
        }

        // Update payment status based on PayOS data
        const payosData = payosResult.data;
        let newStatus = payment.status;

        if (payosData.status === "PAID") {
            newStatus = "paid";
            payment.transaction = {
                transactionId: payosData.transactionId,
                transactionTime: new Date(payosData.transactionTime),
                amount: payosData.amount,
                fee: payosData.fee || 0,
                netAmount: payosData.netAmount || payosData.amount
            };
        } else if (payosData.status === "CANCELLED") {
            newStatus = "cancelled";
        } else if (payosData.status === "EXPIRED") {
            newStatus = "expired";
        }

        payment.status = newStatus;
        payment.webhook.received = true;
        payment.webhook.receivedAt = new Date();
        payment.webhook.data = payosData;

        await payment.save();

        return res.status(200).json({
            success: true,
            message: "Đồng bộ trạng thái thanh toán thành công",
            data: {
                paymentId: payment._id,
                orderCode: orderCode,
                oldStatus: payment.status,
                newStatus: newStatus,
                payosStatus: payosData.status
            }
        });

    } catch (error) {
        console.error("Sync payment status error:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi đồng bộ trạng thái thanh toán",
            error: error.message,
        });
    }
};

// Test webhook endpoint for debugging
const testWebhook = async (req, res) => {
    try {
        const { orderCode, status = "PAID", amount = 100000 } = req.body;

        if (!orderCode) {
            return res.status(400).json({
                success: false,
                message: "orderCode is required for testing"
            });
        }

        // Create test webhook data
        const testWebhookData = {
            orderCode: parseInt(orderCode),
            status: status,
            amount: amount,
            fee: 0,
            netAmount: amount,
            transactionId: `test_${Date.now()}`,
            transactionTime: new Date().toISOString(),
            eventId: `test_event_${Date.now()}`
        };

        console.log("Testing webhook with data:", testWebhookData);

        // Process test webhook
        const result = await payosService.handleWebhook(testWebhookData, `test_${Date.now()}`);

        return res.status(200).json({
            success: true,
            message: "Test webhook processed",
            data: {
                testData: testWebhookData,
                result: result
            }
        });

    } catch (error) {
        console.error("Test webhook error:", error);
        res.status(500).json({
            success: false,
            message: "Test webhook failed",
            error: error.message
        });
    }
};

// Simple webhook health check for PayOS verification
const webhookHealthCheck = async (req, res) => {
    try {
        console.log("Webhook health check requested:", {
            method: req.method,
            url: req.url,
            headers: req.headers,
            timestamp: new Date().toISOString()
        });

        return res.status(200).json({
            success: true,
            message: "Webhook endpoint is healthy",
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.url
        });
    } catch (error) {
        console.error("Webhook health check error:", error);
        res.status(500).json({
            success: false,
            message: "Webhook health check failed",
            error: error.message
        });
    }
};


export default {
    createBookingPayment,
    getPaymentStatus,
    cancelBookingPayment,
    getCustomerPayments,
    handleWebhook,
    handlePaymentSuccess,
    handlePaymentCancel,
    syncPaymentStatus,
    testWebhook,
    webhookHealthCheck,
};
