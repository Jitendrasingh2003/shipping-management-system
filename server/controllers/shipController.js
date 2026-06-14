const Ship = require('../models/mongodb/Ship');
const Crew = require('../models/mongodb/Crew');

// GET all ships for this manager (or single ship for staff)
exports.getShips = async (req, res, next) => {
  try {
    let filter = {};
    if (req.user.role === 'staff') {
      const crew = await Crew.findOne({ userId: req.user.id });
      if (!crew) return res.json({ success: true, ships: [] });
      filter = { _id: crew.shipId };
    } else {
      filter = { managerId: req.user.id };
    }
    const ships = await Ship.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, ships });
  } catch (err) { next(err); }
};

// GET single ship
exports.getShip = async (req, res, next) => {
  try {
    let filter = { _id: req.params.id };
    if (req.user.role === 'staff') {
      const crew = await Crew.findOne({ userId: req.user.id });
      if (!crew || crew.shipId.toString() !== req.params.id) {
        return res.status(403).json({ success: false, message: 'Not authorized to view this ship' });
      }
    } else {
      filter.managerId = req.user.id;
    }
    const ship = await Ship.findOne(filter);
    if (!ship) return res.status(404).json({ success: false, message: 'Ship not found' });
    res.json({ success: true, ship });
  } catch (err) { next(err); }
};

// POST create ship
exports.createShip = async (req, res, next) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ success: false, message: 'Only managers can create ships' });
    }
    const { name, flag, imoNumber, type, status } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Ship name is required' });
    const ship = await Ship.create({ managerId: req.user.id, name, flag, imoNumber, type, status });
    res.status(201).json({ success: true, message: 'Ship added successfully', ship });
  } catch (err) { next(err); }
};

// PUT update ship
exports.updateShip = async (req, res, next) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ success: false, message: 'Only managers can update ships' });
    }
    const ship = await Ship.findOneAndUpdate(
      { _id: req.params.id, managerId: req.user.id },
      req.body,
      { new: true }
    );
    if (!ship) return res.status(404).json({ success: false, message: 'Ship not found' });
    res.json({ success: true, message: 'Ship updated', ship });
  } catch (err) { next(err); }
};

// DELETE ship
exports.deleteShip = async (req, res, next) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ success: false, message: 'Only managers can delete ships' });
    }
    const ship = await Ship.findOneAndDelete({ _id: req.params.id, managerId: req.user.id });
    if (!ship) return res.status(404).json({ success: false, message: 'Ship not found' });
    res.json({ success: true, message: 'Ship deleted' });
  } catch (err) { next(err); }
};
