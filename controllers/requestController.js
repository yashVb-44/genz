const asyncHandler = require("express-async-handler");
const Request = require("../models/request");
const TempBooking = require("../models/tempBooking");
const Driver = require("../models/driver"); // Assuming you have a Driver model
const { getSocket } = require("../config/socket");
const { handleNewRideRequest, handleAcceptRide, handleRejectRide } = require("../utils/rider");
const haversine = require("haversine-distance");

// 🟢 Create a new ride request
exports.createRideRequest = asyncHandler(async (req, res) => {
    try {
        const { id } = req.user;
        const { pickupLocation, dropLocation, estimatedFare, vehicleType, paymentMethod } = req.body;

        if (!pickupLocation || !dropLocation || !estimatedFare || !vehicleType || !paymentMethod) {
            return res.status(400).json({ message: "Missing required parameters", type: "error" });
        }

        const request = new Request({ user: id, ...req.body });
        await request.save(); // ✅ Store request before emitting
        const io = req.app.get("io");

        // ✅ Call handleNewRideRequest AFTER saving the request
        await handleNewRideRequest(io, {
            userId: id,
            request,
            latitude: pickupLocation.latitude,
            longitude: pickupLocation.longitude,
        });

        return res.status(201).json({
            message: "Ride request created successfully",
            type: "success",
            request,
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to create ride request",
            error: error.message,
            type: "error",
        });
    }
});

// 🟢 Accept a ride request
exports.acceptRideRequest = asyncHandler(async (req, res) => {
    try {
        const { id: driverId } = req.user;
        const { requestId } = req.body;

        if (!requestId) {
            return res.status(400).json({ message: "Missing required parameters", type: "error" });
        }

        const request = await Request.findById(requestId);
        if (!request || request.status !== "pending") {
            return res.status(400).json({ message: "Request not available or already accepted", type: "error" });
        }

        request.status = "accepted";
        request.acceptTime = new Date();
        await request.save();

        const tempBooking = new TempBooking({
            ...request.toObject(),
            driver: driverId,
            fare: request.estimatedFare,
            otp: Math.floor(1000 + Math.random() * 9000),
        });

        await tempBooking.save();
        await Request.findByIdAndDelete(requestId); // ✅ Remove from requests after tempBooking is created

        const io = req.app.get("io");
        await handleAcceptRide(io, { driverId, rideId: requestId, tempBookingId: tempBooking._id });

        // // ✅ Notify user that the ride is accepted
        // const userSocket = io.sockets.adapter.rooms.get(request.user.toString());
        // if (userSocket) {
        //     io.to(userSocket).emit("rideAccepted", {
        //         driverId,
        //         rideId: requestId,
        //         driverDetails: await Driver.findById(driverId).select("name phone currentLocation vehicleDetails"),
        //         tempBookingId: tempBooking._id,
        //     });
        // }

        return res.status(201).json({
            message: "Request accepted successfully",
            type: "success",
            tempBooking,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to accept ride request",
            error: error.message,
            type: "error",
        });
    }
});

// 🟢 Reject a ride request
exports.rejectRideRequest = asyncHandler(async (req, res) => {
    try {
        const { id: driverId } = req.user;
        const { requestId } = req.body;

        if (!requestId) {
            return res.status(400).json({ message: "Missing required parameters", type: "error" });
        }

        const request = await Request.findById(requestId);
        if (!request || request.status !== "pending") {
            return res.status(400).json({ message: "Request not available or already processed", type: "error" });
        }
        const io = req.app.get("io");
        await handleRejectRide(io, { driverId, rideId: requestId });

        // ✅ Reset driver status to available after rejecting a ride
        await Driver.findByIdAndUpdate(driverId, { isAvailableForRide: true });

        return res.status(200).json({
            message: "Ride request rejected successfully",
            type: "success",
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to reject ride request",
            error: error.message,
            type: "error",
        });
    }
});

// Get All the aviailable ride requests for a driver
exports.getRideRequestsForDriver = async (req, res) => {
    try {
        const driverId = req.user.id; // Extract driver ID from authenticated request

        // Fetch driver details
        const driver = await Driver.findById(driverId).select("currentLocation isAvailableForRide");

        if (!driver) {
            return res.status(404).json({ success: false, message: "Driver not found" });
        }

        if (!driver.isAvailableForRide) {
            return res.status(400).json({ success: false, message: "Driver is not available for rides" });
        }

        // Extract driver's coordinates (longitude, latitude)
        const driverCoords = driver.currentLocation.coordinates; // [longitude, latitude]
        if (!driverCoords || driverCoords.length !== 2) {
            return res.status(400).json({ success: false, message: "Driver location is invalid" });
        }

        // Fetch all pending ride requests
        const rideRequests = await Request.find({ status: "pending" });

        // Filter requests within a 5KM radius of the driver
        const filteredRequests = rideRequests.filter((ride) => {
            if (!ride.pickupLocation || !ride.pickupLocation.latitude || !ride.pickupLocation.longitude) {
                return false; // Skip invalid requests
            }

            const pickupCoords = [ride.pickupLocation.longitude, ride.pickupLocation.latitude];

            // Calculate distance (in meters)
            const distance = haversine(
                { lat: driverCoords[1], lon: driverCoords[0] }, // Driver's location
                { lat: pickupCoords[1], lon: pickupCoords[0] }  // Ride's pickup location
            ) / 1000; // Convert to KM

            return distance <= 5; // Keep requests within 5KM
        });

        res.status(200).json({
            success: true,
            message: "Available ride requests retrieved",
            totalRequests: filteredRequests.length,
            rideRequests: filteredRequests,
        });
    } catch (error) {
        console.error("❌ Error in getRideRequestsForDriver:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
