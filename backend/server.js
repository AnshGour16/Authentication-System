require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, "public")));

// API Routes
app.use("/api/auth", authRoutes);

// Health check / DB Test Route
app.get("/api/health", async (req, res) => {
    try {
        const isConnected = mongoose.connection.readyState === 1;
        if (!isConnected) {
            return res.status(503).json({
                success: false,
                message: "Database connecting or disconnected",
                readyState: mongoose.connection.readyState
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

// Start Server (only when not running automated tests)
if (process.env.NODE_ENV !== "test") {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;