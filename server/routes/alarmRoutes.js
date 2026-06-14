const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { getAlarms, createAlarm, updateAlarm, deleteAlarm } = require('../controllers/alarmController');

router.use(protect, authorize('manager', 'staff'));
router.get('/', getAlarms);
router.post('/', createAlarm);
router.put('/:id', updateAlarm);
router.delete('/:id', authorize('manager'), deleteAlarm);

module.exports = router;
