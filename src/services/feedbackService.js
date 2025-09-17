import Appointment from "../models/appointment.js";

// Get feedback of an appointment (owner only)
const getFeedback = async (appointmentId, customerId) => {
    try {
        const appointment = await Appointment.findOne({ _id: appointmentId, customer: customerId });

        if (!appointment) {
            return { success: false, statusCode: 404, message: "Không tìm thấy booking" };
        }

        return {
            success: true,
            statusCode: 200,
            message: "Lấy đánh giá thành công",
            data: appointment.rating || null,
        };
    } catch (error) {
        console.error("Get feedback error:", error);
        return { success: false, statusCode: 500, message: "Lỗi khi lấy đánh giá" };
    }
};

// Create or update feedback
const upsertFeedback = async (appointmentId, customerId, feedback) => {
    try {
        const { overall, service, technician, facility, comment } = feedback || {};

        const appointment = await Appointment.findOne({ _id: appointmentId, customer: customerId });

        if (!appointment) {
            return { success: false, statusCode: 404, message: "Không tìm thấy booking" };
        }

        // Enforce status: allow only after maintenance completed or completed
        if (!["maintenance_completed", "completed"].includes(appointment.status)) {
            return { success: false, statusCode: 400, message: "Chỉ được đánh giá sau khi dịch vụ hoàn thành" };
        }

        appointment.rating = appointment.rating || {};
        if (overall !== undefined) appointment.rating.overall = overall;
        if (service !== undefined) appointment.rating.service = service;
        if (technician !== undefined) appointment.rating.technician = technician;
        if (facility !== undefined) appointment.rating.facility = facility;
        if (comment !== undefined) appointment.rating.comment = comment;
        appointment.rating.ratedAt = new Date();

        await appointment.save();

        return {
            success: true,
            statusCode: 200,
            message: "Lưu đánh giá thành công",
            data: appointment.rating,
        };
    } catch (error) {
        console.error("Upsert feedback error:", error);
        return { success: false, statusCode: 500, message: "Lỗi khi lưu đánh giá" };
    }
};

// Delete feedback (clear rating fields)
const deleteFeedback = async (appointmentId, customerId) => {
    try {
        const appointment = await Appointment.findOne({ _id: appointmentId, customer: customerId });

        if (!appointment) {
            return { success: false, statusCode: 404, message: "Không tìm thấy booking" };
        }

        appointment.rating = {
            overall: undefined,
            service: undefined,
            technician: undefined,
            facility: undefined,
            comment: undefined,
            ratedAt: undefined,
        };

        // Alternatively unset the field entirely
        appointment.markModified("rating");
        await appointment.save();

        return { success: true, statusCode: 200, message: "Xóa đánh giá thành công" };
    } catch (error) {
        console.error("Delete feedback error:", error);
        return { success: false, statusCode: 500, message: "Lỗi khi xóa đánh giá" };
    }
};

export default {
    getFeedback,
    upsertFeedback,
    deleteFeedback,
};


