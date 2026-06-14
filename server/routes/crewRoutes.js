const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { getCrew, createCrew, updateCrew, deleteCrew } = require('../controllers/crewController');

router.use(protect, authorize('manager'));
router.get('/', getCrew);
router.post('/', createCrew);
router.put('/:id', updateCrew);
router.delete('/:id', deleteCrew);

module.exports = router;
