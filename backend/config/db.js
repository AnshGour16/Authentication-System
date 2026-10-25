const mongoose = require("mongoose");

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null, lastError: null };
}

const connectDB = async () => {
    // Reuse existing connection if active
    if (cached.conn && mongoose.connection.readyState === 1) {
        return cached.conn;
    }

    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
        cached.lastError = "MONGO_URI environment variable is not defined.";
        console.error("MongoDB Config Error:", cached.lastError);
        return null;
    }

    if (!cached.promise) {
        const opts = {
            serverSelectionTimeoutMS: 15000,
            maxPoolSize: 10
        };

        cached.promise = mongoose.connect(mongoURI.trim(), opts).then((mongooseInstance) => {
            console.log(` MongoDB Connected: ${mongooseInstance.connection.host}`);
            cached.lastError = null;
            return mongooseInstance;
        }).catch((err) => {
            cached.lastError = err.message;
            cached.promise = null;
            console.error(" MongoDB Connection Failed:", err.message);
            throw err;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (err) {
        cached.promise = null;
    }

    return cached.conn;
};

const getLastError = () => cached ? cached.lastError : null;

module.exports = connectDB;
module.exports.getLastError = getLastError;