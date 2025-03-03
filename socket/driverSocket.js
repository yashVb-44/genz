const Driver = require("../models/driver");
const { activeDrivers } = require("../utils/activeUsers");
const jwt = require("jsonwebtoken");
const { registerDriver, unRegisterDriver, updateDriverLocation } = require("../utils/driver");
const { authenticateDriverSocket } = require("../middleware/socketAuthMiddleware");


module.exports = function driverSocket(io) {
    const driverNamespace = io.of("/drivers");

    // ✅ Middleware to authenticate driver before connection
    driverNamespace.use(authenticateDriverSocket);
    driverNamespace.on("connection", (socket) => {
        console.log(`🚗 Driver connected: ${socket.id}`);

        // ✅ Store the driver's socket connection
        socket.on("registerDriver", (data) => {
            try {
                const { driverId } = data;
                if (driverId) {
                    activeDrivers.set(driverId, { socketId: socket?.id });
                    console.log(`✅ Driver ${driverId} registered with socket ${socket.id}`);
                }
            } catch (error) {
                console.log("❌ Error in registerDriver:", error);
            }
        });

        // ✅ remove the driver's socket connection
        socket.on("unRegisterDriver", async (data) => {
            try {
                await unRegisterDriver(io, data, socket);
            } catch (error) {

            }
        });


        // ✅ Handle location & availability updates
        socket.on("updateDriverLocation", async (data) => {
            try {
                await updateDriverLocation(io, data, socket);
            } catch (error) {
                console.error("❌ Error handling updateDriverLocation event:", error);
                socket.emit("error", { message: "Internal server error" });
            }
        });

        // ✅ Get Nearby Drivers (For Riders)
        socket.on("getNearbyDrivers", async (data) => {

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
                });

                socket.emit("nearbyDrivers", { drivers: nearbyDrivers });

                console.log(`✅ Sent ${nearbyDrivers.length} nearby drivers`);
            } catch (error) {
                console.error("❌ Error fetching nearby drivers:", error);
                socket.emit("error", { message: "Failed to fetch nearby drivers" });
            }
        });

        // ✅ Handle Driver Disconnect
        socket.on("disconnect", () => {
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
        });
    });
};
