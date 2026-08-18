const mongoose = require('mongoose'); 
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Get all users
// GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all products
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('vendor', 'name email');
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Change user role (Admin only)
// PUT /api/admin/users/:id/role
const changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;
    
    console.log(`[DEBUG] Changing role for user ${userId} to ${role}`);
    
    // Validate role
    const validRoles = ['customer', 'vendor', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role. Must be customer, vendor, or admin' 
      });
    }
    
    // Find user by ID
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    const oldRole = user.role;
    
    // Update the role directly
    user.role = role;
    
    // If changing to vendor, add vendor details
    if (role === 'vendor' && !user.vendorDetails) {
      user.vendorDetails = {
        storeName: `${user.name}'s Store`,
        isApproved: true,
        commissionRate: 10,
        totalSales: 0,
        balance: 0,
        payoutHistory: []
      };
    }
    
    // If changing to admin, ensure no vendor details
    if (role === 'admin') {
      user.isVendor = false;
    }
    
    await user.save();
    
    console.log(`[DEBUG] Role changed: ${user.email} from ${oldRole} to ${role}`);
    
    res.json({ 
      success: true, 
      message: `User role changed from ${oldRole} to ${role} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        vendorDetails: user.vendorDetails
      }
    });
    
  } catch (error) {
    console.error('[ERROR] Error changing user role:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error changing user role'
    });
  }
};

//  Delete user
// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Prevent deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }
    
    await user.deleteOne();
    console.log(`[DEBUG] User deleted: ${user.email}`);
    
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

//  Get all vendors
// GET /api/admin/vendors
const getAllVendors = async (req, res) => {
  try {
    const vendors = await User.find({ role: 'vendor' }).select('-password');
    res.json({ success: true, vendors });
  } catch (error) {
    console.error('Error in getAllVendors:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

//  Get pending vendors
// GET /api/admin/vendors/pending
const getPendingVendors = async (req, res) => {
  try {
    const vendors = await User.find({ 
      role: 'vendor',
      'vendorDetails.isApproved': false 
    }).select('-password');
    
    console.log(`[DEBUG] Found ${vendors.length} pending vendors`);
    
    res.json({ success: true, vendors });
  } catch (error) {
    console.error('Error in getPendingVendors:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

//  Approve vendor (FIXED)
// PUT /api/admin/vendors/:id/approve
//  Approve vendor - COMPLETELY REWRITTEN
// PUT /api/admin/vendors/:id/approve
const approveVendor = async (req, res) => {
  try {
    const vendorId = req.params.id;
    console.log(`[DEBUG] Approving vendor with ID: ${vendorId}`);
    
    // Validate ID format
    if (!vendorId || vendorId.length !== 24) {
      console.log(`[DEBUG] Invalid vendor ID format: ${vendorId}`);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid vendor ID format' 
      });
    }
    
    // Find vendor by ID
    const vendor = await User.findById(vendorId);
    
    if (!vendor) {
      console.log(`[DEBUG] Vendor not found with ID: ${vendorId}`);
      return res.status(404).json({ 
        success: false, 
        message: 'Vendor not found' 
      });
    }
    
    console.log(`[DEBUG] Found vendor: ${vendor.email}, Current role: ${vendor.role}`);
    
    // Check if user is a vendor
    if (vendor.role !== 'vendor') {
      console.log(`[DEBUG] User is not a vendor. Role: ${vendor.role}`);
      return res.status(400).json({ 
        success: false, 
        message: 'User is not a vendor' 
      });
    }
    
    // Method 1: Direct MongoDB update (bypasses Mongoose issues)
    const db = mongoose.connection.db;
    const collection = db.collection('users');
    
    const result = await collection.updateOne(
      { _id: vendor._id },
      { 
        $set: { 
          'vendorDetails.isApproved': true,
          'vendorDetails.storeName': vendor.vendorDetails?.storeName || `${vendor.name}'s Store`,
          'vendorDetails.commissionRate': vendor.vendorDetails?.commissionRate || 10,
          'vendorDetails.totalSales': vendor.vendorDetails?.totalSales || 0,
          'vendorDetails.balance': vendor.vendorDetails?.balance || 0
        },
        $setOnInsert: {
          'vendorDetails.payoutHistory': []
        }
      }
    );
    
    console.log(`[DEBUG] Update result:`, result);
    
    if (result.modifiedCount > 0 || result.upsertedCount > 0) {
      console.log(`[DEBUG] Vendor approved successfully: ${vendor.email}`);
      
      // Fetch updated vendor
      const updatedVendor = await User.findById(vendorId).select('-password');
      
      return res.json({ 
        success: true, 
        message: 'Vendor approved successfully',
        vendor: updatedVendor
      });
    } else {
      console.log(`[DEBUG] No changes made to vendor: ${vendor.email}`);
      return res.json({ 
        success: true, 
        message: 'Vendor was already approved',
        vendor: vendor
      });
    }
    
  } catch (error) {
    console.error('[ERROR] Error approving vendor:', error);
    console.error('[ERROR] Stack trace:', error.stack);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Error approving vendor',
      error: error.toString()
    });
  }
};

