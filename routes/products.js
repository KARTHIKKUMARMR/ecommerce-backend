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
    if (size) query['sizes.size'] = size;
    if (search) query.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 })
      .lean()
      .allowDiskUse(true);

    res.json({ products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @GET /api/products/hero — Latest products with Cloudinary images for homepage hero slider
router.get('/hero', async (req, res) => {
  try {
    // First try featured products, then fall back to latest products
    let products = await Product.find({ isFeatured: true })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    // If no featured products, get latest products
    if (products.length === 0) {
      products = await Product.find()
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
    }

    // Filter to only products with valid Cloudinary (http) images
    const heroProducts = products
      .filter(p => p.images && p.images.some(img => img.startsWith('http')))
      .slice(0, 6)
      .map(p => ({
        _id: p._id,
        name: p.name,
        category: p.category,
        isFeatured: p.isFeatured,
        image: p.images.find(img => img.startsWith('http')),
      }));

    console.log(`[HERO API] Returning ${heroProducts.length} hero products`);
    res.json({ heroProducts });
  } catch (err) {
    console.error('[HERO API] Error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// @GET /api/products/latest-by-category — One latest product image per category for collection cards
router.get('/latest-by-category', async (req, res) => {
  try {
    const categories = ['Sarees', 'Dupattas', 'Dress Materials', 'Running Fabric'];
    const result = {};

    for (const category of categories) {
      // Find the LATEST product in this exact category that has a Cloudinary image
      const product = await Product.findOne({
        category: category,
        images: { $exists: true, $ne: [] }
      })
        .sort({ createdAt: -1 })
        .lean();

      if (product) {
        // Only use images that start with http (Cloudinary URLs)
        const cloudinaryImage = product.images.find(img => img.startsWith('http'));
        if (cloudinaryImage) {
          result[category] = {
            _id: product._id,
            name: product.name,
            image: cloudinaryImage,
          };
          console.log(`[CATEGORY API] ${category} → ${product.name} → ${cloudinaryImage.substring(0, 60)}...`);
        } else {
          console.log(`[CATEGORY API] ${category} → ${product.name} has no Cloudinary images`);
          result[category] = null;
        }
      } else {
        console.log(`[CATEGORY API] ${category} → No products found`);
        result[category] = null;
      }
    }

    res.json({ categories: result });
  } catch (err) {
    console.error('[CATEGORY API] Error:', err.message);
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
