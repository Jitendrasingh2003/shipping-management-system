const jwt = require('jsonwebtoken');
const User = require('../models/mongodb/User');
const AuditLog = require('../models/mongodb/AuditLog');

// Protect routes — verify JWT
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.id, isActive: true });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Token invalid or user deactivated.' });
    }
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired.' });
  }
};

// Authorize by role(s)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized for this resource.`,
      });
    }
    next();
  };
};

// Audit logger helper
const logAudit = async ({ userId, userName, userRole, action, resource, resourceId, description, changes, req, status = 'success' }) => {
  try {
    await AuditLog.create({
      userId,
      userName,
      userRole,
      action,
      resource: resource || '',
      resourceId: resourceId || '',
      description,
      changes: changes || null,
      ipAddress: req?.ip || '',
      userAgent: req?.get('user-agent') || '',
      status,
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

module.exports = { protect, authorize, logAudit };
