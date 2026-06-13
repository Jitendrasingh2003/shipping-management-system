const DemoRequest = require('../models/mongodb/DemoRequest');

// GET /api/demo-requests
exports.getDemoRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const total = await DemoRequest.countDocuments(filter);
    const demos = await DemoRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: demos, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/demo-requests/stats
exports.getDemoStats = async (req, res) => {
  try {
    const total     = await DemoRequest.countDocuments();
    const pending   = await DemoRequest.countDocuments({ status: 'pending' });
    const contacted = await DemoRequest.countDocuments({ status: 'contacted' });
    const completed = await DemoRequest.countDocuments({ status: 'completed' });
    res.json({ success: true, data: { total, pending, contacted, completed } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/demo-requests
exports.createDemoRequest = async (req, res) => {
  try {
    const demo = await DemoRequest.create(req.body);
    res.status(201).json({ success: true, data: demo, message: 'Demo request submitted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/demo-requests/:id
exports.updateDemoRequest = async (req, res) => {
  try {
    const demo = await DemoRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!demo) return res.status(404).json({ success: false, message: 'Demo request not found' });
    res.json({ success: true, data: demo, message: 'Demo request updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/demo-requests/:id
exports.deleteDemoRequest = async (req, res) => {
  try {
    await DemoRequest.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Demo request deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
