const bcrypt = require('bcryptjs');
const Crew = require('../models/mongodb/Crew');
const User = require('../models/mongodb/User');

// GET all crew for a manager (optionally filter by ship)
exports.getCrew = async (req, res, next) => {
  try {
    const filter = { managerId: req.user.id };
    if (req.query.shipId) filter.shipId = req.query.shipId;
    const crew = await Crew.find(filter).populate('shipId', 'name').sort({ createdAt: -1 });
    res.json({ success: true, crew });
  } catch (err) { next(err); }
};

// POST create crew member + auto-create User account for login
exports.createCrew = async (req, res, next) => {
  try {
    const { shipId, name, designation, email, dateOfBirth, nationality, phone, password } = req.body;
    if (!name || !email || !shipId) {
      return res.status(400).json({ success: false, message: 'Name, email and ship are required' });
    }

    // Check if email already exists
    let existingUser = await User.findOne({ email: email.toLowerCase() });
    let userId = null;

    if (!existingUser) {
      // Create a User account so they can login on Staff portal
      const pw = password || 'Staff@123';
      const hashedPw = await bcrypt.hash(pw, 12);
      const newUser = await User.create({
        name, email,
        password: hashedPw,
        role: 'staff',
        phone: phone || '',
      });
      userId = newUser._id;
    } else {
      userId = existingUser._id;
    }

    const crew = await Crew.create({
      managerId: req.user.id,
      shipId, name, designation, email,
      dateOfBirth, nationality, phone,
      userId,
    });

    res.status(201).json({ success: true, message: 'Staff member added. They can login on Staff portal.', crew });
  } catch (err) { next(err); }
};

// PUT update crew
exports.updateCrew = async (req, res, next) => {
  try {
    const crew = await Crew.findOneAndUpdate(
      { _id: req.params.id, managerId: req.user.id },
      req.body,
      { new: true }
    );
    if (!crew) return res.status(404).json({ success: false, message: 'Staff not found' });
    res.json({ success: true, message: 'Staff updated', crew });
  } catch (err) { next(err); }
};

// DELETE crew
exports.deleteCrew = async (req, res, next) => {
  try {
    const crew = await Crew.findOneAndDelete({ _id: req.params.id, managerId: req.user.id });
    if (!crew) return res.status(404).json({ success: false, message: 'Staff not found' });
    res.json({ success: true, message: 'Staff deleted' });
  } catch (err) { next(err); }
};
