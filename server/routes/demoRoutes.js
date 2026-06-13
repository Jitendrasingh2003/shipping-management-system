const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getDemoRequests, getDemoStats, createDemoRequest, updateDemoRequest, deleteDemoRequest,
} = require('../controllers/demoController');

router.use(protect);
router.get('/stats',  authorize('admin'), getDemoStats);
router.get('/',       authorize('admin'), getDemoRequests);
router.post('/',      authorize('admin'), createDemoRequest);
router.patch('/:id',  authorize('admin'), updateDemoRequest);
router.delete('/:id', authorize('admin'), deleteDemoRequest);

module.exports = router;
