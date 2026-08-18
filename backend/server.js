// server.js - Complete corrected version
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
// ─── CORS Configuration ─────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://fyp-pi-ivory.vercel.app',
  process.env.CLIENT_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
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
// THIS MUST COME AFTER app IS INITIALIZED
app.use('/uploads', (req, res, next) => {
  // Set CORS headers for all static files
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
}, express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    // Set cache control for images
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Set appropriate content type based on file extension
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

// ─── Helper function to check if route file exists ──────
const routeExists = (routePath) => {
  try {
    const fullPath = path.join(__dirname, routePath);
    return fs.existsSync(fullPath);
  } catch (error) {
    return false;
  }
};

// ─── Routes ────────────────────────────────────────────────
// Load routes only if they exist
const routes = [
  { path: './routes/auth', name: 'auth' },
  { path: './routes/products', name: 'products' },
  { path: './routes/vendorRoutes', name: 'vendor' },
  { path: './routes/admin', name: 'admin' },
  { path: './routes/cart', name: 'cart' },
  { path: './routes/orders', name: 'orders' },
  { path: './routes/vendors', name: 'vendors' },
  { path: './routes/recommendationRoutes', name: 'recommendations' },
  { path: './routes/reviews', name: 'reviews' },
  { path: './routes/categories', name: 'categories' },
  { path: './routes/payments', name: 'payments' },
  { path: './routes/wishlist', name: 'wishlist' },
  { path: './routes/contact', name: 'contact' },
];

// Dynamically load routes
routes.forEach((route) => {
  try {
    const routeModule = require(route.path);
    app.use(`/api/${route.name}`, routeModule);
    console.log(`✅ Route loaded: /api/${route.name}`);
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log(`⚠️ Route file not found: ${route.path}, skipping...`);
    } else {
      console.error(`❌ Error loading route ${route.path}:`, error.message);
    }
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
    environment: process.env.NODE_ENV || 'development'
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

  // List available endpoints based on loaded routes
  const availableRoutes = routes
    .filter(r => {
      try {
        require.resolve(r.path);
        return true;
      } catch {
        return false;
      }
    })
    .map(r => r.name);

  availableRoutes.forEach(routeName => {
    endpoints[routeName] = `/api/${routeName}`;
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
    console.log(`📧 Email Service: ${process.env.EMAIL_SERVICE || 'Not configured'}`);
    console.log('='.repeat(60));
    console.log('\n📋 Available Routes:');
    
    // List loaded routes
    routes.forEach(r => {
      try {
        require.resolve(r.path);
        console.log(`  ✅ /api/${r.name}`);
      } catch {
        console.log(`  ❌ /api/${r.name} (not loaded)`);
      }
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