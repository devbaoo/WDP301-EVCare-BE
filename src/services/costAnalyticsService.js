import Payment from "../models/payment.js";
import Appointment from "../models/appointment.js";

// Build date filter
const buildDateRange = (from, to) => {
    const filter = {};
    if (from || to) {
        filter.$and = [];
        if (from) {
            filter.$and.push({ createdAt: { $gte: new Date(from) } });
        }
        if (to) {
            filter.$and.push({ createdAt: { $lte: new Date(to) } });
        }
        if (filter.$and.length === 0) delete filter.$and;
    }
    return filter;
};

// History: list transactions (online and offline) for a customer
const getPersonalCostHistory = async (customerId, filters = {}) => {
    try {
        const {
            from, // ISO date
            to,   // ISO date
            vehicleId,
            serviceCenterId,
            page = 1,
            limit = 10,
        } = filters;

        const dateFilter = buildDateRange(from, to);

        // Online payments (PayOS etc.)
        const paymentQuery = {
            customer: customerId,
            status: "paid",
            ...(dateFilter.$and ? {} : dateFilter),
        };

        // For date bounds by Payment.createdAt when provided
        if (dateFilter.$and) {
            paymentQuery.$and = [
                { customer: customerId },
                { status: "paid" },
                ...dateFilter.$and,
            ];
        }

        if (vehicleId) paymentQuery.appointment = { $in: [] }; // placeholder; we will post-filter
        if (serviceCenterId) paymentQuery.appointment = { $in: [] }; // placeholder; we will post-filter

        const onlinePayments = await Payment.find(paymentQuery)
            .populate({
                path: "appointment", select: "vehicle serviceCenter serviceType serviceDetails payment", populate: [
                    { path: "vehicle", select: "vehicleInfo" },
                    { path: "serviceCenter", select: "name" },
                    { path: "serviceType", select: "name" },
                ]
            })
            .sort({ createdAt: -1 });

        // Offline payments captured on appointment
        const apptQuery = {
            customer: customerId,
            "payment.status": "paid",
            "payment.method": { $in: ["cash", "card", "banking"] },
        };
        if (from || to) {
            apptQuery.createdAt = {};
            if (from) apptQuery.createdAt.$gte = new Date(from);
            if (to) apptQuery.createdAt.$lte = new Date(to);
        }
        if (vehicleId) apptQuery.vehicle = vehicleId;
        if (serviceCenterId) apptQuery.serviceCenter = serviceCenterId;

        const offlineAppointments = await Appointment.find(apptQuery)
            .populate([
                { path: "vehicle", select: "vehicleInfo" },
                { path: "serviceCenter", select: "name" },
                { path: "serviceType", select: "name" },
            ])
            .sort({ createdAt: -1 });

        // Map to unified records
        const onlineRecords = onlinePayments
            .filter(p => {
                // Optional filter by vehicle/center via populated appointment
                if (vehicleId && p.appointment?.vehicle?.id !== String(vehicleId)) return false;
                if (serviceCenterId && p.appointment?.serviceCenter?.id !== String(serviceCenterId)) return false;
                return true;
            })
            .map(p => ({
                type: "online",
                amount: p.paymentInfo.amount,
                currency: p.paymentInfo.currency,
                description: p.paymentInfo.description,
                status: p.status,
                paymentMethod: p.paymentMethod,
                createdAt: p.createdAt,
                appointmentId: p.appointment?._id,
                vehicle: p.appointment?.vehicle,
                serviceCenter: p.appointment?.serviceCenter,
                serviceType: p.appointment?.serviceType,
            }));

        const offlineRecords = offlineAppointments.map(a => ({
            type: "offline",
            amount: a.payment?.amount ?? a.serviceDetails?.actualCost ?? a.serviceDetails?.estimatedCost ?? 0,
            currency: "VND",
            description: a.serviceDetails?.description || `Thanh toán tại trung tâm cho lịch hẹn ${a._id}`,
            status: a.payment?.status || "paid",
            paymentMethod: a.payment?.method || "cash",
            createdAt: a.updatedAt || a.createdAt,
            appointmentId: a._id,
            vehicle: a.vehicle,
            serviceCenter: a.serviceCenter,
            serviceType: a.serviceType,
        }));

        const all = [...onlineRecords, ...offlineRecords]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const start = (parseInt(page) - 1) * parseInt(limit);
        const paged = all.slice(start, start + parseInt(limit));

        return {
            success: true,
            statusCode: 200,
            message: "Lấy lịch sử chi phí thành công",
            data: {
                items: paged,
                pagination: {
                    currentPage: parseInt(page),
                    itemsPerPage: parseInt(limit),
                    totalItems: all.length,
                    totalPages: Math.ceil(all.length / parseInt(limit)) || 1,
                }
            }
        };
    } catch (error) {
        console.error("Get personal cost history error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi lấy lịch sử chi phí",
        };
    }
};

// Summary: totals by period/vehicle/serviceCenter
const getPersonalCostSummary = async (customerId, filters = {}) => {
    try {
        const { from, to, groupBy = "month" } = filters; // groupBy: day|month|year|vehicle|serviceCenter|serviceType

        // Reuse history without pagination to aggregate
        const hist = await getPersonalCostHistory(customerId, { from, to, page: 1, limit: 100000 });
        if (!hist.success) return hist;
        const items = hist.data.items;

        const sum = items.reduce((acc, r) => acc + (r.amount || 0), 0);

        const groupKeyFn = (r) => {
            if (groupBy === "day") return new Date(r.createdAt).toISOString().slice(0, 10);
            if (groupBy === "month") return new Date(r.createdAt).toISOString().slice(0, 7);
            if (groupBy === "year") return new Date(r.createdAt).getFullYear().toString();
            if (groupBy === "vehicle") return r.vehicle?._id?.toString() || "unknown";
            if (groupBy === "serviceCenter") return r.serviceCenter?._id?.toString() || "unknown";
            if (groupBy === "serviceType") return r.serviceType?._id?.toString() || "unknown";
            return "all";
        };

        const groups = {};
        for (const r of items) {
            const k = groupKeyFn(r);
            if (!groups[k]) {
                groups[k] = { amount: 0, count: 0, sample: r };
            }
            groups[k].amount += r.amount || 0;
            groups[k].count += 1;
        }

        const breakdown = Object.entries(groups).map(([key, val]) => ({
            key,
            amount: val.amount,
            count: val.count,
            sample: {
                vehicle: val.sample.vehicle,
                serviceCenter: val.sample.serviceCenter,
                serviceType: val.sample.serviceType,
            }
        })).sort((a, b) => b.amount - a.amount);

        return {
            success: true,
            statusCode: 200,
            message: "Lấy tổng hợp chi phí thành công",
            data: {
                totalAmount: sum,
                currency: "VND",
                from: from ? new Date(from) : undefined,
                to: to ? new Date(to) : undefined,
                groupBy,
                breakdown,
            }
        };
    } catch (error) {
        console.error("Get personal cost summary error:", error);
        return {
            success: false,
            statusCode: 500,
            message: "Lỗi khi lấy tổng hợp chi phí",
        };
    }
};

export default {
    getPersonalCostHistory,
    getPersonalCostSummary,
};


