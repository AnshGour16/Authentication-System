const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const helmet = require("helmet");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const { apiLimiter } = require("./middleware/rateLimiter");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Security Headers (Helmet configured for fonts & icon CDN compatibility)
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                imgSrc: ["'self'", "data:"],
                connectSrc: ["'self'"]
            }
        },
        crossOriginEmbedderPolicy: false
    })
);

// Middleware
app.use(cors());
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));

// General API Rate Limiting
app.use("/api", apiLimiter);

// Ensure MongoDB connection is ready (critical for serverless platforms like Vercel)
app.use(async (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        await connectDB();
    }
    next();
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, "public")));

// API Routes with Database Connection Guard
app.use("/api/auth", async (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        await connectDB();
    }
    if (mongoose.connection.readyState !== 1) {
        const dbError = typeof connectDB.getLastError === "function" ? connectDB.getLastError() : "Database disconnected";
        return res.status(503).json({
            success: false,
            message: dbError.includes("whitelist") || dbError.includes("servers")
                ? "Database connection blocked by MongoDB Atlas. Please add 0.0.0.0/0 to Network Access in MongoDB Atlas."
                : "Database connection unavailable. Please try again in a few seconds."
        });
    }
    next();
}, authRoutes);

// Health check / DB Test Route
app.get("/api/health", async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            await connectDB();
        }
        const isConnected = mongoose.connection.readyState === 1;
        if (!isConnected) {
            return res.status(503).json({
                success: false,
                message: "Database connecting or disconnected",
                hasMongoUri: Boolean(process.env.MONGO_URI),
                hasJwtSecret: Boolean(process.env.JWT_SECRET),
                readyState: mongoose.connection.readyState,
                error: typeof connectDB.getLastError === "function" ? connectDB.getLastError() : null
            });
        }
        res.json({
            success: true,
            message: "Authentication Server & MongoDB are running smoothly",
            database: mongoose.connection.name,
            host: mongoose.connection.host
        });
    } catch (error) {
        console.error("Health check error:", error);
        res.status(500).json({
            success: false,
            message: "Database connection failed",
            error: error.message
        });
    }
});

// Fallback to index.html for single page app (Express 5 compatible)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start Server (only when not running automated tests and not on Vercel)
if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;