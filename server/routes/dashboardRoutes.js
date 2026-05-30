const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getDashboardStats, getAuditLogs, getInvoices } = require('../controllers/dashboardController');

router.use(protect);
router.get('/stats', getDashboardStats);
router.get('/audit-logs', authorize('admin'), getAuditLogs);
router.get('/invoices', authorize('admin', 'manager'), getInvoices);

module.exports = router;
