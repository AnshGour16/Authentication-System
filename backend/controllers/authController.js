const mongoose = require("mongoose");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");

// 1. REGISTER USER
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Type checking to prevent NoSQL operator injection
        if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
            return res.status(400).json({
                success: false,
                message: "Invalid input types"
            });
        }

        const trimmedName = name.trim();
        if (trimmedName.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Name cannot be empty"
            });
        }

        if (trimmedName.length > 100) {
            return res.status(400).json({
                success: false,
                message: "Name cannot exceed 100 characters"
            });
        }

        if (email.length > 255) {
            return res.status(400).json({
                success: false,
                message: "Email cannot exceed 255 characters"
            });
        }

        // Email regex validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long"
            });
        }

        if (password.length > 128) {
            return res.status(400).json({
                success: false,
                message: "Password cannot exceed 128 characters"
            });
        }

        // Check if email already exists
        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Determine role (default: "user"; supports "admin" if explicitly passed for eval demo)
        const role = (req.body.role && typeof req.body.role === "string" && req.body.role.toLowerCase() === "admin") ? "admin" : "user";

        // Save new user in MongoDB
        const newUser = await User.create({
            name: trimmedName,
            email: normalizedEmail,
            password: hashedPassword,
            role
        });

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            userId: newUser._id,
            role: newUser.role
        });

    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

// 2. LOGIN USER
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Type checking to prevent NoSQL operator injection
        if (typeof email !== "string" || typeof password !== "string") {
            return res.status(400).json({
                success: false,
                message: "Invalid input types"
            });
        }

        if (password.length > 128) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Find user in MongoDB
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Account Lockout Defense: Check if account is temporarily locked
        if (user.lockUntil && user.lockUntil > new Date()) {
            const remainingMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / (60 * 1000));
            return res.status(423).json({
                success: false,
                message: `Account is temporarily locked due to multiple failed login attempts. Try again in ${remainingMinutes} minute(s).`,
                isLocked: true,
                remainingMinutes
            });
        }

        // Account Status Check: Ensure account is active
        if (user.isActive === false) {
            return res.status(403).json({
                success: false,
                message: "This account has been deactivated by an administrator. Please contact support."
            });
        }

        // Compare password
        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        const clientIp = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
        const clientDevice = req.headers["user-agent"] ? req.headers["user-agent"].substring(0, 80) : "Browser";

        if (!isPasswordCorrect) {
            user.loginAttempts = (user.loginAttempts || 0) + 1;
            let message = "Invalid email or password";

            if (user.loginAttempts >= 5) {
                user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15-minute lock
                user.loginAttempts = 0;
                message = "Account locked for 15 minutes due to 5 consecutive failed login attempts.";
            }

            if (!user.loginHistory) user.loginHistory = [];
            user.loginHistory.unshift({
                timestamp: new Date(),
                ip: clientIp,
                device: clientDevice,
                status: "failed"
            });
            if (user.loginHistory.length > 10) user.loginHistory = user.loginHistory.slice(0, 10);

            await user.save();

            return res.status(401).json({
                success: false,
                message,
                attemptsRemaining: user.lockUntil ? 0 : Math.max(0, 5 - user.loginAttempts)
            });
        }

        // Successful Login: Reset lockout counters & log activity
        user.loginAttempts = 0;
        user.lockUntil = null;
        user.lastLogin = new Date();
        user.lastLoginIp = clientIp;
        user.lastLoginDevice = clientDevice;

        if (!user.loginHistory) user.loginHistory = [];
        user.loginHistory.unshift({
            timestamp: new Date(),
            ip: clientIp,
            device: clientDevice,
            status: "success"
        });
        if (user.loginHistory.length > 10) user.loginHistory = user.loginHistory.slice(0, 10);

        await user.save();

        // Generate JWT Token with user role
        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role || "user"
            },
            process.env.JWT_SECRET || "default_secret_key_change_in_production",
            {
                expiresIn: "24h"
            }
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role || "user",
                isActive: user.isActive !== false,
                lastLogin: user.lastLogin
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });
    }
};

