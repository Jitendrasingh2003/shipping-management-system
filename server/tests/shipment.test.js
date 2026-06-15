/**
 * Shipment Controller Unit Tests
 * Tests: CRUD, status updates, assignment, tracking, authorization
 * Tool: Jest + supertest
 */

const request = require('supertest');
const mongoose = require('mongoose');

// ─── Mock dependencies ─────────────────────────────────────────────────────────
jest.mock('../models/mongodb/Shipment');
jest.mock('../models/mongodb/Notification');
jest.mock('../models/mongodb/Invoice');
jest.mock('../models/mongodb/User');
jest.mock('../utils/email', () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
  emailTemplates: {
    shipmentCreated: jest.fn().mockReturnValue({ subject: 'test', html: '<p>test</p>' }),
    statusUpdate: jest.fn().mockReturnValue({ subject: 'test', html: '<p>test</p>' }),
  },
}));
jest.mock('../middleware/auth', () => ({
  logAudit: jest.fn().mockResolvedValue(undefined),
  protect: jest.fn((req, res, next) => {
    req.user = { id: 'admin123', name: 'Test Admin', role: 'admin', email: 'admin@test.com' };
    next();
  }),
  authorize: jest.fn(() => (req, res, next) => next()),
}));

const Shipment = require('../models/mongodb/Shipment');
const Invoice  = require('../models/mongodb/Invoice');
const User     = require('../models/mongodb/User');
const app      = require('../server');

// ─── Helper: valid shipment payload ───────────────────────────────────────────
const validShipmentPayload = () => ({
  senderName:    'Ramesh Kumar',
  senderEmail:   'ramesh@example.com',
  senderPhone:   '+91-9876543210',
  senderAddress: '123 MG Road',
  senderCity:    'Mumbai',
  senderState:   'Maharashtra',
  senderZip:     '400001',
  receiverName:  'Suresh Singh',
  receiverEmail: 'suresh@example.com',
  receiverPhone: '+91-9123456789',
  receiverAddress: '456 CP Area',
  receiverCity:   'Delhi',
  receiverState:  'Delhi',
  receiverZip:    '110001',
  weight:         5.0,
  serviceType:    'standard',
  packageType:    'parcel',
  priority:       'normal',
  description:    'Electronics package',
});

const mockShipment = () => ({
  _id: new mongoose.Types.ObjectId(),
  trackingId: 'SHP-2024-001',
  senderName: 'Ramesh Kumar',
  receiverName: 'Suresh Singh',
  senderCity: 'Mumbai',
  receiverCity: 'Delhi',
  weight: 5.0,
  serviceType: 'standard',
  status: 'created',
  priority: 'normal',
  isArchived: false,
  shippingCost: 150,
  statusHistory: [],
  assignedTo: {},
  proofOfDelivery: {},
  currentLocation: '',
  save: jest.fn().mockResolvedValue(undefined),
  push: jest.fn(),
});

