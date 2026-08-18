// routes/vendorRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const Product = require('../models/Product');
const Order = require('../models/Order');

// All vendor routes require authentication and vendor role
router.use(protect);
router.use(authorize('vendor'));

// ============================================
// PRODUCT ROUTES - CRUD Operations
// ============================================

// ✅ GET - Get all products for the vendor
router.get('/products', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    console.log(`📊 Fetching products for vendor: ${userId}`);
    
    const products = await Product.find({ 
      $or: [
        { vendorId: userId },
        { vendor: userId }
      ]
    }).sort({ createdAt: -1 });

    console.log(`✅ Found ${products.length} products`);
    
    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Error fetching vendor products:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ✅ POST - Add a new product
router.post('/products', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    console.log(`📝 Adding product for vendor: ${userId}`);
    console.log('📦 Product data:', req.body);
    
    const productData = {
      name: req.body.name,
      description: req.body.description || '',
      price: parseFloat(req.body.price),
      category: req.body.category || 'Uncategorized',
      stock: parseInt(req.body.stock) || 0,
      discountedPrice: req.body.discountedPrice ? parseFloat(req.body.discountedPrice) : null,
      images: req.body.images || [],
      vendorId: userId,
      vendor: userId,
      status: 'pending',
      isApproved: false
    };

    const product = new Product(productData);
    await product.save();

    console.log(`✅ Product added: ${product._id}`);
    
    res.status(201).json({
      success: true,
      product,
      message: 'Product added successfully'
    });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ✅ PUT - Update a product
router.put('/products/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id || req.user.id;

    console.log(`📝 Updating product: ${productId} for user: ${userId}`);
    console.log('📦 Update data:', req.body);

    // Validate productId format
    if (!productId || productId.length !== 24) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      console.log(`❌ Product not found: ${productId}`);
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    console.log(`📦 Found product: ${product.name}`);

    // Check ownership
    const productVendorId = product.vendorId || product.vendor;
    if (productVendorId.toString() !== userId.toString() && req.user.role !== 'admin') {
      console.log(`❌ Unauthorized: User ${userId} does not own product ${productId}`);
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product'
      });
    }

    // Update fields
    const { name, description, price, category, stock, discountedPrice } = req.body;
    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    if (price) product.price = parseFloat(price);
    if (category) product.category = category;
    if (stock !== undefined) product.stock = parseInt(stock);
    if (discountedPrice !== undefined) product.discountedPrice = parseFloat(discountedPrice) || null;

    await product.save();

    console.log(`✅ Product updated: ${productId}`);

    res.json({
      success: true,
      product,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ✅ DELETE - Delete a product
router.delete('/products/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id || req.user.id;

    console.log(`🗑️ Deleting product: ${productId} for user: ${userId}`);

    // Validate productId format
    if (!productId || productId.length !== 24) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      console.log(`❌ Product not found: ${productId}`);
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check ownership
    const productVendorId = product.vendorId || product.vendor;
    if (productVendorId.toString() !== userId.toString() && req.user.role !== 'admin') {
      console.log(`❌ Unauthorized: User ${userId} does not own product ${productId}`);
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this product'
      });
    }

    await Product.findByIdAndDelete(productId);

    console.log(`✅ Product deleted: ${productId}`);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================
// ORDER ROUTES - FIXED
// ============================================

// ✅ GET - Get vendor orders (orders that contain this vendor's products)
router.get('/orders', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    console.log(`📊 Fetching orders for vendor: ${userId}`);
    
    // Find orders that have items with this vendor's ID
    const orders = await Order.find({
      'items.vendorId': userId
    })
    .populate('user', 'name email phone')
    .populate('items.productId', 'name price images')
    .sort({ createdAt: -1 });

    console.log(`✅ Found ${orders.length} orders for vendor ${userId}`);
    
    // Format orders for vendor view
    const formattedOrders = orders.map(order => {
      // Filter items that belong to this vendor
      const vendorItems = order.items.filter(
        item => item.vendorId && item.vendorId.toString() === userId.toString()
      );
      
      // Calculate totals for this vendor's items
      const subtotal = vendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const vendorEarnings = vendorItems.reduce((sum, item) => sum + (item.vendorEarnings || (item.price * item.quantity * 0.85)), 0);
      
      // Find vendor-specific status
      const vendorStatus = order.vendorStatuses?.find(
        vs => vs.vendorId && vs.vendorId.toString() === userId.toString()
      );
      
      return {
        _id: order._id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        status: vendorStatus?.status || order.status || 'pending',
        customer: order.user || {
          name: order.shippingAddress?.fullName || 'N/A',
          email: order.shippingAddress?.email || 'N/A',
          phone: order.shippingAddress?.phone || 'N/A'
        },
        items: vendorItems.map(item => ({
          _id: item._id,
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image || null,
          vendorEarnings: item.vendorEarnings || (item.price * item.quantity * 0.85)
        })),
        subtotal: subtotal,
        vendorEarnings: vendorEarnings,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        total: order.total
      };
    });

    res.json({
      success: true,
      count: formattedOrders.length,
      orders: formattedOrders
    });
  } catch (error) {
    console.error('❌ Error fetching vendor orders:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch orders'
    });
  }
});

// ✅ PUT - Update vendor order status
router.put('/orders/status', async (req, res) => {
  try {
    const { orderId, status } = req.body;
    const userId = req.user._id || req.user.id;

    console.log(`📝 Vendor ${userId} updating order ${orderId} status to: ${status}`);

    if (!orderId || !status) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and status are required'
      });
    }

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if this vendor has items in this order
    const hasVendorItem = order.items.some(
      item => item.vendorId && item.vendorId.toString() === userId.toString()
    );

    if (!hasVendorItem) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }

    // Update vendor-specific status
    const vendorStatusIndex = order.vendorStatuses?.findIndex(
      vs => vs.vendorId && vs.vendorId.toString() === userId.toString()
    );

    if (vendorStatusIndex !== undefined && vendorStatusIndex >= 0) {
      order.vendorStatuses[vendorStatusIndex].status = status.toLowerCase();
      order.vendorStatuses[vendorStatusIndex].updatedAt = new Date();
    } else {
      if (!order.vendorStatuses) order.vendorStatuses = [];
      order.vendorStatuses.push({
        vendorId: userId,
        status: status.toLowerCase(),
        updatedAt: new Date()
      });
    }

    // Check if all vendors have confirmed/processed
    if (status.toLowerCase() === 'confirmed') {
      const allConfirmed = order.vendorStatuses.every(vs => 
        ['confirmed', 'processing', 'shipped', 'delivered'].includes(vs.status)
      );
      if (allConfirmed && order.vendorStatuses.length > 0) {
        order.status = 'confirmed';
        order.confirmedAt = new Date();
      }
    }

    await order.save();

    console.log(`✅ Vendor order ${orderId} status updated to ${status}`);

    res.json({
      success: true,
      order,
      message: `Order status updated to ${status} successfully`
    });
  } catch (error) {
    console.error('❌ Error updating vendor order status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update order status'
    });
  }
});

// ============================================
// TEST ROUTE
// ============================================

router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Vendor route is working',
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role
    },
    routes: {
      products: {
        GET: '/api/vendor/products',
        POST: '/api/vendor/products',
        PUT: '/api/vendor/products/:productId',
        DELETE: '/api/vendor/products/:productId'
      },
      orders: {
        GET: '/api/vendor/orders',
        PUT: '/api/vendor/orders/status'
      }
    }
  });
});

// ============================================
// EXPORT - ✅ Make sure this is included
// ============================================
module.exports = router;