const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema(
    {
        driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
        aadharCardFrontImage: { type: String },
        aadharCardBackImage: { type: String },
        panCardImage: { type: String },
        drivingLicenseFrontImage: { type: String },
        isDeleted: { type: Boolean, default: false },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Document", DocumentSchema);