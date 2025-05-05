const express = require("express");
const router = express.Router();
const { authenticateAndAuthorize } = require("../middleware/authMiddleware");
const { getBookingDetails, getBookingsForAdmin } = require("../controllers/bookingController");

router.get("/details/:id", authenticateAndAuthorize(['user', 'driver', 'admin']), getBookingDetails);
router.get("/list/forAdmin", authenticateAndAuthorize(['admin']), getBookingsForAdmin);

module.exports = router;