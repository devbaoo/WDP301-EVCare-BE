import systemSettingsService from "../services/systemSettingsService.js";

const getPolicies = async (req, res) => {
    try {
        const result = await systemSettingsService.getPolicies();
        return res.status(result.statusCode).json({ success: result.success, message: result.message, data: result.data });
    } catch (error) {
        console.error("Get policies error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const updatePolicies = async (req, res) => {
    try {
        const result = await systemSettingsService.updatePolicies(req.body);
        return res.status(result.statusCode).json({ success: result.success, message: result.message, data: result.data });
    } catch (error) {
        console.error("Update policies error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export default { getPolicies, updatePolicies };


