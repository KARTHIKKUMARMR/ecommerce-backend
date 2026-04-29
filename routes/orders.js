/**
 * orders.js — Order Routes
 *
 * Routes:
 *  POST /api/orders          — Place order (logged-in users only)
 *  POST /api/orders/guest    — Place order as guest (no login required)
 *  GET  /api/orders/my       — Get current user's order history
 *  GET  /api/orders/:id      — Get a specific order
 *
 * Payment Enforcement:
 *  Before creating any order, we check each product's `allowedPaymentMethods`.
 *  If the user chose COD but a product only allows Online → reject with a clear message.
 */

const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const router = express.Router();

// ─── HELPER: Validate Payment Method ────────────────────────────────────────
/**
 * Checks all cart items against their allowedPaymentMethods.
 * Returns { ok: true } or { ok: false, message: '...' }
 */
const validatePayment = async (items, paymentMethod) => {
  // Normalize: 'UPI', 'Card', 'NetBanking' all count as 'Online'
  const methodType = paymentMethod === 'COD' ? 'COD' : 'Online';

  for (const item of items) {
    const product = await Product.findById(item.product).select('name allowedPaymentMethods');
    if (!product) continue;

    // Default: both allowed (for old products without this field)
    const allowed = product.allowedPaymentMethods?.length > 0
      ? product.allowedPaymentMethods
      : ['COD', 'Online'];

    if (!allowed.includes(methodType)) {
      const restriction = methodType === 'COD'
        ? `"${product.name}" does not support Cash on Delivery. Please choose an online payment method.`
        : `"${product.name}" is available for Cash on Delivery only.`;
      return { ok: false, message: restriction };
    }
  }
  return { ok: true };
};

// ─── HELPER: Deduct Stock ────────────────────────────────────────────────────
const deductStock = async (items) => {
  for (const item of items) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
  }
};

// ─── POST /api/orders — Logged-in User Order ─────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, subtotal, shippingCharge, discount, total } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }

    // Validate payment method against product restrictions
    const check = await validatePayment(items, paymentMethod);
    if (!check.ok) return res.status(400).json({ message: check.message });

    const order = await Order.create({
      user: req.user._id,
      isGuest: false,
      items,
      shippingAddress,
      paymentMethod: paymentMethod || 'COD',
      paymentStatus: paymentMethod === 'COD' ? 'pending' : 'pending', // simulate pending for all
      subtotal,
      shippingCharge: shippingCharge || 0,
      discount:       discount || 0,
      total,
    });

    await deductStock(items);
    res.status(201).json(order);
  } catch (err) {
    console.error('Order error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/orders/guest — Guest Order (No Login Needed) ─────────────────
/**
 * HOW GUEST CHECKOUT WORKS:
 * 1. No authentication token is required for this route.
 * 2. The guest provides their name, phone, and optionally email in `guestInfo`.
 * 3. Order is saved with isGuest: true and user: null.
 * 4. Stock is still deducted as normal.
 * 5. Admin can see all guest orders in the dashboard.
 */
router.post('/guest', async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, subtotal, shippingCharge, discount, total, guestInfo } = req.body;

    // Basic validation
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }
    if (!guestInfo?.name || !guestInfo?.phone) {
      return res.status(400).json({ message: 'Guest name and phone number are required' });
    }
    if (!shippingAddress?.street || !shippingAddress?.city || !shippingAddress?.pincode) {
      return res.status(400).json({ message: 'Complete shipping address is required' });
    }

    // Validate payment method against product restrictions
    const check = await validatePayment(items, paymentMethod);
    if (!check.ok) return res.status(400).json({ message: check.message });

    const order = await Order.create({
      user: null,       // no user reference for guests
      isGuest: true,
      guestInfo: {
        name:  guestInfo.name,
        phone: guestInfo.phone,
        email: guestInfo.email || '',
      },
      items,
      shippingAddress,
      paymentMethod: paymentMethod || 'COD',
      subtotal,
      shippingCharge: shippingCharge || 0,
      discount:       discount || 0,
      total,
    });

    await deductStock(items);
    res.status(201).json(order);
  } catch (err) {
    console.error('Guest order error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/orders/my — My Order History ───────────────────────────────────
router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('items.product', 'name images');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/orders/:id — Single Order ──────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user && order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
