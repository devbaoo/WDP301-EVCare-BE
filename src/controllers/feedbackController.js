import feedbackService from "../services/feedbackService.js";

const getMyFeedback = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const customerId = req.user.id;
        const result = await feedbackService.getFeedback(appointmentId, customerId);
        return res.status(result.statusCode).json({ success: result.success, message: result.message, data: result.data });
    } catch (error) {
        console.error("Get feedback error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const upsertMyFeedback = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const customerId = req.user.id;
        const result = await feedbackService.upsertFeedback(appointmentId, customerId, req.body);
        return res.status(result.statusCode).json({ success: result.success, message: result.message, data: result.data });
    } catch (error) {
        console.error("Upsert feedback error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const deleteMyFeedback = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const customerId = req.user.id;
        const result = await feedbackService.deleteFeedback(appointmentId, customerId);
        return res.status(result.statusCode).json({ success: result.success, message: result.message });
    } catch (error) {
        console.error("Delete feedback error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export default {
    getMyFeedback,
    upsertMyFeedback,
    deleteMyFeedback,
};


