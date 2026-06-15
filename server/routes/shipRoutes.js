const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { getShips, getShip, createShip, updateShip, deleteShip, getShipCargo } = require('../controllers/shipController');

router.use(protect);

router.get('/', authorize('manager', 'staff'), getShips);
router.get('/:id', authorize('manager', 'staff'), getShip);
router.get('/:id/cargo', authorize('manager', 'staff'), getShipCargo);

router.post('/', authorize('manager'), createShip);
router.put('/:id', authorize('manager'), updateShip);
router.delete('/:id', authorize('manager'), deleteShip);

module.exports = router;
