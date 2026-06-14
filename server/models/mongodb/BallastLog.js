const mongoose = require('mongoose');

const ballastLogSchema = new mongoose.Schema({
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shipId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Ship', required: true },
  logDate:   { type: String, default: '' },
  tank:      { type: String, default: '' },
  volume:    { type: String, default: '' },
  salinity:  { type: String, default: '' },
  status:    { type: String, default: '' },
  location:  { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('BallastLog', ballastLogSchema);
