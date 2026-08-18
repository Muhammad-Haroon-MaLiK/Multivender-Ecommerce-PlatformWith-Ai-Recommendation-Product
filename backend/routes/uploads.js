const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Serve image files
// GET /api/uploads/:filename
// Public
router.get('/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads', filename);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      message: 'Image not found'
    });
  }
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  
  // Send the file
  res.sendFile(filePath);
});

module.exports = router;