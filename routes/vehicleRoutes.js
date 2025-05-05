const express = require('express');
const router = express.Router();
const { authenticateAndAuthorize } = require('../middleware/authMiddleware');
const { uploadVehicleDocuments, getVehicle, updateVehicle } = require('../controllers/vehicleController');

router.post('/upload', authenticateAndAuthorize(['admin', 'driver']), uploadVehicleDocuments);
router.get('/details/:id?', authenticateAndAuthorize(['admin', 'driver']), getVehicle);
router.put('/update/:id', authenticateAndAuthorize(['admin', 'driver']), updateVehicle);

module.exports = router;