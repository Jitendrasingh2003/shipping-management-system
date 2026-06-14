const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { getBunkerLogs, createBunkerLog, updateBunkerLog, deleteBunkerLog } = require('../controllers/bunkerController');

router.use(protect, authorize('manager', 'staff'));
router.get('/', getBunkerLogs);
router.post('/', createBunkerLog);
router.put('/:id', updateBunkerLog);
router.delete('/:id', authorize('manager'), deleteBunkerLog);

module.exports = router;
