const Driver = require("../models/driver");
const Request = require("../models/request");
const { activeRiders, activeDrivers, activeUsers, activeRequests } = require("./activeUsers");

exports.handleNewRideRequest = async (io, data, socket) => {
    try {
        const { userId, latitude, longitude, request } = data;

        if (!userId || latitude === undefined || longitude === undefined || !request) {
            return
        }
        const rideId = request._id.toString();
        const userSocketId = activeRiders.get(userId);

        if (!userSocketId) {
            console.error("Error: User socket ID not found in activeRiders");
            return
        }
        console.log(`🚗 New ride request from user ${userId} at (${latitude}, ${longitude})`);
        // Store the user's socket ID
        activeUsers.set(rideId, userSocketId);

        // Fetch nearby available drivers (within 5 km)
        const nearbyDrivers = await Driver.find({
            currentLocation: {
                $near: {
                    $geometry: { type: "Point", coordinates: [longitude, latitude] },
                    $maxDistance: 5000, // 5 km in meters
                },
            },
            isOnline: true,
            // isAvailableForRide: true,
            // isOnRide: false,
        });

        console.log(`📢 Notifying ${nearbyDrivers.length} nearby drivers for ride ${rideId}`);

        // Track drivers who receive the request
        activeRequests.set(rideId, new Set());

        // Notify each driver   
        nearbyDrivers.forEach((driver) => {
            const driverSocket = activeDrivers.get(driver._id.toString());
            if (driverSocket) {
                console.log(`🚕 Sending ride request to driver ${driver._id} socket id ${driverSocket.socketId}`);

                io.of("/drivers").to(driverSocket.socketId).emit("getNewRideRequest", {
                    userId,
                    latitude,
                    longitude,
                    requestData: request,
                });

                activeRequests.get(rideId).add(driver._id.toString());
            }
        });

    } catch (error) {
        console.error("❌ Error in handleNewRideRequest:", error);
        socket.emit("error", { message: "Failed to request ride" });
    }
};

exports.handleAcceptRide = async (io, data, socket) => {
    try {
        const { driverId, rideId, tempBookingId } = data;
        if (!driverId || !rideId || !tempBookingId) {
            return
        }

        // Mark driver as occupied
        await Driver.findByIdAndUpdate(driverId, { isAvailableForRide: false, isOnRide: true });

        // Get user socket ID using rideId
        const userSocket = activeUsers.get(rideId);
        console.log(`🚖 Driver ${driverId} accepted ride ${rideId}, notifying rider: ${userSocket}`);

        if (userSocket) {
            io.of("/rides").to(userSocket).emit("rideAccepted", { driverId, rideId, tempBookingId });
        }

        // Notify other drivers to remove the ride request
        if (activeRequests.has(rideId)) {
            activeRequests.get(rideId).forEach((otherDriverId) => {
                if (otherDriverId !== driverId) {
                    const driverSocket = activeDrivers.get(otherDriverId);
                    if (driverSocket) {
                        io.of("/drivers").to(driverSocket).emit("removeRideRequest", { rideId });
                    }
                }
            });

            // Remove request from tracking after acceptance
            activeRequests.delete(rideId);
        }

        console.log(`✅ Ride ${rideId} accepted by driver ${driverId}`);

    } catch (error) {
        console.error("❌ Error in handleAcceptRide:", error);
        return
    }
};

exports.handleRejectRide = async (io, data, socket) => {
    try {
        const { driverId, rideId } = data;
        if (!driverId || !rideId) {
            return socket.emit("error", { message: "Missing required fields" });
        }

        // Remove this driver from the active requests map
        if (activeRequests.has(rideId)) {
            activeRequests.get(rideId).delete(driverId);

            // If no more drivers are assigned to this ride, remove the ride request
            if (activeRequests.get(rideId).size === 0) {
                activeRequests.delete(rideId);
            }
        }

        // Notify the rejecting driver
        const driverSocket = activeDrivers.get(driverId);
        if (driverSocket) {
            io.of("/drivers").to(driverSocket).emit("removeRideRequest", { rideId });
        }

        console.log(`❌ Driver ${driverId} rejected ride ${rideId}`);

    } catch (error) {
        console.error("❌ Error in handleRejectRide:", error);
        return
    }
};

exports.cleanExpiredRequests = async (io) => {
    const now = new Date();
    // Fetch expired requests from the database
    const expiredRequests = await Request.find({ expiryTime: { $lt: now } });

    expiredRequests.forEach((request) => {
        const rideId = request._id.toString();

        // Remove expired request from activeRequests
        if (activeRequests.has(rideId)) {
            activeRequests.delete(rideId);
        }

        // Notify drivers that the request expired
        if (activeRequests.has(rideId)) {
            activeRequests.get(rideId).forEach((driverId) => {
                const driverSocket = activeDrivers.get(driverId);
                if (driverSocket) {
                    io.of("/drivers").to(driverSocket).emit("removeRideRequest", { rideId });
                }
            });

            activeRequests.delete(rideId);
        }
    });

    // Remove expired requests from the database
    await Request.deleteMany({ expiryTime: { $lt: now } });
};

