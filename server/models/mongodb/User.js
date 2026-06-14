const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'manager', 'staff'], default: 'staff' },
  phone: { type: String, default: '' },
  avatar: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: null },
  // Company fields (for manager/company admin accounts)
  companyName: { type: String, default: '' },
  companyEmail: { type: String, default: '' },
  companyAltEmail: { type: String, default: '' },
  companyPhone: { type: String, default: '' },
  country: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  zip: { type: String, default: '' },
  officeAddress: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
