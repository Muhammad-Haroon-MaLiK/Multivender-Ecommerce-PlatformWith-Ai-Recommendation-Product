const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const mongoose = require('mongoose');
const { sendEmail, emailTemplates } = require('../config/email');

// Create a new order
const createOrder = async (req, res) => {
  try {
    console.log('Creating order for user:', req.user.id);
    console.log('Order items:', JSON.stringify(req.body.items, null, 2));
    
    const { items, shippingAddress, paymentMethod, subtotal, shipping, tax, total } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items in order' });
    }
    
    // Process each item
    const processedItems = [];
    const vendorIds = new Set();
    
    for (const item of items) {
      let product = null;
      
      if (item.id) {
        try {
          product = await Product.findById(item.id);
        } catch (err) {
          console.log('Error finding by id:', err.message);
        }
      }
      
      if (!product && item.productId) {
        try {
          product = await Product.findById(item.productId);
        } catch (err) {
          console.log('Error finding by productId:', err.message);
        }
      }
      
      if (!product && item._id) {
        try {
          product = await Product.findById(item._id);
        } catch (err) {
          console.log('Error finding by _id:', err.message);
        }
      }
      
      if (!product) {
        console.log(`❌ Product not found for item:`, item);
        return res.status(400).json({
          success: false,
          message: `Product not found. Please refresh your cart and try again.`,
          item: item
        });
      }
      
      console.log(`✅ Found product: ${product.name}`);
      
      let vendorId = product.vendor;
      
      if (!vendorId) {
        console.log(`Product ${item.id} has no vendor, finding default vendor...`);
        const vendor = await User.findOne({ role: 'vendor' });
        if (vendor) {
          vendorId = vendor._id;
          await Product.findByIdAndUpdate(item.id, { vendor: vendorId });
          console.log(`Updated product with vendor ID: ${vendorId}`);
        }
      }
      
      if (!vendorId) {
        console.log(`No vendor found for product ${item.id}`);
        return res.status(400).json({
          success: false,
          message: `Product "${product.name}" has no vendor assigned. Please contact support.`
        });
      }
      
      vendorIds.add(vendorId.toString());
      
      const itemPrice = item.price || product.price;
      const itemQuantity = item.quantity || 1;
      
      const vendorEarnings = itemPrice * itemQuantity * 0.85;
      const adminCommission = itemPrice * itemQuantity * 0.15;
      
      let imageUrl = item.image || null;
      if (!imageUrl && product.images && product.images.length > 0) {
        const img = product.images[0];
        if (typeof img === 'string') {
          imageUrl = img.startsWith('http') ? img : `/uploads/${img}`;
        } else if (img.url) {
          imageUrl = img.url.startsWith('http') ? img.url : `/uploads/${img.url}`;
        }
      }
      
      processedItems.push({
        productId: product._id,
        vendorId: vendorId,
        name: item.name || product.name,
        price: itemPrice,
        quantity: itemQuantity,
        image: imageUrl,
        vendorEarnings: vendorEarnings,
        adminCommission: adminCommission
      });
    }
    
    if (processedItems.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No valid items in order' 
      });
    }
    
    const adminTotalCommission = processedItems.reduce((sum, item) => sum + item.adminCommission, 0);
    const vendorTotalEarnings = processedItems.reduce((sum, item) => sum + item.vendorEarnings, 0);
    
    const vendorStatuses = Array.from(vendorIds).map(vendorId => ({
      vendorId: new mongoose.Types.ObjectId(vendorId),
      status: 'pending'
    }));
    
    const calculatedSubtotal = processedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const finalSubtotal = subtotal || calculatedSubtotal;
    const finalShipping = shipping || 0;
    const finalTax = tax || 0;
    const finalTotal = total || (finalSubtotal + finalShipping + finalTax);
    
    const order = new Order({
      user: req.user.id,
      items: processedItems,
      shippingAddress,
      paymentMethod,
      subtotal: finalSubtotal,
      shipping: finalShipping,
      tax: finalTax,
      total: finalTotal,
      adminTotalCommission,
      vendorTotalEarnings,
      vendorStatuses,
      status: 'pending'
    });
    
    await order.save();
    
    console.log('✅ Order saved:', order.orderNumber);
    console.log('Items with images:', processedItems.map(i => ({ name: i.name, image: i.image })));
    
    // Update product stock
    for (const item of processedItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity }
      });
    }
    
    // Send order confirmation email to customer
    const user = await User.findById(req.user.id);
    if (user) {
      const orderEmail = emailTemplates.orderConfirmation(
        user.name,
        order.orderNumber,
        processedItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        finalTotal,
        shippingAddress
      );
      
      sendEmail({
        to: user.email,
        subject: orderEmail.subject,
        html: orderEmail.html
      }).then(result => {
        if (result.success) {
          console.log(`✅ Order confirmation email sent to ${user.email}`);
        } else {
          console.log(`⚠️ Failed to send order confirmation to ${user.email}:`, result.error);
        }
      }).catch(err => {
        console.log(`⚠️ Order confirmation email error for ${user.email}:`, err.message);
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Order placed successfully! A confirmation email has been sent.',
      order
    });
  } catch (error) {
    console.error('❌ Error creating order:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all orders for a user
const getOrders = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    console.log(`📊 Fetching orders for user: ${userId}`);
    
    const orders = await Order.find({ 
      $or: [
        { user: userId },
        { userId: userId }
      ]
    })
    .populate('items.productId', 'name price images')
    .sort({ createdAt: -1 });

    console.log(`✅ Found ${orders.length} orders`);
    
    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      debug: { error: error.message }
    });
  }
};

