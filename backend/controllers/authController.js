const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendEmail, emailTemplates } = require('../config/email');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Register User with Email
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, storeName } = req.body;
    
    console.log('Registration attempt:', { name, email, role });
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide name, email and password' 
      });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }
    
    // Prepare user data
    const userData = {
      name,
      email: email.toLowerCase(),
      password: password,
      role: role || 'customer',
      isEmailVerified: true,
    };
    
    // Add vendor details if vendor
    if (role === 'vendor') {
      userData.vendorDetails = {
        storeName: storeName || `${name}'s Store`,
        isApproved: false,
        commissionRate: 10
      };
    }
    
    // Create user
    const user = new User(userData);
    await user.save();
    
    console.log('User created successfully:', user.email);
    
    //  Send welcome email
    const welcomeEmail = emailTemplates.welcome(name, email);
    await sendEmail({
      to: email,
      subject: welcomeEmail.subject,
      html: welcomeEmail.html
    });
    
    // Generate token for auto-login
    const token = generateToken(user._id);
    
    res.status(201).json({
      success: true,
      token,
      message: role === 'vendor' 
        ? 'Vendor registration successful! Waiting for admin approval.' 
        : 'Registration successful! A welcome email has been sent.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        vendorDetails: user.vendorDetails
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Login User with Email Notification
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt:', email);
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide email and password' 
      });
    }
    
    // Find user with password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }
    
    // Check password
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      console.log('Password mismatch for:', email);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }
    
    // Check if vendor is approved
    if (user.role === 'vendor' && user.vendorDetails && !user.vendorDetails.isApproved) {
      return res.status(403).json({ 
        success: false, 
        message: 'Your vendor account is pending admin approval. Please wait.' 
      });
    }
    
    // Generate token
    const token = generateToken(user._id);
    
    console.log('Login successful:', email);
    
    //  Send login notification email
    const loginTime = new Date().toLocaleString();
    const ip = req.ip || req.connection.remoteAddress || 'Unknown';
    const device = req.headers['user-agent'] || 'Unknown';
    
    const loginEmail = emailTemplates.loginNotification(
      user.name, 
      user.email, 
      loginTime, 
      ip, 
      device
    );
    await sendEmail({
      to: email,
      subject: loginEmail.subject,
      html: loginEmail.html
    });
    
    // Remove password from response
    user.password = undefined;
    
    res.json({
      success: true,
      token,
      message: 'Login successful! A notification email has been sent.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        vendorDetails: user.vendorDetails
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Get current user profile
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    res.json({
      success: true,
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      vendorDetails: user.vendorDetails,
      address: user.address,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Get user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        vendorDetails: user.vendorDetails
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    
    if (req.body.address) {
      user.address = req.body.address;
    }
    
    if (req.body.password) {
      user.password = req.body.password;
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Verify Email
const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if OTP matches (you'll need to implement OTP storage)
    // For now, we'll just mark as verified
    user.isEmailVerified = true;
    await user.save();
    
    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Resend Verification Email
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }
    
    // Resend verification email
    const welcomeEmail = emailTemplates.welcome(user.name, user.email);
    await sendEmail({
      to: user.email,
      subject: welcomeEmail.subject,
      html: welcomeEmail.html
    });
    
    res.json({
      success: true,
      message: 'Verification email resent successfully'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all users (for admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Get user by ID (for admin)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Update user role (for admin)
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    const validRoles = ['customer', 'vendor', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role. Must be customer, vendor, or admin' 
      });
    }
    
    user.role = role;
    await user.save();
    
    console.log(`User role updated: ${user.email} -> ${role}`);
    
    res.json({
      success: true,
      message: 'User role updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Delete user (for admin)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'You cannot delete your own account' 
      });
    }
    
    await user.deleteOne();
    
    console.log(`User deleted: ${user.email}`);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

module.exports = { 
  registerUser, 
  loginUser, 
  getMe,
  getProfile,
  updateProfile,
  verifyEmail,
  resendVerificationEmail,
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser
};