const mongoose = require('mongoose');

const shipSchema = new mongoose.Schema({
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  flag: { type: String, default: 'India' },
  imoNumber: { type: String, default: '' },
  type: { type: String, default: '' },
  status: { type: String, enum: ['Active', 'Inactive', 'Under Maintenance'], default: 'Active' },
  image: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Ship', shipSchema);
