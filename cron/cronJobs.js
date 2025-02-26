const cron = require("node-cron");
const { cleanExpiredRequests } = require("../utils/rider");


const startCleanupJob = (io) => {
    cron.schedule("* * * * *", () => { // Runs every minute
        console.log("⏳ Running cleanup job...");
        cleanExpiredRequests(io);
    });
};

module.exports = startCleanupJob;
