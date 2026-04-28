const express = require('express');
const Product = require('../models/Product');
const router = express.Router();

// @GET /api/products
router.get('/', async (req, res) => {
  try {
    const { category, minPrice, maxPrice, size, search, featured, sale, page = 1, limit = 12 } = req.query;
    const query = {};

    if (category) query.category = category;
    if (featured === 'true') query.isFeatured = true;
    if (sale === 'true') query.isOnSale = true;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (size) query.sizes = { $in: [size] };
    if (search) query.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query).skip(skip).limit(Number(limit)).sort({ createdAt: -1 });

    res.json({ products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
