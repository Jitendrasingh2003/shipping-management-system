const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getCompany, updateCompany } = require('../controllers/companyController');

router.use(protect);
router.get('/',  authorize('admin', 'manager'), getCompany);
router.put('/',  authorize('admin'), updateCompany);

module.exports = router;
