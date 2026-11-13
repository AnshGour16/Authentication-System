const express = require("express");
const {
    register,
    login,
    forgotPassword,
    verifyOtp,
    resetPassword,
    getProfile,
    updateProfile,
    changePassword,
    getSessions
} = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const { authLimiter, otpLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

// Public Routes with Rate Limiting Protection
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/forgot-password", otpLimiter, forgotPassword);
router.post("/verify-otp", otpLimiter, verifyOtp);
router.post("/reset-password", otpLimiter, resetPassword);

// Protected Routes (Require Valid Bearer Token)
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);
router.post("/change-password", authMiddleware, changePassword);
router.get("/sessions", authMiddleware, getSessions);

module.exports = router;