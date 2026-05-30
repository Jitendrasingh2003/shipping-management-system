const Shipment = require('../models/mongodb/Shipment');
const Notification = require('../models/mongodb/Notification');
const Invoice = require('../models/mongodb/Invoice');
const User = require('../models/mongodb/User');
const { logAudit } = require('../middleware/auth');
const { sendEmail, emailTemplates } = require('../utils/email');
const { v4: uuidv4 } = require('uuid');

// Helper: calculate shipping cost
const calculateCost = (weight, serviceType) => {
  const base = { standard: 50, express: 150, overnight: 300, economy: 30 };
  return Math.round((base[serviceType] || 50) + weight * 20);
};

// Helper: calculate estimated delivery
const calcDelivery = (serviceType) => {
  const days = { standard: 5, express: 2, overnight: 1, economy: 10 };
  const date = new Date();
  date.setDate(date.getDate() + (days[serviceType] || 5));
  return date;
};

// @desc  Get all shipments (paginated + filtered)
// @route GET /api/shipments
// @access Admin, Manager
const getShipments = async (req, res, next) => {
  try {
    const { status, priority, search, page = 1, limit = 10, dateFrom, dateTo, isArchived } = req.query;
    const query = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (isArchived !== undefined) query.isArchived = isArchived === 'true';
    else query.isArchived = false;

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo + 'T23:59:59');
    }

    if (search) {
      query.$or = [
        { trackingId: { $regex: search, $options: 'i' } },
        { senderName: { $regex: search, $options: 'i' } },
        { receiverName: { $regex: search, $options: 'i' } },
        { receiverCity: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [shipments, total] = await Promise.all([
      Shipment.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Shipment.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: shipments.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page),
      shipments,
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Get shipments assigned to logged-in staff
// @route GET /api/shipments/assigned
// @access Staff
const getAssignedShipments = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { 'assignedTo.userId': req.user.id, isArchived: false };
    if (status) query.status = status;

    const shipments = await Shipment.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: shipments.length, shipments });
  } catch (err) {
    next(err);
  }
};

// @desc  Get single shipment
// @route GET /api/shipments/:id
// @access Admin, Manager, Staff (own)
const getShipmentById = async (req, res, next) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found.' });

    // Staff can only see own assigned
    if (req.user.role === 'staff' && String(shipment.assignedTo?.userId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, shipment });
  } catch (err) {
    next(err);
  }
};

// @desc  Track by tracking ID (no auth)
// @route GET /api/shipments/track/:trackingId
// @access Public
const trackShipment = async (req, res, next) => {
  try {
    const shipment = await Shipment.findOne({ trackingId: req.params.trackingId.toUpperCase() });
    if (!shipment) return res.status(404).json({ success: false, message: 'Tracking ID not found.' });
    res.json({ success: true, shipment });
  } catch (err) {
    next(err);
  }
};

