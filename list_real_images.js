const cloudinary = require('cloudinary').v2;
const fs = require('fs');

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

async function listFolders() {
  try {
    const result = await cloudinary.api.root_folders();
    console.log('Root Folders:', JSON.stringify(result.folders, null, 2));
    
    const resources = await cloudinary.api.resources({
       type: 'upload',
       max_results: 500
    });
    // Filter out sample images
    const nonSamples = resources.resources.filter(r => !r.public_id.startsWith('samples/'));
    console.log('Non-Sample Resources:', JSON.stringify(nonSamples.map(r => ({ url: r.secure_url, public_id: r.public_id })), null, 2));
  } catch (err) {
    console.error(err);
  }
}
listFolders();
