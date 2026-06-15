const { body, param, query, validationResult } = require('express-validator');

// ─── Helper: send validation errors ───────────────────────────────────────────
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return res.status(400).json({
      success: false,
      message: firstError.msg,
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ─── Auth Validators ───────────────────────────────────────────────────────────
const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  validate,
];

const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Full name is required.')
    .isLength({ min: 2, max: 60 }).withMessage('Name must be 2–60 characters.'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.'),
  body('companyName')
    .trim()
    .notEmpty().withMessage('Company name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Company name must be 2–100 characters.'),
  validate,
];

const validateChangePassword = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required.'),
  body('newPassword')
    .notEmpty().withMessage('New password is required.')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.'),
  validate,
];

// ─── Shipment Validators ───────────────────────────────────────────────────────
const validateCreateShipment = [
  body('senderName')
    .trim()
    .notEmpty().withMessage('Sender name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Sender name must be 2–100 characters.')
    .escape(),
  body('senderEmail')
    .optional({ checkFalsy: true })
    .isEmail().withMessage('Sender email must be valid.')
    .normalizeEmail(),
  body('senderPhone')
    .optional({ checkFalsy: true })
    .matches(/^[+\d\s\-()]{7,20}$/).withMessage('Sender phone format is invalid.'),
  body('senderCity')
    .trim()
    .notEmpty().withMessage('Sender city is required.')
    .escape(),
  body('receiverName')
    .trim()
    .notEmpty().withMessage('Receiver name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Receiver name must be 2–100 characters.')
    .escape(),
  body('receiverEmail')
    .optional({ checkFalsy: true })
    .isEmail().withMessage('Receiver email must be valid.')
    .normalizeEmail(),
  body('receiverCity')
    .trim()
    .notEmpty().withMessage('Receiver city is required.')
    .escape(),
  body('weight')
    .notEmpty().withMessage('Package weight is required.')
    .isFloat({ min: 0.01, max: 9999 }).withMessage('Weight must be between 0.01 and 9999 kg.'),
  body('serviceType')
    .notEmpty().withMessage('Service type is required.')
    .isIn(['economy', 'standard', 'express', 'overnight'])
    .withMessage('Invalid service type. Choose: economy, standard, express, overnight.'),
  body('packageType')
    .optional()
    .isIn(['document', 'parcel', 'fragile', 'perishable', 'electronics', 'clothing', 'industrial', 'other'])
    .withMessage('Invalid package type.'),
  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('Invalid priority. Choose: low, normal, high, urgent.'),
  body('value')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 }).withMessage('Declared value must be a positive number.'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters.')
    .escape(),
  body('specialInstructions')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Special instructions must not exceed 500 characters.')
    .escape(),
  validate,
];

const validateUpdateStatus = [
  body('status')
    .notEmpty().withMessage('Status is required.')
    .isIn(['created','processing','dispatched','picked_up','in_transit','out_for_delivery','delivered','failed','returned','cancelled'])
    .withMessage('Invalid status value.'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Location must not exceed 200 characters.')
    .escape(),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters.')
    .escape(),
  validate,
];

const validateAssignShipment = [
  body('staffId')
    .notEmpty().withMessage('Staff ID is required.')
    .isMongoId().withMessage('Invalid staff ID format.'),
  validate,
];

// ─── User Validators ───────────────────────────────────────────────────────────
const validateCreateUser = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ min: 2, max: 60 }).withMessage('Name must be 2–60 characters.'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Valid email is required.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  body('role')
    .notEmpty().withMessage('Role is required.')
    .isIn(['admin', 'manager', 'staff'])
    .withMessage('Invalid role. Choose: admin, manager, staff.'),
  validate,
];

// ─── ID Param Validator ────────────────────────────────────────────────────────
const validateMongoId = [
  param('id')
    .isMongoId().withMessage('Invalid ID format.'),
  validate,
];

module.exports = {
  validateLogin,
  validateRegister,
  validateChangePassword,
  validateCreateShipment,
  validateUpdateStatus,
  validateAssignShipment,
  validateCreateUser,
  validateMongoId,
  validate,
};
