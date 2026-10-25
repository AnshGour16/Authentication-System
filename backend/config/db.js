const mongoose = require("mongoose");

let isConnected = false;
let lastError = null;

const connectDB = async () => {
    // Reuse existing connection if active
    if (isConnected || mongoose.connection.readyState === 1) {
        return;
    }

    try {
        const mongoURI = process.env.MONGO_URI;

        if (!mongoURI) {
            lastError = "MONGO_URI environment variable is not defined in Vercel project settings.";
            console.error(" MongoDB Config Error:", lastError);
            return;
        }

        const conn = await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 5000 // Fast fail in serverless
        });
        isConnected = true;
        lastError = null;

        console.log(` MongoDB Connected: ${conn.connection.host} / Database: ${conn.connection.name}`);
    } catch (error) {
        lastError = error.message;
        console.error(" MongoDB Connection Failed:", error.message);
    }
};

const getLastError = () => lastError;

module.exports = connectDB;
module.exports.getLastError = getLastError;