const asyncHandler = require('express-async-handler');
const SurgePricing = require("../models/surgePricing");

exports.UpdateSurgePricing = asyncHandler(async (req, res) => {
    try {
        const { city, activeRides, availableDrivers, trafficLevel, weatherCondition } = req.body;

        let surgeMultiplier = 1;
        if (activeRides > availableDrivers) {
            const demandRatio = activeRides / availableDrivers;
            if (demandRatio > 1.5) surgeMultiplier += 0.5;
            if (demandRatio > 2) surgeMultiplier += 1;
        }
        if (trafficLevel === 2) surgeMultiplier += 0.3;
        if (trafficLevel === 3) surgeMultiplier += 0.7;
        if (weatherCondition === "rainy") surgeMultiplier += 0.5;
        if (weatherCondition === "storm" || weatherCondition === "fog") surgeMultiplier += 1;

        const updatedSurge = await SurgePricing.findOneAndUpdate(
            { city },
            { activeRides, availableDrivers, trafficLevel, weatherCondition, surgeMultiplier },
            { upsert: true, new: true }
        );

        return res.status(200).json({
            message: 'Surge pricing updated',
            type: 'success',
            surge: updatedSurge
        });

    } catch (error) {
        return res.status(500).json({
            message: 'Failed to update surge pricing',
            error: error.message,
            type: 'error',
        });
    }
});