//  Reject/Delete vendor
// DELETE /api/admin/vendors/:id
const deleteVendor = async (req, res) => {
  try {
    const vendorId = req.params.id;
    console.log(`[DEBUG] Rejecting vendor with ID: ${vendorId}`);
    
    const vendor = await User.findById(vendorId);
    
    if (!vendor) {
      return res.status(404).json({ 
        success: false, 
        message: 'Vendor not found' 
      });
    }
    
    if (vendor.role !== 'vendor') {
      return res.status(400).json({ 
        success: false, 
        message: 'User is not a vendor' 
      });
    }
    
    // Prevent deleting yourself if you're a vendor (though admin can't be vendor)
    if (vendor._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'You cannot delete your own account' 
      });
    }
    
    await vendor.deleteOne();
    
    console.log(`[DEBUG] Vendor rejected and deleted: ${vendor.email}`);
    
    res.json({ 
      success: true, 
      message: 'Vendor rejected and deleted successfully' 
    });
  } catch (error) {
    console.error('[ERROR] Error rejecting vendor:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error rejecting vendor' 
    });
  }
};

//  Get all stats
// GET /api/admin/stats
const getAllStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const orders = await Order.find();
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    console.log(`[DEBUG] Stats: Products=${totalProducts}, Orders=${totalOrders}, Revenue=${totalRevenue}`);
    
    res.json({ 
      success: true, 
      totalProducts,
      totalOrders,
      totalRevenue
    });
  } catch (error) {
    console.error('Error in getAllStats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

//  Get single user by ID
// GET /api/admin/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error in getUserById:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

//  Update user (admin only)
// PUT /api/admin/users/:id
const updateUser = async (req, res) => {
  try {
    const { name, email, role, isActive } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    
    await user.save();
    
    console.log(`[DEBUG] User updated: ${user.email}`);
    
    res.json({ 
      success: true, 
      message: 'User updated successfully',
      user: user.select('-password')
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

//  Get platform statistics (detailed)
// GET /api/admin/stats/detailed
const getDetailedStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalVendors = await User.countDocuments({ role: 'vendor' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const pendingVendors = await User.countDocuments({ 
      role: 'vendor', 
      'vendorDetails.isApproved': false 
    });
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    
    const orders = await Order.find();
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    res.json({ 
      success: true, 
      stats: {
        users: {
          total: totalUsers,
          customers: totalCustomers,
          vendors: totalVendors,
          admins: totalAdmins,
          pendingVendors: pendingVendors
        },
        products: totalProducts,
        orders: totalOrders,
        revenue: totalRevenue
      }
    });
  } catch (error) {
    console.error('Error in getDetailedStats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  changeUserRole,
  deleteUser,
  getAllVendors,
  getPendingVendors,
  approveVendor,
  deleteVendor,
  getAllStats,
  getDetailedStats
};