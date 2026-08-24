const mongoose = require('mongoose');
const User = require('../models/User');

const DEMO_ADMIN = {
  name: 'Demo Admin',
  email: 'admin@tce.edu',
  password: 'Password@123',
  role: 'admin',
};

async function ensureDemoAdmin() {
  if (mongoose.connection.readyState !== 1) {
    console.warn('Demo admin setup skipped because MongoDB is not connected.');
    return;
  }

  const existing = await User.findOne({ email: DEMO_ADMIN.email });
  if (!existing) {
    await User.create(DEMO_ADMIN);
    console.log('Demo admin account created: admin@tce.edu / Password@123');
    return;
  }

  let changed = false;

  if (existing.name !== DEMO_ADMIN.name) {
    existing.name = DEMO_ADMIN.name;
    changed = true;
  }
  if (existing.role !== 'admin') {
    existing.role = 'admin';
    changed = true;
  }
  if (existing.isActive === false) {
    existing.isActive = true;
    changed = true;
  }
  if (existing.department !== null) {
    existing.department = null;
    changed = true;
  }

  const passwordMatches = await existing.comparePassword(DEMO_ADMIN.password);
  if (!passwordMatches) {
    existing.password = DEMO_ADMIN.password;
    changed = true;
  }

  if (changed) {
    await existing.save();
    console.log('Demo admin account refreshed: admin@tce.edu / Password@123');
  }
}

module.exports = ensureDemoAdmin;

