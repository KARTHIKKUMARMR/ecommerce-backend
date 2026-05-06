const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

    // 1. Delete sample users (Priti/Priya Sharma, Preethi, etc.)
    const sampleEmails = ['user@brandname.com', 'preethi@gmail.com', 'karthikkumar2003k@gmail.com'];
    const deleteResult = await User.deleteMany({ 
      $or: [
        { email: { $in: sampleEmails } },
        { name: /Priti Sharma/i },
        { name: /Priya Sharma/i }
      ]
    });
    console.log(`Deleted ${deleteResult.deletedCount} sample users.`);

    // 2. Hash plain text passwords for all users
    const users = await User.find({});
    let hashedCount = 0;
    for (const user of users) {
      // bcrypt hashes typically start with $2a$, $2b$, or $2y$
      if (user.password && !user.password.startsWith('$2')) {
        user.password = await bcrypt.hash(user.password, 12);
        await user.save();
        hashedCount++;
      }
    }
    console.log(`Hashed ${hashedCount} plain text passwords.`);

    // 3. Update Admin phone number
    // The user mentioned the current one was random. 
    // We'll use the number from the screenshot (9677224831) which likely belongs to the owner.
    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      admin.phone = '9677224831'; 
      await admin.save();
      console.log('Updated Admin phone number.');
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixDatabase();
