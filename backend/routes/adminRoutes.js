const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Debug middleware to log all admin requests
router.use((req, res, next) => {
  console.log(`[Admin Route] ${req.method} ${req.url}`);
  next();
});

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// USER MANAGEMENT 

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    console.log('Fetching all users...');
    const users = await User.find().select('-password');
    console.log(`Found ${users.length} users`);
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

//  PUT /api/admin/users/:id/role
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;
    
    console.log(`Changing role for user ${userId} to ${role}`);
    
    const validRoles = ['customer', 'vendor', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const oldRole = user.role;
    user.role = role;
    
    if (role === 'vendor' && !user.vendorDetails) {
      user.vendorDetails = {
        storeName: `${user.name}'s Store`,
        isApproved: false,
        commissionRate: 10,
        totalSales: 0,
        balance: 0
      };
    }
    
    await user.save();
    
    console.log(`Role changed: ${user.email} from ${oldRole} to ${role}`);
    res.json({ 
      success: true, 
      message: `Role changed from ${oldRole} to ${role}`,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Error changing role:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// VENDOR MANAGEMENT 

// GET /api/admin/vendors
router.get('/vendors', async (req, res) => {
  try {
    const vendors = await User.find({ role: 'vendor' }).select('-password');
    res.json({ success: true, vendors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/vendors/pending
router.get('/vendors/pending', async (req, res) => {
  try {
    const vendors = await User.find({ 
      role: 'vendor', 
      'vendorDetails.isApproved': false 
    }).select('-password');
    res.json({ success: true, vendors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

//  PUT /api/admin/vendors/:id/approve
router.put('/vendors/:id/approve', async (req, res) => {
  try {
    const vendor = await User.findById(req.params.id);
    
    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }
    
    if (!vendor.vendorDetails) {
      vendor.vendorDetails = {};
    }
    
    vendor.vendorDetails.isApproved = true;
    await vendor.save();
    
    res.json({ success: true, message: 'Vendor approved successfully' });
  } catch (error) {
    console.error('Error approving vendor:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PRODUCT MANAGEMENT

// GET /api/admin/products/all
router.get('/products/all', async (req, res) => {
  try {
    const products = await Product.find().populate('vendor', 'name email');
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/products/pending
router.get('/products/pending', async (req, res) => {
  try {
    const products = await Product.find({ 
      isApproved: false, 
      approvalStatus: 'pending' 
    }).populate('vendor', 'name email');
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/admin/products/:id/approve
router.put('/products/:id/approve', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    product.isApproved = true;
    product.approvalStatus = 'approved';
    await product.save();
    
    res.json({ success: true, message: 'Product approved successfully' });
  } catch (error) {
    console.error('Error approving product:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/admin/products/:id/reject
router.put('/products/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    product.isApproved = false;
    product.approvalStatus = 'rejected';
    product.rejectionReason = reason || 'No reason provided';
    await product.save();
    
    res.json({ success: true, message: 'Product rejected' });
  } catch (error) {
    console.error('Error rejecting product:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// STATISTICS 

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const orders = await Order.find();
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    res.json({ 
      success: true, 
      totalProducts,
      totalOrders,
      totalRevenue
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;