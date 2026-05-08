const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  bannerImage: { type: String },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  autoUpdateByCategory: { type: String },
  autoUpdateByTag: { type: String },
  offerText: { type: String },
  type: { type: String, enum: ['Festival', 'Wedding', 'Trending', 'New Arrival', 'Other'], default: 'Other' },
  visibility: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Collection', collectionSchema);
