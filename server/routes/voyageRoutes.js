const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { getVoyages, createVoyage, updateVoyage, deleteVoyage } = require('../controllers/voyageController');

router.use(protect, authorize('manager', 'staff'));
router.get('/', getVoyages);
router.post('/', createVoyage);
router.put('/:id', updateVoyage);
router.delete('/:id', authorize('manager'), deleteVoyage);

module.exports = router;
