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


const PORT = process.env.PORT || 8080;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
