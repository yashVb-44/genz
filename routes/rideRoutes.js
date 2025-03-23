const express = require("express");
const { authenticateAndAuthorize } = require("../middleware/authMiddleware");
const { getEstimateFare } = require("../controllers/fareController");
const { acceptRideRequest, createRideRequest, rejectRideRequest, getRideRequestsForDriver, cancelRideRequest } = require("../controllers/requestController");
const { startRide, completeRide, cancelRide, driverArrived } = require("../controllers/tempBookingController");
const { handleGetDriverLocationForActiveRide } = require("../controllers/userController");

const router = express.Router();

// 🚗 Estimate Fare
router.get("/estimate-fare", getEstimateFare);

// 📌 Ride Requests
router.post("/request", authenticateAndAuthorize(["user"]), createRideRequest);
router.get("/requests", authenticateAndAuthorize(["driver"]), getRideRequestsForDriver);
router.post("/request/cancel", authenticateAndAuthorize(["user"]), cancelRideRequest);

// 🚖 Temporary Bookings
router.post("/accept", authenticateAndAuthorize(["driver"]), acceptRideRequest);
router.post("/reject", authenticateAndAuthorize(["driver"]), rejectRideRequest);
router.post("/driver/arrived", authenticateAndAuthorize(["driver"]), driverArrived);
// router.get("/temp-bookings", authenticateAndAuthorize(["driver", "admin"]), rideController.getTempBookings);
// router.delete("/temp-booking/:id", authenticateAndAuthorize(["driver"]), rideController.rejectRide);

// 🏁 Ride Lifecycle
router.post("/start", authenticateAndAuthorize(["driver"]), startRide);
router.post("/complete", authenticateAndAuthorize(["driver"]), completeRide);
router.post("/cancel", authenticateAndAuthorize(["user", "driver"]), cancelRide);

// 📜 Booking History
// router.get("/bookings", authenticateAndAuthorize(["user", "driver", "admin"]), rideController.getBookings);
// router.get("/booking/:id", authenticateAndAuthorize(["user", "driver", "admin"]), rideController.getBookingById);

// driver lat long
router.get("/driver/location/byUser", authenticateAndAuthorize(["user"]), handleGetDriverLocationForActiveRide);

module.exports = router;
