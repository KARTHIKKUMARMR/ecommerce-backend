const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const fs = require('fs');

// Read from render.env manually since it's not .env
const env = fs.readFileSync('render.env', 'utf8');
const lines = env.split('\n');
lines.forEach(line => {
  const [k, v] = line.split('=');
  if (k && v) process.env[k] = v;
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function list() {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      max_results: 50
    });
    console.log(JSON.stringify(result.resources.map(r => ({ url: r.secure_url, public_id: r.public_id, created_at: r.created_at })), null, 2));
  } catch (err) {
    console.error(err);
  }
}
list();
