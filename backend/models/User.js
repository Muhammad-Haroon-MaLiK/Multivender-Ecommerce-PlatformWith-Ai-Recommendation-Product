const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String  
  },
  googleId: {
    type: String  
  },
  avatar : {
    type: String  
  },

  role: {
    type: String,
    enum: ['customer', 'vendor', 'admin'],
    default: 'customer',
  },
  vendorDetails: {
    storeName: String,
    isApproved: { type: Boolean, default: false },
    commissionRate: { type: Number, default: 10 },
  },
  isEmailVerified: {
    type: Boolean,
    default: true,
  },
  // ✅ Add these fields for password reset
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpire: {
    type: Date,
    default: null,
  },
  resetOTP: {
    type: String,
    default: null,
  },
  resetOTPExpire: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);