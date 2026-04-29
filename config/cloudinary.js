/**
 * cloudinary.js — Cloudinary + Multer Configuration
 *
 * HOW IT WORKS:
 * 1. We configure the Cloudinary SDK with our account credentials (from .env).
 * 2. We create a "storage engine" using multer-storage-cloudinary.
 *    This tells multer to upload files directly to Cloudinary instead of your local disk.
 * 3. We create a multer "upload" middleware using that storage engine.
 * 4. We export both so routes can use them.
 */

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Step 1: Configure Cloudinary with credentials from .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Step 2: Create a Cloudinary storage engine for multer
// - folder: where images are stored inside your Cloudinary account
// - allowed_formats: only allow image file types
// - transformation: auto-optimize quality and convert to webp for faster loading
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'hashthakala/products',         // Organized folder in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    transformation: [
      { quality: 'auto', fetch_format: 'auto' }, // Auto optimize
    ],
  },
});

// Step 3: Create the multer upload middleware
// - storage: use Cloudinary (not local disk)
// - limits: max 5 MB per file to prevent abuse
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    // Only accept image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

// Step 4: Export for use in route files
module.exports = { cloudinary, upload };
