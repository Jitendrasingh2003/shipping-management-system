const Shipment = require('../models/mongodb/Shipment');
const User = require('../models/mongodb/User');
const Invoice = require('../models/mongodb/Invoice');
const AuditLog = require('../models/mongodb/AuditLog');
const { logAudit } = require('../middleware/auth');

// @desc  Dashboard stats (role-filtered)
// @route GET /api/dashboard/stats
const getDashboardStats = async (req, res, next) => {
  try {
    const role = req.user.role;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    if (role === 'admin') {
      const [
        totalShipments, delivered, inTransit, pending, failed,
        thisMonthShipments, weeklyShipments,
        totalUsers, activeStaff,
        totalInvoices, paidInvoices,
      ] = await Promise.all([
        Shipment.countDocuments({ isArchived: false }),
        Shipment.countDocuments({ status: 'delivered', isArchived: false }),
        Shipment.countDocuments({ status: { $in: ['in_transit', 'out_for_delivery', 'picked_up'] }, isArchived: false }),
        Shipment.countDocuments({ status: { $in: ['created', 'processing', 'dispatched'] }, isArchived: false }),
        Shipment.countDocuments({ status: { $in: ['failed', 'returned'] }, isArchived: false }),
        Shipment.countDocuments({ createdAt: { $gte: startOfMonth }, isArchived: false }),
        Shipment.countDocuments({ createdAt: { $gte: startOfWeek }, isArchived: false }),
        User.countDocuments({ isActive: true }),
        User.countDocuments({ role: 'staff', isActive: true }),
        Invoice.countDocuments(),
        Invoice.countDocuments({ status: 'paid' }),
      ]);

      // Revenue from paid invoices
      const revenueResult = await Invoice.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);
      const totalRevenue = parseFloat(revenueResult[0]?.total || 0);

      // Monthly shipment trend (last 6 months)
      const monthlyTrend = await Shipment.aggregate([
        { $match: { createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) }, isArchived: false } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);

      // Status distribution
      const statusDist = await Shipment.aggregate([
        { $match: { isArchived: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);

      // Service type distribution
      const serviceTypeDist = await Shipment.aggregate([
        { $match: { isArchived: false } },
        { $group: { _id: '$serviceType', count: { $sum: 1 } } },
      ]);

      const onTimeRate = totalShipments > 0 ? Math.round((delivered / totalShipments) * 100) : 0;

      res.json({
        success: true, role: 'admin',
        stats: {
          totalShipments, delivered, inTransit, pending, failed,
          thisMonthShipments, weeklyShipments,
          totalUsers, activeStaff, onTimeRate,
          totalRevenue, totalInvoices, paidInvoices,
          monthlyTrend, statusDist, serviceTypeDist,
        },
      });

    } else if (role === 'manager') {
      const [total, pending, dispatched, inTransit, delivered] = await Promise.all([
        Shipment.countDocuments({ isArchived: false }),
        Shipment.countDocuments({ status: { $in: ['created', 'processing'] }, isArchived: false }),
        Shipment.countDocuments({ status: 'dispatched', isArchived: false }),
        Shipment.countDocuments({ status: { $in: ['in_transit', 'out_for_delivery', 'picked_up'] }, isArchived: false }),
        Shipment.countDocuments({ status: 'delivered', isArchived: false }),
      ]);

      const staffList = await User.find({ role: 'staff', isActive: true }).select('id name');
      const staffWorkload = await Promise.all(staffList.map(async (s) => {
        const count = await Shipment.countDocuments({ 'assignedTo.userId': s.id, status: { $nin: ['delivered', 'cancelled'] } });
        return { name: s.name, activeDeliveries: count };
      }));

      const recentShipments = await Shipment.find({ isArchived: false }).sort({ createdAt: -1 }).limit(5);

      res.json({
        success: true, role: 'manager',
        stats: { total, pending, dispatched, inTransit, delivered, staffWorkload, recentShipments },
      });

    } else if (role === 'staff') {
      const [assigned, pickedUp, inTransit, delivered, total] = await Promise.all([
        Shipment.countDocuments({ 'assignedTo.userId': req.user.id, status: 'dispatched' }),
        Shipment.countDocuments({ 'assignedTo.userId': req.user.id, status: 'picked_up' }),
        Shipment.countDocuments({ 'assignedTo.userId': req.user.id, status: { $in: ['in_transit', 'out_for_delivery'] } }),
        Shipment.countDocuments({ 'assignedTo.userId': req.user.id, status: 'delivered' }),
        Shipment.countDocuments({ 'assignedTo.userId': req.user.id }),
      ]);

      const todayDeliveries = await Shipment.find({
        'assignedTo.userId': req.user.id,
        status: { $in: ['dispatched', 'picked_up', 'in_transit', 'out_for_delivery'] },
        isArchived: false,
      }).sort({ updatedAt: -1 }).limit(10);

      res.json({
        success: true, role: 'staff',
        stats: { assigned, pickedUp, inTransit, delivered, total, todayDeliveries },
      });
    }
  } catch (err) {
    next(err);
  }
};

// @desc  Audit logs
// @route GET /api/audit-logs
// @access Admin
const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, action, userId } = req.query;
    const query = {};
    if (action) query.action = action;
    if (userId) query.userId = userId;

    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      AuditLog.countDocuments(query),
    ]);

    res.json({ success: true, logs, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// @desc  Get invoices
// @route GET /api/invoices
// @access Admin, Manager
const getInvoices = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [invoices, total] = await Promise.all([
      Invoice.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Invoice.countDocuments(query),
    ]);

    res.json({ success: true, invoices, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboardStats, getAuditLogs, getInvoices };
