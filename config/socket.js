const driverSocket = require("../socket/driverSocket");
const rideSocket = require("../socket/rideSocket");
let socketIo; // Global variable to store io instance

function initializeSocket(io) {
    driverSocket(io);
    rideSocket(io);
    socketIo = io
}

function getSocket() {
    if (!socketIo) {
        throw new Error("Socket.io is not initialized. Call initializeSocket() first.");
    }
    return io = socketIo;
}

module.exports = { initializeSocket, getSocket };
