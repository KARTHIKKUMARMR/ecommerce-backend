const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

const fs = require('fs');

const env = fs.readFileSync('../render.env', 'utf8');
const lines = env.split('\n');
lines.forEach(line => {
  const index = line.indexOf('=');
  if (index !== -1) {
    const k = line.substring(0, index).trim();
    const v = line.substring(index + 1).trim();
    process.env[k] = v;
  }
});

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const products = await Product.find({});
    console.log(JSON.stringify(products, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
