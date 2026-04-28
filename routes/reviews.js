const express = require('express');
const Review = require('../models/Review');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const router = express.Router();

// @GET /api/reviews/:productId
router.get('/:productId', async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId }).sort({ createdAt: -1 });
  res.json(reviews);
});

// @POST /api/reviews/:productId
router.post('/:productId', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const existing = await Review.findOne({ product: req.params.productId, user: req.user._id });
    if (existing) return res.status(400).json({ message: 'You already reviewed this product' });
    const review = await Review.create({
      product: req.params.productId,
      user: req.user._id,
      userName: req.user.name,
      rating,
      comment,
    });
    // Recalculate product rating
    const reviews = await Review.find({ product: req.params.productId });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Product.findByIdAndUpdate(req.params.productId, { ratings: avgRating, numReviews: reviews.length });
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
