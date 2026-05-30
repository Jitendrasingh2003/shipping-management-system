const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getUsers, getUserById, createUser, updateUser, deleteUser, getStaffList,
} = require('../controllers/userController');

router.use(protect);

router.get('/staff', authorize('admin', 'manager'), getStaffList);
router.get('/', authorize('admin'), getUsers);
router.get('/:id', authorize('admin'), getUserById);
router.post('/', authorize('admin'), createUser);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;
