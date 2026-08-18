// routes/orders.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { 
  createOrder, 
  getOrders, 
  getOrderById, 
  updateOrderStatus,
  getAdminOrdersSummary,
  getVendorOrders,
  updateVendorOrderStatus
} = require('../controllers/orderController');
const Order = require('../models/Order');

// All routes require authentication
router.use(protect);

// Customer routes
router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);

// ✅ Cancel order route - FIXED
router.put('/:orderId/cancel', async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id || req.user.id;

    console.log(`📝 Cancelling order: ${orderId} for user: ${userId}`);

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      console.log(`❌ Order not found: ${orderId}`);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns this order
    if (order.user.toString() !== userId.toString()) {
      console.log(`❌ Unauthorized: User ${userId} does not own order ${orderId}`);
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Check if order can be cancelled (only pending, confirmed, processing)
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
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel order'
    });
  }
});

// Vendor routes
router.get('/vendor/orders', getVendorOrders);
router.put('/vendor/:id/status', updateVendorOrderStatus);

// Admin routes
router.put('/:id/status', authorize('admin'), updateOrderStatus);
router.get('/admin/summary', authorize('admin'), getAdminOrdersSummary);

module.exports = router;