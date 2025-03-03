const { authenticateRiderSocket } = require("../middleware/socketAuthMiddleware");
const { activeRiders, activeDrivers } = require("../utils/activeUsers");
const { handleNewRideRequest, handleAcceptRide } = require("../utils/rider");

module.exports = function rideSocket(io) {
    const rideNamespace = io.of("/rides");
    rideNamespace.use(authenticateRiderSocket);
    rideNamespace.on("connection", (socket) => {
        console.log(`🛺 Rider connected: ${socket.id}`);

        // ✅ Store the rider's socket connection
        socket.on("registerRider", (data) => {
            try {
                const { userId } = data;
                if (userId) {
                    activeRiders.set(userId, socket.id);
                    console.log(`✅ Rider registered: ${userId} (Socket: ${socket.id})`);
                }
            } catch (error) {   
                console.log("❌ Error in registerRider:", error); 
            }
        });

        // ✅ Handle New Ride Request
        socket.on("newRideRequest", async (data) => {
            try {
                await handleNewRideRequest(io, data, socket);
            } catch (error) {
                console.error("❌ Error in newRideRequest:", error);
                socket.emit("error", { message: "Failed to request ride" });
            }
        });

        // ✅ Handle Ride Acceptance
        socket.on("acceptRide", async (data) => {
            try {
                await handleAcceptRide(io, data, socket);
            } catch (error) {
                console.error("❌ Error in acceptRide:", error);
                socket.emit("error", { message: "Failed to accept ride" });
            }
        });

        // ✅ Handle Driver Disconnect Event from `driverSocket.js`
        socket.on("driverDisconnected", (data) => {
            try {
                const { driverId } = data;
                if (driverId) {
                    activeDrivers.delete(driverId);
                    console.log(`🛑 Driver ${driverId} removed from active drivers`);
                }
            } catch (error) {
                console.error("❌ Error in driverDisconnected:", error);
            }
        });

        // ✅ Handle Rider Disconnect
        socket.on("disconnect", () => {
            // Remove disconnected rider from activeRiders
            for (let [userId, socketId] of activeRiders.entries()) {
                if (socketId === socket.id) {
                    activeRiders.delete(userId);
                    console.log(`❌ Rider disconnected: ${userId} (Socket: ${socket.id})`);
                    break;
                }
            }
        });
    });
};