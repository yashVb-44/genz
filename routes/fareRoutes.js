const express = require('express');
const router = express.Router();
const { authenticateAndAuthorize } = require('../middleware/authMiddleware');
const { addNewFare, updateFare, getFare, getEstimateFare, getFaresForAdmin, deleteFare } = require('../controllers/fareController');


router.post('/add', authenticateAndAuthorize(['admin']), addNewFare);
router.put('/update/:id', authenticateAndAuthorize(['admin']), updateFare);
router.get('/estimate?', authenticateAndAuthorize(['user']), getEstimateFare);
router.get('/:id?', authenticateAndAuthorize(['admin', 'user', 'driver']), getFare);
router.get('/list/forAdmin', authenticateAndAuthorize(['admin']), getFaresForAdmin);
router.delete('/byAdmin/:id', authenticateAndAuthorize(['admin']), deleteFare);

module.exports = router;
