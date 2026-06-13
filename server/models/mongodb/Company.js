const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name:        { type: String, required: true, default: 'ShipTrack Pro' },
  tagline:     { type: String, default: 'Shipping Excellence Delivered' },
  email:       { type: String, default: '' },
  phone:       { type: String, default: '' },
  address:     { type: String, default: '' },
  city:        { type: String, default: '' },
  country:     { type: String, default: 'India' },
  website:     { type: String, default: '' },
  logo:        { type: String, default: null },
  fleetStatus: { type: String, enum: ['Optimal', 'Degraded', 'Maintenance', 'Critical'], default: 'Optimal' },
  totalFleet:  { type: Number, default: 0 },
  founded:     { type: String, default: '' },
  gstNumber:   { type: String, default: '' },
  panNumber:   { type: String, default: '' },
  licenseNo:   { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);
