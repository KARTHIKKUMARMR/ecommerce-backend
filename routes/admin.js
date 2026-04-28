const express = require('express');
const multer = require('multer');
const path = require('path');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');
const router = express.Router();

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.use(protect, adminOnly);

// Products CRUD
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

router.post('/products', upload.array('images', 5), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.files && req.files.length > 0) {
      data.images = req.files.map(f => `/uploads/${f.filename}`);
    } else if (data.images) {
      data.images = Array.isArray(data.images) ? data.images : [data.images];
    }
    if (data.sizes) data.sizes = Array.isArray(data.sizes) ? data.sizes : data.sizes.split(',').map(s => s.trim());
    if (data.colors) data.colors = Array.isArray(data.colors) ? data.colors : data.colors.split(',').map(c => c.trim());
    if (data.tags) data.tags = Array.isArray(data.tags) ? data.tags : data.tags.split(',').map(t => t.trim());
    const product = await Product.create(data);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/products/:id', upload.array('images', 5), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.files && req.files.length > 0) {
      data.images = req.files.map(f => `/uploads/${f.filename}`);
    }
    if (data.sizes && typeof data.sizes === 'string') data.sizes = data.sizes.split(',').map(s => s.trim());
    if (data.colors && typeof data.colors === 'string') data.colors = data.colors.split(',').map(c => c.trim());
    if (data.tags && typeof data.tags === 'string') data.tags = data.tags.split(',').map(t => t.trim());
    const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/products/:id', async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: 'Product deleted' });
});

// Orders management
router.get('/orders', async (req, res) => {
  const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
  res.json(orders);
});

router.put('/orders/:id/status', async (req, res) => {
  const order = await Order.findByIdAndUpdate(req.params.id, { orderStatus: req.body.status }, { new: true });
  res.json(order);
});

// Users
router.get('/users', async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json(users);
});

// Dashboard stats
router.get('/stats', async (req, res) => {
  const totalProducts = await Product.countDocuments();
  const totalOrders = await Order.countDocuments();
  const totalUsers = await User.countDocuments();
  const revenueData = await Order.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]);
  const totalRevenue = revenueData[0]?.total || 0;
  res.json({ totalProducts, totalOrders, totalUsers, totalRevenue });
});

module.exports = router;
