const mongoose = require('mongoose');

const bunkerLogSchema = new mongoose.Schema({
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shipId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Ship', required: true },
  logDate:   { type: String, default: '' },
  fuelType:  { type: String, default: '' },
  qty:       { type: String, default: '' },
  viscosity: { type: String, default: '' },
  sulfur:    { type: String, default: '' },
  supplier:  { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('BunkerLog', bunkerLogSchema);
