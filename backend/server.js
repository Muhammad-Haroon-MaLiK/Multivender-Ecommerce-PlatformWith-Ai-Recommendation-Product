// server.js - Fully Corrected Version
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const passport = require('passport');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Import Passport configuration
require('./config/passport');

// Initialize express app FIRST
const app = express();

// ─── Security Middleware ────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use(compression());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

app.use('/api/auth', limiter);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ─── CORS Configuration ─────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://fyp-pi-ivory.vercel.app',
  process.env.CLIENT_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS Policy: Origin not allowed'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

// ─── Body Parsers ──────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Static Files with CORS Headers ──────────────────────────
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
}, express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
    };
    if (mimeTypes[ext]) {
      res.setHeader('Content-Type', mimeTypes[ext]);
    }
  }
}));

// ─── Initialize Passport ──────────────────────────────────
app.use(passport.initialize());

// ─── Route Registry (FIXED: Added .js and Safe Loading) ──
const routeConfigs = [
  { name: 'auth', path: './routes/auth.js' },
  { name: 'products', path: './routes/products.js' },
  { name: 'vendor', path: './routes/vendorRoutes.js' },
  { name: 'admin', path: './routes/admin.js' },
  { name: 'cart', path: './routes/cart.js' },
  { name: 'orders', path: './routes/orders.js' },
  { name: 'vendors', path: './routes/vendors.js' },
  { name: 'recommendations', path: './routes/recommendationRoutes.js' },
  { name: 'reviews', path: './routes/reviews.js' },
  { name: 'categories', path: './routes/categories.js' },
  { name: 'payments', path: './routes/payments.js' },
  { name: 'wishlist', path: './routes/wishlist.js' },
  { name: 'contact', path: './routes/contact.js' },
];

// Store loaded routes for API documentation
const loadedRoutes = [];

// Dynamically load routes with safe fallback
routeConfigs.forEach((route) => {
  try {
    const fullPath = path.join(__dirname, route.path);
    if (fs.existsSync(fullPath)) {
      const routeModule = require(route.path);
      app.use(`/api/${route.name}`, routeModule);
      loadedRoutes.push(route.name);
      console.log(`✅ Route loaded: /api/${route.name}`);
    } else {
      console.log(`⚠️ Route file not found: ${route.path}, creating fallback...`);
      // Create a fallback route that returns 404 with meaningful message
      app.use(`/api/${route.name}`, (req, res) => {
        res.status(404).json({
          success: false,
          message: `Route /api/${route.name} is not implemented yet (File missing)`,
          requestedUrl: req.originalUrl,
          method: req.method
        });
      });
      loadedRoutes.push(`${route.name} (fallback)`);
    }
  } catch (error) {
    console.error(`❌ Error loading route ${route.path}:`, error.message);
    // Create a fallback route even on error
    app.use(`/api/${route.name}`, (req, res) => {
      res.status(500).json({
        success: false,
        message: `Route /api/${route.name} failed to load`,
        error: error.message
      });
    });
  }
});

// ─── Health Check ──────────────────────────────────────────
app.get('/health', (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    status: 'healthy',
    memoryUsage: process.memoryUsage(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
    loadedRoutes: loadedRoutes
  };
  try {
    res.status(200).json(healthCheck);
  } catch (error) {
    healthCheck.message = error;
    res.status(503).json(healthCheck);
  }
});

// ─── API Documentation ─────────────────────────────────────
app.get('/api', (req, res) => {
  const endpoints = {};
  loadedRoutes.forEach(routeName => {
    // Clean up " (fallback)" suffix for display
    const cleanName = routeName.replace(' (fallback)', '');
    endpoints[cleanName] = `/api/${cleanName}`;
  });

  res.json({
    success: true,
    version: '1.0.0',
    name: 'ShopVerse API',
    description: 'E-commerce API for ShopVerse',
    availableEndpoints: endpoints,
    documentation: `${process.env.CLIENT_URL || 'http://localhost:3000'}/api-docs`
  });
});

// ─── Root Route ────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 ShopVerse API Server is running',
    version: '1.0.0',
    status: 'online',
    documentation: '/api',
    health: '/health',
    time: new Date().toISOString()
  });
});

// ─── 404 Handler ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    requestedUrl: req.originalUrl,
    method: req.method,
    suggestion: 'Please check the API documentation at /api'
  });
});

// ─── Error Handling Middleware ─────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message),
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      error: err.message
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      message: `Duplicate value for ${field}`,
      field: field
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: err.message
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      error: err.message
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    code: err.code || 'INTERNAL_ERROR'
  });
});

// ─── Database Connection ────────────────────────────────────
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB connected successfully');
    console.log('📊 Database:', mongoose.connection.name);
    console.log(`📁 Host: ${mongoose.connection.host}`);
    console.log(`🔢 Port: ${mongoose.connection.port}`);
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// ─── Start Server ──────────────────────────────────────────
const startServer = async () => {
  await connectDB();
  
  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`🔗 API Documentation: http://localhost:${PORT}/api`);
    console.log(`💚 Health Check: http://localhost:${PORT}/health`);
    console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('='.repeat(60));
    console.log('\n📋 Available Routes:');
    
    loadedRoutes.forEach(route => {
      console.log(`  ✅ /api/${route}`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('✨ Server is ready for requests!');
    console.log('='.repeat(60) + '\n');
  });

  const gracefulShutdown = () => {
    console.log('\n🛑 Received shutdown signal');
    server.close(async () => {
      console.log('🛑 HTTP server closed');
      try {
        await mongoose.connection.close();
        console.log('🛑 MongoDB connection closed');
        process.exit(0);
      } catch (err) {
        console.error('❌ Error during shutdown:', err);
        process.exit(1);
      }
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
};

// ─── Handle Uncaught Exceptions ──────────────────────────
process.on('uncaughtException', (err) => {
  console.error('🔥 Uncaught Exception:', err);
  console.error('Stack:', err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

module.exports = { app, startServer };