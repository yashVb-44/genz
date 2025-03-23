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
                    $maxDistance: 5000000, // 5 km in meters
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
            console.log(`🚖 Notifying rider ${userSocket} that driver ${driverId} accepted ride ${rideId}`);
            io.of("/rides").to(userSocket).emit("rideAccepted", { driverId, rideId, tempBookingId });
        }

        // Notify other drivers to remove the ride request
        if (activeRequests.has(rideId)) {
            activeRequests.get(rideId).forEach((otherDriverId) => {
                if (otherDriverId !== driverId) {
                    const driverData = activeDrivers.get(otherDriverId); // Get the object
                    if (driverData && driverData.socketId) {
                        console.log(`🚫 Emitting to socket ID: ${driverData.socketId}`);
                        io.of("/drivers").to(driverData.socketId).emit("removeRideRequest", { rideId });
                    } else {
                        console.log(`🚫 No valid socket ID for driver ${otherDriverId}`);
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
        const driverData = activeDrivers.get(driverId); // Get the object
        if (driverData && driverData.socketId) {
            console.log(`🚫 Emitting to socket ID: ${driverData.socketId}`);
            io.of("/drivers").to(driverData.socketId).emit("removeRideRequest", { rideId });
        } else {
            console.log(`🚫 No valid socket ID for driver ${otherDriverId}`);
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
                const driverData = activeDrivers.get(driverId); // Get the object
                if (driverData && driverData.socketId) {
                    console.log(`🚫 Emitting to socket ID: ${driverData.socketId}`);
                    io.of("/drivers").to(driverData.socketId).emit("removeRideRequest", { rideId });
                } else {
                    console.log(`🚫 No valid socket ID for driver ${otherDriverId}`);
                }
            });

            activeRequests.delete(rideId);
        }
    });

    // Remove expired requests from the database
    await Request.deleteMany({ expiryTime: { $lt: now } });
};

exports.handleCancelRideRequest = async (io, data) => {
    try {
        const { rideId } = data;
        // Notify other drivers to remove the ride request
        if (activeRequests.has(rideId)) {
            activeRequests.get(rideId).forEach((otherDriverId) => {
                if (otherDriverId) {
                    const driverData = activeDrivers.get(otherDriverId); // Get the object
                    if (driverData && driverData.socketId) {
                        console.log(`🚫 Emitting to socket ID: ${driverData.socketId}`);
                        io.of("/drivers").to(driverData.socketId).emit("removeRideRequest", { rideId });
                    } else {
                        console.log(`🚫 No valid socket ID for driver ${otherDriverId}`);
                    }
                }
            });

            // Remove request from tracking after cancle by user
            activeRequests.delete(rideId);
        }
        console.log(`✅ Ride request ${rideId} canceled by user`);
    } catch (error) {
        console.error("❌ Error in handleCancelRideRequest:", error);
        return;
    }
};

exports.handleCancelRide = async (io, data) => {
    try {
        const { bookingId, driverId, userId, canceledBy, reason, cancelTime } = data;

        if (!bookingId || !canceledBy) {
            console.error("❌ Missing data in handleCancelRide:", data);
            return;
        }

        // ✅ Mark driver as available if driverId exists
        if (driverId) {
            await Driver.findByIdAndUpdate(driverId, { isAvailableForRide: true, isOnRide: false });
        }

        // 🔔 WebSocket Notification Data
        let notificationData = {
            type: "rideCanceled",
            message: `Ride has been canceled by the ${canceledBy}`,
            bookingId,
            canceledBy,
            reason: reason || "",
            cancelTime,
        };

        // Send to driver if user cancels
        if (driverId && activeDrivers.has(driverId) && canceledBy === "user") {
            const driverData = activeDrivers.get(driverId); // Get the driver data object
            if (driverData && driverData.socketId) {
                io.of("/drivers").to(driverData.socketId).emit("rideCanceled", notificationData);
            } else {
                console.log(`❌ No valid socket ID for driver ${driverId}`);
            }
        }

        // Send to user if driver cancels
        if (userId && activeRiders.has(userId) && canceledBy === "driver") {
            const userSocketId = activeRiders.get(userId); // Assuming activeRiders stores socketId directly
            if (userSocketId) {
                io.of("/rides").to(userSocketId).emit("rideCanceled", notificationData);
            } else {
                console.log(`❌ No valid socket ID for user ${userId}`);
            }
        }

        console.log(`✅ Ride ${bookingId} canceled by ${canceledBy}`);

    } catch (error) {
        console.error("❌ Error in handleCancelRide:", error);
        return;
    }
};

exports.handleStartRide = async (io, data) => {
    try {
        const { tempBookingId, driverId, userId } = data;

        if (!tempBookingId || !driverId || !userId) {
            console.error("❌ Missing data in handleStartRide:", data);
            return;
        }

        // 🔔 WebSocket Notification Data for User
        let notificationData = {
            type: "rideStarted",
            message: "Your ride has started.",
            tempBookingId,
            driverId,
        };

        // Send notification to the user when the ride starts
        if (activeRiders.has(userId)) {
            const userSocketId = activeRiders.get(userId);
            if (userSocketId) {
                io.of("/rides").to(userSocketId).emit("rideStarted", notificationData);
            } else {
                console.log(`❌ No valid socket ID for user ${userId}`);
            }
        }

        console.log(`✅ Ride started for booking ${tempBookingId} by driver ${driverId}`);

    } catch (error) {
        console.error("❌ Error in handleStartRide:", error);
    }
};

exports.handleCompleteRide = async (io, data) => {
    try {
        const { bookingId, driverId, userId, fare } = data;

        if (!bookingId || !driverId || !userId || !fare) {
            console.error("❌ Missing data in handleCompleteRide:", data);
            return;
        }

        // 🔔 WebSocket Notification Data for User
        let notificationData = {
            type: "rideCompleted",
            message: `Your ride has been completed. Total fare: ₹${fare}.`,
            bookingId,
            driverId,
            totalFare: fare,
        };

        // Send notification to the user when the ride is completed
        if (activeRiders.has(userId)) {
            const userSocketId = activeRiders.get(userId);
            if (userSocketId) {
                io.of("/rides").to(userSocketId).emit("rideCompleted", notificationData);
            } else {
                console.log(`❌ No valid socket ID for user ${userId}`);
            }
        }

        console.log(`✅ Ride completed for booking ${bookingId} by driver ${driverId}. Fare: ₹${fare}`);

    } catch (error) {
        console.error("❌ Error in handleCompleteRide:", error);
    }
};