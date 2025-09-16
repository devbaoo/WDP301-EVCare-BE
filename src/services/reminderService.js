import Vehicle from "../models/vehicle.js";
import VehicleModel from "../models/vehicleModel.js";
import CustomerPackage from "../models/customerPackage.js";
import User from "../models/user.js";
import emailService from "./emailService.js";

// Helper: months between dates
const monthsBetween = (fromDate, toDate) => {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    let months = (to.getFullYear() - from.getFullYear()) * 12;
    months += to.getMonth() - from.getMonth();
    return months + (to.getDate() >= from.getDate() ? 0 : -1);
};

// Run maintenance reminders based on VehicleModel.maintenanceIntervals and Vehicle.currentStatus
const runMaintenanceReminders = async (options = {}) => {
    try {
        const {
            kmThreshold = 300, // remind when within 300km of nextServiceMileage
            monthsThreshold = 1, // remind when within 1 month of next interval
            limit = 500,
            preview = false, // don't send email, just list
        } = options;

        const vehicles = await Vehicle.find({ status: "active" })
            .populate("owner", "email fullName username notificationSettings")
            .populate("vehicleInfo.vehicleModel", "brand modelName maintenanceIntervals");

        console.log(`Found ${vehicles.length} active vehicles to check for maintenance reminders`);

        let remindersSent = 0;
        const matchedIds = [];
        const now = new Date();

        for (const v of vehicles) {
            if (!v.owner?.email) {
                console.log(`Vehicle ${v._id} has no owner email, skipping`);
                continue;
            }

            // Check if user has enabled email notifications for maintenance reminders
            const emailEnabled = v.owner?.notificationSettings?.email?.maintenanceReminders !== false;
            if (!emailEnabled) {
                console.log(`Vehicle ${v._id} owner has disabled maintenance reminder emails, skipping`);
                continue;
            }

            const vm = v.vehicleInfo?.vehicleModel;
            const intervals = vm?.maintenanceIntervals || {};
            console.log(`Checking vehicle ${v._id} (${vm?.brand} ${vm?.modelName}) with intervals:`, intervals);

            // Time-based: check months since lastServiceDate or vehicle creation
            const lastServiceDate = v.currentStatus?.lastServiceDate || v.createdAt;
            const monthsSince = monthsBetween(lastServiceDate, now);
            console.log(`Months since last service: ${monthsSince} (lastServiceDate: ${lastServiceDate})`);

            let timeDue = false;
            let timeReason = "";
            // Find any interval like "6months", "12months" and check threshold
            for (const key of Object.keys(intervals)) {
                const m = key.match(/(\d+)\s*months?/i);
                if (m) {
                    const every = parseInt(m[1], 10);
                    const remainder = monthsSince % every;
                    const monthsToNext = every - remainder;
                    console.log(`Interval ${key}: every ${every} months, remainder ${remainder}, months to next: ${monthsToNext}`);

                    // Approaching next cycle if within threshold of cycle end
                    if (monthsToNext <= monthsThreshold) {
                        timeDue = true;
                        timeReason = `${key} interval (${monthsToNext} months to next service)`;
                        break;
                    }
                }
            }

            // Mileage-based: check against maintenance intervals
            const currentMileage = v.currentStatus?.mileage || 0;
            let kmDue = false;
            let kmReason = "";

            // Check if current mileage is approaching any km-based intervals
            for (const key of Object.keys(intervals)) {
                const m = key.match(/(\d+)\s*km/i);
                if (m) {
                    const intervalKm = parseInt(m[1], 10);
                    const kmToNext = intervalKm - (currentMileage % intervalKm);
                    console.log(`Interval ${key}: every ${intervalKm}km, current ${currentMileage}, km to next: ${kmToNext}`);

                    if (kmToNext <= kmThreshold) {
                        kmDue = true;
                        kmReason = `${key} interval (${kmToNext}km to next service)`;
                        break;
                    }
                }
            }

            console.log(`Vehicle ${v._id} - timeDue: ${timeDue}, kmDue: ${kmDue}`);

            if (timeDue || kmDue) {
                matchedIds.push(String(v._id));
                if (!preview) {
                    try {
                        await emailService.sendMaintenanceReminder({
                            vehicle: v,
                            owner: v.owner,
                            vehicleModel: vm,
                            reason: {
                                timeDue,
                                kmDue,
                                timeReason,
                                kmReason,
                                currentMileage,
                                monthsSince,
                                nextServiceMileage: null // Not used in current logic
                            }
                        });
                        remindersSent += 1;
                        console.log(`Sent maintenance reminder for vehicle ${v._id} to ${v.owner.email}`);
                        if (remindersSent >= limit) break;
                    } catch (e) {
                        console.error(`Failed to send maintenance reminder for vehicle ${v._id}:`, e.message);
                        // continue others
                    }
                } else {
                    console.log(`Preview: Would send maintenance reminder for vehicle ${v._id} to ${v.owner.email}`);
                }
            }
        }

        return {
            success: true,
            statusCode: 200,
            message: "Đã chạy nhắc nhở bảo dưỡng",
            data: {
                remindersSent,
                matched: preview ? matchedIds : undefined,
                totalVehicles: vehicles.length,
                checkedVehicles: vehicles.filter(v => v.owner?.email).length
            },
        };
    } catch (error) {
        console.error("Run maintenance reminders error:", error);
        return { success: false, statusCode: 500, message: "Lỗi khi chạy nhắc nhở bảo dưỡng" };
    }
};

