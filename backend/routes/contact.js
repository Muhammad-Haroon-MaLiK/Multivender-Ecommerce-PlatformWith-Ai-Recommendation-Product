// routes/contact.js
const express = require('express');
const { sendContactMessage } = require('../controllers/contactController');
const router = express.Router();

/**
 * @route   POST /api/contact
 * @desc    Send contact message
 * @access  Public
 */
router.post('/', sendContactMessage);

module.exports = router;