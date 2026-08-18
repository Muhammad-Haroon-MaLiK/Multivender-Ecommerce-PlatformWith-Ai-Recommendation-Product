const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');


router.get('/', protect, async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id })
      .populate({
        path: 'items.product',
        select: 'name description price images stock rating category vendor'
      });
    
    if (!wishlist) {
      wishlist = await Wishlist.create({ 
        user: req.user.id, 
        items: [] 
      });
    }
    
    // Filter out items where product no longer exists
    const validItems = wishlist.items.filter(item => item.product !== null);
    
    if (validItems.length !== wishlist.items.length) {
      wishlist.items = validItems;
      await wishlist.save();
    }
    
    res.json({
      success: true,
      count: validItems.length,
      wishlist: validItems
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Add item to wishlist
// POST /api/wishlist/add
// Private
router.post('/add', protect, async (req, res) => {
  try {
    const { productId } = req.body;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }
    
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    let wishlist = await Wishlist.findOne({ user: req.user.id });
    
    if (!wishlist) {
      wishlist = await Wishlist.create({ 
        user: req.user.id, 
        items: [] 
      });
    }
    
    // Check if product already in wishlist
    const existingItem = wishlist.items.find(
      item => item.product.toString() === productId
    );
    
    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: 'Product already in wishlist'
      });
    }
    
    wishlist.items.push({ product: productId });
    await wishlist.save();
    
    // Return updated wishlist with populated product
    const updatedWishlist = await Wishlist.findOne({ user: req.user.id })
      .populate('items.product', 'name description price images stock rating');
    
    res.json({
      success: true,
      message: 'Product added to wishlist',
      wishlist: updatedWishlist.items
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Remove item from wishlist
// @route   DELETE /api/wishlist/remove/:productId
// @access  Private
router.delete('/remove/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;
    
    const wishlist = await Wishlist.findOne({ user: req.user.id });
    
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }
    
    const itemIndex = wishlist.items.findIndex(
      item => item.product.toString() === productId
    );
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in wishlist'
      });
    }
    
    wishlist.items.splice(itemIndex, 1);
    await wishlist.save();
    
    res.json({
      success: true,
      message: 'Item removed from wishlist',
      wishlist: wishlist.items
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Clear wishlist
// DELETE /api/wishlist/clear
// Private
router.delete('/clear', protect, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id });
    
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }
    
    wishlist.items = [];
    await wishlist.save();
    
    res.json({
      success: true,
      message: 'Wishlist cleared successfully'
    });
  } catch (error) {
    console.error('Clear wishlist error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;