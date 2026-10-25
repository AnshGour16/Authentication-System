const sendEmail = require("../../utils/sendEmail");

describe("Unit Test: sendEmail Utility", () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    it("should gracefully log and return development mode when EMAIL_USER is missing", async () => {
        delete process.env.EMAIL_USER;
        delete process.env.EMAIL_PASS;

        const result = await sendEmail({
            to: "someone@test.com",
            subject: "Test Subject",
            text: "Hello World"
        });

        expect(result).toBeDefined();
        expect(result.success).toBe(true);
        expect(result.mode).toBe("development");
    });

    it("should accept HTML formatted emails in dev mode without throwing", async () => {
        delete process.env.EMAIL_USER;

        const result = await sendEmail({
            to: "recipient@example.com",
            subject: "Your OTP",
            html: "<h1>123456</h1>"
        });

        expect(result.success).toBe(true);
        expect(result.mode).toBe("development");
    });
});
