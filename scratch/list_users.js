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

async function listUsers() {
  try {
    if (!process.env.MONGODB_URI) {
        console.error("MONGODB_URI not found in environment");
        process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await User.find({});
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
listUsers();