// @desc  Create shipment
// @route POST /api/shipments
// @access Admin, Manager
const createShipment = async (req, res, next) => {
  try {
    const { serviceType, weight, ...rest } = req.body;
    const shippingCost = rest.shippingCost || calculateCost(weight, serviceType);
    const estimatedDelivery = rest.estimatedDelivery || calcDelivery(serviceType);

    const shipment = await Shipment.create({
      ...rest,
      weight,
      serviceType,
      shippingCost,
      estimatedDelivery,
      createdBy: req.user.id,
      createdByName: req.user.name,
      status: 'created',
      statusHistory: [{
        status: 'created',
        description: 'Shipment created in system',
        updatedBy: req.user.name,
        updatedByRole: req.user.role,
      }],
    });

    // Create invoice in MongoDB
    const invoiceNum = `INV-${Date.now()}`;
    const tax = Math.round(shippingCost * 0.18);
    await Invoice.create({
      invoiceNumber: invoiceNum,
      shipmentId: shipment._id,
      trackingId: shipment.trackingId,
      senderName: shipment.senderName,
      receiverName: shipment.receiverName,
      amount: shippingCost,
      tax,
      totalAmount: shippingCost + tax,
      status: 'pending',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdBy: req.user.id,
    });

    // Notify all admins + managers
    const managers = await User.find({ role: { $in: ['admin', 'manager'] }, isActive: true });
    await Notification.insertMany(managers.map(m => ({
      userId: m.id, userRole: m.role,
      title: 'New Shipment Created',
      message: `${shipment.trackingId} | ${shipment.senderName} → ${shipment.receiverName}`,
      type: 'shipment_created',
      relatedId: shipment.trackingId,
    })));

    // Global socket emit
    if (req.app.get('io')) {
      req.app.get('io').emit('shipment:new', { trackingId: shipment.trackingId });
    }

    await logAudit({
      userId: req.user.id, userName: req.user.name, userRole: req.user.role,
      action: 'SHIPMENT_CREATED', resource: 'shipment', resourceId: shipment.trackingId,
      description: `Shipment created: ${shipment.trackingId}`, req,
    });

    // Send email (non-blocking)
    const emailData = emailTemplates.shipmentCreated(shipment);
    sendEmail({ to: shipment.senderEmail, ...emailData }).catch(() => {});

    res.status(201).json({ success: true, message: 'Shipment created.', shipment });
  } catch (err) {
    next(err);
  }
};

// @desc  Update shipment
// @route PUT /api/shipments/:id
// @access Admin, Manager
const updateShipment = async (req, res, next) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found.' });

    const before = { status: shipment.status, priority: shipment.priority };
    const allowedFields = [
      'senderName','senderEmail','senderPhone','senderAddress','senderCity','senderState','senderZip',
      'receiverName','receiverEmail','receiverPhone','receiverAddress','receiverCity','receiverState','receiverZip',
      'weight','dimensions','packageType','serviceType','description','value',
      'priority','specialInstructions','estimatedDelivery','shippingCost',
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) shipment[field] = req.body[field];
    });

    await shipment.save();

    await logAudit({
      userId: req.user.id, userName: req.user.name, userRole: req.user.role,
      action: 'SHIPMENT_UPDATED', resource: 'shipment', resourceId: shipment.trackingId,
      description: `Shipment updated: ${shipment.trackingId}`,
      changes: { before, after: { status: shipment.status, priority: shipment.priority } }, req,
    });

    res.json({ success: true, message: 'Shipment updated.', shipment });
  } catch (err) {
    next(err);
  }
};

