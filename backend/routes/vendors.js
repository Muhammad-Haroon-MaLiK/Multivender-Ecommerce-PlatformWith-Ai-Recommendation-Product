const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get all approved vendors
router.get('/', async (req, res) => {
  try {
    const vendors = await User.find({ 
      role: 'vendor',
      'vendorDetails.isApproved': true 
    }).select('-password');
    
    res.json({ success: true, vendors });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single vendor by ID
router.get('/:id', async (req, res) => {
  try {
    const vendor = await User.findOne({ 
      _id: req.params.id,
      role: 'vendor',
      'vendorDetails.isApproved': true 
    }).select('-password');
    
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }
    
    res.json({ success: true, vendor });
  } catch (error) {
    console.error('Error fetching vendor:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;