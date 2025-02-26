const mongoose = require("mongoose");

const surgePricingSchema = new mongoose.Schema({
  city: { type: String, required: true },
  activeRides: { type: Number, required: true, default: 0 }, // Ongoing rides
  availableDrivers: { type: Number, required: true, default: 0 }, // Free drivers
  trafficLevel: { type: Number, default: 1 }, // 1 = low, 2 = moderate, 3 = high
  weatherCondition: { type: String, enum: ["clear", "rainy", "storm", "fog"], default: "clear" },
  surgeMultiplier: { type: Number, default: 1 }, // Updated dynamically
}, { timestamps: true });

module.exports = mongoose.model("SurgePricing", surgePricingSchema);
