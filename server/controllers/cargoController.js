const CargoLog = require('../models/mongodb/CargoLog');
const Crew = require('../models/mongodb/Crew');

exports.getCargoLogs = async (req, res, next) => {
  try {
    let filter = {};
    if (req.user.role === 'staff') {
      const crew = await Crew.findOne({ userId: req.user.id });
      if (!crew) return res.json({ success: true, logs: [] });
      filter = { shipId: crew.shipId };
    } else {
      filter = { managerId: req.user.id };
      if (req.query.shipId) filter.shipId = req.query.shipId;
    }
    const logs = await CargoLog.find(filter).populate('shipId', 'name').sort({ createdAt: -1 });
    res.json({ success: true, logs });
  } catch (err) { next(err); }
};

exports.createCargoLog = async (req, res, next) => {
  try {
    const { shipId, logDate, operation, cargoType, qty, rate, status } = req.body;
    if (!shipId) return res.status(400).json({ success: false, message: 'Ship is required' });

    let managerId = req.user.id;
    if (req.user.role === 'staff') {
      const crew = await Crew.findOne({ userId: req.user.id });
      if (!crew || crew.shipId.toString() !== shipId) {
        return res.status(403).json({ success: false, message: 'Not authorized for this ship' });
      }
      managerId = crew.managerId;
    }

    const log = await CargoLog.create({
      managerId, shipId, logDate, operation, cargoType, qty, rate, status
    });
    res.status(201).json({ success: true, message: 'Cargo log entry added', log });
  } catch (err) { next(err); }
};

exports.updateCargoLog = async (req, res, next) => {
  try {
    let filter = { _id: req.params.id };
    if (req.user.role === 'staff') {
      const crew = await Crew.findOne({ userId: req.user.id });
      if (!crew) return res.status(403).json({ success: false, message: 'Not authorized' });
      filter.shipId = crew.shipId;
    } else {
      filter.managerId = req.user.id;
    }

    const log = await CargoLog.findOneAndUpdate(filter, req.body, { new: true });
    if (!log) return res.status(404).json({ success: false, message: 'Log not found' });
    res.json({ success: true, message: 'Log updated', log });
  } catch (err) { next(err); }
};

exports.deleteCargoLog = async (req, res, next) => {
  try {
    let filter = { _id: req.params.id };
    if (req.user.role === 'staff') {
      const crew = await Crew.findOne({ userId: req.user.id });
      if (!crew) return res.status(403).json({ success: false, message: 'Not authorized' });
      filter.shipId = crew.shipId;
    } else {
      filter.managerId = req.user.id;
    }

    const log = await CargoLog.findOneAndDelete(filter);
    if (!log) return res.status(404).json({ success: false, message: 'Log not found' });
    res.json({ success: true, message: 'Log deleted' });
  } catch (err) { next(err); }
};
