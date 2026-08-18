const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  discountedPrice: {
    type: Number,
    default: null,
  },
  category: {
    type: String,
    required: true,
    enum: ['Clothing', 'Electronics', 'Footwear', 'Watches', 'Perfumes', 'Beauty', 'Home & Living', 'Fashion', 'Accessories', 'Electronics'],
  },
  subcategory: {
    type: String,
  },
  stock: {
    type: Number,
    default: 0,
  },
  images: [{
    type: String,
  }],
  
  //  Dynamic attributes based on category
  attributes: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
  
  //  Pre-defined attribute options per category
  attributeOptions: {
    type: Map,
    of: [String],
    default: {},
  },
  
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  views: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    default: 0,
  },
  reviews: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Product', productSchema);