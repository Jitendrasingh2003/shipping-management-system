const Voyage = require('../models/mongodb/Voyage');
const Crew = require('../models/mongodb/Crew');

exports.getVoyages = async (req, res, next) => {
  try {
    let filter = {};
    if (req.user.role === 'staff') {
      const crew = await Crew.findOne({ userId: req.user.id });
      if (!crew) return res.json({ success: true, voyages: [] });
      filter = { shipId: crew.shipId };
    } else {
      filter = { managerId: req.user.id };
      if (req.query.shipId) filter.shipId = req.query.shipId;
    }
    const voyages = await Voyage.find(filter).populate('shipId', 'name').sort({ createdAt: -1 });
    res.json({ success: true, voyages });
  } catch (err) { next(err); }
};

exports.createVoyage = async (req, res, next) => {
  try {
    const { shipId, voyageNo, voyageType, voyageStatus, departurePort, arrivalPort, departureDate, arrivalDate, role } = req.body;
    if (!shipId || !voyageNo) return res.status(400).json({ success: false, message: 'Ship and Voyage No are required' });

    let managerId = req.user.id;
    if (req.user.role === 'staff') {
      const crew = await Crew.findOne({ userId: req.user.id });
      if (!crew || crew.shipId.toString() !== shipId) {
        return res.status(403).json({ success: false, message: 'Not authorized to add voyage for this ship' });
      }
      managerId = crew.managerId;
    }

    const voyage = await Voyage.create({
      managerId,
      shipId, voyageNo, voyageType, voyageStatus,
      departurePort, arrivalPort, departureDate, arrivalDate,
      role: role || req.user.role,
    });
    res.status(201).json({ success: true, message: 'Voyage created', voyage });
  } catch (err) { next(err); }
};

exports.updateVoyage = async (req, res, next) => {
  try {
    let filter = { _id: req.params.id };
    if (req.user.role === 'staff') {
      const crew = await Crew.findOne({ userId: req.user.id });
      if (!crew) return res.status(403).json({ success: false, message: 'Not authorized' });
      filter.shipId = crew.shipId;
    } else {
      filter.managerId = req.user.id;
    }

    const voyage = await Voyage.findOneAndUpdate(
      filter,
      req.body, { new: true }
    );
    if (!voyage) return res.status(404).json({ success: false, message: 'Voyage not found' });
    res.json({ success: true, message: 'Voyage updated', voyage });
  } catch (err) { next(err); }
};

exports.deleteVoyage = async (req, res, next) => {
  try {
    let filter = { _id: req.params.id };
    if (req.user.role === 'staff') {
      const crew = await Crew.findOne({ userId: req.user.id });
      if (!crew) return res.status(403).json({ success: false, message: 'Not authorized' });
      filter.shipId = crew.shipId;
    } else {
      filter.managerId = req.user.id;
    }

    const voyage = await Voyage.findOneAndDelete(filter);
    if (!voyage) return res.status(404).json({ success: false, message: 'Voyage not found' });
    res.json({ success: true, message: 'Voyage deleted' });
  } catch (err) { next(err); }
};
