const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../server");
const User = require("../../models/User");

describe("Integration Tests: Auth Routes (/api/auth)", () => {
    const timestamp = Date.now();
    const testUser = {
        name: "Test Runner",
        email: `test_tdd_${timestamp}@example.com`,
        password: "InitialPassword123!"
    };
    const newPassword = "NewUpdatedPassword456!";
    let authToken = "";
    let generatedOtp = "";

    beforeAll(async () => {
        // Ensure mongoose connection is ready
        if (mongoose.connection.readyState !== 1) {
            const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/authentication_db";
            await mongoose.connect(mongoURI);
        }
        // Clean up any test user with this email
        await User.deleteMany({ email: testUser.email });
    }, 15000);

    afterAll(async () => {
        // Clean up test user created during tests
        await User.deleteMany({ email: testUser.email });
        await mongoose.connection.close();
    }, 15000);

    describe("1. POST /api/auth/register", () => {
        it("should return 400 if required fields are missing", async () => {
            const res = await request(app)
                .post("/api/auth/register")
                .send({ name: "Incomplete" });

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("All fields are required");
        });

        it("should return 400 if email is invalid", async () => {
            const res = await request(app)
                .post("/api/auth/register")
                .send({ name: testUser.name, email: "invalid-email-address", password: testUser.password });

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("Please provide a valid email address");
        });

        it("should return 400 if password is less than 6 characters", async () => {
            const res = await request(app)
                .post("/api/auth/register")
                .send({ name: testUser.name, email: testUser.email, password: "123" });

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("Password must be at least 6 characters long");
        });

        it("should register a new user successfully with 201 Created", async () => {
            const res = await request(app)
                .post("/api/auth/register")
                .send(testUser);

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("User registered successfully");
            expect(res.body.userId).toBeDefined();
        });

        it("should return 409 Conflict if registering with already existing email", async () => {
            const res = await request(app)
                .post("/api/auth/register")
                .send(testUser);

            expect(res.statusCode).toBe(409);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("Email already registered");
        });
    });

    describe("2. POST /api/auth/login", () => {
        it("should return 400 if credentials are missing", async () => {
            const res = await request(app)
                .post("/api/auth/login")
                .send({ email: testUser.email });

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it("should return 401 if password is incorrect", async () => {
            const res = await request(app)
                .post("/api/auth/login")
                .send({ email: testUser.email, password: "wrong_password_xyz" });

            expect(res.statusCode).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("Invalid email or password");
        });

        it("should return 401 for nonexistent email", async () => {
            const res = await request(app)
                .post("/api/auth/login")
                .send({ email: "nonexistent_random_user@domain.com", password: "somePassword" });

            expect(res.statusCode).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it("should log in successfully and return JWT token and user info", async () => {
            const res = await request(app)
                .post("/api/auth/login")
                .send({ email: testUser.email, password: testUser.password });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.token).toBeDefined();
            expect(res.body.user.email).toBe(testUser.email.toLowerCase());
            authToken = res.body.token;
        });
    });

    describe("3. GET /api/auth/profile (Protected Route)", () => {
        it("should return 401 if no Bearer token is provided", async () => {
            const res = await request(app).get("/api/auth/profile");

            expect(res.statusCode).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it("should return 200 and profile info when valid Bearer token is provided", async () => {
            const res = await request(app)
                .get("/api/auth/profile")
                .set("Authorization", `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.user.email).toBe(testUser.email.toLowerCase());
            expect(res.body.user.name).toBe(testUser.name);
        });
    });

    describe("4. POST /api/auth/forgot-password (OTP Generation)", () => {
        it("should return 400 if email is missing", async () => {
            const res = await request(app)
                .post("/api/auth/forgot-password")
                .send({});

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it("should return 404 if email does not exist", async () => {
            const res = await request(app)
                .post("/api/auth/forgot-password")
                .send({ email: "notfound_nobody@example.com" });

            expect(res.statusCode).toBe(404);
            expect(res.body.success).toBe(false);
        });

        it("should generate and save 6-digit OTP in database with 10-minute expiry", async () => {
            const res = await request(app)
                .post("/api/auth/forgot-password")
                .send({ email: testUser.email });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);

            // Fetch user from DB to verify OTP was stored properly
            const dbUser = await User.findOne({ email: testUser.email });
            expect(dbUser.otp).toBeDefined();
            expect(dbUser.otp).toHaveLength(6);
            expect(dbUser.otpExpiresAt).toBeDefined();
            expect(new Date(dbUser.otpExpiresAt).getTime()).toBeGreaterThan(Date.now());

            generatedOtp = dbUser.otp;
        });
    });

    describe("5. POST /api/auth/verify-otp", () => {
        it("should return 400 for incorrect OTP", async () => {
            const res = await request(app)
                .post("/api/auth/verify-otp")
                .send({ email: testUser.email, otp: "000000" });

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("Invalid OTP code");
        });

        it("should return 200 for correct OTP", async () => {
            const res = await request(app)
                .post("/api/auth/verify-otp")
                .send({ email: testUser.email, otp: generatedOtp });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("OTP verified successfully");
        });
    });

    describe("6. POST /api/auth/reset-password", () => {
        it("should return 400 if new password is too short", async () => {
            const res = await request(app)
                .post("/api/auth/reset-password")
                .send({ email: testUser.email, otp: generatedOtp, newPassword: "123" });

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it("should return 400 if wrong OTP is provided for reset", async () => {
            const res = await request(app)
                .post("/api/auth/reset-password")
                .send({ email: testUser.email, otp: "999999", newPassword });

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it("should reset password, clear OTP from DB, and allow login with new password", async () => {
            const res = await request(app)
                .post("/api/auth/reset-password")
                .send({ email: testUser.email, otp: generatedOtp, newPassword });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain("Password reset successfully");

            // Verify OTP is cleared in DB (single-use defense)
            const dbUser = await User.findOne({ email: testUser.email });
            expect(dbUser.otp).toBeNull();
            expect(dbUser.otpExpiresAt).toBeNull();

            // Verify old password fails
            const oldLogin = await request(app)
                .post("/api/auth/login")
                .send({ email: testUser.email, password: testUser.password });
            expect(oldLogin.statusCode).toBe(401);

            // Verify new password succeeds
            const newLogin = await request(app)
                .post("/api/auth/login")
                .send({ email: testUser.email, password: newPassword });
            expect(newLogin.statusCode).toBe(200);
            expect(newLogin.body.token).toBeDefined();
        });
    });
});
