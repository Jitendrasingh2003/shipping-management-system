const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userRole: { type: String, required: true },
  action: {
    type: String,
    required: true,
    enum: [
      'USER_LOGIN', 'USER_LOGOUT', 'USER_CREATED', 'USER_UPDATED', 'USER_DELETED',
      'SHIPMENT_CREATED', 'SHIPMENT_UPDATED', 'SHIPMENT_STATUS_CHANGED',
      'SHIPMENT_ASSIGNED', 'SHIPMENT_DELETED', 'SHIPMENT_ARCHIVED',
      'INVOICE_CREATED', 'INVOICE_UPDATED',
      'REPORT_GENERATED', 'NOTIFICATION_SENT',
      'SYSTEM_SETTINGS_CHANGED',
    ],
  },
  resource: { type: String, default: '' }, // e.g., 'shipment', 'user', 'invoice'
  resourceId: { type: String, default: '' },
  description: { type: String, required: true },
  changes: { type: mongoose.Schema.Types.Mixed, default: null }, // before/after
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success',
  },
}, {
  timestamps: true,
});

auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
