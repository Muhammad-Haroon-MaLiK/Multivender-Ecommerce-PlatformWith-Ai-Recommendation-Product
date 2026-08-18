const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const BrowsingHistory = require('../models/BrowsingHistory');
const Product = require('../models/Product');


const getUserIdFromRequest = async (req) => {
  if (req.user?._id) {
    return req.user._id;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  if (!token || token === 'null' || token === 'undefined') {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const rawId = decoded.id || decoded._id || decoded.userId || null;
    if (!rawId) return null;
    return mongoose.Types.ObjectId.isValid(rawId) ? new mongoose.Types.ObjectId(rawId) : rawId;
  } catch (err) {
    console.log('⚠️ trackEvent: token present but could not be verified:', err.message);
    return null;
  }
};

//  Get personalized recommendations by email (REAL-TIME)
// GET /api/recommendations/:email
// Public (with optional auth)
const getRecommendationsByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    
    console.log('📊 Fetching recommendations for email:', email);
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('❌ User not found for email:', email);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log('👤 User found:', user.email, 'ID:', user._id);
    
    const db = mongoose.connection.db;
    
    // ✅ REAL-TIME: Check user's browsing history
    const history = await db.collection('browsinghistories')
      .find({ userId: user._id })
      .sort({ createdAt: -1 })
      .toArray();
    
    const historyCount = history.length;
    console.log('📊 History count:', historyCount);
    
    // ✅ If user has 2+ views, generate REAL-TIME recommendations immediately
    if (historyCount >= 2) {
      console.log('✅ User has 2+ views. Generating REAL-TIME recommendations...');
      
      // Get all products
      const products = await db.collection('products').find({}).toArray();
      
      // Get viewed product IDs with weights
      const viewedProducts = {};
      for (const h of history) {
        const productId = h.productId.toString();
        if (!viewedProducts[productId]) {
          viewedProducts[productId] = { count: 0, weight: 0 };
        }
        viewedProducts[productId].count++;
        viewedProducts[productId].weight += (h.weight || 1);
      }
      
      // Calculate recommendations based on viewing history
      const recommendations = products.map(product => {
        const productId = product._id.toString();
        const isViewed = viewedProducts[productId];
        let score = 0;
        
        if (isViewed) {
          // Higher score for products viewed more times
          score = Math.min(0.6 + (isViewed.count * 0.1) + (isViewed.weight * 0.05), 1.0);
        } else {
          // Check if same category as viewed products
          const categories = history.map(h => h.category).filter(c => c);
          const categoryMatch = categories.some(cat => cat === product.category);
          
          if (categoryMatch) {
            score = 0.3 + (Math.random() * 0.2);
          } else {
            score = 0.1 + (Math.random() * 0.15);
          }
        }
        
        // Get full product details
        return {
          productId: product._id,
          _id: product._id,
          name: product.name || 'Product',
          price: product.price || 0,
          category: product.category || 'General',
          images: product.images || [],
          stock: product.stock || 10,
          vendorId: product.vendorId || product.vendor?._id || null,
          vendor: product.vendor || null,
          description: product.description || '',
          rating: product.rating || 0,
          reviews: product.reviews || 0,
          score: parseFloat(score.toFixed(4))
        };
      });
      
      // Sort by score (highest first)
      recommendations.sort((a, b) => b.score - a.score);
      
      // Take top 10
      const topRecommendations = recommendations.slice(0, 10);
      
      //  SAVE to database for future use
      await db.collection('recommendations').updateOne(
        { userId: user._id },
        {
          $set: {
            userId: user._id,
            userEmail: user.email,
            recommendations: topRecommendations,
            updatedAt: new Date(),
            generatedFrom: 'real-time'
          }
        },
        { upsert: true }
      );
      
      console.log(`✅ Generated ${topRecommendations.length} REAL-TIME recommendations for ${user.email}`);
      
      return res.json({
        success: true,
        recommendations: topRecommendations,
        source: 'personalized',
        userId: user._id,
        generatedFrom: 'real-time',
        historyCount: historyCount,
        message: `🎯 ${topRecommendations.length} personalized recommendations ready!`
      });
    }
    
    //  If user has 1 view, show category-based recommendations
    if (historyCount === 1) {
      console.log('👀 User has 1 view. Showing category-based recommendations...');
      
      const singleHistory = history[0];
      const viewedProduct = await db.collection('products')
        .findOne({ _id: singleHistory.productId });
      
      if (viewedProduct) {
        // Get products in same category
        const categoryProducts = await db.collection('products')
          .find({ 
            category: viewedProduct.category,
            _id: { $ne: viewedProduct._id }
          })
          .limit(8)
          .toArray();
        
        if (categoryProducts.length > 0) {
          const recommendations = categoryProducts.map(product => ({
            productId: product._id,
            _id: product._id,
            name: product.name || 'Product',
            price: product.price || 0,
            category: product.category || 'General',
            images: product.images || [],
            stock: product.stock || 10,
            vendorId: product.vendorId || product.vendor?._id || null,
            vendor: product.vendor || null,
            description: product.description || '',
            score: 0.5,
            reason: `Similar to ${viewedProduct.name}`
          }));
          
          // Save to database
          await db.collection('recommendations').updateOne(
            { userId: user._id },
            {
              $set: {
                userId: user._id,
                userEmail: user.email,
                recommendations: recommendations,
                updatedAt: new Date(),
                generatedFrom: 'category-based'
              }
            },
            { upsert: true }
          );
          
          console.log(`✅ Generated ${recommendations.length} category-based recommendations for ${user.email}`);
          
          return res.json({
            success: true,
            recommendations: recommendations,
            source: 'personalized',
            userId: user._id,
            generatedFrom: 'category-based',
            historyCount: historyCount,
            message: `📂 Showing products similar to ${viewedProduct.name}`
          });
        }
      }
    }
    
    //  No history - show trending with message
    console.log('📊 No history. Showing trending products...');
    
    const trending = await db.collection('products')
      .find({})
      .sort({ views: -1, createdAt: -1 })
      .limit(10)
      .toArray();
    
    const mappedTrending = trending.map(product => ({
      ...product,
      _id: product._id,
      name: product.name || 'Product',
      price: product.price || 0,
      category: product.category || 'General',
      images: product.images || [],
      stock: product.stock || 10,
      vendorId: product.vendorId || product.vendor?._id || null,
      vendor: product.vendor || null
    }));
    
    res.json({
      success: true,
      recommendations: mappedTrending,
      source: 'trending',
      isTrending: true,
      historyCount: historyCount,
      message: historyCount === 0 
        ? '👀 View 2-3 products to get personalized recommendations!' 
        : '📊 View more products to get better recommendations!'
    });
    
  } catch (error) {
    console.error('❌ Error fetching recommendations by email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recommendations',
      error: error.message
    });
  }
};

