const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { getConsumptionLogs, createConsumptionLog, updateConsumptionLog, deleteConsumptionLog } = require('../controllers/consumptionController');

router.use(protect, authorize('manager', 'staff'));
router.get('/', getConsumptionLogs);
router.post('/', createConsumptionLog);
router.put('/:id', updateConsumptionLog);
router.delete('/:id', authorize('manager'), deleteConsumptionLog);

module.exports = router;
