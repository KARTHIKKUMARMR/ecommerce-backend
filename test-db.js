require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
  const user = await User.findOne({ email: 'admin@brandname.com' });
  if (!user) {
    console.log('Admin user not found!');
  } else {
    console.log('Admin user found.');
    console.log('Password hash in DB:', user.password);
    const isMatch = await user.comparePassword('admin123');
    console.log('Matches "admin123"?', isMatch);
  }
  process.exit(0);
}
test().catch(err => {
  console.error(err);
  process.exit(1);
});
