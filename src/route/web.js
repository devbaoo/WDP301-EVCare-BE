import express from "express";
import userController from "../controllers/userController.js";
import authController from "../controllers/authController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

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

    // Legacy login route (keeping for backward compatibility)
    router.post('/api/login', userController.handleLoging);

    // User profile routes (protected)
    router.get('/api/user/profile', protect, userController.getUserProfile);
    router.put('/api/user/profile', protect, userController.updateUserProfile);

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