const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'), false);
    }
  }
});

// PUBLIC ROUTES

// GET all approved products (public)
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({ isApproved: true })
      .populate('vendor', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (error) {
    console.error('Error in GET /products:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single product by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('vendor', 'name email vendorDetails');
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }
    
    res.json({ success: true, product });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET products by category (public)
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const products = await Product.find({ 
      category: category,
      isApproved: true 
    }).populate('vendor', 'name');
    
    res.json({ success: true, products });
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET product attributes by category (public)
router.get('/attributes/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { getProductAttributes } = require('../config/productAttributes');
    const attributes = getProductAttributes(category);
    
    res.json({
      success: true,
      category,
      attributes
    });
  } catch (error) {
    console.error('Error fetching product attributes:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// VENDOR ROUTES 

// POST create product (vendor only)
router.post('/', protect, authorize('vendor'), upload.array('images', 5), async (req, res) => {
  try {
    console.log('=== CREATE PRODUCT ===');
    console.log('User ID:', req.user?.id);
    console.log('Body:', req.body);
    console.log('Files:', req.files ? req.files.length : 0);
    
    const { 
      name, description, price, category, stock, 
      discountedPrice, attributes, attributeOptions 
    } = req.body;
    
    // Validate required fields
    if (!name || !description || !price || !category || !stock) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: name, description, price, category, stock' 
      });
    }
    
    // Create product
    const productData = {
      name,
      description,
      price: Number(price),
      stock: Number(stock),
      category,
      vendor: req.user.id,
      discountedPrice: discountedPrice ? Number(discountedPrice) : null,
      isApproved: false,
      approvalStatus: 'pending',
      images: req.files ? req.files.map(f => `/uploads/${f.filename}`) : []
    };
    
    //  Add attributes if provided
    if (attributes) {
      productData.attributes = typeof attributes === 'string' 
        ? JSON.parse(attributes) 
        : attributes;
    }
    
    //  Add attribute options if provided
    if (attributeOptions) {
      productData.attributeOptions = typeof attributeOptions === 'string' 
        ? JSON.parse(attributeOptions) 
        : attributeOptions;
    }
    
    const product = new Product(productData);
    await product.save();
    
    console.log('Product saved:', product._id);
    console.log('Attributes:', product.attributes);
    
    res.status(201).json({
      success: true,
      message: 'Product added successfully! Waiting for admin approval.',
      product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// PUT update product (vendor only)
router.put('/:id', protect, authorize('vendor'), upload.array('images', 5), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }
    
    // Check if user owns the product
    if (product.vendor.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this product' 
      });
    }
    
    const { 
      name, description, price, category, stock, 
      discountedPrice, attributes, attributeOptions 
    } = req.body;
    
    // Update fields
    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = Number(price);
    if (category) product.category = category;
    if (stock !== undefined) product.stock = Number(stock);
    if (discountedPrice !== undefined) {
      product.discountedPrice = discountedPrice ? Number(discountedPrice) : null;
    }
    if (attributes) {
      product.attributes = typeof attributes === 'string' 
        ? JSON.parse(attributes) 
        : attributes;
    }
    if (attributeOptions) {
      product.attributeOptions = typeof attributeOptions === 'string' 
        ? JSON.parse(attributeOptions) 
        : attributeOptions;
    }
    
    // Handle new images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(f => `/uploads/${f.filename}`);
      product.images = [...product.images, ...newImages];
    }
    
    await product.save();
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE product (vendor only)
router.delete('/:id', protect, authorize('vendor'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }
    
    // Check if user owns the product
    if (product.vendor.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to delete this product' 
      });
    }
    
    await product.deleteOne();
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// VENDOR SPECIFIC ROUTES  

// GET vendor's own products (vendor only)
router.get('/vendor/me', protect, authorize('vendor'), async (req, res) => {
  try {
    console.log('Fetching products for vendor:', req.user.id);
    const products = await Product.find({ vendor: req.user.id })
      .sort({ createdAt: -1 });
    
    res.json({ 
      success: true, 
      products 
    });
  } catch (error) {
    console.error('Error fetching vendor products:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;