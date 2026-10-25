const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/authentication_db";

        const conn = await mongoose.connect(mongoURI);

        console.log(` MongoDB Connected: ${conn.connection.host} / Database: ${conn.connection.name}`);
    } catch (error) {
        console.error(" MongoDB Connection Failed:", error.message);
        console.log("Tip: Ensure local MongoDB is running or add your MongoDB Atlas connection string to .env (MONGO_URI=...)");
    }
};

module.exports = connectDB;