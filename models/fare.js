const mongoose = require("mongoose");

const fareSchema = new mongoose.Schema({
    vehicleType: {
        type: String,
        // enum: ["bike", "auto", "sedan", "suv", "luxury"],
        required: true,
    },
    baseFare: { type: Number }, // Fixed starting charge
    costPerKm: { type: Number }, // Rate per km
    costPerMin: { type: Number }, // Rate per minute
    surgeMultiplier: { type: Number, default: 1 }, // Surge pricing
    waitingChargePerMin: { type: Number, default: 0 }, // Waiting charge per min
    tollCharges: { type: Number, default: 0 }, // Toll fees
    taxPercentage: { type: Number, default: 0 }, // GST, VAT, etc.
    serviceFee: { type: Number, default: 0 }, // Platform service fee
    minFare: { type: Number, default: 50 }, // Minimum charge
    nightFareMultiplier: { type: Number, default: 1.5 }, // Higher fare at night
    peakHourMultiplier: { type: Number, default: 1 }, // Higher fare in peak hours
    peakHours: [{ start: Number, end: Number }], // Peak hour time slots (24hr format)
    city: { type: String },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("Fare", fareSchema);
