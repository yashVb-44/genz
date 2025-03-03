const express = require('express');
const { getHomeStatus } = require('../controllers/homePageController');
const { authenticateAndAuthorize } = require('../middleware/authMiddleware');
const router = express.Router();


router.get("/active/ride/status", authenticateAndAuthorize(["user", "driver"]), getHomeStatus);


module.exports = router;