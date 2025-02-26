const express = require("express");
const router = express.Router();
const { authenticateAndAuthorize } = require("../middleware/authMiddleware");
const { getUserTempBooking, getDriverCurrentTempBooking } = require("../controllers/tempBookingController");

router.get("/booking/user", authenticateAndAuthorize(["user"]), getUserTempBooking);
router.get("/booking/driver", authenticateAndAuthorize(["driver"]), getDriverCurrentTempBooking);

module.exports = router;