//  Track user events (views, clicks, etc.) - WITH AUTO-TRIGGER
// POST /api/recommendations/track
// Public (with optional auth)
const trackEvent = async (req, res) => {
  try {
    const { productId, action } = req.body;
    const userId = await getUserIdFromRequest(req);
    const sessionId = req.session?.id || null;
    
    console.log(`📊 Tracking event: ${action} for product ${productId}, user: ${userId || 'guest'}${req.user?._id ? ' (from req.user)' : userId ? ' (from decoded token — req.user was empty!)' : ''}`);
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      console.log('❌ Invalid productId sent to /track:', productId);
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }
    
    // Validate action
    const validActions = ['view', 'click', 'add_to_cart', 'wishlist', 'purchase'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be one of: ' + validActions.join(', ')
      });
    }
    
    // Get product category
    const db = mongoose.connection.db;
    const productObjectId = new mongoose.Types.ObjectId(productId);
    const product = await db.collection('products').findOne({ _id: productObjectId });
    
    // Create tracking entry
    let weight = 1;
    if (action === 'purchase') weight = 5;
    else if (action === 'add_to_cart') weight = 3;
    else if (action === 'click') weight = 1.5;
    
    const historyEntry = {
      userId: userId,
      sessionId: sessionId,
      productId: productObjectId,
      category: product?.category || 'General',
      eventType: action,
      weight: weight,
      createdAt: new Date()
    };
    
    await BrowsingHistory.create(historyEntry);
    console.log('✅ Event tracked successfully');
    
    // Update product view count if action is 'view'
    if (action === 'view') {
      await db.collection('products').updateOne(
        { _id: new mongoose.Types.ObjectId(productId) },
        { $inc: { views: 1 } }
      );
    }
    
    //  AUTO-TRIGGER: If user is logged in and has 2+ views, generate recommendations immediately
    let historyCount = 0;
    let recommendationsReady = false;
    let generatedCount = 0;
    
    if (userId) {
      historyCount = await db.collection('browsinghistories').countDocuments({ userId: userId });
      
      if (historyCount >= 2) {
        console.log(`🎯 User has ${historyCount} views. Auto-generating recommendations...`);
        recommendationsReady = true;
        
        // Generate recommendations immediately
        try {
          const user = await User.findById(userId);
          if (user) {
            const generated = await generateRecommendationsForUser(userId, user.email);
            generatedCount = generated || 0;
            console.log(`✅ Auto-generated ${generatedCount} recommendations for:`, user.email);
          }
        } catch (genError) {
          console.error('Error auto-generating recommendations:', genError);
        }
      }
    }
    
    // Return response with status
    let message = '';
    if (recommendationsReady && generatedCount > 0) {
      message = `🎯 ${generatedCount} personalized recommendations ready! Refresh to see them.`;
    } else if (historyCount === 1) {
      message = `👀 ${historyCount}/2 views. View 1 more product for personalized recommendations!`;
    } else if (historyCount >= 2) {
      message = `🎯 Recommendations generated! Refresh to see them.`;
    } else {
      message = `👀 View ${2 - historyCount} more product(s) to get personalized recommendations!`;
    }
    
    res.json({
      success: true,
      message: 'Event tracked successfully',
      historyCount: historyCount,
      recommendationsReady: recommendationsReady,
      generatedCount: generatedCount,
      recommendationMessage: message
    });
    
  } catch (error) {
    console.error('❌ Error tracking event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track event'
    });
  }
};

