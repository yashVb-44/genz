const express = require('express');
const { getHomeStatus, getAdminDashboardStats } = require('../controllers/homePageController');
const { authenticateAndAuthorize } = require('../middleware/authMiddleware');
const router = express.Router();


router.get("/active/ride/status", authenticateAndAuthorize(["user", "driver"]), getHomeStatus);
router.get('/dashboard/stats', authenticateAndAuthorize(['admin']), getAdminDashboardStats);


module.exports = router;