const SurgePricing = require("../models/surgePricing");

const getSurgeMultiplier = async (city) => {
    try {
        const surgeData = await SurgePricing.findOne({ city });

        if (!surgeData) return 1; // No surge if data missing

        let surgeMultiplier = 1; // Default fare

        // Demand-Supply Surge Logic
        if (surgeData.activeRides > surgeData.availableDrivers) {
            const demandRatio = surgeData.activeRides / surgeData.availableDrivers;
            if (demandRatio > 1.5) surgeMultiplier += 0.5; // High surge
            if (demandRatio > 2) surgeMultiplier += 1; // Extreme surge
        }

        // Traffic-based surge
        if (surgeData.trafficLevel === 2) surgeMultiplier += 0.3;
        if (surgeData.trafficLevel === 3) surgeMultiplier += 0.7;

        // Weather-based surge
        if (surgeData.weatherCondition === "rainy") surgeMultiplier += 0.5;
        if (surgeData.weatherCondition === "storm" || surgeData.weatherCondition === "fog") surgeMultiplier += 1;

        return surgeMultiplier;
    } catch (error) {
        console.error("Error fetching surge pricing:", error);
        return 1; // Default multiplier if error
    }
};

module.exports = { getSurgeMultiplier };
