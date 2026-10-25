const User = require("../../models/User");

describe("Unit Test: User Model Schema Validation", () => {
    it("should successfully validate a user with complete and correct fields", async () => {
        const user = new User({
            name: "John Doe",
            email: "John.Doe@example.com",
            password: "SecurePassword123"
        });

        let error = null;
        try {
            await user.validate();
        } catch (err) {
            error = err;
        }

        expect(error).toBeNull();
        expect(user.email).toBe("john.doe@example.com"); // Auto lowercased
        expect(user.otp).toBeNull();
        expect(user.otpExpiresAt).toBeNull();
    });

    it("should fail validation if name is missing", async () => {
        const user = new User({
            email: "test@example.com",
            password: "password123"
        });

        let error = null;
        try {
            await user.validate();
        } catch (err) {
            error = err;
        }

        expect(error).toBeDefined();
        expect(error.errors.name).toBeDefined();
        expect(error.errors.name.message).toBe("Name is required");
    });

    it("should fail validation if email is missing", async () => {
        const user = new User({
            name: "Test User",
            password: "password123"
        });

        let error = null;
        try {
            await user.validate();
        } catch (err) {
            error = err;
        }

        expect(error).toBeDefined();
        expect(error.errors.email).toBeDefined();
        expect(error.errors.email.message).toBe("Email is required");
    });

    it("should fail validation if email format is invalid", async () => {
        const invalidEmails = ["plainaddress", "missing@domain", "@missinguser.com", "user@.com"];

        for (const email of invalidEmails) {
            const user = new User({
                name: "Test User",
                email,
                password: "password123"
            });

            let error = null;
            try {
                await user.validate();
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error.errors.email).toBeDefined();
            expect(error.errors.email.message).toBe("Please provide a valid email address");
        }
    });

    it("should fail validation if password is shorter than 6 characters", async () => {
        const user = new User({
            name: "Test User",
            email: "test@example.com",
            password: "123"
        });

        let error = null;
        try {
            await user.validate();
        } catch (err) {
            error = err;
        }

        expect(error).toBeDefined();
        expect(error.errors.password).toBeDefined();
        expect(error.errors.password.message).toBe("Password must be at least 6 characters long");
    });
});
