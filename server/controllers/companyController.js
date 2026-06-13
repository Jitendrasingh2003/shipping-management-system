const Company = require('../models/mongodb/Company');

// GET /api/company
exports.getCompany = async (req, res) => {
  try {
    let company = await Company.findOne();
    if (!company) {
      company = await Company.create({ name: 'ShipTrack Pro' });
    }
    res.json({ success: true, data: company });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/company
exports.updateCompany = async (req, res) => {
  try {
    let company = await Company.findOne();
    if (!company) {
      company = await Company.create(req.body);
    } else {
      Object.assign(company, req.body);
      await company.save();
    }
    res.json({ success: true, data: company, message: 'Company profile updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
