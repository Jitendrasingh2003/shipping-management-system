const mongoose = require('mongoose');

const deckLogSchema = new mongoose.Schema({
  managerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shipId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Ship', required: true },
  voyageId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Voyage', default: null },
  latitude:   { type: String, default: '' },
  longitude:  { type: String, default: '' },
  speed:      { type: Number, default: 0 },
  course:     { type: String, default: '' },
  weather:    { type: String, default: '' },
  remarks:    { type: String, default: '' },
  logDate:    { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('DeckLog', deckLogSchema);
