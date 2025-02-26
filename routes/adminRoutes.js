const express = require('express');
const router = express.Router();
const { registerAdmin, loginAdmin, getAdminProfile } = require('../controllers/adminController');
const { authenticateAndAuthorize } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', registerAdmin); // Route to register admin
router.post('/login', loginAdmin); // Route to login admin

// Protected route
router.get('/profile', authenticateAndAuthorize(['admin']), getAdminProfile); // Route to get admin profile

module.exports = router;
