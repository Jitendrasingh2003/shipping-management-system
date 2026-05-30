const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
    enum: ['created', 'processing', 'dispatched', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned', 'cancelled'],
  },
  location: { type: String, default: '' },
  description: { type: String, default: '' },
  updatedBy: { type: String, default: '' },
  updatedByRole: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
});

const shipmentSchema = new mongoose.Schema({
  trackingId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  // Sender Info
  senderName: { type: String, required: true },
  senderEmail: { type: String, required: true },
  senderPhone: { type: String, required: true },
  senderAddress: { type: String, required: true },
  senderCity: { type: String, required: true },
  senderState: { type: String, required: true },
  senderZip: { type: String, required: true },
  senderCountry: { type: String, default: 'India' },

  // Receiver Info
  receiverName: { type: String, required: true },
  receiverEmail: { type: String, required: true },
  receiverPhone: { type: String, required: true },
  receiverAddress: { type: String, required: true },
  receiverCity: { type: String, required: true },
  receiverState: { type: String, required: true },
  receiverZip: { type: String, required: true },
  receiverCountry: { type: String, default: 'India' },

  // Package Details
  packageType: {
    type: String,
    enum: ['document', 'parcel', 'fragile', 'perishable', 'electronics', 'clothing', 'industrial', 'other'],
    required: true,
  },
  weight: { type: Number, required: true }, // in kg
  dimensions: {
    length: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
  },
  description: { type: String, default: '' },
  value: { type: Number, default: 0 }, // declared value in INR

  // Shipping Details
  serviceType: {
    type: String,
    enum: ['standard', 'express', 'overnight', 'economy'],
    default: 'standard',
  },
  shippingCost: { type: Number, required: true },
  estimatedDelivery: { type: Date },

  // Status
  status: {
    type: String,
    enum: ['created', 'processing', 'dispatched', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned', 'cancelled'],
    default: 'created',
  },
  statusHistory: [statusHistorySchema],
  currentLocation: { type: String, default: '' },

  // Assignment
  assignedTo: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
  },

  // Meta
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  },
  specialInstructions: { type: String, default: '' },
  proofOfDelivery: {
    image: { type: String, default: null },
    signature: { type: String, default: null },
    receivedBy: { type: String, default: '' },
    deliveredAt: { type: Date, default: null },
  },
  invoiceId: { type: String, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdByName: { type: String },

  isArchived: { type: Boolean, default: false },
}, {
  timestamps: true,
});

// Auto-generate tracking ID
shipmentSchema.pre('validate', function (next) {
  if (!this.trackingId) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = 'SHP';
    for (let i = 0; i < 9; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.trackingId = id;
  }
  next();
});

shipmentSchema.index({ status: 1 });
shipmentSchema.index({ 'assignedTo.userId': 1 });
shipmentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Shipment', shipmentSchema);
