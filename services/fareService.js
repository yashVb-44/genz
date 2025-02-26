const { getSurgeMultiplier } = require("../services/surgeService");
const Fare = require("../models/fare");

const calculateFare = async (vehicleType, city, distance, duration, waitingTime, isNight) => {
    try {
        const fare = await Fare.findOne({ vehicleType, city, isActive: true });

        if (!fare) throw new Error("Fare data not found");

        // Get real-time surge multiplier
        const surgeMultiplier = await getSurgeMultiplier(city);

        // Base calculation
        let totalFare = fare.baseFare + (distance * fare.costPerKm) + (duration * fare.costPerMin);

        // Apply waiting charges
        if (waitingTime > 0) totalFare += waitingTime * fare.waitingChargePerMin;

        // Apply night fare multiplier
        if (isNight) totalFare *= fare.nightFareMultiplier;

        // Apply real-time surge pricing
        totalFare *= surgeMultiplier;

        // Add toll charges & service fees
        totalFare += fare.tollCharges + fare.serviceFee;

        // Apply tax
        const taxAmount = (totalFare * fare.taxPercentage) / 100;
        totalFare += taxAmount;

        // Ensure minimum fare
        totalFare = Math.max(totalFare, fare.minFare);

        return {
            baseFare: fare.baseFare,
            distanceCharge: distance * fare.costPerKm,
            timeCharge: duration * fare.costPerMin,
            waitingCharge: waitingTime * fare.waitingChargePerMin,
            surgeMultiplier: surgeMultiplier.toFixed(2),
            nightFareMultiplier: isNight ? fare.nightFareMultiplier : 1,
            tollCharges: fare.tollCharges,
            serviceFee: fare.serviceFee,
            tax: taxAmount,
            totalFare: totalFare.toFixed(2),
        };
    } catch (error) {
        console.log(error)
        throw new Error(error.message);
    }
};

module.exports = { calculateFare };
