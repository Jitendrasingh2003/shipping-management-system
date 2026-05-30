const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, authorize } = require('../middleware/auth');
const {
  getShipments, getAssignedShipments, getShipmentById, trackShipment,
  createShipment, updateShipment, updateStatus, assignShipment, uploadProof, deleteShipment,
} = require('../controllers/shipmentController');

// Multer for proof of delivery
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, `proof-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
});

// Public
router.get('/track/:trackingId', trackShipment);

// Protected
router.use(protect);

router.get('/assigned', authorize('staff'), getAssignedShipments);
router.get('/', authorize('admin', 'manager'), getShipments);
router.post('/', authorize('admin', 'manager'), createShipment);
router.get('/:id', authorize('admin', 'manager', 'staff'), getShipmentById);
router.put('/:id', authorize('admin', 'manager'), updateShipment);
router.patch('/:id/status', authorize('admin', 'manager', 'staff'), updateStatus);
router.patch('/:id/assign', authorize('admin', 'manager'), assignShipment);
router.patch('/:id/proof', authorize('staff'), upload.single('proof'), uploadProof);
router.delete('/:id', authorize('admin'), deleteShipment);

module.exports = router;
