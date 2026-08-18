const express = require('express');
const router = express.Router();
const { getProductAttributes, PRODUCT_ATTRIBUTES } = require('../config/productAttributes');

// Get all categories with their attributes
router.get('/categories', (req, res) => {
  const categories = Object.keys(PRODUCT_ATTRIBUTES);
  res.json({
    success: true,
    categories
  });
});

// Get attributes for a specific category
router.get('/category/:category', (req, res) => {
  const { category } = req.params;
  const attributes = getProductAttributes(category);
  
  res.json({
    success: true,
    category,
    attributes
  });
});

// Get all categories with their attributes
router.get('/all', (req, res) => {
  res.json({
    success: true,
    categories: PRODUCT_ATTRIBUTES
  });
});

module.exports = router;