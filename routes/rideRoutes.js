const express = require("express");
const { authenticateAndAuthorize } = require("../middleware/authMiddleware");
const { getEstimateFare } = require("../controllers/fareController");
const { acceptRideRequest, createRideRequest, rejectRideRequest, getRideRequestsForDriver } = require("../controllers/requestController");
const { startRide, completeRide, cancelRide, getUserTempBooking } = require("../controllers/tempBookingController");

const router = express.Router();

// 🚗 Estimate Fare
router.get("/estimate-fare", getEstimateFare);

// 📌 Ride Requests
router.post("/request", authenticateAndAuthorize(["user"]), createRideRequest);
router.get("/requests", authenticateAndAuthorize(["driver"]), getRideRequestsForDriver);
router.delete("/request/:id", authenticateAndAuthorize(["user"]), acceptRideRequest);

// 🚖 Temporary Bookings
router.post("/accept", authenticateAndAuthorize(["driver"]), acceptRideRequest);
router.post("/reject", authenticateAndAuthorize(["driver"]), rejectRideRequest);
// router.get("/temp-bookings", authenticateAndAuthorize(["driver", "admin"]), rideController.getTempBookings);
// router.delete("/temp-booking/:id", authenticateAndAuthorize(["driver"]), rideController.rejectRide);

// 🏁 Ride Lifecycle
router.post("/start", authenticateAndAuthorize(["driver"]), startRide);
router.post("/completes", authenticateAndAuthorize(["driver"]), completeRide);
// router.post("/cancel-ride", authenticateAndAuthorize(["user", "driver"]), rideController.cancelRide);

// 📜 Booking History
// router.get("/bookings", authenticateAndAuthorize(["user", "driver", "admin"]), rideController.getBookings);
// router.get("/booking/:id", authenticateAndAuthorize(["user", "driver", "admin"]), rideController.getBookingById);

module.exports = router;
