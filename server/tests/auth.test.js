/**
 * Auth Controller Unit Tests
 * Tests: login, register, JWT generation, password validation
 * Tool: Jest + supertest
 */

const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ─── Mock dependencies ─────────────────────────────────────────────────────────
jest.mock('../models/mongodb/User');
jest.mock('../models/mongodb/Notification');
jest.mock('../middleware/auth', () => ({
  logAudit: jest.fn().mockResolvedValue(undefined),
  protect: jest.fn((req, res, next) => next()),
  authorize: jest.fn(() => (req, res, next) => next()),
}));

const User = require('../models/mongodb/User');
const app  = require('../server');

// ─── Test Suite ────────────────────────────────────────────────────────────────
describe('Auth API Tests', () => {
  
  // ── POST /api/auth/login ────────────────────────────────────────────────────
  describe('POST /api/auth/login', () => {

    test('TC-001: Returns 400 if email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'Test@123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/email/i);
    });

    test('TC-002: Returns 400 if password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/password/i);
    });

    test('TC-003: Returns 400 if email format is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: 'Test@123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('TC-004: Returns 401 for non-existent user', async () => {
      User.findOne.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'notfound@example.com', password: 'Test@123' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid credentials/i);
    });

    test('TC-005: Returns 401 for wrong password', async () => {
      const hashedPassword = await bcrypt.hash('correctPassword123', 12);
      User.findOne.mockResolvedValueOnce({
        _id: new mongoose.Types.ObjectId(),
        id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'staff',
        isActive: true,
        lastLogin: null,
        save: jest.fn().mockResolvedValue(undefined),
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrongPassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('TC-006: Returns 401 for deactivated account', async () => {
      User.findOne.mockResolvedValueOnce({
        _id: new mongoose.Types.ObjectId(),
        email: 'inactive@example.com',
        isActive: false,
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'inactive@example.com', password: 'Test@123' });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/deactivated/i);
    });

    test('TC-007: Successful login returns token and user object', async () => {
      const hashedPassword = await bcrypt.hash('Test@123', 12);
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        id: 'user123',
        name: 'John Admin',
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'admin',
        phone: '9876543210',
        avatar: null,
        isActive: true,
        lastLogin: null,
        save: jest.fn().mockResolvedValue(undefined),
      };
      User.findOne.mockResolvedValueOnce(mockUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'Test@123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toMatchObject({
        name: 'John Admin',
        email: 'admin@test.com',
        role: 'admin',
      });
      expect(res.body.user.password).toBeUndefined(); // password should not be exposed
    });

    test('TC-008: Login response does not expose password hash', async () => {
      const hashedPassword = await bcrypt.hash('Test@123', 12);
      User.findOne.mockResolvedValueOnce({
        id: 'user123',
        name: 'Test',
        email: 'test@test.com',
        password: hashedPassword,
        role: 'staff',
        isActive: true,
        lastLogin: null,
        save: jest.fn().mockResolvedValue(undefined),
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'Test@123' });

      expect(res.body.token).toBeDefined();
      expect(res.body.user?.password).toBeUndefined();
    });
  });

  // ── POST /api/auth/register ─────────────────────────────────────────────────
  describe('POST /api/auth/register', () => {

    test('TC-009: Returns 400 if name is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@test.com', password: 'Test@123', companyName: 'TestCo' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/name/i);
    });

    test('TC-010: Returns 400 if company name is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'John', email: 'test@test.com', password: 'Test@123' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/company/i);
    });

    test('TC-011: Returns 400 if password is too short', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'John', email: 'test@test.com', password: 'abc', companyName: 'Co' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/6 characters/i);
    });

    test('TC-012: Returns 400 if email already exists', async () => {
      User.findOne.mockResolvedValueOnce({ email: 'existing@test.com' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John', email: 'existing@test.com',
          password: 'Test@123', companyName: 'TestCo',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already exists/i);
    });

    test('TC-013: Successful registration returns token', async () => {
      User.findOne.mockResolvedValueOnce(null); // no existing user
      const mockNewUser = {
        id: 'newuser123',
        name: 'New Manager',
        email: 'newmanager@test.com',
        role: 'manager',
        companyName: 'TestCo',
      };
      User.create.mockResolvedValueOnce(mockNewUser);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New Manager', email: 'newmanager@test.com',
          password: 'Manager@123', companyName: 'TestCo',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('manager');
    });

    test('TC-014: Password is hashed before storage (bcrypt)', async () => {
      User.findOne.mockResolvedValueOnce(null);
      let storedPassword = null;
      User.create.mockImplementationOnce(async (data) => {
        storedPassword = data.password;
        return { id: 'u1', name: data.name, email: data.email, role: 'manager', companyName: data.companyName };
      });

      await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'hash@test.com', password: 'Hashed@123', companyName: 'Co' });

      // Verify password was hashed (not plain text)
      expect(storedPassword).not.toBe('Hashed@123');
      const isHashed = await bcrypt.compare('Hashed@123', storedPassword);
      expect(isHashed).toBe(true);
    });
  });

  // ── Rate Limiting Tests ─────────────────────────────────────────────────────
  describe('Rate Limiting', () => {
    test('TC-015: Auth limiter applies after 5 failed attempts', async () => {
      User.findOne.mockResolvedValue(null);

      // Make 5 requests (limit is 5 per 15 minutes in test window)
      const requests = Array.from({ length: 5 }, () =>
        request(app)
          .post('/api/auth/login')
          .set('x-test-rate-limit', 'true')
          .send({ email: 'spam@test.com', password: 'wrong' })
      );
      await Promise.all(requests);

      // 6th request should be rate limited
      const res = await request(app)
        .post('/api/auth/login')
        .set('x-test-rate-limit', 'true')
        .send({ email: 'spam@test.com', password: 'wrong' });

      expect(res.status).toBe(429);
      expect(res.body.success).toBe(false);
    }, 15000);
  });
});