// 3. FORGOT PASSWORD - GENERATE & SEND OTP
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        if (typeof email !== "string") {
            return res.status(400).json({
                success: false,
                message: "Valid email is required"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "No account found with this email address"
            });
        }

        // Generate 6-digit secure OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Set expiry time (10 minutes from now)
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Save OTP & expiry in MongoDB and reset attempts
        user.otp = otp;
        user.otpExpiresAt = otpExpiresAt;
        user.otpAttempts = 0;
        await user.save();

        // Send Email with OTP
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
                <h2 style="color: #4f46e5; text-align: center; margin-bottom: 20px;">Password Reset Request</h2>
                <p>Hello <strong>${user.name}</strong>,</p>
                <p>You requested a one-time password (OTP) to reset your password. Use the code below to proceed:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e1b4b; background: #e0e7ff; padding: 12px 24px; border-radius: 8px;">
                        ${otp}
                    </span>
                </div>
                <p style="color: #64748b; font-size: 14px;">This OTP is valid for <strong>10 minutes</strong>. If you did not request this, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="text-align: center; font-size: 12px; color: #94a3b8;">Authentication System</p>
            </div>
        `;

        // Await email delivery so serverless lambda (Vercel) does not terminate prematurely
        try {
            await sendEmail({
                to: user.email,
                subject: "Your Password Reset OTP Code",
                text: `Your OTP for password reset is: ${otp}. It will expire in 10 minutes.`,
                html: emailHtml
            });
        } catch (emailErr) {
            console.error("OTP Email Delivery Error:", emailErr.message || emailErr);
            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to deliver OTP email. Please try again later."
                });
            }
        }

        res.status(200).json({
            success: true,
            message: "OTP sent successfully to your email",
            email: user.email,
            // Convenience in dev mode when SMTP is not configured
            devOtp: (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) ? otp : undefined
        });

    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({
            success: false,
            message: "Error sending OTP. Please try again."
        });
    }
};

// 4. VERIFY OTP
const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required"
            });
        }

        if (typeof email !== "string") {
            return res.status(400).json({
                success: false,
                message: "Invalid email format"
            });
        }

        const cleanOtp = String(otp).trim();
        if (!/^\d{6}$/.test(cleanOtp)) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP code"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check if OTP matches
        if (!user.otp || user.otp !== cleanOtp) {
            user.otpAttempts = (user.otpAttempts || 0) + 1;
            if (user.otpAttempts >= 5) {
                user.otp = null;
                user.otpExpiresAt = null;
                user.otpAttempts = 0;
                await user.save();
                return res.status(400).json({
                    success: false,
                    message: "Too many failed attempts. This OTP has been invalidated. Please request a new one."
                });
            }
            await user.save();
            return res.status(400).json({
                success: false,
                message: "Invalid OTP code"
            });
        }

        const now = new Date();
        if (new Date(user.otpExpiresAt) < now) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new one."
            });
        }

        res.status(200).json({
            success: true,
            message: "OTP verified successfully"
        });

    } catch (error) {
        console.error("Verify OTP Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

// 5. RESET PASSWORD
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Email, OTP, and new password are required"
            });
        }

        if (typeof email !== "string" || typeof newPassword !== "string") {
            return res.status(400).json({
                success: false,
                message: "Invalid input types"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long"
            });
        }

        if (newPassword.length > 128) {
            return res.status(400).json({
                success: false,
                message: "Password cannot exceed 128 characters"
            });
        }

        const cleanOtp = String(otp).trim();
        if (!/^\d{6}$/.test(cleanOtp)) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP code"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Validate OTP
        if (!user.otp || user.otp !== cleanOtp) {
            user.otpAttempts = (user.otpAttempts || 0) + 1;
            if (user.otpAttempts >= 5) {
                user.otp = null;
                user.otpExpiresAt = null;
                user.otpAttempts = 0;
                await user.save();
                return res.status(400).json({
                    success: false,
                    message: "Too many failed attempts. This OTP has been invalidated. Please request a new one."
                });
            }
            await user.save();
            return res.status(400).json({
                success: false,
                message: "Invalid OTP code"
            });
        }

        // Validate Expiry
        const now = new Date();
        if (new Date(user.otpExpiresAt) < now) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new one."
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and clear OTP & attempts
        user.password = hashedPassword;
        user.otp = null;
        user.otpExpiresAt = null;
        user.otpAttempts = 0;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password reset successfully! You can now log in with your new password."
        });

    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

// 6. GET USER PROFILE (PROTECTED ROUTE)
const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(401).json({
                success: false,
                message: "Session expired or invalid token. Please sign in again."
            });
        }

        const user = await User.findById(userId).select("-password").lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role || "user",
                isActive: user.isActive !== false,
                created_at: user.createdAt,
                lastLogin: user.lastLogin,
                lastLoginIp: user.lastLoginIp,
                lastLoginDevice: user.lastLoginDevice
            }
        });

    } catch (error) {
        console.error("Profile Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

// 7. UPDATE PROFILE (PROTECTED ROUTE)
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name } = req.body;

        if (!name || typeof name !== "string") {
            return res.status(400).json({
                success: false,
                message: "Valid name is required"
            });
        }

        const trimmedName = name.trim();
        if (trimmedName.length === 0 || trimmedName.length > 100) {
            return res.status(400).json({
                success: false,
                message: "Name must be between 1 and 100 characters"
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        user.name = trimmedName;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role || "user"
            }
        });

    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

// 8. CHANGE PASSWORD (PROTECTED ROUTE)
const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Current password and new password are required"
            });
        }

        if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
            return res.status(400).json({
                success: false,
                message: "Invalid input types"
            });
        }

        if (newPassword.length < 6 || newPassword.length > 128) {
            return res.status(400).json({
                success: false,
                message: "New password must be between 6 and 128 characters long"
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const isCurrentCorrect = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentCorrect) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect"
            });
        }

        const isSame = await bcrypt.compare(newPassword, user.password);
        if (isSame) {
            return res.status(400).json({
                success: false,
                message: "New password must be different from current password"
            });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password changed successfully! Please keep your credentials secure."
        });

    } catch (error) {
        console.error("Change Password Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

// 9. GET SESSIONS & AUDIT LOG (PROTECTED ROUTE)
const getSessions = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select("lastLogin lastLoginIp lastLoginDevice loginHistory").lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const clientIp = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
        const clientDevice = req.headers["user-agent"] ? req.headers["user-agent"].substring(0, 80) : "Browser";

        res.status(200).json({
            success: true,
            currentSession: {
                ip: clientIp,
                device: clientDevice,
                activeSince: user.lastLogin || new Date()
            },
            history: user.loginHistory || []
        });

    } catch (error) {
        console.error("Get Sessions Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

module.exports = {
    register,
    login,
    forgotPassword,
    verifyOtp,
    resetPassword,
    getProfile,
    updateProfile,
    changePassword,
    getSessions
};