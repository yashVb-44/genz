const asyncHandler = require("express-async-handler");
const Booking = require("../models/booking");

// 🟢 Get all past bookings for a user
exports.getUserBookings = asyncHandler(async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ message: "Missing userId", type: "error" });
        }

        const bookings = await Booking.find({ user: userId }).sort({ createdAt: -1 });

        return res.status(200).json({
            message: "User bookings fetched successfully",
            type: "success",
            bookings,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch user bookings",
            error: error.message,
            type: "error",
        });
    }
});

// 🟢 Get all past rides for a driver
exports.getDriverBookings = asyncHandler(async (req, res) => {
    try {
        const { driverId } = req.params;

        if (!driverId) {
            return res.status(400).json({ message: "Missing driverId", type: "error" });
        }

        const bookings = await Booking.find({ driver: driverId }).sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Driver bookings fetched successfully",
            type: "success",
            bookings,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch driver bookings",
            error: error.message,
            type: "error",
        });
    }
});
