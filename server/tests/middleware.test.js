/**
 * Middleware Unit Tests
 * Tests: JWT auth middleware, role authorization, input validators
 * Tool: Jest
 */

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Set test JWT secret
process.env.JWT_SECRET = 'test_secret_key_for_jest';

// ─── Mock User model ──────────────────────────────────────────────────────────
jest.mock('../models/mongodb/User');
jest.mock('../models/mongodb/AuditLog');
const User     = require('../models/mongodb/User');
const AuditLog = require('../models/mongodb/AuditLog');

const { protect, authorize, logAudit } = require('../middleware/auth');

// ─── Helper: mock express objects ────────────────────────────────────────────
const mockReq = (overrides = {}) => ({
  headers: {},
  user: null,
  ip: '127.0.0.1',
  get: jest.fn().mockReturnValue('test-agent'),
  ...overrides,
});

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

// ─── Test Suite ────────────────────────────────────────────────────────────────
describe('Middleware Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── protect middleware ──────────────────────────────────────────────────────
  describe('protect middleware (JWT verification)', () => {

    test('TC-038: Returns 401 if no Authorization header', async () => {
      const req = mockReq();
      const res = mockRes();

      await protect(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('TC-039: Returns 401 if token does not start with Bearer', async () => {
      const req = mockReq({ headers: { authorization: 'Basic abc123' } });
      const res = mockRes();

      await protect(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('TC-040: Returns 401 if token is expired/invalid', async () => {
      const req = mockReq({ headers: { authorization: 'Bearer invalid.token.here' } });
      const res = mockRes();

      await protect(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringMatching(/invalid|expired/i),
      }));
    });

    test('TC-041: Returns 401 if user not found in DB (deactivated)', async () => {
      const token = jwt.sign({ id: 'user123' }, process.env.JWT_SECRET);
      const req = mockReq({ headers: { authorization: `Bearer ${token}` } });
      const res = mockRes();

      User.findOne.mockResolvedValueOnce(null);

      await protect(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringMatching(/invalid|deactivated/i),
      }));
    });

    test('TC-042: Sets req.user and calls next() for valid token', async () => {
      const userId = new mongoose.Types.ObjectId();
      const token  = jwt.sign({ id: userId.toString() }, process.env.JWT_SECRET);
      const req    = mockReq({ headers: { authorization: `Bearer ${token}` } });
      const res    = mockRes();

      User.findOne.mockResolvedValueOnce({
        id: userId.toString(),
        name: 'Test User',
        email: 'test@test.com',
        role: 'admin',
        phone: '9876543210',
        isActive: true,
      });

      await protect(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(req.user).toMatchObject({
        name: 'Test User',
        role: 'admin',
      });
    });

    test('TC-043: req.user.password is never set by protect middleware', async () => {
      const userId = new mongoose.Types.ObjectId();
      const token  = jwt.sign({ id: userId.toString() }, process.env.JWT_SECRET);
      const req    = mockReq({ headers: { authorization: `Bearer ${token}` } });
      const res    = mockRes();

      User.findOne.mockResolvedValueOnce({
        id: userId.toString(),
        name: 'User',
        email: 'u@u.com',
        role: 'staff',
        phone: '',
        password: 'hashed_password_should_not_appear',
        isActive: true,
      });

      await protect(req, res, mockNext);

      expect(req.user.password).toBeUndefined();
    });
  });

  // ── authorize middleware ────────────────────────────────────────────────────
  describe('authorize middleware (RBAC)', () => {

    test('TC-044: Returns 403 if user role is not in allowed list', () => {
      const req = { user: { role: 'staff' } };
      const res = mockRes();
      const next = jest.fn();

      authorize('admin', 'manager')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
      expect(next).not.toHaveBeenCalled();
    });

    test('TC-045: Calls next() if user role is allowed', () => {
      const req = { user: { role: 'admin' } };
      const res = mockRes();
      const next = jest.fn();

      authorize('admin', 'manager')(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('TC-046: RBAC works for manager role', () => {
      const req = { user: { role: 'manager' } };
      const res = mockRes();
      const next = jest.fn();

      authorize('admin', 'manager')(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('TC-047: RBAC blocks admin from staff-only resources', () => {
      const req = { user: { role: 'admin' } };
      const res = mockRes();
      const next = jest.fn();

      authorize('staff')(req, res, next); // staff-only resource

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  // ── logAudit helper ────────────────────────────────────────────────────────
  describe('logAudit helper', () => {

    test('TC-048: Creates audit log entry with correct fields', async () => {
      AuditLog.create.mockResolvedValueOnce({});
      const req = mockReq();

      await logAudit({
        userId: 'user123',
        userName: 'Admin',
        userRole: 'admin',
        action: 'SHIPMENT_CREATED',
        resource: 'shipment',
        resourceId: 'SHP-001',
        description: 'Test audit log',
        req,
      });

      expect(AuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'user123',
        action: 'SHIPMENT_CREATED',
        resource: 'shipment',
        status: 'success',
      }));
    });

    test('TC-049: logAudit does not throw if DB insert fails', async () => {
      AuditLog.create.mockRejectedValueOnce(new Error('DB error'));

      // Should not throw — errors are silently caught
      await expect(logAudit({
        userId: 'u1', userName: 'U', userRole: 'admin',
        action: 'TEST', resource: 'test', req: mockReq(),
      })).resolves.not.toThrow();
    });
  });
});
