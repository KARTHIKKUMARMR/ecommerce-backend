const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Read env from root
const envPath = path.join(__dirname, '../../render.env');
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf8');
  const lines = env.split('\n');
  lines.forEach(line => {
    const index = line.indexOf('=');
    if (index !== -1) {
      const k = line.substring(0, index).trim();
      const v = line.substring(index + 1).trim();
      process.env[k] = v;
    }
  });
}

const User = require('../models/User');

async function fixDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Update Admin phone number
    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      admin.phone = '8897270798'; 
      await admin.save();
      console.log('Updated Admin phone number to 8897270798.');
    }

    // 2. Fix Thejash phone number (user says they didn't give one)
    const thejash = await User.findOne({ email: 'giribabu1979@gmail.com' });
    if (thejash) {
      thejash.phone = ''; // Clear the random number
      await thejash.save();
      console.log('Cleared phone number for user Thejash.');
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixDatabase();
