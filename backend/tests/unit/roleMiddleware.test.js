const { authorizeRoles } = require("../../middleware/roleMiddleware");

describe("Unit Test: Role Middleware (RBAC)", () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            user: {
                id: "user123",
                role: "user"
            }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    it("should allow request if user has required role", () => {
        const middleware = authorizeRoles("user", "admin");
        middleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    it("should reject request with 403 if user lacks required role", () => {
        const middleware = authorizeRoles("admin");
        middleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: expect.stringContaining("Access denied")
            })
        );
    });

    it("should return 401 if req.user is missing", () => {
        req.user = null;
        const middleware = authorizeRoles("admin");
        middleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
    });
});

