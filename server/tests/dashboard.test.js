/**
 * Dashboard & Validator Unit Tests
 * Tests: dashboard stats API, input validators
 * Tool: Jest + supertest
 */

const request    = require('supertest');
const mongoose   = require('mongoose');
const { body, validationResult } = require('express-validator');

// ─── Mock dependencies ─────────────────────────────────────────────────────────
jest.mock('../models/mongodb/Shipment');
jest.mock('../models/mongodb/User');
jest.mock('../models/mongodb/Invoice');
jest.mock('../models/mongodb/AuditLog');
jest.mock('../models/mongodb/Ship');
jest.mock('../models/mongodb/Voyage');
jest.mock('../models/mongodb/Alarm');
jest.mock('../models/mongodb/Crew');
jest.mock('../models/mongodb/DeckLog');
jest.mock('../middleware/auth', () => ({
  logAudit: jest.fn().mockResolvedValue(undefined),
  protect: jest.fn((req, res, next) => {
    req.user = { id: 'admin123', name: 'Test Admin', role: req._testRole || 'admin' };
    next();
  }),
  authorize: jest.fn(() => (req, res, next) => next()),
}));

const Shipment = require('../models/mongodb/Shipment');
const User     = require('../models/mongodb/User');
const Invoice  = require('../models/mongodb/Invoice');
const AuditLog = require('../models/mongodb/AuditLog');
const app      = require('../server');

// ─── Test Suite ────────────────────────────────────────────────────────────────
describe('Dashboard & Validator Tests', () => {

  // ── GET /api/dashboard/stats ────────────────────────────────────────────────
  describe('GET /api/dashboard/stats (Admin)', () => {

    const setupAdminMocks = () => {
      Shipment.countDocuments.mockResolvedValue(10);
      User.countDocuments.mockResolvedValue(5);
      Invoice.countDocuments.mockResolvedValue(8);
      Invoice.aggregate.mockResolvedValueOnce([{ _id: null, total: 50000 }]);
      Shipment.aggregate
        .mockResolvedValueOnce([{ _id: { year: 2024, month: 6 }, count: 5 }]) // monthlyTrend
        .mockResolvedValueOnce([{ _id: 'delivered', count: 3 }])               // statusDist
        .mockResolvedValueOnce([{ _id: 'standard', count: 4 }]);               // serviceTypeDist
    };

    test('TC-050: Returns 200 with dashboard stats for admin', async () => {
      setupAdminMocks();

      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', 'Bearer validtoken');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.stats).toBeDefined();
    });

    test('TC-051: Admin stats include totalShipments, revenue, onTimeRate', async () => {
      setupAdminMocks();

      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', 'Bearer validtoken');

      expect(res.body.stats).toHaveProperty('totalShipments');
      expect(res.body.stats).toHaveProperty('totalRevenue');
      expect(res.body.stats).toHaveProperty('onTimeRate');
    });

    test('TC-052: Admin stats include monthlyTrend array', async () => {
      setupAdminMocks();

      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', 'Bearer validtoken');

      expect(Array.isArray(res.body.stats.monthlyTrend)).toBe(true);
    });

    test('TC-053: Admin stats include statusDist array', async () => {
      setupAdminMocks();

      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', 'Bearer validtoken');

      expect(Array.isArray(res.body.stats.statusDist)).toBe(true);
    });
  });

  // ── GET /api/dashboard/audit-logs ──────────────────────────────────────────
  describe('GET /api/dashboard/audit-logs', () => {

    test('TC-054: Returns paginated audit logs', async () => {
      const mockLogs = [
        { _id: 'l1', action: 'USER_LOGIN', userName: 'Admin', createdAt: new Date() },
        { _id: 'l2', action: 'SHIPMENT_CREATED', userName: 'Manager', createdAt: new Date() },
      ];
      AuditLog.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockLogs),
      });
      AuditLog.countDocuments.mockResolvedValue(2);

      const res = await request(app)
        .get('/api/dashboard/audit-logs')
        .set('Authorization', 'Bearer validtoken');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.logs)).toBe(true);
      expect(res.body.total).toBe(2);
    });
  });

  // ── Input Validators ────────────────────────────────────────────────────────
  describe('Input Validators (validateLogin)', () => {
    const { validateLogin } = require('../middleware/validators');

    const runValidator = async (body) => {
      const express  = require('express');
      const testApp  = express();
      testApp.use(express.json());
      testApp.post('/test', validateLogin, (req, res) => res.json({ success: true }));

      return request(testApp).post('/test').send(body);
    };

    test('TC-055: validateLogin passes with valid email and password', async () => {
      const res = await runValidator({ email: 'test@example.com', password: 'Valid@123' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('TC-056: validateLogin rejects invalid email format', async () => {
      const res = await runValidator({ email: 'not-email', password: 'Valid@123' });
      expect(res.status).toBe(400);
    });

    test('TC-057: validateLogin rejects empty password', async () => {
      const res = await runValidator({ email: 'test@example.com', password: '' });
      expect(res.status).toBe(400);
    });

    test('TC-058: validateLogin rejects password shorter than 6 chars', async () => {
      const res = await runValidator({ email: 'test@example.com', password: 'abc' });
      expect(res.status).toBe(400);
    });
  });

  describe('Input Validators (validateCreateShipment)', () => {
    const { validateCreateShipment } = require('../middleware/validators');

    const runValidator = async (body) => {
      const express  = require('express');
      const testApp  = express();
      testApp.use(express.json());
      testApp.post('/test', validateCreateShipment, (req, res) => res.json({ success: true }));

      return request(testApp).post('/test').send(body);
    };

    const validBody = {
      senderName: 'Ramesh', receiverName: 'Suresh',
      senderCity: 'Mumbai', receiverCity: 'Delhi',
      weight: 2.5, serviceType: 'standard',
    };

    test('TC-059: Shipment validator passes with all required fields', async () => {
      const res = await runValidator(validBody);
      expect(res.status).toBe(200);
    });

    test('TC-060: Shipment validator rejects weight of 0', async () => {
      const res = await runValidator({ ...validBody, weight: 0 });
      expect(res.status).toBe(400);
    });

    test('TC-061: Shipment validator rejects invalid serviceType', async () => {
      const res = await runValidator({ ...validBody, serviceType: 'rocket' });
      expect(res.status).toBe(400);
    });

    test('TC-062: Shipment validator rejects invalid priority', async () => {
      const res = await runValidator({ ...validBody, priority: 'super_urgent' });
      expect(res.status).toBe(400);
    });

    test('TC-063: Shipment validator sanitizes XSS in description', async () => {
      const res = await runValidator({
        ...validBody,
        description: '<script>alert("xss")</script>',
      });
      // Should pass (escaped), not blocked
      expect(res.status).toBe(200);
    });
  });

  // ── Health Check ────────────────────────────────────────────────────────────
  describe('GET /api/health', () => {
    test('TC-064: Health endpoint returns 200 with running status', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/running/i);
    });
  });

  // ── 404 Handler ─────────────────────────────────────────────────────────────
  describe('404 Handler', () => {
    test('TC-065: Returns 404 for unknown routes', async () => {
      const res = await request(app).get('/api/nonexistent-route');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
