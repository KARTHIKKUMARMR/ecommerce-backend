const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, default: 0 },
  category: { type: String, required: true, enum: ['Kurtis', 'Sarees', 'Earrings', 'Bangles'] },
  images: [{ type: String }],
  sizes: [{ type: String }],
  colors: [{ type: String }],
  stock: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  isOnSale: { type: Boolean, default: false },
  discount: { type: Number, default: 0 },
  tags: [{ type: String }],
  ratings: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
}, { timestamps: true });

productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ createdAt: -1 });          // for default sort
productSchema.index({ category: 1, createdAt: -1 }); // for category filter + sort
productSchema.index({ price: 1 });               // for price range queries
productSchema.index({ isFeatured: 1 });          // for featured products
productSchema.index({ isOnSale: 1 });            // for sale products

module.exports = mongoose.model('Product', productSchema);
