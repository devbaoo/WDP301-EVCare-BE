import CustomerPackage from "../models/customerPackage.js";
import ServicePackage from "../models/servicePackage.js";
import payosService from "./payosService.js";

// Lấy danh sách gói đã đăng ký của customer
const getCustomerSubscriptions = async (customerId, filters = {}) => {
    try {
        const { status = 'all' } = filters;

        let filter = { customerId };
        if (status !== 'all') {
            filter.status = status;
        }

        const subscriptions = await CustomerPackage.find(filter)
            .populate('vehicleId', 'vehicleInfo')
            .populate('packageId', 'packageName description durationMonths price includedServices')
            .sort({ createdAt: -1 });

        return {
            success: true,
            statusCode: 200,
            message: "Lấy danh sách gói đăng ký thành công",
            data: subscriptions
        };
    } catch (error) {
        console.error("Get customer subscriptions error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi lấy danh sách gói đăng ký"
        };
    }
};

// Đăng ký gói dịch vụ mới
const subscribeToPackage = async (subscriptionData) => {
    try {
        const { customerId, vehicleId, packageId, autoRenewal = false } = subscriptionData;

        // Validate required fields
        if (!customerId || !vehicleId || !packageId) {
            return {
                success: false,
                statusCode: 400,
                message: "Thiếu thông tin bắt buộc"
            };
        }

        // Get package details
        const packageData = await ServicePackage.findById(packageId);
        if (!packageData) {
            return {
                success: false,
                statusCode: 404,
                message: "Không tìm thấy gói dịch vụ"
            };
        }

        // Check if customer already has active subscription for this vehicle
        const existingSubscription = await CustomerPackage.findOne({
            customerId,
            vehicleId,
            status: 'active'
        });

        if (existingSubscription) {
            return {
                success: false,
                statusCode: 400,
                message: "Bạn đã có gói dịch vụ đang hoạt động cho xe này"
            };
        }

        // Calculate dates
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + packageData.durationMonths);

        // Create subscription
        const subscription = new CustomerPackage({
            customerId,
            vehicleId,
            packageId,
            startDate,
            endDate,
            remainingServices: packageData.maxServicesPerMonth * packageData.durationMonths,
            autoRenewal,
            status: 'active',
            paymentStatus: 'pending'
        });

        await subscription.save();

        // Create payment for subscription
        const paymentResult = await payosService.createSubscriptionPayment(subscription._id, customerId);

        if (!paymentResult.success) {
            // If payment creation fails, delete the subscription
            await CustomerPackage.findByIdAndDelete(subscription._id);
            return {
                success: false,
                statusCode: 400,
                message: "Không thể tạo thanh toán cho gói dịch vụ"
            };
        }

        // Populate for response
        await subscription.populate([
            { path: 'vehicleId', select: 'vehicleInfo' },
            { path: 'packageId', select: 'packageName description durationMonths price' }
        ]);

        return {
            success: true,
            statusCode: 201,
            message: "Đăng ký gói dịch vụ thành công. Vui lòng thanh toán để kích hoạt.",
            data: {
                subscription,
                payment: paymentResult.data
            }
        };
    } catch (error) {
        console.error("Subscribe to package error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi đăng ký gói dịch vụ"
        };
    }
};

// Gia hạn gói dịch vụ
const renewSubscription = async (subscriptionId, customerId) => {
    try {
        const subscription = await CustomerPackage.findOne({
            _id: subscriptionId,
            customerId
        }).populate('packageId');

        if (!subscription) {
            return {
                success: false,
                statusCode: 404,
                message: "Không tìm thấy gói đăng ký"
            };
        }

        if (subscription.status !== 'active') {
            return {
                success: false,
                statusCode: 400,
                message: "Chỉ có thể gia hạn gói đang hoạt động"
            };
        }

        // Calculate new end date
        const newEndDate = new Date(subscription.endDate);
        newEndDate.setMonth(newEndDate.getMonth() + subscription.packageId.durationMonths);

        // Update subscription
        subscription.endDate = newEndDate;
        subscription.remainingServices += subscription.packageId.maxServicesPerMonth * subscription.packageId.durationMonths;
        subscription.paymentStatus = 'pending';

        await subscription.save();

        // Create payment for renewal
        const paymentResult = await payosService.createSubscriptionPayment(subscription._id, customerId);

        if (!paymentResult.success) {
            return {
                success: false,
                statusCode: 400,
                message: "Không thể tạo thanh toán gia hạn"
            };
        }

        return {
            success: true,
            statusCode: 200,
            message: "Gia hạn gói dịch vụ thành công. Vui lòng thanh toán.",
            data: {
                subscription,
                payment: paymentResult.data
            }
        };
    } catch (error) {
        console.error("Renew subscription error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi gia hạn gói dịch vụ"
        };
    }
};

// Hủy gói dịch vụ
const cancelSubscription = async (subscriptionId, customerId, reason) => {
    try {
        const subscription = await CustomerPackage.findOne({
            _id: subscriptionId,
            customerId
        });

        if (!subscription) {
            return {
                success: false,
                statusCode: 404,
                message: "Không tìm thấy gói đăng ký"
            };
        }

        if (subscription.status !== 'active') {
            return {
                success: false,
                statusCode: 400,
                message: "Chỉ có thể hủy gói đang hoạt động"
            };
        }

        // Update subscription status
        subscription.status = 'cancelled';
        subscription.cancellationReason = reason;
        subscription.cancelledAt = new Date();

        await subscription.save();

        return {
            success: true,
            statusCode: 200,
            message: "Hủy gói dịch vụ thành công"
        };
    } catch (error) {
        console.error("Cancel subscription error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi hủy gói dịch vụ"
        };
    }
};

// Xem tình trạng sử dụng gói
const getSubscriptionUsage = async (subscriptionId, customerId) => {
    try {
        const subscription = await CustomerPackage.findOne({
            _id: subscriptionId,
            customerId
        }).populate([
            { path: 'vehicleId', select: 'vehicleInfo' },
            { path: 'packageId', select: 'packageName description durationMonths maxServicesPerMonth' }
        ]);

        if (!subscription) {
            return {
                success: false,
                statusCode: 404,
                message: "Không tìm thấy gói đăng ký"
            };
        }

        // Get usage statistics
        const Appointment = (await import("../models/appointment.js")).default;
        const usedServices = await Appointment.countDocuments({
            customer: customerId,
            vehicle: subscription.vehicleId,
            'serviceDetails.isFromPackage': true,
            createdAt: { $gte: subscription.startDate, $lte: subscription.endDate }
        });

        const totalServices = subscription.packageId.maxServicesPerMonth * subscription.packageId.durationMonths;
        const usagePercentage = (usedServices / totalServices) * 100;

        return {
            success: true,
            statusCode: 200,
            message: "Lấy thông tin sử dụng gói thành công",
            data: {
                subscription,
                usage: {
                    used: usedServices,
                    remaining: subscription.remainingServices,
                    total: totalServices,
                    percentage: Math.round(usagePercentage)
                }
            }
        };
    } catch (error) {
        console.error("Get subscription usage error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi lấy thông tin sử dụng gói"
        };
    }
};

export default {
    getCustomerSubscriptions,
    subscribeToPackage,
    renewSubscription,
    cancelSubscription,
    getSubscriptionUsage
};
