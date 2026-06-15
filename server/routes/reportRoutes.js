const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { reportLimiter } = require('../middleware/rateLimiter');
const { generateShipmentReport, generateRevenueReport } = require('../controllers/reportController');

router.use(protect);
router.get('/shipments', authorize('admin', 'manager'), reportLimiter, generateShipmentReport);
router.get('/revenue',   authorize('admin'),             reportLimiter, generateRevenueReport);

module.exports = router;
