import subscriptionService from "../services/subscriptionService.js";

// Lấy danh sách gói đã đăng ký của customer
const getCustomerSubscriptions = async (req, res) => {
    try {
        const customerId = req.user.id;
        const filters = req.query;
        const result = await subscriptionService.getCustomerSubscriptions(customerId, filters);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        console.error("Get customer subscriptions error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Đăng ký gói dịch vụ mới
const subscribeToPackage = async (req, res) => {
    try {
        const customerId = req.user.id;
        const subscriptionData = { ...req.body, customerId };
        const result = await subscriptionService.subscribeToPackage(subscriptionData);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        console.error("Subscribe to package error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Gia hạn gói dịch vụ
const renewSubscription = async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        const customerId = req.user.id;
        const result = await subscriptionService.renewSubscription(subscriptionId, customerId);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        console.error("Renew subscription error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Hủy gói dịch vụ
const cancelSubscription = async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        const customerId = req.user.id;
        const { reason } = req.body;
        const result = await subscriptionService.cancelSubscription(subscriptionId, customerId, reason);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
        });
    } catch (error) {
        console.error("Cancel subscription error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Xem tình trạng sử dụng gói
const getSubscriptionUsage = async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        const customerId = req.user.id;
        const result = await subscriptionService.getSubscriptionUsage(subscriptionId, customerId);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        console.error("Get subscription usage error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

export default {
    getCustomerSubscriptions,
    subscribeToPackage,
    renewSubscription,
    cancelSubscription,
    getSubscriptionUsage
};
