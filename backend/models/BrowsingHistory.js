const mongoose = require('mongoose');

const BrowsingHistorySchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null, 
    index: true 
  },
  sessionId: { 
    type: String, 
    default: null, 
    index: true 
  },
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true, 
    index: true 
  },
  category: { type: String },
  eventType: {
    type: String,
    enum: ['view', 'click', 'add_to_cart', 'wishlist', 'purchase'],
    required: true,
  },
  weight: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now, index: true },
});

const EVENT_WEIGHTS = { view: 1, click: 1.5, add_to_cart: 3, wishlist: 2, purchase: 5 };

BrowsingHistorySchema.pre('save', function (next) {
  this.weight = EVENT_WEIGHTS[this.eventType] || 1;
  next();
});

BrowsingHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });

module.exports = mongoose.model('BrowsingHistory', BrowsingHistorySchema);