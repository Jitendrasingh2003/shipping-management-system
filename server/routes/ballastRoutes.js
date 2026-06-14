const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { getBallastLogs, createBallastLog, updateBallastLog, deleteBallastLog } = require('../controllers/ballastController');

router.use(protect, authorize('manager', 'staff'));
router.get('/', getBallastLogs);
router.post('/', createBallastLog);
router.put('/:id', updateBallastLog);
router.delete('/:id', authorize('manager'), deleteBallastLog);

module.exports = router;
