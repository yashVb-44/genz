const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pickupLocation: { type: { latitude: Number, longitude: Number, address: String }, required: true },
    dropLocation: { type: { latitude: Number, longitude: Number, address: String }, required: true },
    estimatedFare: { type: Number, required: true },
    vehicleType: { type: String, required: true },
    paymentMethod: { type: String, enum: ["cash", "wallet", "online"], required: true },
    status: { type: String, enum: ["pending", "expired", "accepted"], default: "pending" },
    distance: { type: Number, required: true }, // Distance in KM
    duration: { type: Number, required: true }, // Duration in minutes
    expiryTime: { type: Date, default: () => new Date(Date.now() + 100 * 60 * 1000) },
    requestTime: { type: Date, default: Date.now }, // When user requested ride
    acceptTime: { type: Date }, // When driver accepted request
    specialRequest: { type: String },
    note: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("Request", requestSchema);
