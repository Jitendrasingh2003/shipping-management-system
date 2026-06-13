const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true },
  email:   { type: String, required: true, lowercase: true, trim: true },
  phone:   { type: String, default: '' },
  subject: { type: String, required: true, trim: true },
  message: { type: String, required: true },
  status:  { type: String, enum: ['new', 'read', 'replied', 'closed'], default: 'new' },
  reply:   { type: String, default: '' },
  repliedAt:{ type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Enquiry', enquirySchema);
