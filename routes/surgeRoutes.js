const express = require('express');
const router = express.Router();
const { authenticateAndAuthorize } = require('../middleware/authMiddleware');
const { UpdateSurgePricing } = require('../controllers/surgeController');


router.put('/update', authenticateAndAuthorize(['admin']), UpdateSurgePricing);

module.exports = router;
