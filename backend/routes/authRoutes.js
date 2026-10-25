const express = require("express");
const { 
    register, 
    login, 
    forgotPassword, 
    verifyOtp, 
    resetPassword, 
    getProfile 
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

// Protected Route
router.get("/profile", authMiddleware, getProfile);

module.exports = router;