const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/mongodb/User');
const { logAudit } = require('../middleware/auth');
const Notification = require('../models/mongodb/Notification');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

// @desc  Register new company (manager account)
// @route POST /api/auth/register
// @access Public
const register = async (req, res, next) => {
  try {
    const {
      name, email, password,
      companyName, companyEmail, companyAltEmail, companyPhone,
      country, city, state, zip, officeAddress,
    } = req.body;

    if (!name || !email || !password || !companyName) {
      return res.status(400).json({ success: false, message: 'Name, email, password and company name are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name, email,
      password: hashedPassword,
      role: 'manager',
      companyName, companyEmail, companyAltEmail,
      companyPhone: companyPhone || '',
      country: country || '',
      city: city || '',
      state: state || '',
      zip: zip || '',
      officeAddress: officeAddress || '',
    });

    const token = generateToken(user.id);
    res.status(201).json({
      success: true,
      message: 'Company registered successfully!',
      token,
      user: {
        id: user.id, name: user.name, email: user.email,
        role: user.role, companyName: user.companyName,
      },
    });
  } catch (err) {
    next(err);
  }
};


// @desc  Login
// @route POST /api/auth/login
// @access Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account deactivated. Contact admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    user.lastLogin = new Date();
    await user.save();

    await logAudit({
      userId: user.id, userName: user.name, userRole: user.role,
      action: 'USER_LOGIN', resource: 'auth',
      description: `${user.name} logged in successfully`, req,
    });

    const token = generateToken(user.id);
    res.json({
      success: true,
      token,
      user: {
        id: user.id, name: user.name, email: user.email,
        role: user.role, phone: user.phone, avatar: user.avatar,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Get current user
// @route GET /api/auth/me
// @access Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc  Update profile
// @route PUT /api/auth/profile
// @access Private
const updateProfile = async (req, res, next) => {
  try {
    const {
      name, phone,
      companyName, companyEmail, companyAltEmail, companyPhone,
      country, city, state, zip, officeAddress
    } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;

    if (user.role === 'manager') {
      if (companyName !== undefined) user.companyName = companyName;
      if (companyEmail !== undefined) user.companyEmail = companyEmail;
      if (companyAltEmail !== undefined) user.companyAltEmail = companyAltEmail;
      if (companyPhone !== undefined) user.companyPhone = companyPhone;
      if (country !== undefined) user.country = country;
      if (city !== undefined) user.city = city;
      if (state !== undefined) user.state = state;
      if (zip !== undefined) user.zip = zip;
      if (officeAddress !== undefined) user.officeAddress = officeAddress;
    }

    await user.save();
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        companyName: user.companyName,
        companyEmail: user.companyEmail,
        companyAltEmail: user.companyAltEmail,
        companyPhone: user.companyPhone,
        country: user.country,
        city: user.city,
        state: user.state,
        zip: user.zip,
        officeAddress: user.officeAddress,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Change password
// @route PUT /api/auth/change-password
// @access Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword };

