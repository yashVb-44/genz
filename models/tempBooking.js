const mongoose = require("mongoose");

const tempBookingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true },
    pickupLocation: { type: { latitude: Number, longitude: Number, address: String }, required: true },
    dropLocation: { type: { latitude: Number, longitude: Number, address: String }, required: true },
    fare: { type: Number, required: true },
    vehicleType: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    otp: { type: String, required: true },
    status: { type: String, enum: ["accepted", "started", "canceled", "completed"], default: "accepted" },
    requestTime: { type: Date, required: true }, // From Request model
    acceptTime: { type: Date, required: true }, // From Request model
    pickupTime: { type: Date }, // When user gets picked up
    dropTime: { type: Date }, // When user reaches destination
    distance: { type: Number, required: true }, // Distance in KM
    duration: { type: Number, required: true }, // Duration in minutes
    specialRequest: { type: String },
    note: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("TempBooking", tempBookingSchema);
