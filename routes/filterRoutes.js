const express = require('express');
const router = express.Router();
const { authenticateAndAuthorize } = require('../middleware/authMiddleware');
const { getAllUsersListForFilter } = require('../controllers/userController');
const { getAllDriversListForFilter } = require('../controllers/driverController');

router.get('/user/list', authenticateAndAuthorize(['admin']), getAllUsersListForFilter);
router.get('/driver/list', authenticateAndAuthorize(['admin']), getAllDriversListForFilter);

module.exports = router;