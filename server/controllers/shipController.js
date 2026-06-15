const Ship = require('../models/mongodb/Ship');
const Crew = require('../models/mongodb/Crew');
const Shipment = require('../models/mongodb/Shipment');
const CargoLog = require('../models/mongodb/CargoLog');

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

// GET cargo and shipments assigned to a ship's crew
exports.getShipCargo = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Auth & authorization check
    if (req.user.role === 'staff') {
      const crew = await Crew.findOne({ userId: req.user.id });
      if (!crew || crew.shipId.toString() !== id) {
        return res.status(403).json({ success: false, message: 'Not authorized to view this ship cargo' });
      }
    } else if (req.user.role === 'manager') {
      const ship = await Ship.findOne({ _id: id, managerId: req.user.id });
      if (!ship) {
        return res.status(404).json({ success: false, message: 'Ship not found or access denied' });
      }
    }

    // 1. Find all crew associated with this ship
    const crewList = await Crew.find({ shipId: id });
    const userIds = crewList.map(c => c.userId).filter(uid => uid != null);

    // 2. Fetch shipments assigned to this crew's user accounts
    const shipments = await Shipment.find({ 'assignedTo.userId': { $in: userIds }, isArchived: false }).sort({ createdAt: -1 });

    // 3. Fetch cargo logs for the ship
    const cargoLogs = await CargoLog.find({ shipId: id }).sort({ logDate: -1 });

    res.json({
      success: true,
      shipments,
      cargoLogs
    });
  } catch (err) { next(err); }
};
