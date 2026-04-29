const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  phone:    { type: String, default: '' },
  address: {
    street:  { type: String, default: '' },
    city:    { type: String, default: '' },
    state:   { type: String, default: '' },
    pincode: { type: String, default: '' },
  },
  role:     { type: String, enum: ['user', 'admin'], default: 'user' },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

  // ── Email Verification (OTP) ────────────────────────────────────────────
  // isVerified: becomes true once the user enters the correct OTP
  isVerified: { type: Boolean, default: false },
  // otp: we store a HASHED version of the OTP (never the raw code)
  otp:       { type: String, default: null },
  // otpExpiry: the Date/time when the OTP stops being valid (10 minutes)
  otpExpiry: { type: Date, default: null },

  // ── Password Reset ───────────────────────────────────────────────────────
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpire: { type: Date, default: null },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
