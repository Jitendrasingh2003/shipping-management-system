const Enquiry = require('../models/mongodb/Enquiry');

// GET /api/enquiries
exports.getEnquiries = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const total = await Enquiry.countDocuments(filter);
    const enquiries = await Enquiry.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: enquiries, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/enquiries/stats
exports.getEnquiryStats = async (req, res) => {
  try {
    const total   = await Enquiry.countDocuments();
    const newReqs = await Enquiry.countDocuments({ status: 'new' });
    const read    = await Enquiry.countDocuments({ status: 'read' });
    const replied = await Enquiry.countDocuments({ status: 'replied' });
    res.json({ success: true, data: { total, new: newReqs, read, replied } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/enquiries  (public — no auth needed)
exports.createEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.create(req.body);
    res.status(201).json({ success: true, data: enquiry, message: 'Enquiry submitted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/enquiries/:id
exports.updateEnquiry = async (req, res) => {
  try {
    const update = { ...req.body };
    if (req.body.reply) {
      update.status    = 'replied';
      update.repliedAt = new Date();
    }
    const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });
    res.json({ success: true, data: enquiry, message: 'Enquiry updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/enquiries/:id
exports.deleteEnquiry = async (req, res) => {
  try {
    await Enquiry.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Enquiry deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
