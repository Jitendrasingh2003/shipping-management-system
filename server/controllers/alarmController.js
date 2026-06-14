const Alarm = require('../models/mongodb/Alarm');
const Crew = require('../models/mongodb/Crew');

exports.getAlarms = async (req, res, next) => {
  try {
    let filter = {};
    if (req.user.role === 'staff') {
      const crew = await Crew.findOne({ userId: req.user.id });
      if (!crew) return res.json({ success: true, alarms: [] });
      filter = { shipId: crew.shipId };
    } else {
      filter = { managerId: req.user.id };
      if (req.query.shipId) filter.shipId = req.query.shipId;
    }
    const alarms = await Alarm.find(filter).populate('shipId', 'name').sort({ createdAt: -1 });
    res.json({ success: true, alarms });
  } catch (err) { next(err); }
};

exports.createAlarm = async (req, res, next) => {
  try {
    const { shipId, category, title, status, severity, time } = req.body;
    if (!shipId || !title) return res.status(400).json({ success: false, message: 'Ship and Title are required' });

    let managerId = req.user.id;
    if (req.user.role === 'staff') {
      const crew = await Crew.findOne({ userId: req.user.id });
      if (!crew || crew.shipId.toString() !== shipId) {
        return res.status(403).json({ success: false, message: 'Not authorized for this ship' });
      }
      managerId = crew.managerId;
    }

    const alarm = await Alarm.create({
      managerId, shipId, category, title, status, severity, time
    });
    res.status(201).json({ success: true, message: 'Alarm added', alarm });
  } catch (err) { next(err); }
};

exports.updateAlarm = async (req, res, next) => {
  try {
    let filter = { _id: req.params.id };
    if (req.user.role === 'staff') {
      const crew = await Crew.findOne({ userId: req.user.id });
      if (!crew) return res.status(403).json({ success: false, message: 'Not authorized' });
      filter.shipId = crew.shipId;
    } else {
      filter.managerId = req.user.id;
    }

    const alarm = await Alarm.findOneAndUpdate(filter, req.body, { new: true });
    if (!alarm) return res.status(404).json({ success: false, message: 'Alarm not found' });
    res.json({ success: true, message: 'Alarm updated', alarm });
  } catch (err) { next(err); }
};

exports.deleteAlarm = async (req, res, next) => {
  try {
    let filter = { _id: req.params.id };
    if (req.user.role === 'staff') {
      const crew = await Crew.findOne({ userId: req.user.id });
      if (!crew) return res.status(403).json({ success: false, message: 'Not authorized' });
      filter.shipId = crew.shipId;
    } else {
      filter.managerId = req.user.id;
    }

    const alarm = await Alarm.findOneAndDelete(filter);
    if (!alarm) return res.status(404).json({ success: false, message: 'Alarm not found' });
    res.json({ success: true, message: 'Alarm deleted' });
  } catch (err) { next(err); }
};
