const mongoose = require("mongoose");

const VehicleSchema = new mongoose.Schema(
    {
        vehicleType: { type: String, required: true },
        vehicleNumber: { type: String, required: true },
        // vehicleModel: { type: String, required: true },
        // vehicleColor: { type: String, required: true },
        driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
        isDeleted: { type: Boolean, default: false },
        vehicleInsuranceIamge: { type: String },
        pollutionCertificateImage: { type: String },
        registrationCertificateImage: { type: String }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Vehicle", VehicleSchema);