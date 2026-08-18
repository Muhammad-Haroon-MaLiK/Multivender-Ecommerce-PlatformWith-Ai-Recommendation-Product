const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const vendorRoutes = require('./routes/vendorRoutes');
const adminRoutes = require('./routes/admin');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const vendorsRoutes = require('./routes/vendors');
const recommendationRoutes = require('./routes/recommendationRoutes');



// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/vendors', vendorsRoutes);
app.use('/api/recommendations', recommendationRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    console.log('Database:', mongoose.connection.name);
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});