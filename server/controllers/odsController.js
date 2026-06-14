const OdsLog = require('../models/mongodb/OdsLog');
const Crew = require('../models/mongodb/Crew');

exports.getOdsLogs = async (req, res, next) => {
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
    const logs = await OdsLog.find(filter).populate('shipId', 'name').sort({ createdAt: -1 });
    res.json({ success: true, logs });
  } catch (err) { next(err); }
};

exports.createOdsLog = async (req, res, next) => {
  try {
    const { shipId, logDate, system, gasType, qty, operation, loggedBy } = req.body;
    if (!shipId) return res.status(400).json({ success: false, message: 'Ship is required' });

    let managerId = req.user.id;
    if (req.user.role === 'staff') {
      const crew = await Crew.findOne({ userId: req.user.id });
      if (!crew || crew.shipId.toString() !== shipId) {
        return res.status(403).json({ success: false, message: 'Not authorized for this ship' });
      }
      managerId = crew.managerId;
    }

    const log = await OdsLog.create({
      managerId, shipId, logDate, system, gasType, qty, operation, loggedBy: loggedBy || req.user.name
    });
    res.status(201).json({ success: true, message: 'ODS entry logged', log });
  } catch (err) { next(err); }
};

exports.updateOdsLog = async (req, res, next) => {
  try {
    let filter = { _id: req.params.id };
    if (req.user.role === 'staff') {
      const crew = await Crew.findOne({ userId: req.user.id });
      if (!crew) return res.status(403).json({ success: false, message: 'Not authorized' });
      filter.shipId = crew.shipId;
    } else {
      filter.managerId = req.user.id;
    }

    const log = await OdsLog.findOneAndUpdate(filter, req.body, { new: true });
    if (!log) return res.status(404).json({ success: false, message: 'Log not found' });
    res.json({ success: true, message: 'Log updated', log });
  } catch (err) { next(err); }
};

exports.deleteOdsLog = async (req, res, next) => {
  try {
    let filter = { _id: req.params.id };
    if (req.user.role === 'staff') {
      const crew = await Crew.findOne({ userId: req.user.id });
      if (!crew) return res.status(403).json({ success: false, message: 'Not authorized' });
      filter.shipId = crew.shipId;
    } else {
      filter.managerId = req.user.id;
    }

    const log = await OdsLog.findOneAndDelete(filter);
    if (!log) return res.status(404).json({ success: false, message: 'Log not found' });
    res.json({ success: true, message: 'Log deleted' });
  } catch (err) { next(err); }
};
