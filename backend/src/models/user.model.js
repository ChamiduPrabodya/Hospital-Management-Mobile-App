const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        },
        role: {
            type: String,
            enum: ["patient", "doctor", "admin"],
            default: "patient"
        },
        doctorProfileId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Doctor",
            default: null
        },
        phone: {
            type: String
        },
        address: {
            type: String
        },
        profileImage: {
            type: String
        },
        resetPasswordOtpHash: {
            type: String,
            default: null
        },
        resetPasswordOtpExpiresAt: {
            type: Date,
            default: null
        },
        isActive: {
            type: Boolean,
            default: true
        },
        deletedAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
