const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { generateShipmentReport, generateRevenueReport } = require('../controllers/reportController');

router.use(protect);
router.get('/shipments', authorize('admin', 'manager'), generateShipmentReport);
router.get('/revenue', authorize('admin'), generateRevenueReport);

module.exports = router;
