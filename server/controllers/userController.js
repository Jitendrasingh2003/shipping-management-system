const bcrypt = require('bcryptjs');
const User = require('../models/mongodb/User');
const { logAudit } = require('../middleware/auth');
const Notification = require('../models/mongodb/Notification');

// @desc  Get all users
// @route GET /api/users
// @access Admin
const getUsers = async (req, res, next) => {
  try {
    const { role, isActive, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: users.length, users });
  } catch (err) {
    next(err);
  }
};

// @desc  Get single user
// @route GET /api/users/:id
// @access Admin
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// @desc  Create user
// @route POST /api/users
// @access Admin
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered.' });

    const hash = await bcrypt.hash(password || 'ShipTrack@123', 12);
    const user = await User.create({ name, email: email.toLowerCase(), password: hash, role, phone });

    await logAudit({
      userId: req.user.id, userName: req.user.name, userRole: req.user.role,
      action: 'USER_CREATED', resource: 'user', resourceId: String(user.id),
      description: `Admin created user: ${name} (${role})`, req,
    });

    await Notification.create({
      userId: user.id, userRole: role,
      title: 'Welcome to ShipTrack Pro!',
      message: `Your account has been created. Login with ${email}`,
      type: 'system',
    });

    res.status(201).json({ success: true, message: 'User created successfully.', user: { id: user.id, name, email, role, phone } });
  } catch (err) {
    next(err);
  }
};

// @desc  Update user
// @route PUT /api/users/:id
// @access Admin
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const { name, email, role, phone, isActive, password } = req.body;
    const before = { name: user.name, role: user.role, isActive: user.isActive };

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (role) user.role = role;
    if (phone) user.phone = phone;
    if (isActive !== undefined) user.isActive = isActive;
    if (password) user.password = await bcrypt.hash(password, 12);

    await user.save();

    await logAudit({
      userId: req.user.id, userName: req.user.name, userRole: req.user.role,
      action: 'USER_UPDATED', resource: 'user', resourceId: String(user.id),
      description: `Admin updated user: ${user.name}`,
      changes: { before, after: { name: user.name, role: user.role, isActive: user.isActive } }, req,
    });

    res.json({ success: true, message: 'User updated.', user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, isActive: user.isActive } });
  } catch (err) {
    next(err);
  }
};

// @desc  Delete user
// @route DELETE /api/users/:id
// @access Admin
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.id === req.user.id) return res.status(400).json({ success: false, message: 'Cannot delete your own account.' });

    await logAudit({
      userId: req.user.id, userName: req.user.name, userRole: req.user.role,
      action: 'USER_DELETED', resource: 'user', resourceId: String(user.id),
      description: `Admin deleted user: ${user.name} (${user.role})`, req,
    });

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted.' });
  } catch (err) {
    next(err);
  }
};

// @desc  Get staff list (for manager to assign)
// @route GET /api/users/staff
// @access Admin, Manager
const getStaffList = async (req, res, next) => {
  try {
    const users = await User.find({ role: 'staff', isActive: true })
      .select('name email phone')
      .sort({ name: 1 });
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser, getStaffList };
