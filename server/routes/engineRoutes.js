const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { getEngineLogs, createEngineLog, updateEngineLog, deleteEngineLog } = require('../controllers/engineController');

router.use(protect, authorize('manager', 'staff'));
router.get('/', getEngineLogs);
router.post('/', createEngineLog);
router.put('/:id', updateEngineLog);
router.delete('/:id', authorize('manager'), deleteEngineLog);

module.exports = router;
