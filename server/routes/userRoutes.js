const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { validateCreateUser, validateMongoId } = require('../middleware/validators');
const {
  getUsers, getUserById, createUser, updateUser, deleteUser, getStaffList,
} = require('../controllers/userController');

router.use(protect);

router.get('/staff',   authorize('admin', 'manager'), getStaffList);
router.get('/',        authorize('admin'),             getUsers);
router.get('/:id',     authorize('admin'),             validateMongoId, getUserById);
router.post('/',       authorize('admin'),             validateCreateUser, createUser);
router.put('/:id',     authorize('admin'),             validateMongoId, updateUser);
router.delete('/:id',  authorize('admin'),             validateMongoId, deleteUser);

module.exports = router;

