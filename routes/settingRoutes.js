const express = require('express');
const {
    getSettings,
    updateSettings,
    deleteSettings
} = require('../controllers/settingController'); // Adjust the path to your settings controller
const { authenticateAndAuthorize } = require('../middleware/authMiddleware'); // Adjust the path to your auth middleware

const router = express.Router();

// Route to get settings (public access for app users)
router.get('/', getSettings); // No authentication required for this route

// Admin routes to manage settings
router.put('/update', authenticateAndAuthorize(['admin']), updateSettings);
router.delete('/', authenticateAndAuthorize(['admin']), deleteSettings);

module.exports = router;
