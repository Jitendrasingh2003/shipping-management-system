require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt   = require('bcryptjs');
const mongoose = require('mongoose');

const User         = require('../models/mongodb/User');
const Shipment     = require('../models/mongodb/Shipment');
const Invoice      = require('../models/mongodb/Invoice');
const Notification = require('../models/mongodb/Notification');
const AuditLog     = require('../models/mongodb/AuditLog');

// ── helpers ──────────────────────────────────────────────────────────────────
const pick   = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand   = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };

// ── static data ──────────────────────────────────────────────────────────────
const CITIES = [
  { city: 'Mumbai',    state: 'Maharashtra',  zip: '400001' },
  { city: 'Delhi',     state: 'Delhi',        zip: '110001' },
  { city: 'Bangalore', state: 'Karnataka',    zip: '560001' },
  { city: 'Hyderabad', state: 'Telangana',    zip: '500001' },
  { city: 'Chennai',   state: 'Tamil Nadu',   zip: '600001' },
  { city: 'Kolkata',   state: 'West Bengal',  zip: '700001' },
  { city: 'Pune',      state: 'Maharashtra',  zip: '411001' },
  { city: 'Ahmedabad', state: 'Gujarat',      zip: '380001' },
  { city: 'Jaipur',    state: 'Rajasthan',    zip: '302001' },
  { city: 'Surat',     state: 'Gujarat',      zip: '395001' },
  { city: 'Lucknow',   state: 'Uttar Pradesh',zip: '226001' },
  { city: 'Kanpur',    state: 'Uttar Pradesh',zip: '208001' },
];

const SENDERS   = ['Rahul Sharma','Anita Patel','Suresh Kumar','Divya Reddy','Mohan Das','Priya Singh','Ravi Verma','Sunita Rao','Amit Joshi','Kavya Nair','Deepak Gupta','Meera Iyer'];
const RECEIVERS = ['Pooja Mehta','Arun Nair','Sneha Bhat','Vijay Shetty','Lakshmi Pillai','Rohit Aggarwal','Neha Malhotra','Sanjay Chopra','Rekha Tiwari','Harish Chandra','Swati Mishra','Aman Kapoor'];
const STATUSES  = ['created','processing','dispatched','picked_up','in_transit','out_for_delivery','delivered','delivered','delivered','failed','returned','cancelled'];
const SERVICES  = ['standard','standard','standard','express','overnight','economy'];
const PKG_TYPES = ['document','parcel','fragile','electronics','clothing','industrial','other'];
const PRIORITIES= ['low','normal','normal','normal','high','urgent'];
const ROADS     = ['MG Road','Ring Road','Station Road','Main Street','Park Avenue','Gandhi Marg','Nehru Path'];
const COLONIES  = ['Gandhi Nagar','Nehru Colony','Rajiv Nagar','Shastri Market','Civil Lines','Lal Bagh','New Colony'];
const ITEMS     = ['Electronic gadgets','Clothing items','Important documents','Fragile glassware','Medical supplies','Industrial parts','Books & stationery','Kitchen appliances'];

const STATUS_LOC = {
  created: 'Warehouse - Sorting Center', processing: 'Processing Hub',
  dispatched: 'Dispatch Center', picked_up: 'Origin City Hub',
  in_transit: 'In Transit - National Highway', out_for_delivery: 'Local Delivery Hub',
  delivered: 'Delivered to Receiver', failed: 'Failed Delivery Attempt',
  returned: 'Return Processing Center', cancelled: 'Order Cancelled',
};

