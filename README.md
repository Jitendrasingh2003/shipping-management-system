# 🚚 ShipTrack Pro — Shipping Management System

**Developed at Codec Technologies Internship**

A full-stack web-based Shipping Management System with role-based dashboards, real-time tracking, automated reports, and complete logistics management.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js (Vite), Chart.js, React Router v6 |
| Backend | Node.js + Express.js |
| Database | MongoDB (Mongoose) — *Fully Migrated (MySQL Removed)* |
| Auth | JWT + bcryptjs |
| Real-time | Socket.IO |
| Emails | Nodemailer |
| Reports | PDFKit + csv-writer |
| UI | Custom CSS (Dark Theme) |

---

## 👥 Roles & Access

| Role | Login | Password | Access |
|------|-------|----------|--------|
| Admin | admin@shiptrack.com | Admin@123 | Full system access |
| Manager | manager@shiptrack.com | Manager@123 | Create/dispatch shipments |
| Staff | staff1@shiptrack.com | Staff@123 | Delivery management |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (running on localhost:27017 or remote cluster)

### 1. Backend Setup

```bash
cd server
# Configure .env with your DB credentials
npm install
npm run seed     # Create demo users in MongoDB
npm run dev      # Start server on port 5000 (watch mode)
```

### 2. Frontend Setup

```bash
cd client
npm install
npm run dev      # Start on http://localhost:5173 / 5174
```

---

## 📋 Features

### Admin
- ✅ Dashboard with KPI cards + Charts (Line, Doughnut, Bar)
- ✅ Full shipment management (CRUD, filter, search, paginate)
- ✅ User management (create, edit, activate/deactivate, delete)
- ✅ Invoice management with revenue tracking
- ✅ PDF + CSV report generation (shipments + revenue)
- ✅ Comprehensive audit trail with action filtering
- ✅ Real-time notifications via Socket.IO

### Warehouse Manager
- ✅ Operations dashboard with staff workload chart
- ✅ 3-step shipment creation with cost calculator
- ✅ Delivery assignment to staff with dispatch
- ✅ Shipment management and tracking
- ✅ Reports and invoice access

### Delivery Personnel (Staff)
- ✅ Personal delivery dashboard with performance metrics
- ✅ Full delivery details with sender/receiver contact info
- ✅ Step-by-step status update flow
- ✅ Proof of delivery upload (photo)
- ✅ Real-time notifications for new assignments

---

## 🔌 API Endpoints

```
POST   /api/auth/login           - Login
GET    /api/auth/me              - Get current user
GET    /api/shipments            - List shipments (paginated)
POST   /api/shipments            - Create shipment
GET    /api/shipments/track/:id  - Track by ID (public)
PUT    /api/shipments/:id        - Update shipment
PATCH  /api/shipments/:id/status - Update status
PATCH  /api/shipments/:id/assign - Assign to staff
PATCH  /api/shipments/:id/proof  - Upload proof of delivery
GET    /api/dashboard/stats      - Role-based stats
GET    /api/dashboard/audit-logs - Audit trail (Admin)
GET    /api/reports/shipments    - Shipment report (PDF/CSV)
GET    /api/reports/revenue      - Revenue report (PDF/CSV)
GET    /api/notifications        - User notifications
GET    /api/users                - User management (Admin)
```

---

## 🗄️ Database Design

**MongoDB Collections:**
- `users` — User accounts with roles (JWT auth)
- `shipments` — Full shipment lifecycle with status history
- `invoices` — Financial records linked to shipments
- `notifications` — Real-time notifications per user
- `auditlogs` — Complete system action log
