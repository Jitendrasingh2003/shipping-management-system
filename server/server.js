require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const connectMongoDB = require('./config/db.mongo');
const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const shipmentRoutes = require('./routes/shipmentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const companyRoutes = require('./routes/companyRoutes');
const bugRoutes = require('./routes/bugRoutes');
const demoRoutes = require('./routes/demoRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');
const shipRoutes = require('./routes/shipRoutes');
const crewRoutes = require('./routes/crewRoutes');
const voyageRoutes = require('./routes/voyageRoutes');
const deckLogRoutes = require('./routes/deckLogRoutes');
const alarmRoutes = require('./routes/alarmRoutes');
const odsRoutes = require('./routes/odsRoutes');
const ballastRoutes = require('./routes/ballastRoutes');
const bunkerRoutes = require('./routes/bunkerRoutes');
const cargoRoutes = require('./routes/cargoRoutes');
const consumptionRoutes = require('./routes/consumptionRoutes');
const engineRoutes = require('./routes/engineRoutes');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true },
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id);

  socket.on('join:user', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`👤 User ${userId} joined their room`);
  });

  socket.on('join:shipment', (trackingId) => {
    socket.join(`shipment:${trackingId}`);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected:', socket.id);
  });
});

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads dir if not exists
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/bugs', bugRoutes);
app.use('/api/demo-requests', demoRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/ships', shipRoutes);
app.use('/api/crew', crewRoutes);
app.use('/api/voyages', voyageRoutes);
app.use('/api/deck-logs', deckLogRoutes);
app.use('/api/alarms', alarmRoutes);
app.use('/api/ods', odsRoutes);
app.use('/api/ballast', ballastRoutes);
app.use('/api/bunker', bunkerRoutes);
app.use('/api/cargo', cargoRoutes);
app.use('/api/consumption', consumptionRoutes);
app.use('/api/engine-logs', engineRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'ShipTrack Pro API is running 🚀', timestamp: new Date() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Error Handler
app.use(errorHandler);

// Start
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectMongoDB();

  server.listen(PORT, () => {
    console.log(`\n🚀 ShipTrack Pro Server running on port ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
    console.log(`🌐 Client: ${process.env.CLIENT_URL}`);
    console.log(`\n📋 Demo Credentials:`);
    console.log(`   Admin:   admin@shiptrack.com   / Admin@123`);
    console.log(`   Manager: manager@shiptrack.com / Manager@123`);
    console.log(`   Staff:   staff1@shiptrack.com  / Staff@123\n`);
  });
};

startServer().catch(console.error);
