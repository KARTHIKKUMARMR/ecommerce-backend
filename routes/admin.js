/**
 * admin.js — Admin-only routes (products, orders, users, stats)
 *
 * Cloudinary Integration:
 * - We import `upload` from our cloudinary config.
 * - When an admin submits a form with images, multer sends each file directly
 *   to Cloudinary and gives us back `req.files` with a `.path` property
 *   that contains the secure Cloudinary HTTPS URL.
 * - We store that URL in MongoDB — no local disk involved.
 */

const express = require('express');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');
const { cloudinary, upload } = require('../config/cloudinary');
const router = express.Router();

// All admin routes require login + admin role
router.use(protect, adminOnly);

// ─── PRODUCTS CRUD ───────────────────────────────────────────────────────────

/**
 * GET /api/admin/products
 * Returns all products sorted by newest first.
 */
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .lean()
      .allowDiskUse(true);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * POST /api/admin/products
 * Creates a new product.
 *
 * HOW IMAGE UPLOAD WORKS:
 * 1. The frontend sends a multipart/form-data request with image files.
 * 2. `upload.array('images', 5)` intercepts the request before our handler runs.
 * 3. multer-storage-cloudinary uploads each file directly to Cloudinary.
 * 4. After upload, `req.files` contains info about each uploaded file.
 * 5. `file.path` is the Cloudinary secure HTTPS URL — we store this in MongoDB.
 */
router.post('/products', upload.array('images', 5), async (req, res) => {
  try {
    const data = { ...req.body };

    // Map uploaded files to their Cloudinary URLs
    // file.path = the secure Cloudinary URL (e.g. https://res.cloudinary.com/...)
    if (req.files && req.files.length > 0) {
      data.images = req.files.map(file => file.path);
    } else if (data.images) {
      // If images were passed as URLs (not files), keep them
      data.images = Array.isArray(data.images) ? data.images : [data.images];
    } else {
      data.images = [];
    }

    // Parse comma-separated strings into arrays (sent from FormData as strings)
    if (data.sizes)  data.sizes  = Array.isArray(data.sizes)  ? data.sizes  : data.sizes.split(',').map(s => s.trim()).filter(Boolean);
    if (data.colors) data.colors = Array.isArray(data.colors) ? data.colors : data.colors.split(',').map(c => c.trim()).filter(Boolean);
    if (data.tags)   data.tags   = Array.isArray(data.tags)   ? data.tags   : data.tags.split(',').map(t => t.trim()).filter(Boolean);

    // Parse numeric fields explicitly (FormData sends everything as strings)
    if (data.price)         data.price         = Number(data.price);
    if (data.originalPrice) data.originalPrice = Number(data.originalPrice);
    if (data.stock)         data.stock         = Number(data.stock);
    if (data.discount)      data.discount      = Number(data.discount);

    const product = await Product.create(data);
    res.status(201).json(product);
  } catch (err) {
    console.error('Create product error:', err);
    res.status(400).json({ message: err.message });
  }
});

/**
 * PUT /api/admin/products/:id
 * Updates an existing product.
 * If new image files are uploaded, they replace the old images on Cloudinary.
 */
router.put('/products/:id', upload.array('images', 5), async (req, res) => {
  try {
    const data = { ...req.body };

    if (req.files && req.files.length > 0) {
      // New files uploaded — use the new Cloudinary URLs
      data.images = req.files.map(file => file.path);
    }
    // If no new files, existing images from DB are preserved (not overwritten)

    if (data.sizes  && typeof data.sizes  === 'string') data.sizes  = data.sizes.split(',').map(s => s.trim()).filter(Boolean);
    if (data.colors && typeof data.colors === 'string') data.colors = data.colors.split(',').map(c => c.trim()).filter(Boolean);
    if (data.tags   && typeof data.tags   === 'string') data.tags   = data.tags.split(',').map(t => t.trim()).filter(Boolean);

    if (data.price)         data.price         = Number(data.price);
    if (data.originalPrice) data.originalPrice = Number(data.originalPrice);
    if (data.stock)         data.stock         = Number(data.stock);
    if (data.discount)      data.discount      = Number(data.discount);

    const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error('Update product error:', err);
    res.status(400).json({ message: err.message });
  }
});

/**
 * DELETE /api/admin/products/:id
 * Deletes a product.
 * (Optional enhancement: also delete from Cloudinary using cloudinary.uploader.destroy)
 */
router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── ORDERS ──────────────────────────────────────────────────────────────────

router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/orders/:id/status', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus: req.body.status },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── USERS ───────────────────────────────────────────────────────────────────

router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────

router.get('/stats', async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalOrders   = await Order.countDocuments();
    const totalUsers    = await User.countDocuments();
    const revenueData   = await Order.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]);
    const totalRevenue  = revenueData[0]?.total || 0;
    res.json({ totalProducts, totalOrders, totalUsers, totalRevenue });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