//       Helper function to generate REAL-TIME recommendations for a user
async function generateRecommendationsForUser(userId, userEmail) {
  try {
    const db = mongoose.connection.db;
    
    // Get user's browsing history
    const history = await db.collection('browsinghistories')
      .find({ userId: userId })
      .sort({ createdAt: -1 })
      .toArray();
    
    if (history.length < 2) return 0;
    
    // Get products
    const products = await db.collection('products').find({}).toArray();
    
    if (products.length === 0) return 0;
    
    // Get viewed product IDs
    const viewedProductIds = history.map(h => h.productId.toString());
    
    // Calculate recommendations
    const recommendations = products.map(product => {
      const isViewed = viewedProductIds.includes(product._id.toString());
      let score = 0;
      
      if (isViewed) {
        const productHistory = history.filter(h => h.productId.toString() === product._id.toString());
        const count = productHistory.length;
        const totalWeight = productHistory.reduce((sum, h) => sum + (h.weight || 1), 0);
        score = Math.min(0.5 + (count * 0.1) + (totalWeight * 0.05), 1.0);
      } else {
        // Check if same category
        const categories = history.map(h => h.category).filter(c => c);
        const categoryMatch = categories.some(cat => cat === product.category);
        score = categoryMatch ? 0.3 + (Math.random() * 0.2) : 0.1 + (Math.random() * 0.15);
      }
      
      return {
        productId: product._id,
        _id: product._id,
        name: product.name || 'Product',
        price: product.price || 0,
        category: product.category || 'General',
        images: product.images || [],
        stock: product.stock || 10,
        vendorId: product.vendorId || product.vendor?._id || null,
        vendor: product.vendor || null,
        description: product.description || '',
        rating: product.rating || 0,
        reviews: product.reviews || 0,
        score: parseFloat(score.toFixed(4))
      };
    });
    
    recommendations.sort((a, b) => b.score - a.score);
    const topRecommendations = recommendations.slice(0, 10);
    
    await db.collection('recommendations').updateOne(
      { userId: userId },
      {
        $set: {
          userId: userId,
          userEmail: userEmail,
          recommendations: topRecommendations,
          updatedAt: new Date(),
          generatedFrom: 'auto-triggered'
        }
      },
      { upsert: true }
    );
    
    console.log(`✅ Auto-generated ${topRecommendations.length} recommendations for ${userEmail}`);
    return topRecommendations.length;
    
  } catch (error) {
    console.error('Error in auto-recommendation generation:', error);
    return 0;
  }
}

//  Get trending products
// GET /api/recommendations/api/trending
// Public
const getTrending = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const db = mongoose.connection.db;
    
    console.log(`📊 Fetching trending products (limit: ${limit})...`);
    
    const trending = await db.collection('products')
      .find({})
      .sort({ views: -1, createdAt: -1 })
      .limit(limit)
      .toArray();
    
    const mappedTrending = trending.map(product => ({
      ...product,
      _id: product._id,
      name: product.name || 'Product',
      price: product.price || 0,
      category: product.category || 'General',
      images: product.images || [],
      stock: product.stock || 10,
      vendorId: product.vendorId || product.vendor?._id || null,
      vendor: product.vendor || null
    }));
    
    console.log(`✅ Found ${mappedTrending.length} trending products`);
    
    res.json({
      success: true,
      products: mappedTrending,
      source: 'trending'
    });
  } catch (error) {
    console.error('❌ Error fetching trending products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending products'
    });
  }
};

//  Get personalized recommendations from token
// GET /api/recommendations
// Private
const getRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = req.user;
    
    console.log('📊 Fetching recommendations for user:', user.email);
    
    const db = mongoose.connection.db;
    
    // Check if recommendations exist for this user
    const recommendations = await db.collection('recommendations').findOne({ 
      userId: userId 
    });
    
    if (recommendations && recommendations.recommendations && recommendations.recommendations.length > 0) {
      return res.json({
        success: true,
        recommendations: recommendations.recommendations,
        source: 'personalized',
        userId: userId
      });
    }
    
    // If no recommendations, return trending as fallback
    const trending = await db.collection('products')
      .find({})
      .sort({ views: -1, createdAt: -1 })
      .limit(10)
      .toArray();
    
    const mappedTrending = trending.map(product => ({
      ...product,
      _id: product._id,
      name: product.name || 'Product',
      price: product.price || 0,
      category: product.category || 'General',
      images: product.images || [],
      stock: product.stock || 10,
      vendorId: product.vendorId || product.vendor?._id || null,
      vendor: product.vendor || null
    }));
    
    res.json({
      success: true,
      recommendations: mappedTrending,
      source: 'trending',
      isTrending: true,
      message: 'View more products to get personalized recommendations!'
    });
    
  } catch (error) {
    console.error('❌ Error fetching recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recommendations'
    });
  }
};

module.exports = {
  getRecommendationsByEmail,
  getRecommendations,
  getTrending,
  trackEvent
};