const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getEnquiries, getEnquiryStats, createEnquiry, updateEnquiry, deleteEnquiry,
} = require('../controllers/enquiryController');

// Public route — anyone can submit enquiry
router.post('/', createEnquiry);

// Protected routes — admin only
router.use(protect);
router.get('/stats',  authorize('admin'), getEnquiryStats);
router.get('/',       authorize('admin'), getEnquiries);
router.patch('/:id',  authorize('admin'), updateEnquiry);
router.delete('/:id', authorize('admin'), deleteEnquiry);

module.exports = router;
