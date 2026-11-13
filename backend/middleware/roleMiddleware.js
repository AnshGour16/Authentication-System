/**
 * Role-Based Access Control (RBAC) Middleware
 * Verifies whether the authenticated user has one of the allowed roles.
 */
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const userRole = req.user.role || "user";

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Requires one of: [${allowedRoles.join(", ")}]. Current role: '${userRole}'`
            });
        }

        next();
    };
};

module.exports = { authorizeRoles };

