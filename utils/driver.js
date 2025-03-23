const Driver = require("../models/driver");
const TempBooking = require("../models/tempBooking");
const { activeRiders, activeDrivers, activeUsers, activeRequests } = require("./activeUsers");

// ✅ Register Driver
exports.registerDriver = (io, data, socket) => {
    try {
        const { driverId, isAvailable } = data;
        if (driverId && isAvailable) {
            activeDrivers.set(driverId, { socketId: socket?.id });
            console.log(`✅ Driver registered: ${driverId} (Socket: ${socket.id})`);
        }
    } catch (error) {
        console.error("❌ Error registering driver:", error);
        return
    }
};

// ✅ Unregister Driver
exports.unRegisterDriver = (io, data, socket) => {
    try {
        const { driverId } = data;
        if (driverId) {
            activeDrivers.delete(driverId);
            console.log(`🚫 Driver unregistered: ${driverId}`);
        }
    } catch (error) {
        console.error("❌ Error unregistering driver:", error);
        return
    }
};

// ✅ Update Driver Status & Location
exports.updateDriverLocation = async (io, data, socket) => {
    try {
        const { driverId, latitude, longitude } = data;

        // Validate input
        if (!driverId || latitude === undefined || longitude === undefined) {
            return socket.emit("error", { message: "Missing required fields" });
        }

        // Update in database
        const updatedDriver = await Driver.findByIdAndUpdate(
            driverId,
            {
                currentLocation: { type: "Point", coordinates: [longitude, latitude] },
                lastUpdated: Date.now(),
            },
            { new: true } // Return updated document
        );

        if (!updatedDriver) {
            return socket.emit("error", { message: "Driver not found" });
        }

        // Store in memory
        activeDrivers.set(driverId.toString(), { socketId: socket.id, latitude, longitude });

        const driverOnGoingRide = await TempBooking.findOne({ driverId, status: "accepted" });
        if (driverOnGoingRide) {
            exports.getDriverLocationForActiveRide(io, {
                rideId: driverOnGoingRide?._id.toString(),
                userId: driverOnGoingRide?.user.toString(),
                driverId,
                latitude,
                longitude
            });
        }

        // Broadcast updated location & availability to all clients
        io.emit("driverStatusUpdated", { driverId, latitude, longitude });

        console.log(`✅ Driver ${driverId} updated location: [${latitude}, ${longitude}]`);
    } catch (error) {
        console.error("❌ Error updating driver location:", error);
        socket.emit("error", { message: "Failed to update driver location" });
    }
};


// ✅ Get Nearby Drivers (For Riders)
exports.getNearbyDrivers = async (io, data, socket) => {
    try {
        const { latitude, longitude, radius = 10 } = data;
        if (!latitude || !longitude) {
            return socket.emit("error", { message: "Latitude and Longitude are required" });
        }

        // Fetch available drivers within radius
        const nearbyDrivers = await Driver.find({
            currentLocation: {
                $near: {
                    $geometry: { type: "Point", coordinates: [parseFloat(longitude), parseFloat(latitude)] },
                    $maxDistance: radius * 1000, // Convert km to meters
                },
            },
            isAvailableForRide: true,
            isOnRide: false,
        });

        socket.emit("nearbyDrivers", { drivers: nearbyDrivers });

        console.log(`✅ Sent ${nearbyDrivers.length} nearby drivers`);
    } catch (error) {
        console.error("❌ Error fetching nearby drivers:", error);
        socket.emit("error", { message: "Failed to fetch nearby drivers" });
    }
};

// ✅ Handle Driver arrival at pickup location
exports.handleDriverArrived = async (io, data) => {
    try {
        const { tempBookingId, driverId, userId } = data;

        if (!tempBookingId || !driverId || !userId) {
            console.error("❌ Missing data in handleDriverArrived:", data);
            return;
        }

        // 🔔 WebSocket Notification Data for User
        let notificationData = {
            type: "driverArrived",
            message: "Your driver has arrived at the pickup location.",
            tempBookingId,
            driverId,
        };

        // Send notification to the user when the driver arrives
        if (activeRiders.has(userId)) {
            const userSocketId = activeRiders.get(userId); // activeUsers stores socketId directly
            console.log(`🚗 Notifying user ${userId} that driver ${driverId} has arrived ${userSocketId}`);
            if (userSocketId) {
                io.of("/rides").to(userSocketId).emit("driverArrived", notificationData);
            } else {
                console.log(`❌ No valid socket ID for user ${userId}`);
            }
        }

        console.log(`✅ Driver ${driverId} has arrived for tempBooking ${tempBookingId}`);

    } catch (error) {
        console.error("❌ Error in handleDriverArrived:", error);
    }
};

// ✅ Get Driver Location for Active Ride
exports.getDriverLocationForActiveRide = async (io, data) => {
    try {
        const { userId, rideId, driverId, latitude, longitude } = data;

        // Validate input
        if (!rideId || !userId || !driverId || latitude === undefined || longitude === undefined) {
            console.error("❌ Missing required fields in getDriverLocationForActiveRide");
            return;
        }

        const userSocketId = activeRiders.get(userId);
        if (userSocketId) {
            console.log(`🚖 Notifying rider ${userSocketId} that driver ${driverId} updated location for ride: ${rideId}`);

            io.of("/rides").to(userSocketId).emit("getDriverLocationForActiveRide", {
                rideId,
                userId,
                driverId,
                latitude,
                longitude
            });
        } else {
            console.warn(`⚠️ No active user found for ride ${rideId}`);
        }

    } catch (error) {
        console.error("❌ Error sending driver location:", error);
    }
};

// ✅ Handle Driver Disconnect
exports.handleDriverDisconnect = (io, socket) => {
    try {
        console.log(`❌ Driver disconnected: ${socket.id}`);

        let disconnectedDriverId = null;
        for (let [driverId, driver] of activeDrivers) {
            if (driver.socketId === socket.id) {
                disconnectedDriverId = driverId;
                activeDrivers.delete(driverId);
                io.emit("driverDisconnected", { driverId });
                console.log(`🚫 Driver ${driverId} removed from active list`);
                break;
            }
        }
    } catch (error) {
        console.error("❌ Error handling driver disconnect:", error);
    }
};
