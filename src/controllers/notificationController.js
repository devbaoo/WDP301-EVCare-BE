import User from "../models/user.js";

// Get user notification settings
const getNotificationSettings = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId).select('notificationSettings');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy người dùng"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Lấy cài đặt thông báo thành công",
            data: user.notificationSettings || {}
        });
    } catch (error) {
        console.error("Get notification settings error:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy cài đặt thông báo"
        });
    }
};

// Update user notification settings
const updateNotificationSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const { notificationSettings } = req.body;

        if (!notificationSettings) {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin cài đặt thông báo"
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy người dùng"
            });
        }

        // Merge with existing settings to preserve other fields
        user.notificationSettings = {
            ...user.notificationSettings,
            ...notificationSettings
        };

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Cập nhật cài đặt thông báo thành công",
            data: user.notificationSettings
        });
    } catch (error) {
        console.error("Update notification settings error:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật cài đặt thông báo"
        });
    }
};

// Update specific email notification type
const updateEmailNotification = async (req, res) => {
    try {
        const userId = req.user.id;
        const { category, enabled } = req.body; // category: 'maintenanceReminders'|'packageRenewalReminders'|etc.

        if (!category || typeof enabled !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin cần thiết (category, enabled)"
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy người dùng"
            });
        }

        // Initialize notificationSettings if not exists
        if (!user.notificationSettings) {
            user.notificationSettings = {};
        }
        if (!user.notificationSettings.email) {
            user.notificationSettings.email = {};
        }

        user.notificationSettings.email[category] = enabled;
        await user.save();

        return res.status(200).json({
            success: true,
            message: `Cập nhật email.${category} thành ${enabled ? 'bật' : 'tắt'}`,
            data: {
                category,
                enabled,
                settings: user.notificationSettings
            }
        });
    } catch (error) {
        console.error("Update email notification error:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật thông báo email"
        });
    }
};

// Reset notification settings to defaults
const resetNotificationSettings = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy người dùng"
            });
        }

        // Reset to default settings
        user.notificationSettings = {
            email: {
                maintenanceReminders: true,
                packageRenewalReminders: true,
                bookingUpdates: true,
                paymentNotifications: true,
                generalUpdates: true
            }
        };

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Đặt lại cài đặt thông báo về mặc định thành công",
            data: user.notificationSettings
        });
    } catch (error) {
        console.error("Reset notification settings error:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi đặt lại cài đặt thông báo"
        });
    }
};

export default {
    getNotificationSettings,
    updateNotificationSettings,
    updateEmailNotification,
    resetNotificationSettings
};
