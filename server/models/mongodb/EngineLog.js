const mongoose = require('mongoose');

const engineLogSchema = new mongoose.Schema({
  managerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shipId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Ship', required: true },
  logDate:      { type: String, default: '' },
  rpm:          { type: String, default: '' },
  jacketTemp:   { type: String, default: '' },
  lubePressure: { type: String, default: '' },
  turboRpm:     { type: String, default: '' },
  scavengeTemp: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('EngineLog', engineLogSchema);
