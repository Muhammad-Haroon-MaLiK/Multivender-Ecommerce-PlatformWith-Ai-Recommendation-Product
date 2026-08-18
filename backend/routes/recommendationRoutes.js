const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

// Guests must reach these — optionalAuth sets req.user if logged in, but never blocks
router.post('/track', optionalAuth, recommendationController.trackEvent);
router.get('/trending', recommendationController.getTrending);

//  Personalized feed with email parameter (for frontend)
router.get('/:email', optionalAuth, recommendationController.getRecommendationsByEmail);

// Personalized feed (from token) - fallback
router.get('/', protect, recommendationController.getRecommendations);

module.exports = router;