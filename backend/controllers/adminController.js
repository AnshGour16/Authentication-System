const mongoose = require("mongoose");
const User = require("../models/User");

// 1. GET SYSTEM-WIDE ADMIN STATS
const getStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ isActive: { $ne: false } });
        const inactiveUsers = await User.countDocuments({ isActive: false });
        const adminCount = await User.countDocuments({ role: "admin" });
        
        // Users registered in last 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const newUsers24h = await User.countDocuments({ createdAt: { $gte: oneDayAgo } });

        // Users currently locked
        const lockedUsers = await User.countDocuments({ lockUntil: { $gt: new Date() } });

        res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                activeUsers,
                inactiveUsers,
                adminCount,
                newUsers24h,
                lockedUsers
            }
        });
    } catch (error) {
        console.error("Admin GetStats Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error fetching admin statistics"
        });
    }
};

// 2. GET ALL USERS (WITH SEARCH & FILTER)
const getAllUsers = async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};

        if (search && typeof search === "string" && search.trim().length > 0) {
            const regex = new RegExp(search.trim(), "i");
            query.$or = [{ name: regex }, { email: regex }];
        }

        const users = await User.find(query)
            .select("-password -otp -otpExpiresAt")
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            count: users.length,
            users: users.map(u => ({
                id: u._id,
                name: u.name,
                email: u.email,
                role: u.role || "user",
                isActive: u.isActive !== false,
                isLocked: Boolean(u.lockUntil && new Date(u.lockUntil) > new Date()),
                lastLogin: u.lastLogin || null,
                lastLoginIp: u.lastLoginIp || null,
                lastLoginDevice: u.lastLoginDevice || null,
                createdAt: u.createdAt
            }))
        });
    } catch (error) {
        console.error("Admin GetAllUsers Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error fetching users"
        });
    }
};

// 3. UPDATE USER ROLE (PROMOTE / DEMOTE)
const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid User ID"
            });
        }

        if (!role || !["user", "admin"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Role must be either 'user' or 'admin'"
            });
        }

        // Prevent self-demotion to avoid locking out the last admin
        if (id === req.user.id && role !== "admin") {
            return res.status(400).json({
                success: false,
                message: "You cannot demote yourself from Admin"
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        user.role = role;
        await user.save();

        res.status(200).json({
            success: true,
            message: `User role updated to ${role}`,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Admin UpdateRole Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error updating user role"
        });
    }
};

// 4. TOGGLE USER ACTIVE / SUSPENDED STATUS
const toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid User ID"
            });
        }

        if (typeof isActive !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "isActive must be a boolean (true or false)"
            });
        }

        // Prevent self-suspension
        if (id === req.user.id && !isActive) {
            return res.status(400).json({
                success: false,
                message: "You cannot deactivate your own administrative account"
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        user.isActive = isActive;
        // If re-activating, also clear any lockout
        if (isActive) {
            user.lockUntil = null;
            user.loginAttempts = 0;
        }
        await user.save();

        res.status(200).json({
            success: true,
            message: `User status changed to ${isActive ? "Active" : "Suspended"}`,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isActive: user.isActive
            }
        });
    } catch (error) {
        console.error("Admin ToggleStatus Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error updating user status"
        });
    }
};

// 5. DELETE USER
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid User ID"
            });
        }

        // Prevent self-deletion
        if (id === req.user.id) {
            return res.status(400).json({
                success: false,
                message: "You cannot delete your own administrative account"
            });
        }

        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: `User '${user.email}' deleted successfully`
        });
    } catch (error) {
        console.error("Admin DeleteUser Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error deleting user"
        });
    }
};

// 6. GET SECURITY AUDIT LOGS
const getAuditLogs = async (req, res) => {
    try {
        // Collect latest login activities across users
        const usersWithHistory = await User.find({ "loginHistory.0": { $exists: true } })
            .select("name email role loginHistory")
            .lean();

        let events = [];
        for (const u of usersWithHistory) {
            if (Array.isArray(u.loginHistory)) {
                for (const h of u.loginHistory) {
                    events.push({
                        userName: u.name,
                        userEmail: u.email,
                        role: u.role || "user",
                        timestamp: h.timestamp,
                        ip: h.ip,
                        device: h.device,
                        status: h.status
                    });
                }
            }
        }

        // Sort descending by event timestamp
        events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        events = events.slice(0, 50); // top 50 recent events

        res.status(200).json({
            success: true,
            count: events.length,
            events
        });
    } catch (error) {
        console.error("Admin AuditLogs Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error fetching audit logs"
        });
    }
};

module.exports = {
    getStats,
    getAllUsers,
    updateUserRole,
    toggleUserStatus,
    deleteUser,
    getAuditLogs
};

