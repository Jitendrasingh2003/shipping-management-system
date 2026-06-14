const mongoose = require('mongoose');

const crewSchema = new mongoose.Schema({
  managerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shipId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Ship', required: true },
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // for login
  name:        { type: String, required: true, trim: true },
  designation: { type: String, default: '' },
  email:       { type: String, required: true, lowercase: true, trim: true },
  dateOfBirth: { type: String, default: '' },
  nationality: { type: String, default: '' },
  phone:       { type: String, default: '' },
  status:      { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { timestamps: true });

module.exports = mongoose.model('Crew', crewSchema);
