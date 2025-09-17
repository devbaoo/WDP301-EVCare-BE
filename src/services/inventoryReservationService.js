import InventoryReservation from "../models/inventoryReservation.js";

const hold = async ({ appointmentId, serviceCenterId, items, expiresAt, notes }) => {
    try {
        // Lazy-load CenterInventory to avoid top-level await issues
        const mod = await import("../models/centerInventory.js");
        const CenterInventory = mod.default || mod;
        // Validate tồn kho theo từng part
        const insufficient = [];
        for (const it of items) {
            const inv = await CenterInventory.findOne({ centerId: serviceCenterId, partId: it.partId });
            const stock = inv?.currentStock || 0;
            if (stock < it.quantity) {
                insufficient.push({ partId: it.partId, required: it.quantity, available: stock });
            }
        }
        if (insufficient.length > 0) {
            return { success: false, statusCode: 400, message: "Không đủ tồn kho", data: { insufficient } };
        }
        const doc = await InventoryReservation.create({ appointmentId, serviceCenterId, items, expiresAt, notes });
        return { success: true, statusCode: 201, message: "Giữ chỗ phụ tùng thành công", data: doc };
    } catch (error) {
        console.error("Reservation hold error:", error);
        return { success: false, statusCode: 500, message: "Lỗi khi giữ chỗ phụ tùng" };
    }
};

const release = async (reservationId) => {
    try {
        const doc = await InventoryReservation.findById(reservationId);
        if (!doc) return { success: false, statusCode: 404, message: "Không tìm thấy reservation" };
        doc.status = "released";
        await doc.save();
        return { success: true, statusCode: 200, message: "Đã release reservation", data: doc };
    } catch (error) {
        console.error("Reservation release error:", error);
        return { success: false, statusCode: 500, message: "Lỗi khi release reservation" };
    }
};

const consume = async (reservationId) => {
    try {
        const doc = await InventoryReservation.findById(reservationId);
        if (!doc) return { success: false, statusCode: 404, message: "Không tìm thấy reservation" };
        doc.status = "consumed";
        await doc.save();
        return { success: true, statusCode: 200, message: "Đã consume reservation", data: doc };
    } catch (error) {
        console.error("Reservation consume error:", error);
        return { success: false, statusCode: 500, message: "Lỗi khi consume reservation" };
    }
};

export default { hold, release, consume };


