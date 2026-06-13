const BugReport = require('../models/mongodb/BugReport');

// GET /api/bugs
exports.getBugs = async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const total = await BugReport.countDocuments(filter);
    const bugs = await BugReport.find(filter)
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: bugs, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/bugs/stats
exports.getBugStats = async (req, res) => {
  try {
    const total      = await BugReport.countDocuments();
    const open       = await BugReport.countDocuments({ status: 'open' });
    const inProgress = await BugReport.countDocuments({ status: 'in-progress' });
    const resolved   = await BugReport.countDocuments({ status: 'resolved' });
    const critical   = await BugReport.countDocuments({ priority: 'critical' });
    res.json({ success: true, data: { total, open, inProgress, resolved, critical } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/bugs
exports.createBug = async (req, res) => {
  try {
    const bug = await BugReport.create({
      ...req.body,
      reportedBy:   req.user.id,
      reporterName: req.user.name,
    });
    res.status(201).json({ success: true, data: bug, message: 'Bug report submitted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/bugs/:id
exports.updateBug = async (req, res) => {
  try {
    const update = { ...req.body };
    if (req.body.status === 'resolved' && !req.body.resolvedAt) {
      update.resolvedAt = new Date();
    }
    const bug = await BugReport.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!bug) return res.status(404).json({ success: false, message: 'Bug not found' });
    res.json({ success: true, data: bug, message: 'Bug report updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/bugs/:id
exports.deleteBug = async (req, res) => {
  try {
    await BugReport.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Bug report deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