// Get single order by ID
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    console.log(`📊 Fetching order: ${id} for user: ${userId}`);

    const order = await Order.findOne({
      $or: [
        { _id: id, user: userId },
        { _id: id, userId: userId }
      ]
    })
    .populate('items.productId', 'name price images')
    .populate('user', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      debug: { error: error.message }
    });
  }
};

// Update order status (Admin only)
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
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
    
    order.status = status;
    
    if (status === 'confirmed') {
      order.confirmedAt = new Date();
    } else if (status === 'delivered') {
      order.deliveredAt = new Date();
    }
    
    await order.save();
    
    // Send status update email to customer
    const user = await User.findById(order.user);
    if (user) {
      const statusEmail = emailTemplates.orderStatusUpdate(
        user.name,
        order.orderNumber,
        status
      );
      
      sendEmail({
        to: user.email,
        subject: statusEmail.subject,
        html: statusEmail.html
      }).then(result => {
        if (result.success) {
          console.log(`✅ Order status update email sent to ${user.email}`);
        } else {
          console.log(`⚠️ Failed to send status update to ${user.email}:`, result.error);
        }
      }).catch(err => {
        console.log(`⚠️ Status update email error for ${user.email}:`, err.message);
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      order: order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      debug: { error: error.message }
    });
  }
};

// Get admin orders summary
const getAdminOrdersSummary = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const processingOrders = await Order.countDocuments({ status: 'processing' });
    const shippedOrders = await Order.countDocuments({ status: 'shipped' });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
    const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });
    
    const totalRevenue = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.status(200).json({
      success: true,
      summary: {
        totalOrders,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0
      },
      recentOrders
    });
  } catch (error) {
    console.error('Error fetching admin summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin summary',
      debug: { error: error.message }
    });
  }
};

// Get vendor orders
const getVendorOrders = async (req, res) => {
  try {
    const vendorId = req.user._id;
    console.log('Fetching orders for vendor:', vendorId);
    
    const orders = await Order.find({
      'items.vendorId': vendorId
    }).sort({ createdAt: -1 });
    
    console.log(`Found ${orders.length} orders for vendor`);
    
    const vendorOrders = orders.map(order => {
      const vendorItems = order.items.filter(
        item => item.vendorId && item.vendorId.toString() === vendorId.toString()
      );
      
      const vendorStatus = order.vendorStatuses?.find(
        vs => vs.vendorId && vs.vendorId.toString() === vendorId.toString()
      );
      
      return {
        _id: order._id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        items: vendorItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image || null,
          vendorEarnings: item.vendorEarnings || (item.price * item.quantity * 0.85)
        })),
        customer: {
          name: order.shippingAddress?.fullName || 'N/A',
          email: order.shippingAddress?.email || 'N/A',
          phone: order.shippingAddress?.phone || 'N/A',
          address: order.shippingAddress
        },
        subtotal: vendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        vendorEarnings: vendorItems.reduce((sum, item) => sum + (item.vendorEarnings || (item.price * item.quantity * 0.85)), 0),
        status: vendorStatus?.status || 'pending',
        shippingAddress: order.shippingAddress
      };
    });
    
    res.status(200).json({
      success: true,
      count: vendorOrders.length,
      orders: vendorOrders
    });
  } catch (error) {
    console.error('Error fetching vendor orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vendor orders',
      debug: { error: error.message }
    });
  }
};

// Update vendor order status
const updateVendorOrderStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    const vendorId = req.user._id;
    
    console.log(`Vendor ${vendorId} updating order ${orderId} status to: ${status}`);
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
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
    
    const vendorStatus = order.vendorStatuses.find(
      vs => vs.vendorId.toString() === vendorId.toString()
    );
    
    if (vendorStatus) {
      vendorStatus.status = status;
      vendorStatus.updatedAt = new Date();
    } else {
      order.vendorStatuses.push({
        vendorId: vendorId,
        status: status,
        updatedAt: new Date()
      });
    }
    
    if (status === 'confirmed') {
      const allConfirmed = order.vendorStatuses.every(vs => vs.status === 'confirmed' || vs.status === 'processing' || vs.status === 'shipped' || vs.status === 'delivered');
      if (allConfirmed) {
        order.status = 'confirmed';
        order.confirmedAt = new Date();
      }
    }
    
    await order.save();
    
    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      order: order
    });
  } catch (error) {
    console.error('Error updating vendor order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      debug: { error: error.message }
    });
  }
};

// ✅ Cancel order (Customer)
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id || req.user.id;

    console.log(`📝 Cancelling order: ${orderId} for user: ${userId}`);

    // Find the order
    const order = await Order.findOne({
      _id: orderId,
      $or: [
        { user: userId },
        { userId: userId }
      ]
    });
    
    if (!order) {
      console.log(`❌ Order not found: ${orderId}`);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    console.log(`📦 Order found: ${order.orderNumber}, Status: ${order.status}`);

    // Check if order can be cancelled
    const cancellableStatuses = ['pending', 'confirmed', 'processing'];
    const currentStatus = order.status?.toLowerCase() || 'pending';
    
    if (!cancellableStatuses.includes(currentStatus)) {
      console.log(`❌ Cannot cancel order with status: ${order.status}`);
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status: ${order.status}. Only pending, confirmed, or processing orders can be cancelled.`
      });
    }

    // Update order status to cancelled
    order.status = 'cancelled';
    await order.save();

    console.log(`✅ Order cancelled: ${orderId}`);

    res.json({
      success: true,
      order,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    console.error('❌ Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel order'
    });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getAdminOrdersSummary,
  getVendorOrders,
  updateVendorOrderStatus,
  cancelOrder  // 
};