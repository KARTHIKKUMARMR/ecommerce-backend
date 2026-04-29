/**
 * auth.js — Authentication Routes
 *
 * Routes:
 *  POST /api/auth/send-otp      — Step 1: receive form data, generate OTP, email it
 *  POST /api/auth/verify-otp    — Step 2: verify OTP, create account, return JWT
 *  POST /api/auth/login         — Login (requires isVerified)
 *  GET  /api/auth/me            — Get current user profile
 *  PUT  /api/auth/profile       — Update profile
 *  PUT  /api/auth/wishlist/:id  — Toggle wishlist item
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); // Built-in Node.js module — no install needed
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { sendOTPEmail } = require('../config/mailer');
const router = express.Router();

// Helper: generate a signed JWT for a user ID
const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// Helper: generate a random 6-digit OTP string
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ─── STEP 1: Send OTP ────────────────────────────────────────────────────────
/**
 * POST /api/auth/send-otp
 * Body: { name, email, password, phone }
 *
 * HOW IT WORKS:
 * 1. Check if email already exists AND is verified → reject (already registered)
 * 2. Generate a 6-digit OTP
 * 3. Hash the OTP (we never store the raw OTP — security best practice)
 * 4. Create or update a pending (unverified) user in the DB
 * 5. Send the OTP to the user's email via Nodemailer
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if already verified under this email
    const existingVerified = await User.findOne({ email, isVerified: true });
    if (existingVerified) {
      return res.status(400).json({ message: 'Email already registered. Please login instead.' });
    }

    // Generate OTP and hash it for storage
    const rawOTP    = generateOTP();
    const hashedOTP = await bcrypt.hash(rawOTP, 10);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Upsert: update pending user if exists, create new if not
    await User.findOneAndUpdate(
      { email, isVerified: false }, // find unverified user with this email
      {
        name,
        email,
        password,       // will be hashed by the pre-save hook
        phone: phone || '',
        otp: hashedOTP,
        otpExpiry,
        isVerified: false,
      },
      {
        upsert: true,   // create if not found
        new: true,
        setDefaultsOnInsert: true,
        runValidators: false, // skip unique check for upsert
      }
    );

    // Send the OTP email (raw OTP, not the hash!)
    await sendOTPEmail(email, rawOTP, name);

    res.json({ message: `Verification code sent to ${email}. Please check your inbox.` });
  } catch (err) {
    console.error('send-otp error:', err);
    res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
});

// ─── STEP 2: Verify OTP & Create Account ─────────────────────────────────────
/**
 * POST /api/auth/verify-otp
 * Body: { email, otp }
 *
 * HOW IT WORKS:
 * 1. Find the pending user by email
 * 2. Check the OTP hasn't expired
 * 3. Compare the entered OTP against the stored hash (using bcrypt.compare)
 * 4. Mark user as verified, clear OTP fields
 * 5. Return a JWT so the user is automatically logged in
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Find the pending user
    const user = await User.findOne({ email, isVerified: false });
    if (!user) {
      return res.status(400).json({ message: 'No pending registration found for this email. Please register again.' });
    }

    // Check if OTP has expired
    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Verify OTP against the stored hash
    const isMatch = await bcrypt.compare(otp.trim(), user.otp);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect OTP. Please check your email and try again.' });
    }

    // ✅ OTP verified — activate the account
    user.isVerified = true;
    user.otp        = null;
    user.otpExpiry  = null;
    await user.save();

    // Return JWT so the user is automatically logged in
    res.json({
      _id:   user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error('verify-otp error:', err);
    res.status(500).json({ message: 'Verification failed. Please try again.' });
  }
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Block login for unverified accounts
    if (!user.isVerified) {
      return res.status(403).json({
        message: 'Email not verified. Please complete registration by verifying your OTP.',
        needsVerification: true,
        email: user.email,
      });
    }

    res.json({
      _id:   user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET PROFILE ──────────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist');
  res.json(user);
});

// ─── UPDATE PROFILE ───────────────────────────────────────────────────────────
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, phone, address }, { new: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── TOGGLE WISHLIST ──────────────────────────────────────────────────────────
router.put('/wishlist/:productId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const idx = user.wishlist.indexOf(req.params.productId);
    if (idx > -1) {
      user.wishlist.splice(idx, 1);
    } else {
      user.wishlist.push(req.params.productId);
    }
    await user.save();
    res.json({ wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
