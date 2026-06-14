const mongoose = require('mongoose');

const alarmSchema = new mongoose.Schema({
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shipId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Ship', required: true },
  category:  { type: String, default: 'General' },
  title:     { type: String, required: true },
  status:    { type: String, enum: ['Active', 'Resolved'], default: 'Active' },
  severity:  { type: String, enum: ['info', 'warning', 'high', 'urgent'], default: 'warning' },
  time:      { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Alarm', alarmSchema);