// @desc  Update status
// @route PATCH /api/shipments/:id/status
// @access Admin, Manager, Staff (restricted)
const updateStatus = async (req, res, next) => {
  try {
    const { status, location, description } = req.body;
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found.' });

    // Staff can only update their own assigned shipments
    if (req.user.role === 'staff' && String(shipment.assignedTo?.userId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const oldStatus = shipment.status;
    shipment.status = status;
    if (location) shipment.currentLocation = location;
    shipment.statusHistory.push({
      status,
      location: location || shipment.currentLocation,
      description: description || `Status updated to ${status}`,
      updatedBy: req.user.name,
      updatedByRole: req.user.role,
    });

    if (status === 'delivered') {
      shipment.proofOfDelivery.deliveredAt = new Date();
      if (req.body.receivedBy) shipment.proofOfDelivery.receivedBy = req.body.receivedBy;
      // Update invoice to paid
      await Invoice.updateOne({ trackingId: shipment.trackingId }, { status: 'paid', paidAt: new Date() });
    }

    await shipment.save();

    // Notify assigned staff if any change by manager
    if (shipment.assignedTo?.userId && req.user.role !== 'staff') {
      await Notification.create({
        userId: shipment.assignedTo.userId, userRole: 'staff',
        title: 'Shipment Status Changed',
        message: `${shipment.trackingId}: ${oldStatus} → ${status}`,
        type: 'status_update',
        relatedId: shipment.trackingId,
      });
    }

    // Socket emit
    if (req.app.get('io')) {
      req.app.get('io').to(`shipment:${shipment.trackingId}`).emit('status:update', {
        trackingId: shipment.trackingId, status, location,
      });
    }

    await logAudit({
      userId: req.user.id, userName: req.user.name, userRole: req.user.role,
      action: 'SHIPMENT_STATUS_CHANGED', resource: 'shipment', resourceId: shipment.trackingId,
      description: `Status: ${oldStatus} → ${status}`,
      changes: { before: oldStatus, after: status }, req,
    });

    const emailData = emailTemplates.statusUpdate(shipment, status);
    sendEmail({ to: shipment.senderEmail, ...emailData }).catch(() => {});

    res.json({ success: true, message: 'Status updated.', shipment });
  } catch (err) {
    next(err);
  }
};

// @desc  Assign shipment to staff
// @route PATCH /api/shipments/:id/assign
// @access Admin, Manager
const assignShipment = async (req, res, next) => {
  try {
    const { staffId } = req.body;
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found.' });

    const staff = await User.findOne({ _id: staffId, role: 'staff', isActive: true });
    if (!staff) return res.status(404).json({ success: false, message: 'Staff member not found.' });

    shipment.assignedTo = { userId: staff.id, name: staff.name, phone: staff.phone };
    if (shipment.status === 'created' || shipment.status === 'processing') {
      shipment.status = 'dispatched';
      shipment.statusHistory.push({
        status: 'dispatched',
        description: `Assigned to ${staff.name} and dispatched`,
        updatedBy: req.user.name,
        updatedByRole: req.user.role,
      });
    }
    await shipment.save();

    await Notification.create({
      userId: staff.id, userRole: 'staff',
      title: 'New Delivery Assigned',
      message: `${shipment.trackingId} | ${shipment.senderCity} → ${shipment.receiverCity}`,
      type: 'delivery_assigned',
      relatedId: shipment.trackingId,
    });

    // Socket emit to staff
    if (req.app.get('io')) {
      req.app.get('io').to(`user:${staff.id}`).emit('delivery:assigned', { trackingId: shipment.trackingId });
    }

    await logAudit({
      userId: req.user.id, userName: req.user.name, userRole: req.user.role,
      action: 'SHIPMENT_ASSIGNED', resource: 'shipment', resourceId: shipment.trackingId,
      description: `Assigned ${shipment.trackingId} to ${staff.name}`, req,
    });

    res.json({ success: true, message: `Shipment assigned to ${staff.name}.`, shipment });
  } catch (err) {
    next(err);
  }
};

// @desc  Upload proof of delivery
// @route PATCH /api/shipments/:id/proof
// @access Staff
const uploadProof = async (req, res, next) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found.' });
    if (String(shipment.assignedTo?.userId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const { receivedBy } = req.body;
    if (req.file) shipment.proofOfDelivery.image = req.file.filename;
    if (receivedBy) shipment.proofOfDelivery.receivedBy = receivedBy;
    shipment.proofOfDelivery.deliveredAt = new Date();
    shipment.status = 'delivered';
    shipment.statusHistory.push({
      status: 'delivered',
      description: `Delivered. Received by: ${receivedBy || 'N/A'}`,
      updatedBy: req.user.name,
      updatedByRole: 'staff',
    });

    await shipment.save();
    res.json({ success: true, message: 'Proof uploaded. Shipment marked delivered.', shipment });
  } catch (err) {
    next(err);
  }
};

// @desc  Delete (archive) shipment
// @route DELETE /api/shipments/:id
// @access Admin
const deleteShipment = async (req, res, next) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found.' });

    shipment.isArchived = true;
    await shipment.save();

    await logAudit({
      userId: req.user.id, userName: req.user.name, userRole: req.user.role,
      action: 'SHIPMENT_ARCHIVED', resource: 'shipment', resourceId: shipment.trackingId,
      description: `Shipment archived: ${shipment.trackingId}`, req,
    });

    res.json({ success: true, message: 'Shipment archived.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getShipments, getAssignedShipments, getShipmentById, trackShipment,
  createShipment, updateShipment, updateStatus, assignShipment, uploadProof, deleteShipment,
};
