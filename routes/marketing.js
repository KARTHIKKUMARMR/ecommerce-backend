const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const Coupon = require('../models/Coupon');
const { protect, admin } = require('../middleware/auth');

// ─── SETTINGS (BANNER & SHIPPING) ────────────────────────────────────────────

// Public: Get banner and shipping config
router.get('/settings', async (req, res) => {
  try {
    const banner = await Settings.findOne({ key: 'top_banner' });
    const shipping = await Settings.findOne({ key: 'shipping_config' });
    res.json({ banner: banner?.value, shipping: shipping?.value });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching settings' });
  }
});

// Admin: Update banner or shipping
router.put('/settings/:key', protect, admin, async (req, res) => {
  try {
    const { value } = req.body;
    const settings = await Settings.findOneAndUpdate(
      { key: req.params.key },
      { value, updatedAt: Date.now() },
      { upsert: true, new: true }
    );
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: 'Error updating settings' });
  }
});

// ─── COUPONS ────────────────────────────────────────────────────────────────

// Admin: Get all coupons
router.get('/coupons', protect, admin, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort('-createdAt');
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching coupons' });
  }
});

// Admin: Create coupon
router.post('/coupons', protect, admin, async (req, res) => {
  try {
    const coupon = new Coupon(req.body);
    await coupon.save();
    res.status(201).json(coupon);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Admin: Delete coupon
router.delete('/coupons/:id', protect, admin, async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ message: 'Coupon deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting coupon' });
  }
});

// Public: Validate coupon
router.post('/coupons/validate', async (req, res) => {
  try {
    const { code, cartValue } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) return res.status(404).json({ message: 'Invalid coupon code' });

    const now = new Date();
    if (now < coupon.startDate) return res.status(400).json({ message: 'Coupon offer has not started yet' });
    if (now > coupon.endDate) return res.status(400).json({ message: 'Coupon has expired' });

    if (cartValue < coupon.minCartValue) {
      return res.status(400).json({ message: `Minimum order of ₹${coupon.minCartValue} required for this coupon` });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: 'Coupon usage limit reached' });
    }

    res.json(coupon);
  } catch (err) {
    res.status(500).json({ message: 'Error validating coupon' });
  }
});

module.exports = router;
