// activeUsers.js
const activeRiders = new Map();
const activeUsers = new Map(); // If needed for tracking ride requests
const activeRequests = new Map();
const activeDrivers = new Map(); // If you need to share drivers

module.exports = { activeRiders, activeUsers, activeRequests, activeDrivers };
