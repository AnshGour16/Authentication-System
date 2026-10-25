const rateLimit = require("express-rate-limit");

// General API rate limiter (100 requests per 15 minutes)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests from this IP. Please try again after 15 minutes."
    },
    skip: () => process.env.NODE_ENV === "test"
});

// Stricter rate limiter for sensitive authentication endpoints (e.g. login, register: 30 per 15 min)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many authentication attempts. Please try again after 15 minutes."
    },
    skip: () => process.env.NODE_ENV === "test"
});

// Strictest rate limiter for OTP / Forgot Password (10 requests per 15 min)
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many OTP requests. Please wait 15 minutes before requesting again."
    },
    skip: () => process.env.NODE_ENV === "test"
});

module.exports = {
    apiLimiter,
    authLimiter,
    otpLimiter
};
