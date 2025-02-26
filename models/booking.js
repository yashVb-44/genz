const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true },
    pickupLocation: { type: { latitude: Number, longitude: Number, address: String }, required: true },
    dropLocation: { type: { latitude: Number, longitude: Number, address: String }, required: true },
    totalFare: { type: Number, required: true },
    vehicleType: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    status: { type: String, enum: ["completed", "canceled"], required: true },
    requestTime: { type: Date, required: true },
    acceptTime: { type: Date, required: true },
    pickupTime: { type: Date, required: true },
    dropTime: { type: Date }, // Null if canceled
    cancelTime: { type: Date }, // When canceled (if applicable)
    cancelReason: { type: String },
    distance: { type: Number, required: true }, // Distance in KM
    duration: { type: Number, required: true }, // Duration in minutes
    specialRequest: { type: String },
    note: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);
