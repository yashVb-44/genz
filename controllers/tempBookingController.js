const asyncHandler = require("express-async-handler");
const TempBooking = require("../models/tempBooking");
const Booking = require("../models/booking");
const { handleCancelRide } = require("../utils/rider");

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
exports.cancelRide = async (req, res) => {
    try {
        const { id, role } = req.user;
        const { tempBookingId, reason } = req.body;

        if (!tempBookingId) {
            return res.status(400).json({
                type: "error",
                message: "Temp-Booking ID is required."
            });
        }

        // Find the ride and populate user & driver
        let tempBooking = await TempBooking.findById(tempBookingId).populate("user driver");
        if (!tempBooking) {
            return res.status(404).json({
                type: "error",
                message: "Temp-Booking not found."
            });
        }

        // 🚫 Prevent duplicate cancellation
        if (tempBooking.status === "canceled") {
            return res.status(400).json({
                type: "error",
                message: "This ride has already been canceled."
            });
        }

        // 🚫 Ensure user/driver exists before checking authorization
        if (role === "user" && (!tempBooking.user || tempBooking.user._id.toString() !== id)) {
            return res.status(403).json({
                type: "error",
                message: "You are not authorized to cancel this booking."
            });
        }

        if (role === "driver" && (!tempBooking.driver || tempBooking.driver._id.toString() !== id)) {
            return res.status(403).json({
                type: "error",
                message: "You are not authorized to cancel this booking."
            });
        }

        // ❌ Restriction: Cannot cancel after ride has started
        if (tempBooking.status === "started") {
            return res.status(400).json({
                type: "error",
                message: "Ride cannot be canceled after pickup."
            });
        }

        if (tempBooking.status === "completed") {
            return res.status(400).json({
                type: "error",
                message: "Ride is already completed and cannot be canceled."
            });
        }

        // ✅ Update status to canceled and log cancel details
        tempBooking.status = "canceled";
        tempBooking.cancelReason = reason || "";
        tempBooking.cancelTime = new Date();
        tempBooking.canceledBy = role;
        await tempBooking.save();

        // ✅ Store booking details with correct status
        const booking = new Booking({
            ...tempBooking.toObject(),
            totalFare: tempBooking.fare,
            status: "canceled",
        });

        await booking.save();

        // ✅ Delete the temp booking
        await tempBooking.deleteOne();

        // 🔔 WebSocket Notification Setup
        const io = req.app.get("io");
        await handleCancelRide(io, {
            bookingId: booking._id.toString(), // ✅ Use booking._id instead of tempBooking._id
            driverId: booking.driver ? booking.driver._id.toString() : null,
            userId: booking.user ? booking.user._id.toString() : null,
            canceledBy: role,
            reason: booking?.cancelReason, // ✅ Use booking.cancelReason
            cancelTime: booking?.cancelTime  // ✅ Use booking.cancelTime
        });

        res.status(200).json({
            type: "success",
            message: "Ride canceled successfully.",
            bookingId: booking._id,
            canceledBy: role,
            cancelTime: tempBooking.cancelTime
        });

    } catch (error) {
        console.error("❌ Error canceling ride:", error);
        res.status(500).json({
            type: "error",
            message: "Error canceling ride.",
            error: error.message
        });
    }
};

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