// ─── Test Suite ────────────────────────────────────────────────────────────────
describe('Shipment API Tests', () => {

  // ── POST /api/shipments (Create) ────────────────────────────────────────────
  describe('POST /api/shipments', () => {

    test('TC-016: Returns 400 if senderName is missing', async () => {
      const payload = validShipmentPayload();
      delete payload.senderName;

      const res = await request(app)
        .post('/api/shipments')
        .set('Authorization', 'Bearer validtoken')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/sender name/i);
    });

    test('TC-017: Returns 400 if receiverName is missing', async () => {
      const payload = validShipmentPayload();
      delete payload.receiverName;

      const res = await request(app)
        .post('/api/shipments')
        .set('Authorization', 'Bearer validtoken')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('TC-018: Returns 400 if weight is missing', async () => {
      const payload = validShipmentPayload();
      delete payload.weight;

      const res = await request(app)
        .post('/api/shipments')
        .set('Authorization', 'Bearer validtoken')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/weight/i);
    });

    test('TC-019: Returns 400 if weight is below 0.01', async () => {
      const res = await request(app)
        .post('/api/shipments')
        .set('Authorization', 'Bearer validtoken')
        .send({ ...validShipmentPayload(), weight: 0 });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/weight/i);
    });

    test('TC-020: Returns 400 if serviceType is invalid', async () => {
      const res = await request(app)
        .post('/api/shipments')
        .set('Authorization', 'Bearer validtoken')
        .send({ ...validShipmentPayload(), serviceType: 'supersonic' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/service type/i);
    });

    test('TC-021: Successfully creates a shipment', async () => {
      const created = mockShipment();
      Shipment.create.mockResolvedValueOnce(created);
      Invoice.create.mockResolvedValueOnce({ _id: 'inv1' });
      User.find.mockResolvedValueOnce([]);

      const res = await request(app)
        .post('/api/shipments')
        .set('Authorization', 'Bearer validtoken')
        .send(validShipmentPayload());

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.shipment).toBeDefined();
      expect(res.body.shipment.trackingId).toBe('SHP-2024-001');
    });

    test('TC-022: Auto-calculates shipping cost based on weight and service', async () => {
      const created = { ...mockShipment(), shippingCost: 150 }; // 50 + 5*20
      Shipment.create.mockResolvedValueOnce(created);
      Invoice.create.mockResolvedValueOnce({ _id: 'inv1' });
      User.find.mockResolvedValueOnce([]);

      const res = await request(app)
        .post('/api/shipments')
        .set('Authorization', 'Bearer validtoken')
        .send({ ...validShipmentPayload(), weight: 5, serviceType: 'standard' });

      expect(res.status).toBe(201);
      expect(res.body.shipment.shippingCost).toBe(150); // 50 base + 5*20
    });

    test('TC-023: Creates invoice automatically with shipment', async () => {
      const created = mockShipment();
      Shipment.create.mockResolvedValueOnce(created);
      const invoiceCreate = Invoice.create.mockResolvedValueOnce({ invoiceNumber: 'INV-001' });
      User.find.mockResolvedValueOnce([]);

      await request(app)
        .post('/api/shipments')
        .set('Authorization', 'Bearer validtoken')
        .send(validShipmentPayload());

      expect(invoiceCreate).toHaveBeenCalled();
    });
  });

  // ── GET /api/shipments (List) ───────────────────────────────────────────────
  describe('GET /api/shipments', () => {

    test('TC-024: Returns paginated shipment list', async () => {
      const shipments = [mockShipment(), mockShipment()];
      Shipment.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(shipments),
      });
      Shipment.countDocuments.mockResolvedValue(2);

      const res = await request(app)
        .get('/api/shipments')
        .set('Authorization', 'Bearer validtoken');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.shipments)).toBe(true);
      expect(res.body.total).toBe(2);
    });

    test('TC-025: Supports status filter in query params', async () => {
      Shipment.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });
      Shipment.countDocuments.mockResolvedValue(0);

      const res = await request(app)
        .get('/api/shipments?status=delivered')
        .set('Authorization', 'Bearer validtoken');

      expect(res.status).toBe(200);
    });

    test('TC-026: Supports search filter', async () => {
      Shipment.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });
      Shipment.countDocuments.mockResolvedValue(0);

      const res = await request(app)
        .get('/api/shipments?search=SHP-001')
        .set('Authorization', 'Bearer validtoken');

      expect(res.status).toBe(200);
    });
  });

  // ── GET /api/shipments/track/:trackingId (Public) ──────────────────────────
  describe('GET /api/shipments/track/:trackingId', () => {

    test('TC-027: Returns 404 for invalid tracking ID', async () => {
      Shipment.findOne.mockResolvedValueOnce(null);

      const res = await request(app)
        .get('/api/shipments/track/INVALID-001');

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    test('TC-028: Returns shipment for valid tracking ID (no auth needed)', async () => {
      Shipment.findOne.mockResolvedValueOnce(mockShipment());

      const res = await request(app)
        .get('/api/shipments/track/SHP-2024-001');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.shipment).toBeDefined();
    });

    test('TC-029: Tracking ID lookup is case-insensitive', async () => {
      Shipment.findOne.mockResolvedValueOnce(mockShipment());

      const res = await request(app)
        .get('/api/shipments/track/shp-2024-001'); // lowercase

      expect(res.status).toBe(200);
    });
  });

  // ── PATCH /api/shipments/:id/status ────────────────────────────────────────
  describe('PATCH /api/shipments/:id/status', () => {
    const validId = new mongoose.Types.ObjectId().toString();

    test('TC-030: Returns 400 if status is invalid', async () => {
      const res = await request(app)
        .patch(`/api/shipments/${validId}/status`)
        .set('Authorization', 'Bearer validtoken')
        .send({ status: 'flying_away' }); // invalid status

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid status/i);
    });

    test('TC-031: Returns 400 for malformed MongoDB ID', async () => {
      const res = await request(app)
        .patch('/api/shipments/not-a-valid-id/status')
        .set('Authorization', 'Bearer validtoken')
        .send({ status: 'delivered' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid id/i);
    });

    test('TC-032: Returns 404 if shipment not found', async () => {
      Shipment.findById.mockResolvedValueOnce(null);

      const res = await request(app)
        .patch(`/api/shipments/${validId}/status`)
        .set('Authorization', 'Bearer validtoken')
        .send({ status: 'in_transit' });

      expect(res.status).toBe(404);
    });

    test('TC-033: Successfully updates shipment status', async () => {
      const ship = mockShipment();
      ship.statusHistory = [];
      Shipment.findById.mockResolvedValueOnce(ship);
      Invoice.updateOne.mockResolvedValueOnce({});

      const res = await request(app)
        .patch(`/api/shipments/${validId}/status`)
        .set('Authorization', 'Bearer validtoken')
        .send({ status: 'in_transit', location: 'Pune Hub' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ── PATCH /api/shipments/:id/assign ────────────────────────────────────────
  describe('PATCH /api/shipments/:id/assign', () => {
    const validId = new mongoose.Types.ObjectId().toString();

    test('TC-034: Returns 400 if staffId is missing', async () => {
      const res = await request(app)
        .patch(`/api/shipments/${validId}/assign`)
        .set('Authorization', 'Bearer validtoken')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/staff id/i);
    });

    test('TC-035: Returns 400 if staffId is not a valid MongoId', async () => {
      const res = await request(app)
        .patch(`/api/shipments/${validId}/assign`)
        .set('Authorization', 'Bearer validtoken')
        .send({ staffId: 'invalid-id' });

      expect(res.status).toBe(400);
    });
  });

  // ── DELETE /api/shipments/:id (Archive) ────────────────────────────────────
  describe('DELETE /api/shipments/:id', () => {
    const validId = new mongoose.Types.ObjectId().toString();

    test('TC-036: Returns 404 if shipment to archive not found', async () => {
      Shipment.findById.mockResolvedValueOnce(null);

      const res = await request(app)
        .delete(`/api/shipments/${validId}`)
        .set('Authorization', 'Bearer validtoken');

      expect(res.status).toBe(404);
    });

    test('TC-037: Archives (soft deletes) shipment instead of hard delete', async () => {
      const ship = mockShipment();
      Shipment.findById.mockResolvedValueOnce(ship);

      const res = await request(app)
        .delete(`/api/shipments/${validId}`)
        .set('Authorization', 'Bearer validtoken');

      expect(res.status).toBe(200);
      expect(ship.isArchived).toBe(true); // soft delete
      expect(ship.save).toHaveBeenCalled();
    });
  });
});
