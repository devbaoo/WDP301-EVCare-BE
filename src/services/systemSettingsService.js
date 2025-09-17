import SystemSettings from "../models/systemSettings.js";

const getPolicies = async () => {
    try {
        const settings = await SystemSettings.getSettings();
        return { success: true, statusCode: 200, message: "Lấy cấu hình thành công", data: settings };
    } catch (error) {
        console.error("Get policies error:", error);
        return { success: false, statusCode: 500, message: "Lỗi khi lấy cấu hình" };
    }
};

const updatePolicies = async (payload) => {
    try {
        const settings = await SystemSettings.getSettings();
        const allowed = ["depositRate", "inspectionFee", "cancellationWindowHours", "autoCancelUnpaidMinutes", "currency"];
        for (const key of allowed) {
            if (payload[key] !== undefined) settings[key] = payload[key];
        }
        await settings.save();
        return { success: true, statusCode: 200, message: "Cập nhật cấu hình thành công", data: settings };
    } catch (error) {
        console.error("Update policies error:", error);
        return { success: false, statusCode: 500, message: "Lỗi khi cập nhật cấu hình" };
    }
};

export default { getPolicies, updatePolicies };


