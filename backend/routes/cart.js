const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Get cart
router.get('/', protect, (req, res) => {
  res.json({ success: true, cart: [] });
});

// Add to cart
router.post('/add', protect, (req, res) => {
  res.json({ success: true, message: 'Added to cart' });
});

module.exports = router;