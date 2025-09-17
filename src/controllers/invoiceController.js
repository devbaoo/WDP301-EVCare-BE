import invoiceService from "../services/invoiceService.js";

const createFromAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const result = await invoiceService.createFromAppointment(appointmentId, req.body);
        return res.status(result.statusCode).json({ success: result.success, message: result.message, data: result.data });
    } catch (error) {
        console.error("Create invoice error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const sendEmail = async (req, res) => {
    try {
        const { invoiceId } = req.params;
        const result = await invoiceService.sendInvoiceEmail(invoiceId);
        return res.status(result.statusCode).json({ success: result.success, message: result.message, data: result.data });
    } catch (error) {
        console.error("Send invoice email error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export default { createFromAppointment, sendEmail };


