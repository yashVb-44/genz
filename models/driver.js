const mongoose = require("mongoose");

const DriverSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        profileImage: { type: String },
        email: { type: String, unique: true, sparse: true },
        mobileNo: { type: String, required: true, unique: true },
        password: { type: String },
        isBlocked: { type: Boolean, default: false },
        isVerified: { type: Boolean, default: true },
        isActive: { type: Boolean, default: true },
        isDeleted: { type: Boolean, default: false },
        isApproved: { type: Boolean, default: true },
        country: { type: String },
        state: { type: String },
        city: { type: String },
        language: { type: String },
        gender: { type: String },
        otp: { type: String },
        otpExpiresAt: { type: Date },
        vehicleType: { type: String },
        role: { type: String, default: "driver" },
        dateOfBirth: { type: String },
        currentLocation: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point",
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
            },
        },
        lastUpdated: { type: Date, default: Date.now }, // Last location update timestamp
        isAvailableForRide: { type: Boolean, default: true }, // True = Available, False = Busy/offline
        isOnline: { type: Boolean, default: true }, // True = Online, False = Offline
        isOnRide: { type: Boolean, default: false }, // True = On Ride, False = Free
        bankDetails: {
            accountHolderName: { type: String },
            accountNumber: { type: String },
            ifscCode: { type: String },
            bankName: { type: String },
            branchName: { type: String },
        }
    },
    {
        timestamps: true,
    }
);
DriverSchema.index({ currentLocation: "2dsphere" });
module.exports = mongoose.model("Driver", DriverSchema);
