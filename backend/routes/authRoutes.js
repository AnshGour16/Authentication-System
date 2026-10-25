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

const router = express.Router();

// Public Routes
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

// Protected Route
router.get("/profile", authMiddleware, getProfile);

module.exports = router;