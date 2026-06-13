const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getBugs, getBugStats, createBug, updateBug, deleteBug,
} = require('../controllers/bugController');

router.use(protect);
router.get('/stats',  authorize('admin'), getBugStats);
router.get('/',       authorize('admin'), getBugs);
router.post('/',      authorize('admin', 'manager', 'staff'), createBug);
router.patch('/:id',  authorize('admin'), updateBug);
router.delete('/:id', authorize('admin'), deleteBug);

module.exports = router;
