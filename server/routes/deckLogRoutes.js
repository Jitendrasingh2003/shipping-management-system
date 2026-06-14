const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { getDeckLogs, createDeckLog, updateDeckLog, deleteDeckLog } = require('../controllers/deckLogController');

router.use(protect, authorize('manager', 'staff'));
router.get('/', getDeckLogs);
router.post('/', createDeckLog);
router.put('/:id', updateDeckLog);
router.delete('/:id', authorize('manager'), deleteDeckLog);

module.exports = router;
