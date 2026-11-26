const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
require("dotenv").config();
const bcrypt = require("bcrypt");
const User = require("./models/User");
const connectDB = require("./config/db");

async function seed() {
    try {
        await connectDB();
        console.log("Connected to MongoDB for seeding...");

        // 1. Seed Administrator Account
        const adminEmail = "admin@demo.com";
        const existingAdmin = await User.findOne({ email: adminEmail });
        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash("AdminPass123!", 10);
            await User.create({
                name: "Administrator",
                email: adminEmail,
                password: hashedPassword,
                role: "admin",
                isActive: true
            });
            console.log("Admin account created successfully: admin@demo.com / AdminPass123!");
        } else {
            let updated = false;
            if (existingAdmin.role !== "admin") {
                existingAdmin.role = "admin";
                updated = true;
            }
            if (existingAdmin.isActive === false) {
                existingAdmin.isActive = true;
                updated = true;
            }
            if (existingAdmin.lockUntil) {
                existingAdmin.lockUntil = null;
                existingAdmin.loginAttempts = 0;
                updated = true;
            }
            if (updated) await existingAdmin.save();
            console.log("Admin account verified & active: admin@demo.com");
        }

        // 2. Seed Standard User Account
        const userEmail = "user@demo.com";
        const existingUser = await User.findOne({ email: userEmail });
        if (!existingUser) {
            const hashedPassword = await bcrypt.hash("UserPass123!", 10);
            await User.create({
                name: "Standard User",
                email: userEmail,
                password: hashedPassword,
                role: "user",
                isActive: true
            });
            console.log("Standard User account created: user@demo.com / UserPass123!");
        } else {
            let updated = false;
            if (existingUser.isActive === false) {
                existingUser.isActive = true;
                updated = true;
            }
            if (existingUser.lockUntil) {
                existingUser.lockUntil = null;
                existingUser.loginAttempts = 0;
                updated = true;
            }
            if (updated) await existingUser.save();
            console.log("Standard User account verified & active: user@demo.com");
        }

        console.log("Database demo seeding complete!");
        process.exit(0);
    } catch (err) {
        console.error("Seeding error:", err);
        process.exit(1);
    }
}

seed();
