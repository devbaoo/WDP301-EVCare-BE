import express from "express";
import multer from "multer";
import userController from "../controllers/userController.js";
import authController from "../controllers/authController.js";
import serviceCenterController from "../controllers/serviceCenterController.js";
import serviceTypeController from "../controllers/serviceTypeController.js";
import bookingController from "../controllers/bookingController.js";
import vehicleModelController from "../controllers/vehicleModelController.js";
import paymentController from "../controllers/paymentController.js";
import servicePackageController from "../controllers/servicePackageController.js";
import subscriptionController from "../controllers/subscriptionController.js";
import staffAssignmentController from "../controllers/staffAssignmentController.js";
import technicianCertificateController from "../controllers/technicianCertificateController.js";
import technicianScheduleController from "../controllers/technicianScheduleController.js";
import workProgressTrackingController from "../controllers/workProgressTrackingController.js";
import costAnalyticsController from "../controllers/costAnalyticsController.js";
import notificationController from "../controllers/notificationController.js";
import feedbackController from "../controllers/feedbackController.js";
import systemSettingsController from "../controllers/systemSettingsController.js";
import inventoryReservationController from "../controllers/inventoryReservationController.js";
import invoiceController from "../controllers/invoiceController.js";
import vehicleController from "../controllers/vehicleController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed"), false);
        }
    },
});

let router = express.Router();

