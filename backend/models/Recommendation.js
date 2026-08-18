const mongoose = require('mongoose');

const RecommendationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true, 
    index: true 
  },
  items: [
    {
      productId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product' 
      },
      score: { type: Number, default: 0 },
      reason: { type: String }, // 'collaborative' | 'content' | 'hybrid' | 'trending'
    },
  ],
  modelVersion: { type: String },
  generatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Recommendation', RecommendationSchema);