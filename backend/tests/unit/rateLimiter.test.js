const { apiLimiter, authLimiter, otpLimiter } = require("../../middleware/rateLimiter");

describe("Unit Test: Rate Limiter Middleware", () => {
    it("should export apiLimiter, authLimiter, and otpLimiter as middleware functions", () => {
        expect(typeof apiLimiter).toBe("function");
        expect(typeof authLimiter).toBe("function");
        expect(typeof otpLimiter).toBe("function");
    });

    it("should skip rate limiting when NODE_ENV is 'test'", async () => {
        expect(process.env.NODE_ENV).toBe("test");
        const mockReq = {
            ip: "127.0.0.1",
            headers: {}
        };
        const mockRes = {};
        const next = jest.fn();

        await apiLimiter(mockReq, mockRes, next);
        expect(next).toHaveBeenCalled();
    });
});
