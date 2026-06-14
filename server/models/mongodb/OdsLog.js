const mongoose = require('mongoose');

const odsLogSchema = new mongoose.Schema({
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shipId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Ship', required: true },
  logDate:   { type: String, default: '' },
  system:    { type: String, default: '' },
  gasType:   { type: String, default: '' },
  qty:       { type: String, default: '' },
  operation: { type: String, default: '' },
  loggedBy:  { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('OdsLog', odsLogSchema);