// ── MAIN ─────────────────────────────────────────────────────────────────────
const seed = async () => {
  const URI = process.env.MONGO_URI || 'mongodb://localhost:27017/shipping_management';
  await mongoose.connect(URI);
  console.log('✅ Connected to:', URI);

  // ── 1. USERS ────────────────────────────────────────────────────────────────
  const usersData = [
    { name:'Rahul Sharma',    email:'admin@shiptrack.com',    pw:'Admin@123',   role:'admin',   phone:'+91-9876543210' },
    { name:'Priya Gupta',     email:'manager@shiptrack.com',  pw:'Manager@123', role:'manager', phone:'+91-9876543211' },
    { name:'Ananya Krishnan', email:'manager2@shiptrack.com', pw:'Manager@123', role:'manager', phone:'+91-9876543215' },
    { name:'Arjun Singh',     email:'staff1@shiptrack.com',   pw:'Staff@123',   role:'staff',   phone:'+91-9876543212' },
    { name:'Kavya Reddy',     email:'staff2@shiptrack.com',   pw:'Staff@123',   role:'staff',   phone:'+91-9876543213' },
    { name:'Vikram Patel',    email:'staff3@shiptrack.com',   pw:'Staff@123',   role:'staff',   phone:'+91-9876543214' },
    { name:'Neha Malhotra',   email:'staff4@shiptrack.com',   pw:'Staff@123',   role:'staff',   phone:'+91-9876543216' },
    { name:'Rohit Aggarwal',  email:'staff5@shiptrack.com',   pw:'Staff@123',   role:'staff',   phone:'+91-9876543217' },
  ];

  const U = {};
  for (const u of usersData) {
    let doc = await User.findOne({ email: u.email });
    if (!doc) {
      doc = await User.create({ name:u.name, email:u.email, password: await bcrypt.hash(u.pw,12), role:u.role, phone:u.phone });
      console.log(`  ✅ Created: ${u.email}`);
    } else {
      console.log(`  ⏩ Exists:  ${u.email}`);
    }
    U[u.email] = doc;
  }
  const admin   = U['admin@shiptrack.com'];
  const manager = U['manager@shiptrack.com'];
  const staff   = [U['staff1@shiptrack.com'], U['staff2@shiptrack.com'], U['staff3@shiptrack.com'], U['staff4@shiptrack.com'], U['staff5@shiptrack.com']];

  // ── 2. SHIPMENTS ────────────────────────────────────────────────────────────
  const existingShipments = await Shipment.countDocuments();
  let allShipments = [];

  if (existingShipments < 50) {
    console.log('\n📦 Seeding shipments...');
    const need = 65 - existingShipments;
    const docs  = [];

    for (let i = 0; i < need; i++) {
      const sc     = pick(CITIES);
      const rc     = pick(CITIES.filter(c => c.city !== sc.city));
      const status = pick(STATUSES);
      const sType  = pick(SERVICES);
      const weight = parseFloat((Math.random() * 20 + 0.2).toFixed(2));
      const cost   = Math.round({ standard:150, express:320, overnight:500, economy:90 }[sType] + weight * 12 + rand(50,200));
      const dOld   = rand(1, 150);
      const created= daysAgo(dOld);
      const est    = new Date(created); est.setDate(est.getDate() + { overnight:1, express:3, standard:5, economy:10 }[sType]);
      const si     = rand(0, SENDERS.length-1);
      const ri     = rand(0, RECEIVERS.length-1);
      const aStaff = ['dispatched','picked_up','in_transit','out_for_delivery','delivered','failed'].includes(status) ? pick(staff) : null;

      // Build minimal status history
      const history = [{ status:'created', location: STATUS_LOC.created, description:'Shipment booked', updatedBy:'System', updatedByRole:'system', timestamp: created }];
      if (!['created'].includes(status)) {
        const ts2 = new Date(created); ts2.setHours(ts2.getHours()+6);
        history.push({ status:'processing', location: STATUS_LOC.processing, description:'Being processed', updatedBy: manager.name, updatedByRole:'manager', timestamp: ts2 });
      }
      if (['dispatched','picked_up','in_transit','out_for_delivery','delivered','failed','returned'].includes(status)) {
        const ts3 = new Date(created); ts3.setHours(ts3.getHours()+18);
        history.push({ status:'dispatched', location: STATUS_LOC.dispatched, description:'Dispatched from hub', updatedBy: aStaff?.name||manager.name, updatedByRole:'staff', timestamp: ts3 });
      }
      if (['in_transit','out_for_delivery','delivered','failed'].includes(status)) {
        const ts4 = new Date(created); ts4.setDate(ts4.getDate()+1);
        history.push({ status:'in_transit', location: STATUS_LOC.in_transit, description:'In transit', updatedBy: aStaff?.name||manager.name, updatedByRole:'staff', timestamp: ts4 });
      }
      if (['out_for_delivery','delivered','failed'].includes(status)) {
        const ts5 = new Date(created); ts5.setDate(ts5.getDate()+rand(2,4));
        history.push({ status:'out_for_delivery', location: STATUS_LOC.out_for_delivery, description:'Out for delivery', updatedBy: aStaff?.name||manager.name, updatedByRole:'staff', timestamp: ts5 });
      }
      if (['delivered','failed'].includes(status)) {
        const ts6 = new Date(created); ts6.setDate(ts6.getDate()+rand(3,6));
        history.push({ status, location: STATUS_LOC[status], description: status==='delivered'?'Delivered successfully':'Delivery failed', updatedBy: aStaff?.name||manager.name, updatedByRole:'staff', timestamp: ts6 });
      }

      // Generate unique trackingId
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let tid = 'SHP';
      for (let k=0; k<9; k++) tid += chars[rand(0,35)];

      docs.push({
        trackingId: tid,
        senderName: SENDERS[si], senderEmail:`sender${si}@gmail.com`, senderPhone:`+91-987${rand(1000000,9999999)}`,
        senderAddress:`${rand(1,999)}, ${pick(ROADS)}`, senderCity:sc.city, senderState:sc.state, senderZip:sc.zip, senderCountry:'India',
        receiverName: RECEIVERS[ri], receiverEmail:`receiver${ri}@gmail.com`, receiverPhone:`+91-912${rand(1000000,9999999)}`,
        receiverAddress:`${rand(1,999)}, ${pick(COLONIES)}`, receiverCity:rc.city, receiverState:rc.state, receiverZip:rc.zip, receiverCountry:'India',
        packageType: pick(PKG_TYPES), weight, dimensions:{ length:rand(5,60), width:rand(5,50), height:rand(3,40) },
        description: `${pick(ITEMS)} - Handle with care`, value: rand(500,50000),
        serviceType: sType, shippingCost: cost, estimatedDelivery: est,
        status, statusHistory: history, currentLocation: STATUS_LOC[status]||sc.city,
        priority: pick(PRIORITIES),
        assignedTo: aStaff ? { userId:aStaff._id, name:aStaff.name, phone:aStaff.phone } : { userId:null, name:'', phone:'' },
        proofOfDelivery: status==='delivered' ? { receivedBy:RECEIVERS[ri], deliveredAt:daysAgo(rand(0,3)) } : {},
        createdBy: manager._id, createdByName: manager.name,
        isArchived: false,
        createdAt: created, updatedAt: daysAgo(rand(0,dOld)),
      });
    }

    // Use insertMany with timestamps:false to preserve our createdAt
    try {
      const inserted = await Shipment.collection.insertMany(docs, { ordered: false });
      allShipments = await Shipment.find().limit(70);
      console.log(`  ✅ ${inserted.insertedCount} shipments inserted`);
    } catch(e) {
      allShipments = await Shipment.find().limit(70);
      console.log(`  ✅ ~${allShipments.length} shipments (some duplicates skipped)`);
    }
  } else {
    allShipments = await Shipment.find().limit(70);
    console.log(`  ⏩ Shipments already exist (${existingShipments})`);
  }

  // ── 3. INVOICES ─────────────────────────────────────────────────────────────
  const existingInvoices = await Invoice.countDocuments();
  if (existingInvoices < 30 && allShipments.length > 0) {
    console.log('\n🧾 Seeding invoices...');
    let num = existingInvoices + 1;
    let iCreated = 0;

    for (const s of allShipments.slice(0, 50)) {
      if (!s.senderName || !s.receiverName || !s.trackingId) continue;
      const has = await Invoice.findOne({ shipmentId: s._id });
      if (has) continue;

      const tax   = Math.round((s.shippingCost||200) * 0.18);
      const total = (s.shippingCost||200) + tax;
      const st    = pick(['pending','paid','paid','paid','overdue','cancelled']);
      const due   = new Date(s.createdAt||new Date()); due.setDate(due.getDate()+30);

      try {
        await Invoice.collection.insertOne({
          invoiceNumber: `INV-2024-${String(num++).padStart(4,'0')}`,
          shipmentId:    s._id,
          trackingId:    s.trackingId,
          senderName:    s.senderName,
          receiverName:  s.receiverName,
          amount:        s.shippingCost||200,
          tax, totalAmount: total,
          status: st, dueDate: due,
          paidAt: st==='paid' ? new Date(s.createdAt||new Date()) : null,
          notes: `Invoice for shipment ${s.trackingId}`,
          createdBy: admin._id,
          createdAt: s.createdAt||new Date(), updatedAt: new Date(),
        });
        iCreated++;
      } catch(e) { /* skip */ }
    }
    console.log(`  ✅ ${iCreated} invoices created`);
  } else {
    console.log(`  ⏩ Invoices already exist (${existingInvoices})`);
  }

  // ── 4. AUDIT LOGS ───────────────────────────────────────────────────────────
  const existingAudit = await AuditLog.countDocuments();
  if (existingAudit < 20) {
    console.log('\n📋 Seeding audit logs...');
    const ACTIONS = [
      { action:'USER_LOGIN',              desc: n => `${n} logged in successfully` },
      { action:'SHIPMENT_CREATED',        desc: n => `${n} created a new shipment` },
      { action:'SHIPMENT_STATUS_CHANGED', desc: n => `${n} updated shipment status` },
      { action:'USER_CREATED',            desc: n => `${n} added a new user` },
      { action:'INVOICE_CREATED',         desc: n => `${n} generated an invoice` },
      { action:'REPORT_GENERATED',        desc: n => `${n} generated a report` },
      { action:'SHIPMENT_ASSIGNED',       desc: n => `${n} assigned a delivery` },
      { action:'SHIPMENT_UPDATED',        desc: n => `${n} updated shipment details` },
      { action:'USER_LOGOUT',             desc: n => `${n} logged out` },
    ];
    const allU = [admin, manager, ...staff];
    const logDocs = [];
    for (let i=0; i<60; i++) {
      const u = pick(allU);
      const a = pick(ACTIONS);
      logDocs.push({
        userId: u._id, userName: u.name, userRole: u.role,
        action: a.action, resource: 'shipments',
        description: a.desc(u.name),
        ipAddress: `192.168.${rand(1,5)}.${rand(1,254)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        status: 'success',
        createdAt: daysAgo(rand(0,30)), updatedAt: new Date(),
      });
    }
    await AuditLog.collection.insertMany(logDocs, { ordered: false });
    console.log(`  ✅ ${logDocs.length} audit logs created`);
  } else {
    console.log(`  ⏩ Audit logs already exist (${existingAudit})`);
  }

  // ── 5. NOTIFICATIONS ────────────────────────────────────────────────────────
  const existingNotifs = await Notification.countDocuments();
  if (existingNotifs < 10) {
    console.log('\n🔔 Seeding notifications...');
    const NTYPES = [
      { type:'shipment_created',  title:'New Shipment Created',    msg:'A new shipment has been created and is awaiting processing.' },
      { type:'status_update',     title:'Shipment Status Updated', msg:'Your shipment status has been updated to In Transit.' },
      { type:'delivery_assigned', title:'Delivery Assigned',       msg:'A new delivery has been assigned to you. Check your dashboard.' },
      { type:'delivery_completed',title:'Delivery Completed ✅',   msg:'Shipment has been delivered successfully.' },
      { type:'system',            title:'System Notification',     msg:'Scheduled maintenance tonight at 11 PM. Service may be brief.' },
      { type:'alert',             title:'⚠️ Delivery Failed',      msg:'A delivery attempt failed. Customer needs to be notified.' },
      { type:'report_ready',      title:'Monthly Report Ready',    msg:'Your monthly shipment analytics report is ready for download.' },
    ];
    const allU = [admin, manager, ...staff];
    const nDocs = [];
    for (const u of allU) {
      for (let i=0; i<rand(4,9); i++) {
        const n = pick(NTYPES);
        nDocs.push({
          userId: u._id.toString(),
          userRole: u.role,
          type: n.type, title: n.title, message: n.msg,
          isRead: Math.random()>0.4,
          createdAt: daysAgo(rand(0,14)), updatedAt: new Date(),
        });
      }
    }
    await Notification.collection.insertMany(nDocs, { ordered: false });
    console.log(`  ✅ ${nDocs.length} notifications created`);
  } else {
    console.log(`  ⏩ Notifications already exist (${existingNotifs})`);
  }

  // ── FINAL SUMMARY ────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(50));
  console.log('🎉  ALL DATA SEEDED SUCCESSFULLY!');
  console.log('─'.repeat(50));
  console.log(`👤 Users:         ${await User.countDocuments()}`);
  console.log(`📦 Shipments:     ${await Shipment.countDocuments()}`);
  console.log(`🧾 Invoices:      ${await Invoice.countDocuments()}`);
  console.log(`📋 Audit Logs:    ${await AuditLog.countDocuments()}`);
  console.log(`🔔 Notifications: ${await Notification.countDocuments()}`);
  console.log('─'.repeat(50));
  console.log('🔑 LOGIN CREDENTIALS:');
  console.log('   Admin:   admin@shiptrack.com   / Admin@123');
  console.log('   Manager: manager@shiptrack.com / Manager@123');
  console.log('   Staff:   staff1@shiptrack.com  / Staff@123');
  console.log('═'.repeat(50) + '\n');

  process.exit(0);
};

seed().catch(e => { console.error('❌ Seed failed:', e.message); process.exit(1); });
