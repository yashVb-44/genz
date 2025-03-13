// routes/userRoutes.js
const express = require('express');
const { register, verifyOtp, sendOtp } = require('../controllers/authController');
const { updateUserProfile, getUserProfile, getUserListWithMobileNo, addUserByDriver, getUsersForAdmin, deleteUser, deActiveUserAccount, deleteUserAccount } = require('../controllers/userController');
const { authenticateAndAuthorize } = require('../middleware/authMiddleware');
const { getUserBookings } = require('../controllers/bookingController');
const router = express.Router();

router.post('/register', register);
router.post('/verifyOtp', verifyOtp);
router.post('/sendOtp', sendOtp);
router.post('/add/byDriver', addUserByDriver);
router.get('/profile/:id?', authenticateAndAuthorize(['user', 'admin']), getUserProfile);
router.get('/list/byMobileNo', authenticateAndAuthorize(['driver', 'admin']), getUserListWithMobileNo);
router.get('/list/forAdmin', authenticateAndAuthorize(['admin']), getUsersForAdmin);
router.put('/profile/:id?', authenticateAndAuthorize(['user', 'admin']), updateUserProfile);
router.get('/details/:id', authenticateAndAuthorize(['user', 'admin']), getUserProfile);
router.delete('/byAdmin/:id', authenticateAndAuthorize(['admin']), deleteUser);
router.post('/account/deActivate', authenticateAndAuthorize(['user']), deActiveUserAccount);
router.delete('/account/delete', authenticateAndAuthorize(['user']), deleteUserAccount);
router.get('/ride/bookings', authenticateAndAuthorize(['user']), getUserBookings);
module.exports = router;
