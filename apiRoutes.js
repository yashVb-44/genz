// apiRoutes.js
const express = require('express');
const app = express();
const router = express.Router();

const userRoutes = require('./routes/userRoutes');
const driverRoutes = require('./routes/driverRoutes');
const fareRoutes = require('./routes/fareRoutes');
const surgeRoutes = require('./routes/surgeRoutes');
const rideRoutes = require('./routes/rideRoutes');
const tempBookingRoutes = require('./routes/tempBookingRoutes');
// const walletRoutes = require('./routes/walletRoutes');
const adminRoutes = require('./routes/adminRoutes');
// // const walletRoutes = require('./routes/coin');
// const settingRoutes = require('./routes/settingRoutes');
// const biddingSessionRoutes = require('./routes/biddingSessionRoutes');
// const bidRoutes = require('./routes/bidRoutes');
// const coinRoutes = require('./routes/coinRoutes');

router.use("/user", userRoutes)
router.use("/admin", adminRoutes)
router.use("/driver", driverRoutes)
router.use("/fare", fareRoutes)
router.use("/surge", surgeRoutes)
router.use("/ride", rideRoutes)
router.use("/temp", tempBookingRoutes)
// router.use("/wallet", walletRoutes)
// router.use("/settings", settingRoutes)
// router.use("/bidding/session", biddingSessionRoutes)
// router.use("/bid", bidRoutes)
// router.use("/coin", coinRoutes)

module.exports = router;
