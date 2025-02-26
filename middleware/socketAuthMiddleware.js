const jwt = require("jsonwebtoken");
const Driver = require("../models/driver");
const User = require("../models/user");

const authenticateDriverSocket = async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;

        if (!token) {
            return next(new Error("Authentication failed: No token provided"));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const driver = await Driver.findById(decoded.id).select("_id name isAvailable");

        if (!driver) {
            return next(new Error("Authentication failed: Driver not found"));
        }

        // Attach driver ID to socket
        socket.driverId = driver._id.toString();
        socket.driver = driver; // Store driver info if needed later
        console.log(`🔑 Authenticated Driver: ${driver._id}`);

        next(); // Proceed with the connection
    } catch (error) {
        console.error("❌ Authentication error:", error.message);
        next(new Error("Authentication failed"));
    }
};


const authenticateRiderSocket = async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;

        if (!token) {
            return next(new Error("Authentication failed: No token provided"));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const rider = await User.findById(decoded.id).select("_id name");

        if (!rider) {
            return next(new Error("Authentication failed: Rider not found"));
        }

        // Attach rider ID to socket
        socket.riderId = rider._id.toString();
        socket.rider = rider; // Store rider info if needed later
        console.log(`🔑 Authenticated Rider: ${rider._id}`);

        next(); // Proceed with the connection
    } catch (error) {
        console.error("❌ Rider Authentication Error:", error.message);
        next(new Error("Authentication failed"));
    }
};


module.exports = { authenticateDriverSocket, authenticateRiderSocket };
