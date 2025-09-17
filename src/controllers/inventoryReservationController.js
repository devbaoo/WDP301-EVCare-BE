import inventoryReservationService from "../services/inventoryReservationService.js";

const hold = async (req, res) => {
    try {
        const result = await inventoryReservationService.hold(req.body);
        return res.status(result.statusCode).json({ success: result.success, message: result.message, data: result.data });
    } catch (error) {
        console.error("Reservation hold error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const release = async (req, res) => {
    try {
        const { reservationId } = req.params;
        const result = await inventoryReservationService.release(reservationId);
        return res.status(result.statusCode).json({ success: result.success, message: result.message, data: result.data });
    } catch (error) {
        console.error("Reservation release error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const consume = async (req, res) => {
    try {
        const { reservationId } = req.params;
        const result = await inventoryReservationService.consume(reservationId);
        return res.status(result.statusCode).json({ success: result.success, message: result.message, data: result.data });
    } catch (error) {
        console.error("Reservation consume error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export default { hold, release, consume };