let initWebRoutes = (app) => {
    // ===== AUTH ROUTES =====

    // Authentication routes
    router.post("/api/auth/register", authController.register);
    router.post("/api/auth/login", authController.login);
    router.post("/api/auth/google-login", authController.googleLogin);
    router.post("/api/auth/refresh-token", authController.refreshToken);

    // Email verification not supported in this project (endpoints kept for clarity but return 404)
    router.get("/api/auth/verify-email/:token", authController.verifyEmail);
    router.post(
        "/api/auth/resend-verification",
        authController.resendVerificationEmail
    );

    // Password reset routes
    router.post("/api/auth/forgot-password", authController.forgotPassword);
    router.post("/api/auth/reset-password/:token", authController.resetPassword);

    // Protected routes (require authentication)
    router.post(
        "/api/auth/change-password",
        protect,
        authController.changePassword
    );

    // ===== USER ROUTES =====

    // User profile routes (protected)
    router.get("/api/user/profile", protect, userController.getUserProfile);
    router.put("/api/user/profile", protect, userController.updateUserProfile);

    // Avatar upload route (protected)
    router.post(
        "/api/user/upload-avatar",
        protect,
        upload.single("avatar"),
        userController.uploadAvatar
    );

    // Admin user management routes (protected + admin only)
    router.delete(
        "/api/user/:id",
        protect,
        authorize("admin"),
        userController.deleteUser
    );
    router.put(
        "/api/user/:userId/role",
        protect,
        authorize("admin"),
        userController.updateUserRole
    );

    // ===== SERVICE CENTER ROUTES =====

    // Public routes
    router.get(
        "/api/service-centers",
        serviceCenterController.getAllServiceCenters
    );
    router.get(
        "/api/service-centers/:id",
        serviceCenterController.getServiceCenterById
    );
    router.get(
        "/api/service-centers/nearby/search",
        serviceCenterController.findNearestCenters
    );

    // Protected routes (require authentication)
    router.post(
        "/api/service-centers",
        protect,
        authorize("admin"),
        serviceCenterController.createServiceCenter
    );
    router.put(
        "/api/service-centers/:id",
        protect,
        authorize("admin"),
        serviceCenterController.updateServiceCenter
    );
    router.delete(
        "/api/service-centers/:id",
        protect,
        authorize("admin"),
        serviceCenterController.deleteServiceCenter
    );

    // Service management
    router.post(
        "/api/service-centers/:id/services",
        protect,
        authorize("admin"),
        serviceCenterController.addServiceToCenter
    );
    router.post(
        "/api/service-centers/:id/staff",
        protect,
        authorize("admin"),
        serviceCenterController.addStaffToCenter
    );

    // ===== SERVICE TYPE ROUTES =====

    // Public routes
    router.get("/api/service-types", serviceTypeController.getAllServiceTypes);
    router.get(
        "/api/service-types/:id",
        serviceTypeController.getServiceTypeById
    );
    router.get(
        "/api/service-types/category/:category",
        serviceTypeController.getServiceTypesByCategory
    );
    router.get(
        "/api/service-types/popular/list",
        serviceTypeController.getPopularServiceTypes
    );
    router.post(
        "/api/service-types/compatible/search",
        serviceTypeController.getCompatibleServices
    );

    // Protected routes (require authentication)
    router.post(
        "/api/service-types",
        protect,
        authorize("admin"),
        serviceTypeController.createServiceType
    );
    router.put(
        "/api/service-types/:id",
        protect,
        authorize("admin"),
        serviceTypeController.updateServiceType
    );
    router.delete(
        "/api/service-types/:id",
        protect,
        authorize("admin"),
        serviceTypeController.deleteServiceType
    );

    // AI data management
    router.put(
        "/api/service-types/:id/ai-data",
        protect,
        authorize("admin"),
        serviceTypeController.updateAIData
    );

    // ===== VEHICLE MODEL ROUTES =====

    // Public routes
    router.get("/api/vehicle-models", vehicleModelController.getAllVehicleModels);
    router.get(
        "/api/vehicle-models/:id",
        vehicleModelController.getVehicleModelById
    );
    router.get(
        "/api/vehicle-models/brands/list",
        vehicleModelController.getBrands
    );
    router.get(
        "/api/vehicle-models/brand/:brand",
        vehicleModelController.getModelsByBrand
    );

    // Admin routes
    router.post(
        "/api/vehicle-models",
        protect,
        authorize("admin"),
        vehicleModelController.createVehicleModel
    );
    router.put(
        "/api/vehicle-models/:id",
        protect,
        authorize("admin"),
        vehicleModelController.updateVehicleModel
    );
    router.delete(
        "/api/vehicle-models/:id",
        protect,
        authorize("admin"),
        vehicleModelController.deleteVehicleModel
    );
    router.post(
        "/api/vehicle-models/sample-data",
        protect,
        authorize("admin"),
        vehicleModelController.createSampleData
    );

    // ===== BOOKING ROUTES =====

    // Service discovery (public)
    router.get(
        "/api/booking/service-centers",
        bookingController.getAvailableServiceCenters
    );
    router.get(
        "/api/booking/vehicles/:vehicleId/services",
        bookingController.getCompatibleServices
    );
    router.get(
        "/api/booking/service-centers/:serviceCenterId/slots",
        bookingController.getAvailableSlots
    );

    // Booking management (protected - customer only)
    router.post("/api/booking", protect, bookingController.createBooking);
    router.get(
        "/api/booking/my-bookings",
        protect,
        bookingController.getCustomerBookings
    );
    router.get(
        "/api/booking/:bookingId",
        protect,
        bookingController.getBookingDetails
    );
    router.post(
        "/api/booking/:bookingId/confirm",
        protect,
        authorize("admin", "staff"),
        bookingController.confirmBooking
    );
    // Admin/Manager: danh sách booking đã thanh toán và chờ xác nhận
    router.get(
        "/api/booking/awaiting-confirmation",
        protect,
        authorize("admin", "staff"),
        bookingController.getPaidAwaitingConfirmation
    );
    router.put(
        "/api/booking/:bookingId/cancel",
        protect,
        bookingController.cancelBooking
    );
    router.put(
        "/api/booking/:bookingId/reschedule",
        protect,
        bookingController.rescheduleBooking
    );

    // ===== PAYMENT ROUTES =====

    // Payment management (protected - customer only)
    router.post(
        "/api/payment/booking/:appointmentId",
        protect,
        paymentController.createBookingPayment
    );
    router.get(
        "/api/payment/:paymentId/status",
        protect,
        paymentController.getPaymentStatus
    );
    router.put(
        "/api/payment/:orderCode/cancel",
        protect,
        paymentController.cancelBookingPayment
    );
    router.get(
        "/api/payment/my-payments",
        protect,
        paymentController.getCustomerPayments
    );

    // PayOS webhook (public - no auth required)
    // Support both GET (for PayOS test) and POST (for actual webhooks)
    router.all("/api/payment/webhook", paymentController.handleWebhook);

    // PayOS redirect pages (public - no auth required)
    router.get("/payment/success", paymentController.handlePaymentSuccess);
    router.get("/payment/cancel", paymentController.handlePaymentCancel);

    // Manual sync payment status from PayOS
    router.post(
        "/api/payment/sync/:orderCode",
        paymentController.syncPaymentStatus
    );

    // Test webhook endpoint (for debugging)
    router.post(
        "/api/payment/test-webhook",
        paymentController.testWebhook
    );

    // Webhook health check (for PayOS verification)
    router.all(
        "/api/payment/webhook/health",
        paymentController.webhookHealthCheck
    );

    // ===== COST ANALYTICS (CUSTOMER) =====
    router.get(
        "/api/costs/history",
        protect,
        costAnalyticsController.getPersonalCostHistory
    );
    router.get(
        "/api/costs/summary",
        protect,
        costAnalyticsController.getPersonalCostSummary
    );

    // ===== NOTIFICATION SETTINGS (CUSTOMER) =====
    router.get(
        "/api/notifications/settings",
        protect,
        notificationController.getNotificationSettings
    );
    router.put(
        "/api/notifications/settings",
        protect,
        notificationController.updateNotificationSettings
    );
    router.put(
        "/api/notifications/email",
        protect,
        notificationController.updateEmailNotification
    );
    router.post(
        "/api/notifications/settings/reset",
        protect,
        notificationController.resetNotificationSettings
    );

    // ===== VEHICLE MANAGEMENT (CUSTOMER) =====
    router.post(
        "/api/vehicles",
        protect,
        vehicleController.addVehicle
    );
    router.get(
        "/api/vehicles",
        protect,
        vehicleController.getCustomerVehicles
    );
    router.get(
        "/api/vehicles/:vehicleId",
        protect,
        vehicleController.getVehicleDetails
    );
    router.put(
        "/api/vehicles/:vehicleId",
        protect,
        vehicleController.updateVehicle
    );
    router.delete(
        "/api/vehicles/:vehicleId",
        protect,
        vehicleController.deleteVehicle
    );

    // ===== SERVICE PACKAGE ROUTES =====

    // Public routes
    router.get("/api/service-packages", servicePackageController.getAllServicePackages);
    router.get("/api/service-packages/:id", servicePackageController.getServicePackageById);
    router.get("/api/service-packages/vehicle/:vehicleId/compatible", servicePackageController.getCompatiblePackages);

    // Admin routes
    router.post("/api/service-packages", protect, authorize("admin"), servicePackageController.createServicePackage);
    router.put("/api/service-packages/:id", protect, authorize("admin"), servicePackageController.updateServicePackage);
    router.delete("/api/service-packages/:id", protect, authorize("admin"), servicePackageController.deleteServicePackage);

    // ===== SUBSCRIPTION ROUTES =====

    // Subscription management (protected - customer only)
    router.get("/api/subscriptions", protect, subscriptionController.getCustomerSubscriptions);
    router.post("/api/subscriptions", protect, subscriptionController.subscribeToPackage);
    router.put("/api/subscriptions/:subscriptionId/renew", protect, subscriptionController.renewSubscription);
    router.put("/api/subscriptions/:subscriptionId/cancel", protect, subscriptionController.cancelSubscription);
    router.get("/api/subscriptions/:subscriptionId/usage", protect, subscriptionController.getSubscriptionUsage);

    // ===== STAFF ASSIGNMENT ROUTES =====

    // Public routes (protected by role)
    router.get(
        "/api/staff-assignments",
        protect,
        authorize("admin", "manager"),
        staffAssignmentController.getAllStaffAssignments
    );
    router.get(
        "/api/staff-assignments/:id",
        protect,
        authorize("admin", "manager"),
        staffAssignmentController.getStaffAssignmentById
    );

    // Service center staff management
    router.get(
        "/api/service-centers/:centerId/staff",
        protect,
        authorize("admin", "manager"),
        staffAssignmentController.getStaffByCenter
    );
    router.get(
        "/api/users/:userId/centers",
        protect,
        staffAssignmentController.getCentersByStaff
    );

    // Staff assignment management (admin only)
    router.post(
        "/api/staff-assignments",
        protect,
        authorize("admin"),
        staffAssignmentController.createStaffAssignment
    );
    router.put(
        "/api/staff-assignments/:id",
        protect,
        authorize("admin"),
        staffAssignmentController.updateStaffAssignment
    );
    router.delete(
        "/api/staff-assignments/:id",
        protect,
        authorize("admin"),
        staffAssignmentController.deleteStaffAssignment
    );

    // Position management (admin and manager)
    router.put(
        "/api/staff-assignments/:id/position",
        protect,
        authorize("admin", "manager"),
        staffAssignmentController.updateStaffPosition
    );

    // ===== TECHNICIAN CERTIFICATE ROUTES =====

    // Certificate management routes (protected by role)
    router.get(
        "/api/technician-certificates",
        protect,
        authorize("admin", "manager"),
        technicianCertificateController.getAllCertificates
    );
    router.get(
        "/api/technician-certificates/:id",
        protect,
        authorize("admin", "manager"),
        technicianCertificateController.getCertificateById
    );

    // Certificate creation and management (admin and manager)
    router.post(
        "/api/technician-certificates",
        protect,
        authorize("admin", "manager"),
        technicianCertificateController.createCertificate
    );
    router.put(
        "/api/technician-certificates/:id",
        protect,
        authorize("admin", "manager"),
        technicianCertificateController.updateCertificate
    );
    router.delete(
        "/api/technician-certificates/:id",
        protect,
        authorize("admin"),
        technicianCertificateController.deleteCertificate
    );

    // Certificate status management
    router.put(
        "/api/technician-certificates/:id/status",
        protect,
        authorize("admin", "manager"),
        technicianCertificateController.updateCertificateStatus
    );

    // Technician-specific certificates
    router.get(
        "/api/technicians/:technicianId/certificates",
        protect,
        technicianCertificateController.getCertificatesByTechnician
    );

    // Specialization-specific certificates
    router.get(
        "/api/technician-certificates/specialization/:specialization",
        protect,
        authorize("admin", "manager"),
        technicianCertificateController.getCertificatesBySpecialization
    );

    // Certificate expiry management
    router.get(
        "/api/technician-certificates/expiry/check",
        protect,
        authorize("admin", "manager"),
        technicianCertificateController.checkExpiredCertificates
    );
    router.get(
        "/api/technician-certificates/expiry/soon",
        protect,
        authorize("admin", "manager"),
        technicianCertificateController.getSoonToExpireCertificates
    );

    // ===== TECHNICIAN SCHEDULE ROUTES =====

    // Schedule management routes (protected by role)
    router.get(
        "/api/technician-schedules",
        protect,
        authorize("admin", "manager"),
        technicianScheduleController.getAllSchedules
    );
    router.get(
        "/api/technician-schedules/:id",
        protect,
        authorize("admin", "manager", "technician"),
        technicianScheduleController.getScheduleById
    );

    // Schedule creation and management (admin and manager)
    router.post(
        "/api/technician-schedules",
        protect,
        authorize("admin", "manager"),
        technicianScheduleController.createSchedule
    );
    router.put(
        "/api/technician-schedules/:id",
        protect,
        authorize("admin", "manager"),
        technicianScheduleController.updateSchedule
    );
    router.delete(
        "/api/technician-schedules/:id",
        protect,
        authorize("admin", "manager"),
        technicianScheduleController.deleteSchedule
    );

    // Technician-specific schedules
    router.get(
        "/api/technicians/:technicianId/schedules",
        protect,
        technicianScheduleController.getSchedulesByTechnician
    );

    // Service center schedules
    router.get(
        "/api/service-centers/:centerId/schedules",
        protect,
        authorize("admin", "manager"),
        technicianScheduleController.getSchedulesByCenter
    );

    // Schedule status management
    router.put(
        "/api/technician-schedules/:id/status",
        protect,
        authorize("admin", "manager", "technician"),
        technicianScheduleController.updateScheduleStatus
    );

    // Check-in and check-out
    router.post(
        "/api/technician-schedules/:id/check-in",
        protect,
        authorize("admin", "manager", "technician"),
        technicianScheduleController.recordCheckIn
    );
    router.post(
        "/api/technician-schedules/:id/check-out",
        protect,
        authorize("admin", "manager", "technician"),
        technicianScheduleController.recordCheckOut
    );

    // Availability management
    router.put(
        "/api/technician-schedules/:id/availability",
        protect,
        authorize("admin", "manager", "technician"),
        technicianScheduleController.updateAvailability
    );

    // Appointment assignment
    router.post(
        "/api/technician-schedules/:id/appointments",
        protect,
        authorize("admin", "manager"),
        technicianScheduleController.addAppointmentToSchedule
    );
    router.delete(
        "/api/technician-schedules/:id/appointments/:appointmentId",
        protect,
        authorize("admin", "manager"),
        technicianScheduleController.removeAppointmentFromSchedule
    );

    // Available technicians
    router.get(
        "/api/service-centers/:centerId/available-technicians",
        protect,
        authorize("admin", "manager"),
        technicianScheduleController.getAvailableTechnicians
    );

    // Overtime report
    router.get(
        "/api/technician-schedules/reports/overtime",
        protect,
        authorize("admin", "manager"),
        technicianScheduleController.getOvertimeReport
    );

    // ===== WORK PROGRESS TRACKING ROUTES =====

    // Progress record management routes (protected by role)
    router.get(
        "/api/work-progress",
        protect,
        authorize("admin", "manager"),
        workProgressTrackingController.getAllProgressRecords
    );
    router.get(
        "/api/work-progress/:id",
        protect,
        authorize("admin", "manager", "technician"),
        workProgressTrackingController.getProgressRecordById
    );

    // Progress record creation and management
    router.post(
        "/api/work-progress",
        protect,
        authorize("admin", "manager", "technician"),
        workProgressTrackingController.createProgressRecord
    );
    router.put(
        "/api/work-progress/:id",
        protect,
        authorize("admin", "manager", "technician"),
        workProgressTrackingController.updateProgressRecord
    );
    router.delete(
        "/api/work-progress/:id",
        protect,
        authorize("admin", "manager"),
        workProgressTrackingController.deleteProgressRecord
    );

    // Technician-specific progress records
    router.get(
        "/api/technicians/:technicianId/work-progress",
        protect,
        authorize("admin", "manager", "technician"),
        workProgressTrackingController.getProgressRecordsByTechnician
    );

    // Appointment progress
    router.get(
        "/api/appointments/:appointmentId/progress",
        protect,
        workProgressTrackingController.getProgressRecordByAppointment
    );

    // Progress status management
    router.put(
        "/api/work-progress/:id/status",
        protect,
        authorize("admin", "manager", "technician"),
        workProgressTrackingController.updateProgressStatus
    );

    // Inspection and quote management
    router.post(
        "/api/work-progress/:id/inspection-quote",
        protect,
        authorize("technician"),
        workProgressTrackingController.submitInspectionAndQuote
    );

    router.put(
        "/api/work-progress/:id/quote-response",
        protect,
        workProgressTrackingController.processQuoteResponse
    );

    router.post(
        "/api/work-progress/:id/start-maintenance",
        protect,
        authorize("technician"),
        workProgressTrackingController.startMaintenance
    );

    router.post(
        "/api/work-progress/:id/complete-maintenance",
        protect,
        authorize("technician"),
        workProgressTrackingController.completeMaintenance
    );

    router.post(
        "/api/work-progress/:id/process-payment",
        protect,
        authorize("admin", "manager", "staff"),
        workProgressTrackingController.processCashPayment
    );


    // Milestone management
    router.post(
        "/api/work-progress/:id/milestones",
        protect,
        authorize("admin", "manager", "technician"),
        workProgressTrackingController.addMilestone
    );
    router.put(
        "/api/work-progress/:id/milestones/:milestoneId/complete",
        protect,
        authorize("admin", "manager", "technician"),
        workProgressTrackingController.completeMilestone
    );

    // Issue management
    router.post(
        "/api/work-progress/:id/issues",
        protect,
        authorize("admin", "manager", "technician"),
        workProgressTrackingController.reportIssue
    );
    router.put(
        "/api/work-progress/:id/issues/:issueId/resolve",
        protect,
        authorize("admin", "manager", "technician"),
        workProgressTrackingController.resolveIssue
    );

    // Supervisor notes
    router.post(
        "/api/work-progress/:id/supervisor-notes",
        protect,
        authorize("admin", "manager"),
        workProgressTrackingController.addSupervisorNotes
    );

    // Efficiency calculation
    router.post(
        "/api/work-progress/:id/calculate-efficiency",
        protect,
        authorize("admin", "manager"),
        workProgressTrackingController.calculateEfficiency
    );

    // Performance metrics
    router.get(
        "/api/technicians/:technicianId/performance",
        protect,
        authorize("admin", "manager"),
        workProgressTrackingController.getTechnicianPerformance
    );
    router.get(
        "/api/service-centers/:centerId/performance",
        protect,
        authorize("admin", "manager"),
        workProgressTrackingController.getServiceCenterPerformance
    );

    // ===== FEEDBACK (CUSTOMER) =====
    router.get(
        "/api/appointments/:appointmentId/feedback",
        protect,
        feedbackController.getMyFeedback
    );
    router.post(
        "/api/appointments/:appointmentId/feedback",
        protect,
        feedbackController.upsertMyFeedback
    );
    router.put(
        "/api/appointments/:appointmentId/feedback",
        protect,
        feedbackController.upsertMyFeedback
    );
    router.delete(
        "/api/appointments/:appointmentId/feedback",
        protect,
        feedbackController.deleteMyFeedback
    );

    // ===== SYSTEM SETTINGS (ADMIN/MANAGER) =====
    router.get(
        "/api/settings/policies",
        protect,
        authorize("admin", "manager"),
        systemSettingsController.getPolicies
    );
    router.put(
        "/api/settings/policies",
        protect,
        authorize("admin", "manager"),
        systemSettingsController.updatePolicies
    );

    // ===== INVENTORY RESERVATIONS =====
    router.post(
        "/api/inventory/reservations",
        protect,
        authorize("admin", "manager"),
        inventoryReservationController.hold
    );
    router.post(
        "/api/inventory/reservations/:reservationId/consume",
        protect,
        authorize("admin", "manager"),
        inventoryReservationController.consume
    );
    router.post(
        "/api/inventory/reservations/:reservationId/release",
        protect,
        authorize("admin", "manager"),
        inventoryReservationController.release
    );

    // ===== INVOICE =====
    router.post(
        "/api/invoices/from-appointment/:appointmentId",
        protect,
        authorize("admin", "manager"),
        invoiceController.createFromAppointment
    );
    router.post(
        "/api/invoices/:invoiceId/send-email",
        protect,
        authorize("admin", "manager"),
        invoiceController.sendEmail
    );

    // ===== HEALTH CHECK =====
    router.get("/api/health", (req, res) => {
        res.status(200).json({
            success: true,
            message: "EVCare API is running",
            timestamp: new Date().toISOString(),
        });
    });

    return app.use("/", router);
};

export default initWebRoutes;
