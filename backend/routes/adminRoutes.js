const express = require("express");
const {
    getStats,
    getAllUsers,
    updateUserRole,
    toggleUserStatus,
    deleteUser,
    getAuditLogs
} = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// All Admin routes require a valid JWT AND the 'admin' role
router.use(authMiddleware);
router.use(authorizeRoles("admin"));

// 1. System Statistics
router.get("/stats", getStats);

// 2. User Management
router.get("/users", getAllUsers);
router.patch("/users/:id/role", updateUserRole);
router.patch("/users/:id/status", toggleUserStatus);
router.delete("/users/:id", deleteUser);

// 3. Security Audit Logs
router.get("/audit-logs", getAuditLogs);

module.exports = router;

