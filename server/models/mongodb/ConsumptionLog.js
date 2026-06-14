const mongoose = require('mongoose');

const consumptionLogSchema = new mongoose.Schema({
  managerId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shipId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Ship', required: true },
  logDate:        { type: String, default: '' },
  mainEngineFuel: { type: String, default: '' },
  auxEngineFuel:  { type: String, default: '' },
  co2Emissions:   { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('ConsumptionLog', consumptionLogSchema);
