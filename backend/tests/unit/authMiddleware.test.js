const jwt = require("jsonwebtoken");
const authMiddleware = require("../../middleware/authMiddleware");

describe("Unit Test: Auth Middleware", () => {
    const originalSecret = process.env.JWT_SECRET;
    const testSecret = "unit_test_jwt_secret_key";

    beforeAll(() => {
        process.env.JWT_SECRET = testSecret;
    });

    afterAll(() => {
        process.env.JWT_SECRET = originalSecret;
    });

    const createMockReqRes = (authHeader) => {
        const req = {
            headers: {}
        };
        if (authHeader !== undefined) {
            req.headers.authorization = authHeader;
        }

        const res = {
            statusCode: 200,
            body: null,
            status(code) {
                this.statusCode = code;
                return this;
            },
            json(data) {
                this.body = data;
                return this;
            }
        };

        const next = jest.fn();

        return { req, res, next };
    };

    it("should return 401 if Authorization header is missing", () => {
        const { req, res, next } = createMockReqRes(undefined);

        authMiddleware(req, res, next);

        expect(res.statusCode).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Authorization token required");
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 if Authorization format is invalid (no token)", () => {
        const { req, res, next } = createMockReqRes("Bearer ");

        authMiddleware(req, res, next);

        expect(res.statusCode).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Invalid authorization format");
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 if token is tampered or invalid", () => {
        const { req, res, next } = createMockReqRes("Bearer invalid_signature_token_xyz");

        authMiddleware(req, res, next);

        expect(res.statusCode).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Invalid or expired token");
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 if token is expired", () => {
        const expiredToken = jwt.sign(
            { id: "671ad89e7f3a9b1c2d3e4f5a", email: "user@test.com" },
            testSecret,
            { expiresIn: "0s" }
        );

        const { req, res, next } = createMockReqRes(`Bearer ${expiredToken}`);

        authMiddleware(req, res, next);

        expect(res.statusCode).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Invalid or expired token");
        expect(next).not.toHaveBeenCalled();
    });

    it("should call next() and attach decoded payload to req.user for valid token", () => {
        const payload = {
            id: "671ad89e7f3a9b1c2d3e4f5a",
            name: "Test User",
            email: "test@user.com"
        };
        const validToken = jwt.sign(payload, testSecret, { expiresIn: "1h" });

        const { req, res, next } = createMockReqRes(`Bearer ${validToken}`);

        authMiddleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(req.user).toBeDefined();
        expect(req.user.id).toBe(payload.id);
        expect(req.user.email).toBe(payload.email);
    });
});
