const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/mongodb/User');

const seedUsers = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/shiptrack';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Connected for seeding...');

    const users = [
      { name: 'Rahul Sharma', email: 'admin@shiptrack.com', password: 'Admin@123', role: 'admin', phone: '+91-9876543210' },
      { name: 'Priya Gupta', email: 'manager@shiptrack.com', password: 'Manager@123', role: 'manager', phone: '+91-9876543211' },
      { name: 'Arjun Singh', email: 'staff1@shiptrack.com', password: 'Staff@123', role: 'staff', phone: '+91-9876543212' },
      { name: 'Kavya Reddy', email: 'staff2@shiptrack.com', password: 'Staff@123', role: 'staff', phone: '+91-9876543213' },
      { name: 'Vikram Patel', email: 'staff3@shiptrack.com', password: 'Staff@123', role: 'staff', phone: '+91-9876543214' },
      { name: 'Ananya Krishnan', email: 'manager2@shiptrack.com', password: 'Manager@123', role: 'manager', phone: '+91-9876543215' },
    ];

    for (const u of users) {
      const existing = await User.findOne({ email: u.email });
      if (!existing) {
        const hash = await bcrypt.hash(u.password, 12);
        await User.create({ ...u, password: hash });
        console.log(`✅ User created: ${u.email} (${u.role})`);
      } else {
        console.log(`⏩ User already exists: ${u.email}`);
      }
    }
    console.log('\n🎉 Seed complete!');
    console.log('\nLogin credentials:');
    console.log('  Admin:   admin@shiptrack.com   / Admin@123');
    console.log('  Manager: manager@shiptrack.com / Manager@123');
    console.log('  Staff:   staff1@shiptrack.com  / Staff@123');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
seedUsers();
