const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { getOdsLogs, createOdsLog, updateOdsLog, deleteOdsLog } = require('../controllers/odsController');

router.use(protect, authorize('manager', 'staff'));
router.get('/', getOdsLogs);
router.post('/', createOdsLog);
router.put('/:id', updateOdsLog);
router.delete('/:id', authorize('manager'), deleteOdsLog);

module.exports = router;
