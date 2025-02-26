const asyncHandler = require("express-async-handler");
const TempBooking = require("../models/tempBooking");
const Booking = require("../models/booking");

// 🟢 Start the ride (Pickup)
exports.startRide = asyncHandler(async (req, res) => {
    try {
        const { id } = req.user
        const { tempBookingId, otp } = req.body;

        if (!tempBookingId || !otp) {
            return res.status(400).json({ message: "Missing tempBookingId or OTP", type: "error" });
        }

        const tempBooking = await TempBooking.findById(tempBookingId);

        if (!tempBooking || tempBooking.status !== "accepted") {
            return res.status(400).json({ message: "Ride can't be started", type: "error" });
        }

        // 🛑 Verify OTP before starting the ride
        if (tempBooking.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP", type: "error" });
        }

        if (tempBooking.driver.toString() !== id) {
            return res.status(403).json({ message: "UnAuthorize", type: "error" });
        }

        tempBooking.status = "started";
        tempBooking.pickupTime = new Date();
        await tempBooking.save();

        return res.status(200).json({
            message: "Ride started successfully",
            type: "success",
            tempBooking,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to start the ride",
            error: error.message,
            type: "error",
        });
    }
});

// 🟢 Complete the ride (Drop-off)
exports.completeRide = asyncHandler(async (req, res) => {
    try {
        const { id } = req.user
        const { tempBookingId } = req.body;

        if (!tempBookingId) {
            return res.status(400).json({ message: "Missing tempBookingId", type: "error" });
        }

        const tempBooking = await TempBooking.findById(tempBookingId);
        if (!tempBooking || tempBooking.status !== "started") {
            return res.status(400).json({ message: "Ride can't be completed", type: "error" });
        }

        if (tempBooking.driver.toString() !== id) {
            return res.status(403).json({ message: "UnAuthorize", type: "error" });
        }

        tempBooking.status = "completed";
        tempBooking.dropTime = new Date();
        await tempBooking.save();

        const booking = new Booking({
            ...tempBooking.toObject(),
            totalFare: tempBooking.fare,
            status: "completed",
        });

        await booking.save();
        await TempBooking.findByIdAndDelete(tempBookingId);

        return res.status(200).json({
            message: "Ride completed successfully",
            type: "success",
            booking,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to complete the ride",
            error: error.message,
            type: "error",
        });
    }
});

// 🛑 Cancel the ride
exports.cancelRide = asyncHandler(async (req, res) => {
    try {
        const { tempBookingId, cancelReason } = req.body;

        if (!tempBookingId || !cancelReason) {
            return res.status(400).json({ message: "Missing required parameters", type: "error" });
        }

        const tempBooking = await TempBooking.findById(tempBookingId);
        if (!tempBooking) {
            return res.status(400).json({ message: "Ride not found", type: "error" });
        }

        tempBooking.status = "canceled";
        tempBooking.cancelTime = new Date();
        tempBooking.cancelReason = cancelReason;
        await tempBooking.save();

        const booking = new Booking({
            ...tempBooking.toObject(),
            status: "canceled",
        });

        await booking.save();
        await TempBooking.findByIdAndDelete(tempBookingId);

        return res.status(200).json({
            message: "Ride canceled successfully",
            type: "success",
            booking,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to cancel the ride",
            error: error.message,
            type: "error",
        });
    }
});

exports.getUserTempBooking = async (req, res) => {
    try {
        const { id } = req.user; // Authenticated user ID

        // Find the latest temp booking for the user
        const tempBooking = await TempBooking.findOne({ user: id })
            .sort({ createdAt: -1 }) // Get the most recent booking
            .populate("driver", "name phoneNumber vehicleType") // Populate driver details
            .lean();

        if (!tempBooking) {
            return res.status(404).json({
                type: "error",
                message: "No active booking found",
            });
        }

        res.status(200).json({
            type: "success",
            message: "Temp booking details retrieved successfully",
            data: tempBooking,
        });

    } catch (error) {
        console.error("❌ Error fetching temp booking:", error);
        res.status(500).json({
            type: "error",
            message: "Error fetching temp booking",
            error: error.message,
        });
    }
};

exports.getDriverCurrentTempBooking = async (req, res) => {
    try {
        const { id } = req.user; // Authenticated driver ID

        // Find the latest temp booking assigned to the driver that is still active
        const tempBooking = await TempBooking.findOne({
            driver: id,
            status: { $nin: ["completed", "canceled"] } // Exclude completed and canceled bookings
        })
            .sort({ createdAt: -1 }) // Get the most recent active booking
            .populate("user", "name phoneNumber") // Populate user details
            .lean();

        if (!tempBooking) {
            return res.status(404).json({
                type: "error",
                message: "No active booking found",
            });
        }

        res.status(200).json({
            type: "success",
            message: "Driver's active temp booking retrieved successfully",
            data: tempBooking,
        });

    } catch (error) {
        console.error("❌ Error fetching driver's temp booking:", error);
        res.status(500).json({
            type: "error",
            message: "Error fetching temp booking",
            error: error.message,
        });
    }
};



