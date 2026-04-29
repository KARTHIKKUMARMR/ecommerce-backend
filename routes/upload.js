/**
 * upload.js — Standalone Image Upload Endpoint
 *
 * WHY THIS EXISTS:
 * Sometimes you want to upload an image independently before creating a product
 * (e.g., upload the image first, get the URL, then fill in the product form).
 * This endpoint handles that use case.
 *
 * POST /api/upload
 * - Accepts up to 10 image files under the field name "images"
 * - Uploads them to Cloudinary
 * - Returns an array of secure Cloudinary URLs
 * - Admin-only: requires a valid JWT token + admin role
 */

const express = require('express');
const { upload } = require('../config/cloudinary');
const { protect, adminOnly } = require('../middleware/auth');
const router = express.Router();

/**
 * POST /api/upload
 * Body: multipart/form-data with field "images" (one or more files)
 * Response: { urls: ["https://res.cloudinary.com/..."] }
 */
router.post('/', protect, adminOnly, upload.array('images', 10), (req, res) => {
  try {
    // Check if any files were actually uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images uploaded. Please attach at least one image file.' });
    }

    // Extract the Cloudinary URLs from the uploaded files
    // file.path = the secure HTTPS URL returned by Cloudinary after upload
    const urls = req.files.map(file => file.path);

    res.status(200).json({
      message: `${urls.length} image(s) uploaded successfully`,
      urls,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: err.message || 'Image upload failed' });
  }
});

module.exports = router;
