import costAnalyticsService from "../services/costAnalyticsService.js";

// GET /api/costs/history
const getPersonalCostHistory = async (req, res) => {
    try {
        const customerId = req.user.id;
        const filters = req.query;
        const result = await costAnalyticsService.getPersonalCostHistory(customerId, filters);
        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        console.error("Get personal cost history error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// GET /api/costs/summary
const getPersonalCostSummary = async (req, res) => {
    try {
        const customerId = req.user.id;
        const filters = req.query;
        const result = await costAnalyticsService.getPersonalCostSummary(customerId, filters);
        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        console.error("Get personal cost summary error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export default {
    getPersonalCostHistory,
    getPersonalCostSummary,
};


