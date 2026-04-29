require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes    = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes   = require('./routes/orders');
const adminRoutes   = require('./routes/admin');
const reviewRoutes  = require('./routes/reviews');
const uploadRoutes  = require('./routes/upload'); // Cloudinary upload endpoint

const app = express();

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) return callback(null, true);

    const isAllowed =
      origin === 'http://localhost:5173' ||
      origin === 'http://localhost:3000' ||
      origin.endsWith('.vercel.app') ||             // All Vercel preview/prod URLs
      origin.includes('20231049karthikkumar');       // Your specific Vercel team URLs

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse JSON and URL-encoded bodies
// Note: We keep the limit for any JSON payloads, but images now go via multipart (Cloudinary)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// NOTE: The old `/uploads` static route has been removed.
// Images are now served from Cloudinary's global CDN — no local disk needed.

// ─── ROUTES ──────────────────────────────────────────────────────────────────

app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/reviews',  reviewRoutes);
app.use('/api/upload',   uploadRoutes); // POST /api/upload — image upload to Cloudinary

// ─── HEALTH CHECK & ROOT ─────────────────────────────────────────────────────

app.get('/', (req, res) => res.send('Welcome to HASHTHAKALA API! The backend is successfully running.'));
app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'HASHTHAKALA API running' }));

// ─── TEST EMAIL ENDPOINT ──────────────────────────────────────────────────────
// Open in browser: https://your-render-url.onrender.com/api/test-email?to=yourmail@gmail.com
// This verifies that email is working on the live Render server.
// REMOVE THIS ROUTE before going to production (or keep it behind admin auth).
app.get('/api/test-email', async (req, res) => {
  const { sendOTPEmail, isEmailConfigured } = require('./config/mailer');
  const to = req.query.to || process.env.EMAIL_USER;
  try {
    console.log('Test email triggered. Configured:', isEmailConfigured(), '→', to);
    await sendOTPEmail(to, '123456', 'Test User');
    res.json({
      success: true,
      message: `✅ Test OTP email sent to: ${to}`,
      configured: isEmailConfigured(),
      sender: process.env.EMAIL_USER,
    });
  } catch (err) {
    console.error('Test email failed:', err);
    res.status(500).json({
      success: false,
      error: err.message,
      configured: isEmailConfigured(),
      hint: 'Check Render logs for full error details',
    });
  }
});

// ─── GLOBAL ERROR HANDLER ────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// ─── DATABASE + SERVER START ─────────────────────────────────────────────────

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server running on http://localhost:${process.env.PORT || 5000}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
