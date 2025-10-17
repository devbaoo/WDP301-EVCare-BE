import InventoryReservation from "../models/inventoryReservation.js";
import inventoryService from "./inventoryService.js";
import mongoose from "mongoose";
import { sendBackorderNotification } from "./emailService.js";

// Helper to lazy-load CenterInventory model
const getCenterInventoryModel = async () => {
    const mod = await import("../models/centerInventory.js");
    return mod.default || mod;
};

const hold = async ({ appointmentId, serviceCenterId, items, expiresAt, notes }) => {
    try {
        const CenterInventory = await getCenterInventoryModel();

        // Validate availability and prepare updates
        const insufficient = [];
        const updates = [];

        for (const it of items) {
            const inv = await CenterInventory.findOne({ centerId: serviceCenterId, partId: it.partId });
            const available = inv?.currentStock - (inv?.reservedQuantity || 0) || 0;
            if (!inv || available < it.quantity) {
                insufficient.push({ partId: it.partId, required: it.quantity, available: inv?.currentStock || 0, reserved: inv?.reservedQuantity || 0 });
            } else {
                updates.push({ inventoryId: inv._id, inc: it.quantity });
            }
        }

        if (insufficient.length > 0) {
            // send backorder notification if possible
            try {
                const apptMod = await import("../models/appointment.js");
                const Appointment = apptMod.default || apptMod;
                const appt = await Appointment.findById(appointmentId).populate('customer');
                if (appt) {
                    await sendBackorderNotification(appt, insufficient, 7);
                }
            } catch (e) {
                console.error('Failed to send backorder email on hold failure:', e);
            }

            return { success: false, statusCode: 400, message: "Không đủ tồn kho để giữ chỗ", data: { insufficient } };
        }

        // Try to perform operations within a transaction if supported
        let session;
        try {
            session = await mongoose.startSession();
            let reservationDoc = null;
            await session.withTransaction(async () => {
                // increment reservedQuantity for each inventory
                for (const u of updates) {
                    await CenterInventory.findByIdAndUpdate(u.inventoryId, { $inc: { reservedQuantity: u.inc } }, { session });
                }
                reservationDoc = await InventoryReservation.create([{ appointmentId, serviceCenterId, items, expiresAt, notes }], { session });
            });
            // reservationDoc is an array
            const created = reservationDoc && reservationDoc[0] ? reservationDoc[0] : null;
            return { success: true, statusCode: 201, message: "Giữ chỗ phụ tùng thành công", data: created };
        } catch (err) {
            console.warn('Transaction hold fallback (sessions might not be supported):', err.message || err);
            // Fallback: best-effort updates (non-transactional)
            try {
                for (const u of updates) {
                    await CenterInventory.findByIdAndUpdate(u.inventoryId, { $inc: { reservedQuantity: u.inc } });
                }
                const doc = await InventoryReservation.create({ appointmentId, serviceCenterId, items, expiresAt, notes });
                return { success: true, statusCode: 201, message: "Giữ chỗ phụ tùng thành công (fallback)", data: doc };
            } catch (e) {
                console.error('Fallback hold error:', e);
                return { success: false, statusCode: 500, message: 'Lỗi khi giữ chỗ phụ tùng' };
            }
        } finally {
            if (session) session.endSession();
        }
    } catch (error) {
        console.error("Reservation hold error:", error);
        return { success: false, statusCode: 500, message: "Lỗi khi giữ chỗ phụ tùng" };
    }
};

const release = async (reservationId) => {
    try {
        const doc = await InventoryReservation.findById(reservationId);
        if (!doc) return { success: false, statusCode: 404, message: "Không tìm thấy reservation" };

        const CenterInventory = await getCenterInventoryModel();
        // Decrement reservedQuantity for each item (best-effort)
        for (const it of doc.items) {
            const inv = await CenterInventory.findOne({ centerId: doc.serviceCenterId, partId: it.partId });
            if (inv) {
                await CenterInventory.findByIdAndUpdate(inv._id, { $inc: { reservedQuantity: -Math.min(inv.reservedQuantity || 0, it.quantity) } });
            }
        }

        doc.status = "released";
        await doc.save();
        return { success: true, statusCode: 200, message: "Đã release reservation", data: doc };
    } catch (error) {
        console.error("Reservation release error:", error);
        return { success: false, statusCode: 500, message: "Lỗi khi release reservation" };
    }
};

