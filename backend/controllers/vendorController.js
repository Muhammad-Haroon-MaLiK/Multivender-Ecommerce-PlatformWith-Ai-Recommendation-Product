const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

//  Get vendor dashboard stats
// GET /api/vendor/stats
// Private/Vendor
const getVendorStats = async (req, res) => {
  try {
    const products = await Product.find({ vendor: req.user._id });
    const productIds = products.map(p => p._id);

    const orders = await Order.find({
      'orderItems.product': { $in: productIds },
    });

    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const totalOrders = orders.length;
    const totalProducts = products.length;
    const averageRating = products.reduce((sum, p) => sum + p.rating, 0) / products.length || 0;

    res.json({
      totalRevenue,
      totalOrders,
      totalProducts,
      averageRating,
      products,
      recentOrders: orders.slice(0, 5),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//  Get vendor orders
// GET /api/vendor/orders
// Private/Vendor
const getVendorOrders = async (req, res) => {
  try {
    const products = await Product.find({ vendor: req.user._id });
    const productIds = products.map(p => p._id);

    const orders = await Order.find({
      'orderItems.product': { $in: productIds },
    }).populate('user', 'name email');

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getVendorStats,
  getVendorOrders,
};