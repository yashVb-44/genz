// routes/driverRoutes.js
const express = require('express');
const { register, verifyOtp, sendOtp } = require('../controllers/authController');
const { getDriverProfile, updateDriverProfile, driverDetails, updateDriverStatus } = require('../controllers/driverController');
const { authenticateAndAuthorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/register', register);
router.post('/verifyOtp', verifyOtp);
router.post('/sendOtp', sendOtp);
router.get('/profile/:id?', authenticateAndAuthorize(['driver', 'admin']), getDriverProfile);
router.put('/profile/:id?', authenticateAndAuthorize(['driver', 'admin']), updateDriverProfile);
router.put('/status/update', authenticateAndAuthorize(['driver']), updateDriverStatus);
router.post('/details/:id?', authenticateAndAuthorize(['user']), driverDetails);

module.exports = router;
