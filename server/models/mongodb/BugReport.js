const mongoose = require('mongoose');

const bugReportSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, required: true },
  priority:    { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  status:      { type: String, enum: ['open', 'in-progress', 'resolved', 'closed'], default: 'open' },
  category:    { type: String, enum: ['UI', 'Backend', 'Database', 'Performance', 'Security', 'Other'], default: 'Other' },
  reportedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reporterName:{ type: String, default: '' },
  assignedTo:  { type: String, default: '' },
  resolvedAt:  { type: Date, default: null },
  resolution:  { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('BugReport', bugReportSchema);