// Run package renewal reminders for CustomerPackage nearing end
const runPackageRenewalReminders = async (options = {}) => {
    try {
        const {
            daysBefore = 7, // remind N days before endDate
            alsoWhenZeroRemaining = true,
            remainingThreshold = 0, // remind when remainingServices <= threshold
            includePendingPayment = false, // remind when paymentStatus != paid
            preview = false, // don't send email, just list
            limit = 500,
        } = options;

        const now = new Date();
        const target = new Date(now.getTime() + daysBefore * 24 * 60 * 60 * 1000);

        const query = {
            status: "active",
        };

        const subs = await CustomerPackage.find(query)
            .populate("customerId", "email fullName username notificationSettings")
            .populate({ path: "vehicleId", select: "vehicleInfo", populate: { path: "vehicleInfo.vehicleModel", select: "brand modelName" } })
            .populate({ path: "packageId", select: "packageName durationMonths price" });

        let remindersSent = 0;
        const matchedIds = [];
        for (const s of subs) {
            const end = new Date(s.endDate);
            const daysLeft = Math.ceil((end - now) / (24 * 60 * 60 * 1000));
            const nearExpiry = end <= target;
            const lowRemaining = (alsoWhenZeroRemaining && (s.remainingServices <= 0)) || (remainingThreshold > 0 && s.remainingServices <= remainingThreshold);
            const pendingPayment = includePendingPayment && s.paymentStatus && s.paymentStatus !== 'paid';

            // Check if user has enabled email notifications for package renewal reminders
            const emailEnabled = s.customerId?.notificationSettings?.email?.packageRenewalReminders !== false;

            if ((nearExpiry || lowRemaining || pendingPayment) && s.customerId?.email && emailEnabled) {
                matchedIds.push(String(s._id));
                if (!preview) {
                    try {
                        await emailService.sendPackageRenewalReminder({ subscription: s, daysLeft });
                        remindersSent += 1;
                        if (remindersSent >= limit) break;
                    } catch (e) {
                        // continue others
                    }
                }
            }
        }

        return {
            success: true,
            statusCode: 200,
            message: "Đã chạy nhắc nhở gia hạn gói",
            data: { remindersSent, matched: matchedIds },
        };
    } catch (error) {
        console.error("Run package renewal reminders error:", error);
        return { success: false, statusCode: 500, message: "Lỗi khi chạy nhắc nhở gia hạn gói" };
    }
};

export default {
    runMaintenanceReminders,
    runPackageRenewalReminders,
};


