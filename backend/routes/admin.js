const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { protect, authorize } = require('../middleware/authMiddleware');

// All admin routes require a logged-in user with the 'admin' role
router.use(protect, authorize('admin'));

// Get all users
router.get('/users', async (req, res) => {
  try {
    console.log('GET /api/admin/users called');
    const users = await User.find().select('-password');
    console.log(`Found ${users.length} users`);
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Change user role
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['customer', 'vendor', 'admin'];

    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent an admin from accidentally demoting themselves and losing access
    if (user._id.toString() === req.user._id.toString() && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own admin role'
      });
    }

    user.role = role;
    await user.save();

    const updatedUser = await User.findById(user._id).select('-password');

    res.json({
      success: true,
      message: 'User role updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error changing user role:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all vendors
router.get('/vendors', async (req, res) => {
  try {
    const vendors = await User.find({ role: 'vendor' }).select('-password');
    res.json({ success: true, vendors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get pending vendors
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

// Approve vendor
router.put('/vendors/:id/approve', async (req, res) => {
  try {
    const vendor = await User.findById(req.params.id);
    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    if (!vendor.vendorDetails) vendor.vendorDetails = {};
    vendor.vendorDetails.isApproved = true;
    await vendor.save();

    res.json({ success: true, message: 'Vendor approved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all products
router.get('/products/all', async (req, res) => {
  try {
    const products = await Product.find().populate('vendor', 'name email');
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get pending products
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

// Approve product
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
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reject product
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
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get stats
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

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Admin API is working!' });
});

module.exports = router;