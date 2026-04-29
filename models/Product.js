const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  description:   { type: String, required: true },
  price:         { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, default: 0 },
  category:      { type: String, required: true, enum: ['Kurtis', 'Sarees', 'Earrings', 'Bangles'] },
  images:        [{ type: String }],
  sizes:         [{ type: String }],
  colors:        [{ type: String }],
  stock:         { type: Number, default: 0 },
  isFeatured:    { type: Boolean, default: false },
  isOnSale:      { type: Boolean, default: false },
  discount:      { type: Number, default: 0 },
  tags:          [{ type: String }],
  ratings:       { type: Number, default: 0 },
  numReviews:    { type: Number, default: 0 },

  // ── Payment Method Control (set by Admin) ───────────────────────────────
  // Determines which payment methods are allowed for this product at checkout.
  // 'COD'    = Cash on Delivery allowed
  // 'Online' = UPI / Card / Net Banking allowed
  // Default: both are allowed
  allowedPaymentMethods: {
    type: [{ type: String, enum: ['COD', 'Online'] }],
    default: ['COD', 'Online'],
  },

}, { timestamps: true });

productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ createdAt: -1 });
productSchema.index({ category: 1, createdAt: -1 });
productSchema.index({ price: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isOnSale: 1 });

module.exports = mongoose.model('Product', productSchema);
