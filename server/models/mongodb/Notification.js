const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: Number, required: true }, // MySQL user ID
  userRole: { type: String },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['shipment_created', 'status_update', 'delivery_assigned', 'delivery_completed', 'alert', 'system', 'report_ready'],
    default: 'system',
  },
  relatedId: { type: String, default: null }, // shipment tracking ID
  isRead: { type: Boolean, default: false },
  readAt: { type: Date, default: null },
}, {
  timestamps: true,
});

notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
