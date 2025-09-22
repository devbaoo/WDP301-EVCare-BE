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
import partController from "../controllers/partController.js";
import inventoryController from "../controllers/inventoryController.js";
import aiPredictionController from "../controllers/aiPredictionController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"), false);
  },
});

let router = express.Router();

let initWebRoutes = (app) => {
  // ===== AUTH ROUTES =====
  router.post("/api/auth/register", authController.register);
  router.post("/api/auth/login", authController.login);
  router.post("/api/auth/google-login", authController.googleLogin);
  router.post("/api/auth/refresh-token", authController.refreshToken);
  router.get("/api/auth/verify-email/:token", authController.verifyEmail);
  router.post(
    "/api/auth/resend-verification",
    authController.resendVerificationEmail
  );
  router.post("/api/auth/forgot-password", authController.forgotPassword);
  router.post("/api/auth/reset-password/:token", authController.resetPassword);
  router.post(
    "/api/auth/change-password",
    protect,
    authController.changePassword
  );

  // ===== USER ROUTES =====
  router.get("/api/user/profile", protect, userController.getUserProfile);
  router.put("/api/user/profile", protect, userController.updateUserProfile);
  router.post(
    "/api/user/upload-avatar",
    protect,
    upload.single("avatar"),
    userController.uploadAvatar
  );
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
  router.get(
    "/api/staff",
    protect,
    authorize("admin", "staff"),
    userController.getAllStaff
  );

  // ===== SERVICE CENTER =====
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

  // ===== SERVICE TYPE =====
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
  router.put(
    "/api/service-types/:id/ai-data",
    protect,
    authorize("admin"),
    serviceTypeController.updateAIData
  );

  // ===== VEHICLE MODEL =====
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

  // ===== BOOKING =====
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
  router.post("/api/booking", protect, bookingController.createBooking);
  router.get(
    "/api/booking/my-bookings",
    protect,
    bookingController.getCustomerBookings
  );
  // Place awaiting-confirmation BEFORE :bookingId to avoid route conflicts
  router.get(
    "/api/booking/awaiting-confirmation",
    protect,
    authorize("admin", "staff"),
    bookingController.getPaidAwaitingConfirmation
  );
  // Constrain :bookingId to a valid Mongo ObjectId to avoid catching other slugs
  router.get(
    "/api/booking/:bookingId([0-9a-fA-F]{24})",
    protect,
    bookingController.getBookingDetails
  );
  router.post(
    "/api/booking/:bookingId/confirm",
    protect,
    authorize("admin", "staff"),
    bookingController.confirmBooking
  );
  // To avoid conflict with /api/booking/:bookingId, expose a non-conflicting alias as well
  router.get(
    "/api/bookings/awaiting-confirmation",
    protect,
    authorize("admin", "staff"),
    bookingController.getPaidAwaitingConfirmation
  );
  // List confirmed bookings (for work-progress intake)
  router.get(
    "/api/bookings/confirmed",
    protect,
    authorize("admin", "staff", "technician"),
    bookingController.getConfirmedBookings
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

  // ===== PAYMENT =====
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
  router.all("/api/payment/webhook", paymentController.handleWebhook);
  router.get("/payment/success", paymentController.handlePaymentSuccess);
  router.get("/payment/cancel", paymentController.handlePaymentCancel);
  router.post(
    "/api/payment/sync/:orderCode",
    paymentController.syncPaymentStatus
  );
  router.post("/api/payment/test-webhook", paymentController.testWebhook);
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

  // ===== VEHICLE (CUSTOMER) =====
  router.post("/api/vehicles", protect, vehicleController.addVehicle);
  router.get("/api/vehicles", protect, vehicleController.getCustomerVehicles);
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

  // ===== SERVICE PACKAGE =====
  router.get(
    "/api/service-packages",
    servicePackageController.getAllServicePackages
  );
  router.get(
    "/api/service-packages/:id",
    servicePackageController.getServicePackageById
  );
  router.get(
    "/api/service-packages/vehicle/:vehicleId/compatible",
    servicePackageController.getCompatiblePackages
  );
  router.post(
    "/api/service-packages",
    protect,
    authorize("admin"),
    servicePackageController.createServicePackage
  );
  router.put(
    "/api/service-packages/:id",
    protect,
    authorize("admin"),
    servicePackageController.updateServicePackage
  );
  router.delete(
    "/api/service-packages/:id",
    protect,
    authorize("admin"),
    servicePackageController.deleteServicePackage
  );

  // ===== SUBSCRIPTION =====
  router.get(
    "/api/subscriptions",
    protect,
    subscriptionController.getCustomerSubscriptions
  );
  router.post(
    "/api/subscriptions",
    protect,
    subscriptionController.subscribeToPackage
  );
  router.put(
    "/api/subscriptions/:subscriptionId/renew",
    protect,
    subscriptionController.renewSubscription
  );
  router.put(
    "/api/subscriptions/:subscriptionId/cancel",
    protect,
    subscriptionController.cancelSubscription
  );
  router.get(
    "/api/subscriptions/:subscriptionId/usage",
    protect,
    subscriptionController.getSubscriptionUsage
  );

  // ===== STAFF ASSIGNMENT =====
  router.get(
    "/api/staff-assignments",
    protect,
    authorize("admin", "staff"),
    staffAssignmentController.getAllStaffAssignments
  );
  router.get(
    "/api/staff-assignments/:id",
    protect,
    authorize("admin", "staff"),
    staffAssignmentController.getStaffAssignmentById
  );
  router.get(
    "/api/service-centers/:centerId/staff",
    protect,
    authorize("admin", "staff"),
    staffAssignmentController.getStaffByCenter
  );
  router.get(
    "/api/users/:userId/centers",
    protect,
    staffAssignmentController.getCentersByStaff
  );
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
  router.put(
    "/api/staff-assignments/:id/position",
    protect,
    authorize("admin", "staff"),
    staffAssignmentController.updateStaffPosition
  );

  // ===== TECHNICIAN CERTIFICATE =====
  router.get(
    "/api/technician-certificates",
    protect,
    authorize("admin", "staff"),
    technicianCertificateController.getAllCertificates
  );
  router.get(
    "/api/technician-certificates/:id",
    protect,
    authorize("admin", "staff"),
    technicianCertificateController.getCertificateById
  );
  router.post(
    "/api/technician-certificates",
    protect,
    authorize("admin", "staff"),
    technicianCertificateController.createCertificate
  );
  router.put(
    "/api/technician-certificates/:id",
    protect,
    authorize("admin", "staff"),
    technicianCertificateController.updateCertificate
  );
  router.delete(
    "/api/technician-certificates/:id",
    protect,
    authorize("admin"),
    technicianCertificateController.deleteCertificate
  );
  router.put(
    "/api/technician-certificates/:id/status",
    protect,
    authorize("admin", "staff"),
    technicianCertificateController.updateCertificateStatus
  );
  router.get(
    "/api/technicians/:technicianId/certificates",
    protect,
    technicianCertificateController.getCertificatesByTechnician
  );
  router.get(
    "/api/technician-certificates/specialization/:specialization",
    protect,
    authorize("admin", "staff"),
    technicianCertificateController.getCertificatesBySpecialization
  );
  router.get(
    "/api/technician-certificates/expiry/check",
    protect,
    authorize("admin", "staff"),
    technicianCertificateController.checkExpiredCertificates
  );
  router.get(
    "/api/technician-certificates/expiry/soon",
    protect,
    authorize("admin", "staff"),
    technicianCertificateController.getSoonToExpireCertificates
  );

  // ===== TECHNICIAN SCHEDULE =====
  router.get(
    "/api/technician-schedules",
    protect,
    authorize("admin", "staff"),
    technicianScheduleController.getAllSchedules
  );
  router.get(
    "/api/technician-schedules/:id",
    protect,
    authorize("admin", "staff", "technician"),
    technicianScheduleController.getScheduleById
  );
  router.post(
    "/api/technician-schedules",
    protect,
    authorize("admin", "staff"),
    technicianScheduleController.createSchedule
  );
  router.post(
    "/api/technician-schedules/default",
    protect,
    authorize("admin", "staff"),
    technicianScheduleController.createDefaultSchedule
  );
  router.put(
    "/api/technician-schedules/:id",
    protect,
    authorize("admin", "staff"),
    technicianScheduleController.updateSchedule
  );
  router.delete(
    "/api/technician-schedules/:id",
    protect,
    authorize("admin", "staff"),
    technicianScheduleController.deleteSchedule
  );
  router.get(
    "/api/technicians/:technicianId/schedules",
    protect,
    technicianScheduleController.getSchedulesByTechnician
  );
  router.get(
    "/api/service-centers/:centerId/schedules",
    protect,
    authorize("admin", "staff"),
    technicianScheduleController.getSchedulesByCenter
  );
  router.put(
    "/api/technician-schedules/:id/status",
    protect,
    authorize("admin", "staff", "technician"),
    technicianScheduleController.updateScheduleStatus
  );
  router.post(
    "/api/technician-schedules/:id/check-in",
    protect,
    authorize("admin", "staff", "technician"),
    technicianScheduleController.recordCheckIn
  );
  router.post(
    "/api/technician-schedules/:id/check-out",
    protect,
    authorize("admin", "staff", "technician"),
    technicianScheduleController.recordCheckOut
  );
  router.put(
    "/api/technician-schedules/:id/availability",
    protect,
    authorize("admin", "staff", "technician"),
    technicianScheduleController.updateAvailability
  );
  router.post(
    "/api/technician-schedules/:id/appointments",
    protect,
    authorize("admin", "staff"),
    technicianScheduleController.addAppointmentToSchedule
  );
  router.delete(
    "/api/technician-schedules/:id/appointments/:appointmentId",
    protect,
    authorize("admin", "staff"),
    technicianScheduleController.removeAppointmentFromSchedule
  );
  router.get(
    "/api/service-centers/:centerId/available-technicians",
    protect,
    authorize("admin", "staff"),
    technicianScheduleController.getAvailableTechnicians
  );
  router.get(
    "/api/technician-schedules/reports/overtime",
    protect,
    authorize("admin", "staff"),
    technicianScheduleController.getOvertimeReport
  );
  // leave requests
  router.post(
    "/api/technicians/:technicianId/leave-request",
    protect,
    authorize("technician"),
    technicianScheduleController.requestLeave
  );
  router.put(
    "/api/technician-schedules/:scheduleId/leave-request",
    protect,
    authorize("admin", "staff"),
    technicianScheduleController.processLeaveRequest
  );
  router.get(
    "/api/leave-requests/pending",
    protect,
    authorize("admin", "staff"),
    technicianScheduleController.getPendingLeaveRequests
  );
  router.get(
    "/api/technicians/:technicianId/leave-history",
    protect,
    technicianScheduleController.getLeaveHistory
  );

  // ===== WORK PROGRESS =====
  router.get(
    "/api/work-progress",
    protect,
    authorize("admin", "staff"),
    workProgressTrackingController.getAllProgressRecords
  );
  router.get(
    "/api/work-progress/:id",
    protect,
    authorize("admin", "staff", "technician"),
    workProgressTrackingController.getProgressRecordById
  );
  router.post(
    "/api/work-progress",
    protect,
    authorize("admin", "staff", "technician"),
    workProgressTrackingController.createProgressRecord
  );
  router.put(
    "/api/work-progress/:id",
    protect,
    authorize("admin", "staff", "technician"),
    workProgressTrackingController.updateProgressRecord
  );
  router.delete(
    "/api/work-progress/:id",
    protect,
    authorize("admin", "staff"),
    workProgressTrackingController.deleteProgressRecord
  );
  router.get(
    "/api/technicians/:technicianId/work-progress",
    protect,
    authorize("admin", "staff", "technician"),
    workProgressTrackingController.getProgressRecordsByTechnician
  );
  router.get(
    "/api/appointments/:appointmentId/progress",
    protect,
    workProgressTrackingController.getProgressRecordByAppointment
  );
  router.put(
    "/api/work-progress/:id/status",
    protect,
    authorize("admin", "staff", "technician"),
    workProgressTrackingController.updateProgressStatus
  );
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
    authorize("admin", "staff"),
    workProgressTrackingController.processCashPayment
  );
  router.post(
    "/api/work-progress/:id/milestones",
    protect,
    authorize("admin", "staff", "technician"),
    workProgressTrackingController.addMilestone
  );
  router.put(
    "/api/work-progress/:id/milestones/:milestoneId/complete",
    protect,
    authorize("admin", "staff", "technician"),
    workProgressTrackingController.completeMilestone
  );
  router.post(
    "/api/work-progress/:id/issues",
    protect,
    authorize("admin", "staff", "technician"),
    workProgressTrackingController.reportIssue
  );
  router.put(
    "/api/work-progress/:id/issues/:issueId/resolve",
    protect,
    authorize("admin", "staff", "technician"),
    workProgressTrackingController.resolveIssue
  );
  router.post(
    "/api/work-progress/:id/supervisor-notes",
    protect,
    authorize("admin", "staff"),
    workProgressTrackingController.addSupervisorNotes
  );
  router.post(
    "/api/work-progress/:id/calculate-efficiency",
    protect,
    authorize("admin", "staff"),
    workProgressTrackingController.calculateEfficiency
  );
  router.get(
    "/api/technicians/:technicianId/performance",
    protect,
    authorize("admin", "staff"),
    workProgressTrackingController.getTechnicianPerformance
  );
  router.get(
    "/api/service-centers/:centerId/performance",
    protect,
    authorize("admin", "staff"),
    workProgressTrackingController.getServiceCenterPerformance
  );

  // ===== STAFF ASSIGNMENT =====
  router.get(
    "/api/staff-assignments",
    protect,
    authorize("admin"),
    staffAssignmentController.getAllStaffAssignments
  );
  router.get(
    "/api/staff-assignments/:id",
    protect,
    authorize("admin"),
    staffAssignmentController.getStaffAssignmentById
  );
  router.get(
    "/api/service-centers/:centerId/staff",
    protect,
    authorize("admin"),
    staffAssignmentController.getStaffByCenter
  );
  router.get(
    "/api/users/:userId/centers",
    protect,
    staffAssignmentController.getCentersByStaff
  );
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
  router.put(
    "/api/staff-assignments/:id/position",
    protect,
    authorize("admin"),
    staffAssignmentController.updateStaffPosition
  );

  // ===== TECHNICIAN CERTIFICATE =====
  router.get(
    "/api/technician-certificates",
    protect,
    authorize("admin"),
    technicianCertificateController.getAllCertificates
  );
  router.get(
    "/api/technician-certificates/:id",
    protect,
    authorize("admin"),
    technicianCertificateController.getCertificateById
  );
  router.delete(
    "/api/technician-certificates/:id",
    protect,
    authorize("admin"),
    technicianCertificateController.deleteCertificate
  );

  router.get(
    "/api/technicians/:technicianId/certificates",
    protect,
    technicianCertificateController.getCertificatesByTechnician
  );


  // ===== TECHNICIAN SCHEDULE =====

  router.get(
    "/api/technician-schedules/:id",
    protect,
    authorize("admin", "technician"),
    technicianScheduleController.getScheduleById
  );

  router.get(
    "/api/technicians/:technicianId/schedules",
    protect,
    technicianScheduleController.getSchedulesByTechnician
  );

  router.put(
    "/api/technician-schedules/:id/status",
    protect,
    authorize("admin", "technician"),
    technicianScheduleController.updateScheduleStatus
  );
  router.post(
    "/api/technician-schedules/:id/check-in",
    protect,
    authorize("admin", "technician"),
    technicianScheduleController.recordCheckIn
  );
  router.post(
    "/api/technician-schedules/:id/check-out",
    protect,
    authorize("admin", "technician"),
    technicianScheduleController.recordCheckOut
  );



  // leave requests
  router.post(
    "/api/technicians/:technicianId/leave-request",
    protect,
    authorize("technician"),
    technicianScheduleController.requestLeave
  );

  router.get(
    "/api/technicians/:technicianId/leave-history",
    protect,
    technicianScheduleController.getLeaveHistory
  );

  // ===== WORK PROGRESS =====

  router.get(
    "/api/appointments/:appointmentId/progress",
    protect,
    workProgressTrackingController.getProgressRecordByAppointment
  );

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





  // ===== FEEDBACK =====
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







  // ===== PARTS =====
  router.get(
    "/api/parts",
    protect,
    authorize("admin", "staff"),
    partController.getAllParts
  );
  router.get(
    "/api/parts/:id",
    protect,
    authorize("admin", "staff"),
    partController.getPartById
  );
  router.get(
    "/api/parts/category/:category",
    protect,
    authorize("admin", "staff"),
    partController.getPartsByCategory
  );
  router.get(
    "/api/vehicle-models/:vehicleModelId/compatible-parts",
    protect,
    authorize("admin", "staff", "technician"),
    partController.getCompatibleParts
  );
  router.post(
    "/api/parts",
    protect,
    authorize("admin", "staff"),
    partController.createPart
  );
  router.put(
    "/api/parts/:id",
    protect,
    authorize("admin", "staff"),
    partController.updatePart
  );
  router.delete(
    "/api/parts/:id",
    protect,
    authorize("admin"),
    partController.deletePart
  );

  // ===== INVENTORY =====
  router.get(
    "/api/inventory",
    protect,
    authorize("admin", "staff"),
    inventoryController.getAllInventory
  );
  router.get(
    "/api/inventory/:id",
    protect,
    authorize("admin", "staff"),
    inventoryController.getInventoryById
  );
  router.get(
    "/api/inventory/alerts/low-stock",
    protect,
    authorize("admin", "staff"),
    inventoryController.getLowStockAlerts
  );
  router.get(
    "/api/service-centers/:centerId/inventory-stats",
    protect,
    authorize("admin", "staff"),
    inventoryController.getInventoryStats
  );
  router.post(
    "/api/inventory",
    protect,
    authorize("admin", "staff"),
    inventoryController.createInventory
  );
  router.put(
    "/api/inventory/:id",
    protect,
    authorize("admin", "staff"),
    inventoryController.updateInventory
  );
  router.post(
    "/api/inventory/transactions",
    protect,
    authorize("admin", "staff"),
    inventoryController.createTransaction
  );
  router.get(
    "/api/inventory/transactions",
    protect,
    authorize("admin", "staff"),
    inventoryController.getTransactions
  );

  // ===== AI PREDICTION =====
  router.get(
    "/api/ai/predictions",
    protect,
    authorize("admin", "staff"),
    aiPredictionController.getAllPredictions
  );
  router.get(
    "/api/ai/predictions/:id",
    protect,
    authorize("admin", "staff"),
    aiPredictionController.getPredictionById
  );
  router.post(
    "/api/ai/demand-forecast",
    protect,
    authorize("admin", "staff"),
    aiPredictionController.generateDemandForecast
  );
  router.post(
    "/api/ai/stock-optimization",
    protect,
    authorize("admin", "staff"),
    aiPredictionController.generateStockOptimization
  );
  router.post(
    "/api/ai/apply-recommendations",
    protect,
    authorize("admin", "staff"),
    aiPredictionController.applyRecommendations
  );

  // ===== SYSTEM SETTINGS =====
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

  // ===== PARTS =====
  router.get(
    "/api/parts",
    protect,
    authorize("admin", "manager", "staff"),
    partController.getAllParts
  );
  router.get(
    "/api/parts/:id",
    protect,
    authorize("admin", "manager", "staff"),
    partController.getPartById
  );
  router.get(
    "/api/parts/category/:category",
    protect,
    authorize("admin", "manager", "staff"),
    partController.getPartsByCategory
  );
  router.get(
    "/api/vehicle-models/:vehicleModelId/compatible-parts",
    protect,
    authorize("admin", "manager", "staff", "technician"),
    partController.getCompatibleParts
  );
  router.post(
    "/api/parts",
    protect,
    authorize("admin", "manager"),
    partController.createPart
  );
  router.put(
    "/api/parts/:id",
    protect,
    authorize("admin", "manager"),
    partController.updatePart
  );
  router.delete(
    "/api/parts/:id",
    protect,
    authorize("admin"),
    partController.deletePart
  );

  // ===== INVENTORY =====
  router.get(
    "/api/inventory",
    protect,
    authorize("admin", "manager", "staff"),
    inventoryController.getAllInventory
  );
  router.get(
    "/api/inventory/:id",
    protect,
    authorize("admin", "manager", "staff"),
    inventoryController.getInventoryById
  );
  router.get(
    "/api/inventory/alerts/low-stock",
    protect,
    authorize("admin", "manager", "staff"),
    inventoryController.getLowStockAlerts
  );
  router.get(
    "/api/service-centers/:centerId/inventory-stats",
    protect,
    authorize("admin", "manager", "staff"),
    inventoryController.getInventoryStats
  );
  router.post(
    "/api/inventory",
    protect,
    authorize("admin", "manager"),
    inventoryController.createInventory
  );
  router.put(
    "/api/inventory/:id",
    protect,
    authorize("admin", "manager"),
    inventoryController.updateInventory
  );
  router.post(
    "/api/inventory/transactions",
    protect,
    authorize("admin", "manager", "staff"),
    inventoryController.createTransaction
  );
  router.get(
    "/api/inventory/transactions",
    protect,
    authorize("admin", "manager", "staff"),
    inventoryController.getTransactions
  );

  // ===== AI PREDICTION =====
  router.get(
    "/api/ai/predictions",
    protect,
    authorize("admin", "manager", "staff"),
    aiPredictionController.getAllPredictions
  );
  router.get(
    "/api/ai/predictions/:id",
    protect,
    authorize("admin", "manager", "staff"),
    aiPredictionController.getPredictionById
  );
  router.post(
    "/api/ai/demand-forecast",
    protect,
    authorize("admin", "manager"),
    aiPredictionController.generateDemandForecast
  );
  router.post(
    "/api/ai/stock-optimization",
    protect,
    authorize("admin", "manager"),
    aiPredictionController.generateStockOptimization
  );
  router.post(
    "/api/ai/apply-recommendations",
    protect,
    authorize("admin", "manager"),
    aiPredictionController.applyRecommendations
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
