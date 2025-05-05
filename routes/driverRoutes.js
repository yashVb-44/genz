// routes/driverRoutes.js
const express = require('express');
const { register, verifyOtp, sendOtp } = require('../controllers/authController');
const { getDriverProfile, updateDriverProfile, driverDetails, updateDriverStatus, getDriversForAdmin, deleteDriverByAdmin, singleDriverDetailsForAdmin } = require('../controllers/driverController');
const { authenticateAndAuthorize } = require('../middleware/authMiddleware');
const { getDriverBookings } = require('../controllers/bookingController');
const router = express.Router();

router.post('/register', register);
router.post('/verifyOtp', verifyOtp);
router.post('/sendOtp', sendOtp);
router.get('/profile/:id?', authenticateAndAuthorize(['driver', 'admin']), getDriverProfile);
router.put('/profile/:id?', authenticateAndAuthorize(['driver', 'admin']), updateDriverProfile);
router.put('/status/update', authenticateAndAuthorize(['driver']), updateDriverStatus);
router.post('/details/:id?', authenticateAndAuthorize(['user']), driverDetails);
router.get('/ride/bookings', authenticateAndAuthorize(['driver']), getDriverBookings);
router.get('/list/forAdmin', authenticateAndAuthorize(['admin']), getDriversForAdmin);
router.delete('/byAdmin/:id', authenticateAndAuthorize(['admin']), deleteDriverByAdmin);
router.post(
    "/forAdmin/driver/details",
    authenticateAndAuthorize(["admin"]),
    singleDriverDetailsForAdmin
);

module.exports = router;