const consume = async (reservationId, performedBy) => {
    try {
        const doc = await InventoryReservation.findById(reservationId);
        if (!doc) return { success: false, statusCode: 404, message: "Không tìm thấy reservation" };

        const CenterInventory = await getCenterInventoryModel();
        const failures = [];

        // For each item, create an 'out' transaction using inventoryService and decrement reservedQuantity
        // attempt transaction
        let session2;
        try {
            session2 = await mongoose.startSession();
            let txFailures = [];
            await session2.withTransaction(async () => {
                for (const it of doc.items) {
                    const inv = await CenterInventory.findOne({ centerId: doc.serviceCenterId, partId: it.partId }).session(session2);
                    if (!inv || (inv.currentStock || 0) < it.quantity) {
                        txFailures.push({ partId: it.partId, required: it.quantity, available: inv?.currentStock || 0 });
                        continue;
                    }

                    // perform transaction record and update inventory.currentStock using inventoryService
                    const txResult = await inventoryService.createTransaction({ inventoryId: inv._id, transactionType: 'out', quantity: it.quantity, referenceType: 'service', referenceId: doc.appointmentId }, performedBy);
                    if (!txResult || !txResult.success) {
                        txFailures.push({ inventoryId: inv._id, message: txResult?.message || 'Transaction failed' });
                        continue;
                    }

                    // decrement reservedQuantity in same session
                    await CenterInventory.findByIdAndUpdate(inv._id, { $inc: { reservedQuantity: -Math.min(inv.reservedQuantity || 0, it.quantity) } }, { session: session2 });
                }

                if (txFailures.length > 0) {
                    // throw to abort transaction
                    throw new Error('Transaction failures during consume');
                }

                doc.status = 'consumed';
                await doc.save({ session: session2 });
            });

            return { success: true, statusCode: 200, message: 'Đã consume reservation', data: doc };
        } catch (err) {
            console.warn('Transaction consume fallback or failed:', err.message || err);
            // Fallback: try best-effort consume without session
            for (const it of doc.items) {
                const inv = await CenterInventory.findOne({ centerId: doc.serviceCenterId, partId: it.partId });
                if (!inv || (inv.currentStock || 0) < it.quantity) {
                    failures.push({ partId: it.partId, required: it.quantity, available: inv?.currentStock || 0 });
                    continue;
                }

                const txResult = await inventoryService.createTransaction({ inventoryId: inv._id, transactionType: 'out', quantity: it.quantity, referenceType: 'service', referenceId: doc.appointmentId }, performedBy);
                if (!txResult || !txResult.success) {
                    failures.push({ inventoryId: inv._id, message: txResult?.message || 'Transaction failed' });
                } else {
                    await CenterInventory.findByIdAndUpdate(inv._id, { $inc: { reservedQuantity: -Math.min(inv.reservedQuantity || 0, it.quantity) } });
                }
            }

            if (failures.length > 0) {
                // send backorder email to appointment customer
                try {
                    const apptMod = await import("../models/appointment.js");
                    const Appointment = apptMod.default || apptMod;
                    const appt = await Appointment.findById(doc.appointmentId).populate('customer');
                    if (appt) await sendBackorderNotification(appt, failures, 7);
                } catch (e) {
                    console.error('Failed to send backorder email on consume failures:', e);
                }

                return { success: false, statusCode: 400, message: 'Không thể consume toàn bộ reservation', data: { failures } };
            }

            // otherwise mark consumed
            doc.status = 'consumed';
            await doc.save();
            return { success: true, statusCode: 200, message: 'Đã consume reservation (fallback)', data: doc };
        } finally {
            if (session2) session2.endSession();
        }
    } catch (error) {
        console.error('Reservation consume error:', error);
        return { success: false, statusCode: 500, message: 'Lỗi khi consume reservation' };
    }
};

export default { hold, release, consume };


