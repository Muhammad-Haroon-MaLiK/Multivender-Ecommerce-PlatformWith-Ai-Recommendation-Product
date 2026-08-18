const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Get all reviews for a product with pagination and sorting
// GET /api/reviews/:productId
// Public
router.get('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sort || 'recent';

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Build sort options
    let sortOptions = {};
    switch (sortBy) {
      case 'recent':
        sortOptions = { createdAt: -1 };
        break;
      case 'rating_high':
        sortOptions = { rating: -1, createdAt: -1 };
        break;
      case 'rating_low':
        sortOptions = { rating: 1, createdAt: -1 };
        break;
      case 'helpful':
        sortOptions = { helpful: -1, createdAt: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    // Get reviews
    const reviews = await Review.find({ product: productId, isApproved: true })
      .populate('user', 'name avatar')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await Review.countDocuments({ product: productId, isApproved: true });

    // Calculate rating distribution
    const ratingDistribution = await Review.aggregate([
      { $match: { product: productId, isApproved: true } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingDistribution.forEach(item => {
      distribution[item._id] = item.count;
    });

    res.json({
      success: true,
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      ratingDistribution: distribution
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create a review
// POST /api/reviews
// Private
router.post('/', protect, async (req, res) => {
  try {
    const { productId, rating, title, comment } = req.body;

    if (!productId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, rating, and comment are required'
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

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      product: productId,
      user: req.user.id
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product. You can edit your existing review.'
      });
    }

    // Check if user purchased this product
    let verifiedPurchase = false;
    if (req.user.role === 'customer') {
      const orders = await Order.find({
        user: req.user.id,
        status: 'delivered',
        'items.productId': productId
      });
      verifiedPurchase = orders.length > 0;
    }

    const review = await Review.create({
      product: productId,
      user: req.user.id,
      rating,
      title: title || '',
      comment,
      verifiedPurchase,
      isApproved: true
    });

    // Update product rating
    await updateProductRating(productId);

    // Populate user info
    await review.populate('user', 'name avatar');

    res.status(201).json({
      success: true,
      review,
      message: 'Review submitted successfully'
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update a review
// PUT /api/reviews/:id
// Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { rating, title, comment } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user owns the review
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review'
      });
    }

    // Update fields
    if (rating) review.rating = rating;
    if (title !== undefined) review.title = title;
    if (comment) review.comment = comment;

    await review.save();

    // Update product rating
    await updateProductRating(review.product);

    await review.populate('user', 'name avatar');

    res.json({
      success: true,
      review,
      message: 'Review updated successfully'
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete a review
// DELETE /api/reviews/:id
// Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user owns the review
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review'
      });
    }

    const productId = review.product;
    await review.deleteOne();

    // Update product rating
    await updateProductRating(productId);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Mark review as helpful
// POST /api/reviews/:id/helpful
// Private
router.post('/:id/helpful', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user already marked as helpful
    const alreadyHelpful = review.helpfulUsers.includes(req.user.id);

    if (alreadyHelpful) {
      // Remove helpful
      review.helpful = Math.max(0, review.helpful - 1);
      review.helpfulUsers = review.helpfulUsers.filter(
        id => id.toString() !== req.user.id
      );
    } else {
      // Add helpful
      review.helpful += 1;
      review.helpfulUsers.push(req.user.id);
    }

    await review.save();

    res.json({
      success: true,
      helpful: review.helpful,
      isHelpful: !alreadyHelpful,
      message: alreadyHelpful ? 'Removed helpful mark' : 'Marked as helpful'
    });
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get user reviews
// GET /api/reviews/user/me
// Private
router.get('/user/me', protect, async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user.id })
      .populate('product', 'name price images')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Helper function to update product rating
const updateProductRating = async (productId) => {
  try {
    const reviews = await Review.find({ product: productId, isApproved: true });
    
    if (reviews.length === 0) {
      await Product.findByIdAndUpdate(productId, {
        rating: 0,
        numReviews: 0
      });
      return;
    }

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = totalRating / reviews.length;

    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(avgRating * 10) / 10,
      numReviews: reviews.length
    });
  } catch (error) {
    console.error('Update product rating error:', error);
  }
};

module.exports = router;