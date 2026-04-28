require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const reviewRoutes = require('./routes/reviews');

const app = express();

// Middleware
const allowedOrigins = ['http://localhost:5173', 'https://frontend-red-two-75.vercel.app', 'https://frontend-46l3t36gi-20231049karthikkumar-4616s-projects.vercel.app'];
app.use(cors({ 
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o) || o.startsWith(origin))) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all temporarily to ensure it works
    }
  }, 
  credentials: true 
}));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);

// Health check and Root route
app.get('/', (req, res) => res.send('Welcome to HASHTHAKALA API! The backend is successfully running.'));
app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'HASHTHAKALA API running' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Server running on http://localhost:${process.env.PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
