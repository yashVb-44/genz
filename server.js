const http = require('http');
const app = require('./app'); // Import the app
const connectDB = require('./config/db');
const { Server } = require('socket.io');
require('./config/env');
const { initializeSocket } = require('./config/socket');
const startCleanupJob = require("./cron/cronJobs");

connectDB();

const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for now, adjust this in production
        methods: ["GET", "POST", "PUT", "PATCH"],
    }
});

// Make io accessible in other files
app.set('io', io);
startCleanupJob(io);

initializeSocket(io);

const axios = require("axios");

const getETA = async (pickup, destination) => {
    const apiKey = "5b3ce3597851110001cf6248aeb42620b04140688354af79df3cf9ac"; // Replace with your actual API key

    // Corrected URL with latitude first
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${pickup.longitude},${pickup.latitude}&end=${destination.longitude},${destination.latitude}`;

    try {
        const response = await axios.get(url);
        
        if (!response.data.routes) {
            console.error("No routes found.");
            return null;
        }

        const durationInSeconds = response.data.routes[0].summary.duration; // Time in seconds
        const etaMinutes = Math.ceil(durationInSeconds / 60); // Convert to minutes
        console.log(`ETA: ${etaMinutes} mins`);
        return etaMinutes;
    } catch (error) {
        console.error("Error fetching ETA:", error?.response?.data || error.message);
        return null;
    }
};

// Example Test
const pickup = { latitude: 12.9716, longitude: 77.5946 }; // Example: Bangalore
const destination = { latitude: 12.9352, longitude: 77.6245 }; // Example: Koramangala

getETA(pickup, destination);



const PORT = process.env.PORT || 8080;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
