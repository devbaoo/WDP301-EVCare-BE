import cron from 'node-cron';
import reminderService from './reminderService.js';
import SystemSettings from "../models/systemSettings.js";
import Appointment from "../models/appointment.js";

class CronService {
    constructor() {
        this.jobs = new Map();
        this.isRunning = false;
    }

    // Khởi động tất cả cron jobs
    start() {
        if (this.isRunning) {
            console.log('Cron service is already running');
            return;
        }

        console.log('Starting cron service...');

        // Job 1: Chạy maintenance reminders hàng ngày lúc 9:00 AM
        const maintenanceJob = cron.schedule('0 9 * * *', async () => {
            console.log('Running daily maintenance reminders...');
            try {
                const result = await reminderService.runMaintenanceReminders({
                    monthsThreshold: 1, // Nhắc nhở 1 tháng trước
                    kmThreshold: 500,   // Nhắc nhở 500km trước
                    limit: 1000
                });
                console.log('Maintenance reminders result:', result);
            } catch (error) {
                console.error('Error running maintenance reminders:', error);
            }
        }, {
            scheduled: false,
            timezone: "Asia/Ho_Chi_Minh"
        });

        // Job 2: Chạy package renewal reminders hàng ngày lúc 10:00 AM
        const packageJob = cron.schedule('0 10 * * *', async () => {
            console.log('Running daily package renewal reminders...');
            try {
                const result = await reminderService.runPackageRenewalReminders({
                    daysBefore: 7, // Nhắc nhở 7 ngày trước khi hết hạn
                    alsoWhenZeroRemaining: true,
                    remainingThreshold: 1, // Nhắc nhở khi còn 1 dịch vụ
                    includePendingPayment: true,
                    limit: 1000
                });
                console.log('Package renewal reminders result:', result);
            } catch (error) {
                console.error('Error running package renewal reminders:', error);
            }
        }, {
            scheduled: false,
            timezone: "Asia/Ho_Chi_Minh"
        });

        // Job 3: Chạy maintenance reminders hàng tuần (Chủ nhật 8:00 AM) - cho những xe cần bảo dưỡng gấp
        const weeklyMaintenanceJob = cron.schedule('0 8 * * 0', async () => {
            console.log('Running weekly maintenance reminders...');
            try {
                const result = await reminderService.runMaintenanceReminders({
                    monthsThreshold: 0.5, // Nhắc nhở 2 tuần trước
                    kmThreshold: 200,     // Nhắc nhở 200km trước
                    limit: 1000
                });
                console.log('Weekly maintenance reminders result:', result);
            } catch (error) {
                console.error('Error running weekly maintenance reminders:', error);
            }
        }, {
            scheduled: false,
            timezone: "Asia/Ho_Chi_Minh"
        });

        // Job 4: Auto-cancel unpaid upfront bookings mỗi 15 phút
        const autoCancelJob = cron.schedule('*/15 * * * *', async () => {
            console.log('Running auto-cancel unpaid upfront bookings...');
            try {
                const settings = await SystemSettings.getSettings();
                const minutes = settings.autoCancelUnpaidMinutes || 30;
                const threshold = new Date(Date.now() - minutes * 60 * 1000);

                // Tìm appointment pending_confirmation có payment.amount>0 && payment.status=pending && createdAt < threshold
                const toCancel = await Appointment.find({
                    status: 'pending_confirmation',
                    'payment.amount': { $gt: 0 },
                    'payment.status': 'pending',
                    createdAt: { $lt: threshold },
                }).limit(100);

                for (const appt of toCancel) {
                    appt.status = 'cancelled';
                    appt.cancellation = appt.cancellation || {};
                    appt.cancellation.isCancelled = true;
                    appt.cancellation.cancelledAt = new Date();
                    appt.cancellation.reason = 'Auto-cancel: unpaid upfront timeout';
                    await appt.save();
                }
                console.log(`Auto-cancelled ${toCancel.length} bookings`);
            } catch (error) {
                console.error('Error running auto-cancel job:', error);
            }
        }, {
            scheduled: false,
            timezone: "Asia/Ho_Chi_Minh"
        });

        // Lưu jobs
        this.jobs.set('maintenance-daily', maintenanceJob);
        this.jobs.set('package-daily', packageJob);
        this.jobs.set('maintenance-weekly', weeklyMaintenanceJob);
        this.jobs.set('auto-cancel-unpaid', autoCancelJob);

        // Khởi động tất cả jobs
        this.jobs.forEach((job, name) => {
            job.start();
            console.log(`Started cron job: ${name}`);
        });

        this.isRunning = true;
        console.log('All cron jobs started successfully');
    }

    // Dừng tất cả cron jobs
    stop() {
        if (!this.isRunning) {
            console.log('Cron service is not running');
            return;
        }

        console.log('Stopping cron service...');
        this.jobs.forEach((job, name) => {
            job.stop();
            console.log(`Stopped cron job: ${name}`);
        });

        this.jobs.clear();
        this.isRunning = false;
        console.log('All cron jobs stopped');
    }

    // Chạy thủ công một job cụ thể
    async runJob(jobName) {
        console.log(`Manually running job: ${jobName}`);

        try {
            switch (jobName) {
                case 'maintenance-daily':
                    return await reminderService.runMaintenanceReminders({
                        monthsThreshold: 1,
                        kmThreshold: 500,
                        limit: 1000
                    });

                case 'package-daily':
                    return await reminderService.runPackageRenewalReminders({
                        daysBefore: 7,
                        alsoWhenZeroRemaining: true,
                        remainingThreshold: 1,
                        includePendingPayment: true,
                        limit: 1000
                    });

                case 'maintenance-weekly':
                    return await reminderService.runMaintenanceReminders({
                        monthsThreshold: 0.5,
                        kmThreshold: 200,
                        limit: 1000
                    });

                default:
                    throw new Error(`Unknown job: ${jobName}`);
            }
        } catch (error) {
            console.error(`Error running job ${jobName}:`, error);
            throw error;
        }
    }

    // Lấy trạng thái của tất cả jobs
    getStatus() {
        const status = {
            isRunning: this.isRunning,
            jobs: {}
        };

        this.jobs.forEach((job, name) => {
            status.jobs[name] = {
                running: job.running,
                scheduled: job.scheduled
            };
        });

        return status;
    }

    // Lấy danh sách jobs
    getJobs() {
        return Array.from(this.jobs.keys());
    }
}

// Export singleton instance
const cronService = new CronService();
export default cronService;
