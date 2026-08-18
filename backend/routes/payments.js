const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Create a payment intent
// POST /api/payments/create-payment-intent
// Private
router.post('/create-payment-intent', protect, async (req, res) => {
  try {
    const { amount, currency } = req.body;
    
    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'Amount is required'
      });
    }
    
    // Mock payment intent (in production, use Stripe, PayFast, etc.)
    res.json({
      success: true,
      clientSecret: `pi_mock_${Date.now()}`,
      amount: amount,
      currency: currency || 'PKR'
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Confirm payment
// POST /api/payments/confirm
// Private
router.post('/confirm', protect, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    
    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID is required'
      });
    }
    
    // Mock payment confirmation
    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      transactionId: `txn_${Date.now()}`
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Payment webhook
// POST /api/payments/webhook
// Public
router.post('/webhook', async (req, res) => {
  try {
    const payload = req.body;
    console.log('📥 Webhook received:', payload);
    
    // Process webhook payload
    // In production, verify signature and process payment status
    
    res.json({
      success: true,
      received: true
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

//  Get payment methods
//  GET /api/payments/methods
//  Public
router.get('/methods', async (req, res) => {
  try {
    // In production, fetch from payment provider
    const methods = [
      { id: 'card', name: 'Credit/Debit Card', icon: '💳' },
      { id: 'bank', name: 'Bank Transfer', icon: '🏦' },
      { id: 'easypaisa', name: 'Easypaisa', icon: '📱' },
      { id: 'jazzcash', name: 'JazzCash', icon: '📱' }
    ];
    
    res.json({
      success: true,
      methods
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;