const mongoose = require('mongoose');

const voyageSchema = new mongoose.Schema({
  managerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shipId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Ship', required: true },
  role:         { type: String, default: 'staff' },
  voyageNo:     { type: String, required: true, trim: true },
  voyageType:   { type: String, enum: ['laden', 'ballast', 'other'], default: 'laden' },
  voyageStatus: { type: String, enum: ['Planned', 'Running', 'Completed'], default: 'Planned' },
  departurePort:{ type: String, default: '' },
  arrivalPort:  { type: String, default: '' },
  departureDate:{ type: String, default: '' },
  arrivalDate:  { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Voyage', voyageSchema);
