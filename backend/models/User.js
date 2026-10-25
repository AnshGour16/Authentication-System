const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            maxlength: [100, "Name cannot exceed 100 characters"]
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: [255, "Email cannot exceed 255 characters"],
            match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email address"]
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters long"]
        },
        otp: {
            type: String,
            default: null
        },
        otpExpiresAt: {
            type: Date,
            default: null
        },
        otpAttempts: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

// Virtual or helper for compatibility if frontend expects id or created_at
userSchema.set("toJSON", {
    transform: (doc, ret) => {
        ret.id = ret._id;
        ret.created_at = ret.createdAt;
        delete ret.__v;
        return ret;
    }
});

const User = mongoose.model("User", userSchema);

module.exports = User;
