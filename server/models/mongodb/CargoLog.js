const mongoose = require('mongoose');

const cargoLogSchema = new mongoose.Schema({
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shipId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Ship', required: true },
  logDate:   { type: String, default: '' },
  operation: { type: String, default: '' },
  cargoType: { type: String, default: '' },
  qty:       { type: String, default: '' },
  rate:      { type: String, default: '' },
  status:    { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('CargoLog', cargoLogSchema);
