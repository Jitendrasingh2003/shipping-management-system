const mongoose = require('mongoose');

const demoRequestSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  email:       { type: String, required: true, lowercase: true, trim: true },
  company:     { type: String, default: '', trim: true },
  phone:       { type: String, default: '' },
  message:     { type: String, default: '' },
  status:      { type: String, enum: ['pending', 'contacted', 'scheduled', 'completed', 'closed'], default: 'pending' },
  scheduledAt: { type: Date, default: null },
  notes:       { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('DemoRequest', demoRequestSchema);
