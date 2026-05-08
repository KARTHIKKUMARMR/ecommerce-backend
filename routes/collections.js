const express = require('express');
const router = express.Router();
const Collection = require('../models/Collection');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// Admin: Get all collections
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const collections = await Collection.find().populate('products', 'name price originalPrice images stock').sort('-createdAt');
    res.json(collections);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching collections' });
  }
});

// Public: Get visible collections for homepage
router.get('/public', async (req, res) => {
  try {
    let collections = await Collection.find({ visibility: true })
      .populate('products', 'name price originalPrice images stock category')
      .sort('-createdAt')
      .lean();

    for (let c of collections) {
      if (c.autoUpdateByCategory || c.autoUpdateByTag) {
        let q = {};
        if (c.autoUpdateByCategory) q.category = c.autoUpdateByCategory;
        if (c.autoUpdateByTag) q.tags = { $regex: new RegExp(c.autoUpdateByTag, 'i') };
        
        const dynamicProducts = await Product.find(q)
          .sort({ createdAt: -1 })
          .limit(4)
          .select('name price originalPrice images stock category')
          .lean();
        
        c.dynamicProducts = dynamicProducts;
      } else {
        c.dynamicProducts = [];
      }
      
      // Dynamic Background Image
      if (!c.bannerImage) {
        let latestProduct = c.dynamicProducts.length > 0 ? c.dynamicProducts[0] : (c.products.length > 0 ? c.products[0] : null);
        if (latestProduct && latestProduct.images && latestProduct.images.length > 0) {
          c.dynamicBannerImage = latestProduct.images[0];
        }
      }
    }
    res.json(collections);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching collections' });
  }
});

// Admin: Create collection
router.post('/', protect, adminOnly, upload.single('bannerImage'), async (req, res) => {
  try {
    const { name, description, products, offerText, type, visibility, autoUpdateByCategory, autoUpdateByTag } = req.body;
    let bannerImage = '';
    
    if (req.file) {
      bannerImage = req.file.path;
    } else if (req.body.bannerImage) {
      bannerImage = req.body.bannerImage;
    }

    const collection = new Collection({
      name,
      description,
      bannerImage,
      products: products ? JSON.parse(products) : [],
      autoUpdateByCategory,
      autoUpdateByTag,
      offerText,
      type,
      visibility: visibility === 'true' || visibility === true
    });

    await collection.save();
    const populated = await collection.populate('products', 'name price originalPrice images stock');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Admin: Update collection
router.put('/:id', protect, adminOnly, upload.single('bannerImage'), async (req, res) => {
  try {
    const { name, description, products, offerText, type, visibility, autoUpdateByCategory, autoUpdateByTag } = req.body;
    
    const updateData = {
      name,
      description,
      offerText,
      type,
      autoUpdateByCategory,
      autoUpdateByTag,
      visibility: visibility === 'true' || visibility === true
    };

    if (products) {
      updateData.products = JSON.parse(products);
    }

    if (req.file) {
      updateData.bannerImage = req.file.path;
    } else if (req.body.bannerImage) {
      updateData.bannerImage = req.body.bannerImage;
    }

    const collection = await Collection.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('products', 'name price originalPrice images stock');
    
    res.json(collection);
  } catch (err) {
    res.status(500).json({ message: 'Error updating collection' });
  }
});

// Admin: Delete collection
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Collection.findByIdAndDelete(req.params.id);
    res.json({ message: 'Collection deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting collection' });
  }
});

module.exports = router;
