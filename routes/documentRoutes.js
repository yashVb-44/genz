const express = require('express');
const router = express.Router();
const { authenticateAndAuthorize } = require('../middleware/authMiddleware');
const { uploadDocuments, getDocuments, updateDocuments } = require('../controllers/documentsController');

router.post('/add', authenticateAndAuthorize(['admin', 'driver']), uploadDocuments);
router.get('/:id?', authenticateAndAuthorize(['admin', 'driver']), getDocuments);
router.put('/update/:id', authenticateAndAuthorize(['admin', 'driver']), updateDocuments);

module.exports = router;