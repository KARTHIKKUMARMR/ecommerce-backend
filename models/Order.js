const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // user is optional — null for guest orders
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // For guest orders — stores name, phone, email (all optional individually)
  isGuest: { type: Boolean, default: false },
  guestInfo: {
    name:  { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
  },

  items: [{
    product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name:     String,
    image:    String,
    price:    Number,
    quantity: { type: Number, default: 1 },
    size:     String,
    color:    String,
  }],

  shippingAddress: {
    name:    String,
    phone:   String,
    street:  String,
    city:    String,
    state:   String,
    pincode: String,
  },

  paymentMethod: { type: String, default: 'COD' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  orderStatus: {
    type: String,
    enum: ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'placed',
  },
  trackingId:   { type: String, default: '' },
  courierName:  { type: String, default: '' },
  trackingLink: { type: String, default: '' },

  subtotal:      { type: Number, required: true },
  shippingCharge:{ type: Number, default: 0 },
  discount:      { type: Number, default: 0 },
  total:         { type: Number, required: true },
  notes:         { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
