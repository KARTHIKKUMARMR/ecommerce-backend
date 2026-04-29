/**
 * auth.js — Authentication Routes
 *
 * Routes:
 *  POST /api/auth/send-otp      — Step 1: generate OTP, email it (or log it in dev)
 *  POST /api/auth/verify-otp    — Step 2: verify OTP, activate account, return JWT
 *  POST /api/auth/login         — Login (blocked until email is verified)
 *  GET  /api/auth/me            — Get current user profile
 *  PUT  /api/auth/profile       — Update profile
 *  PUT  /api/auth/wishlist/:id  — Toggle wishlist item
 *
 * OTP Flow:
 *  DEV  mode → OTP is printed to console + returned in API response as `devOtp`
 *  PROD mode → OTP is sent to email (requires Gmail config in .env)
 */

const express = require('express');
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');
const User    = require('../models/User');
const { protect }       = require('../middleware/auth');
const { sendOTPEmail, isEmailConfigured } = require('../config/mailer');
const router = express.Router();

// ─── Helpers ─────────────────────────────────────────────────────────────────
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// Generates a cryptographically random 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const isDev = process.env.NODE_ENV !== 'production';

// ─── POST /api/auth/send-otp ─────────────────────────────────────────────────
/**
 * Step 1 of registration:
 * 1. Validate inputs
 * 2. Check the email isn't already taken (verified account)
 * 3. Generate 6-digit OTP and hash it for secure storage
 * 4. Save/update the pending (unverified) user record
 * 5. Send OTP email (or log to console in dev mode)
 *
 * Response includes `devOtp` and `previewUrl` in dev mode so you can
 * test without real email credentials.
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // ── Input validation ────────────────────────────────────────────────
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Full name is required' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ message: 'A valid email address is required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // ── Check for existing verified account ─────────────────────────────
    const existingVerified = await User.findOne({ email: email.toLowerCase(), isVerified: true });
    if (existingVerified) {
      return res.status(400).json({ message: 'This email is already registered. Please login instead.' });
    }

    // ── Generate OTP ─────────────────────────────────────────────────────
    const rawOTP    = generateOTP();                             // e.g. "847291"
    const hashedOTP = await bcrypt.hash(rawOTP, 10);            // store only the hash
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);   // expires in 10 minutes

    // Always log to console (visible in Render logs and local terminal)
    console.log(`\n🔐 OTP for ${email}: ${rawOTP}  (expires in 10 min)\n`);

    // ── Save pending user (upsert — handles resend OTP case) ────────────
    // We use findOneAndUpdate + upsert so if user clicks "Resend" it updates
    // the existing unverified record instead of creating a duplicate.
    await User.findOneAndUpdate(
      { email: email.toLowerCase(), isVerified: false },
      {
        name:      name.trim(),
        email:     email.toLowerCase(),
        password,         // User model pre-save hook will hash this
        phone:     phone?.trim() || '',
        otp:       hashedOTP,
        otpExpiry,
        isVerified: false,
      },
      {
        upsert: true,             // create document if none found
        new: true,
        setDefaultsOnInsert: true,
        runValidators: false,
      }
    );

    // ── Send the OTP email ────────────────────────────────────────────────
    let previewUrl = null;
    let emailError = null;

    try {
      previewUrl = await sendOTPEmail(email, rawOTP, name.trim());
    } catch (mailErr) {
      // Email send failed — still proceed, we log OTP to console as fallback
      emailError = mailErr.message;
      console.error('⚠️  Email send failed:', mailErr.message);
    }

    // ── Build response ────────────────────────────────────────────────────
    const response = {
      message: emailError
        ? `OTP generated (email send failed — check server console for the code)`
        : `Verification code sent to ${email}. Check your inbox (and spam folder).`,
    };

    // In DEV mode: include OTP and preview URL in the response for easy testing
    if (isDev) {
      response.devOtp       = rawOTP;
      response.devNote      = '⚠️ Dev mode: This field only exists in development. Remove before going live.';
      if (previewUrl) response.previewUrl = previewUrl;
    }

    res.json(response);

  } catch (err) {
    console.error('send-otp error:', err);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

// ─── POST /api/auth/verify-otp ───────────────────────────────────────────────
/**
 * Step 2 of registration:
 * 1. Find the pending user by email
 * 2. Check OTP hasn't expired
 * 3. Compare entered OTP against the stored bcrypt hash
 * 4. Mark account as verified, clear OTP fields
 * 5. Return JWT (user is automatically logged in)
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are both required' });
    }

    // Find the pending (unverified) user
    const user = await User.findOne({ email: email.toLowerCase(), isVerified: false });
    if (!user) {
      return res.status(400).json({
        message: 'No pending registration found for this email. Please start registration again.',
      });
    }

    // Check expiry
    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(400).json({
        message: 'OTP has expired (valid for 10 minutes). Please request a new code.',
      });
    }

    // Compare the entered OTP against the stored bcrypt hash
    const isMatch = await bcrypt.compare(String(otp).trim(), user.otp);
    if (!isMatch) {
      return res.status(400).json({
        message: 'Incorrect OTP. Double-check the code and try again.',
      });
    }

    // ✅ Success — activate the account
    user.isVerified = true;
    user.otp        = null;
    user.otpExpiry  = null;
    await user.save();

    console.log(`✅ Account verified: ${email}`);

    // Return JWT — user is automatically logged in
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

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Block login for accounts that haven't verified their email
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
    console.error('login error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PUT /api/auth/profile ────────────────────────────────────────────────────
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, address },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PUT /api/auth/wishlist/:productId ───────────────────────────────────────
router.put('/wishlist/:productId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const idx  = user.wishlist.indexOf(req.params.productId);
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
