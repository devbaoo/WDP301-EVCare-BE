import express from "express";
import multer from "multer";
import userController from "../controllers/userController.js";
import authController from "../controllers/authController.js";
import serviceCenterController from "../controllers/serviceCenterController.js";
import serviceTypeController from "../controllers/serviceTypeController.js";
import bookingController from "../controllers/bookingController.js";
import vehicleModelController from "../controllers/vehicleModelController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

let router = express.Router();

let initWebRoutes = (app) => {
    // ===== AUTH ROUTES =====

    // Authentication routes
    router.post('/api/auth/register', authController.register);
    router.post('/api/auth/login', authController.login);
    router.post('/api/auth/google-login', authController.googleLogin);
    router.post('/api/auth/refresh-token', authController.refreshToken);

    // Email verification not supported in this project (endpoints kept for clarity but return 404)
    router.get('/api/auth/verify-email/:token', authController.verifyEmail);
    router.post('/api/auth/resend-verification', authController.resendVerificationEmail);

    // Password reset routes
    router.post('/api/auth/forgot-password', authController.forgotPassword);
    router.post('/api/auth/reset-password/:token', authController.resetPassword);

    // Protected routes (require authentication)
    router.post('/api/auth/change-password', protect, authController.changePassword);

    // ===== USER ROUTES =====

    // User profile routes (protected)
    router.get('/api/user/profile', protect, userController.getUserProfile);
    router.put('/api/user/profile', protect, userController.updateUserProfile);

    // Avatar upload route (protected)
    router.post('/api/user/upload-avatar', protect, upload.single('avatar'), userController.uploadAvatar);

    // Admin user management routes (protected + admin only)
    router.delete('/api/user/:id', protect, authorize('admin'), userController.deleteUser);
    router.put('/api/user/:userId/role', protect, authorize('admin'), userController.updateUserRole);

    // ===== SERVICE CENTER ROUTES =====

    // Public routes
    router.get('/api/service-centers', serviceCenterController.getAllServiceCenters);
    router.get('/api/service-centers/:id', serviceCenterController.getServiceCenterById);
    router.get('/api/service-centers/nearby/search', serviceCenterController.findNearestCenters);

    // Protected routes (require authentication)
    router.post('/api/service-centers', protect, authorize('admin'), serviceCenterController.createServiceCenter);
    router.put('/api/service-centers/:id', protect, authorize('admin'), serviceCenterController.updateServiceCenter);
    router.delete('/api/service-centers/:id', protect, authorize('admin'), serviceCenterController.deleteServiceCenter);

    // Service management
    router.post('/api/service-centers/:id/services', protect, authorize('admin'), serviceCenterController.addServiceToCenter);
    router.post('/api/service-centers/:id/staff', protect, authorize('admin'), serviceCenterController.addStaffToCenter);

    // ===== SERVICE TYPE ROUTES =====

    // Public routes
    router.get('/api/service-types', serviceTypeController.getAllServiceTypes);
    router.get('/api/service-types/:id', serviceTypeController.getServiceTypeById);
    router.get('/api/service-types/category/:category', serviceTypeController.getServiceTypesByCategory);
    router.get('/api/service-types/popular/list', serviceTypeController.getPopularServiceTypes);
    router.post('/api/service-types/compatible/search', serviceTypeController.getCompatibleServices);

    // Protected routes (require authentication)
    router.post('/api/service-types', protect, authorize('admin'), serviceTypeController.createServiceType);
    router.put('/api/service-types/:id', protect, authorize('admin'), serviceTypeController.updateServiceType);
    router.delete('/api/service-types/:id', protect, authorize('admin'), serviceTypeController.deleteServiceType);

    // AI data management
    router.put('/api/service-types/:id/ai-data', protect, authorize('admin'), serviceTypeController.updateAIData);

    // ===== VEHICLE MODEL ROUTES =====

    // Public routes
    router.get('/api/vehicle-models', vehicleModelController.getAllVehicleModels);
    router.get('/api/vehicle-models/:id', vehicleModelController.getVehicleModelById);
    router.get('/api/vehicle-models/brands/list', vehicleModelController.getBrands);
    router.get('/api/vehicle-models/brand/:brand', vehicleModelController.getModelsByBrand);

    // Admin routes
    router.post('/api/vehicle-models', protect, authorize('admin'), vehicleModelController.createVehicleModel);
    router.put('/api/vehicle-models/:id', protect, authorize('admin'), vehicleModelController.updateVehicleModel);
    router.delete('/api/vehicle-models/:id', protect, authorize('admin'), vehicleModelController.deleteVehicleModel);
    router.post('/api/vehicle-models/sample-data', protect, authorize('admin'), vehicleModelController.createSampleData);

    // ===== BOOKING ROUTES =====

    // Vehicle management (protected - customer only)
    router.get('/api/booking/vehicles', protect, bookingController.getCustomerVehicles);
    router.post('/api/booking/vehicles', protect, bookingController.addCustomerVehicle);

    // Vehicle models (public - for selection)
    router.get('/api/booking/vehicle-models', bookingController.getVehicleModels);

    // Service discovery (public)
    router.get('/api/booking/service-centers', bookingController.getAvailableServiceCenters);
    router.get('/api/booking/vehicles/:vehicleId/services', bookingController.getCompatibleServices);
    router.get('/api/booking/service-centers/:serviceCenterId/services/:serviceTypeId/slots', bookingController.getAvailableSlots);

    // Booking management (protected - customer only)
    router.post('/api/booking', protect, bookingController.createBooking);
    router.get('/api/booking/my-bookings', protect, bookingController.getCustomerBookings);
    router.get('/api/booking/:bookingId', protect, bookingController.getBookingDetails);
    router.put('/api/booking/:bookingId/cancel', protect, bookingController.cancelBooking);

    // ===== HEALTH CHECK =====
    router.get('/api/health', (req, res) => {
        res.status(200).json({
            success: true,
            message: 'EVCare API is running',
            timestamp: new Date().toISOString()
        });
    });

    return app.use("/", router);
};

export default initWebRoutes;