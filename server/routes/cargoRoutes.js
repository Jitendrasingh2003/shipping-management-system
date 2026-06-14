const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { getCargoLogs, createCargoLog, updateCargoLog, deleteCargoLog } = require('../controllers/cargoController');

router.use(protect, authorize('manager', 'staff'));
router.get('/', getCargoLogs);
router.post('/', createCargoLog);
router.put('/:id', updateCargoLog);
router.delete('/:id', authorize('manager'), deleteCargoLog);

module.exports = router;
