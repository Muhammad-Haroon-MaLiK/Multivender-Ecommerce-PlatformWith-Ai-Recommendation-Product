const User = require('../models/User');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send Email Function
const sendEmail = async (options) => {
  try {
    // For development, log the email instead of sending
    console.log('📧 ===== EMAIL SENT =====');
    console.log('To:', options.email);
    console.log('Subject:', options.subject);
    console.log('Message:', options.message);
    console.log('📧 ======================');
    
    // If you have SMTP configured, uncomment this:
    /*
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    
    await transporter.sendMail({
      from: `"ShopVerse" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
    });
    */
  } catch (error) {
    console.error('Email error:', error);
  }
};

// Request password reset (send OTP)
// POST /api/auth/forgot-password
// Public
const forgotPassword = async (req, res) => {
  try {
    console.log('🔄 Forgot Password Request Received');
    console.log('📧 Email:', req.body.email);
    
    const { email } = req.body;
    
    if (!email) {
      console.log('❌ No email provided');
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address'
      });
    }
    
    const user = await User.findOne({ email: email.toLowerCase() });
    console.log('🔍 User found:', user ? '✅ Yes' : '❌ No');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email address'
      });
    }
    
    // Generate OTP
    const otp = generateOTP();
    const otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    console.log('🔐 Generated OTP:', otp);
    console.log('⏰ OTP Expires:', new Date(otpExpire).toLocaleString());
    
    // Save OTP to user
    user.resetOTP = otp;
    user.resetOTPExpire = otpExpire;
    await user.save();
    console.log('💾 OTP saved to database');
    
    // Send OTP via email
    const message = `
      Hello ${user.name},
      
      You requested a password reset. Here is your OTP (One-Time Password):
      
      🔐 ${otp}
      
      This OTP is valid for 10 minutes.
      
      If you didn't request this, please ignore this email.
      
      Best regards,
      ShopVerse Team
    `;
    
    await sendEmail({
      email: user.email,
      subject: 'Password Reset OTP - ShopVerse',
      message: message
    });
    
    // For development, also return the OTP in response
    console.log('📱 OTP for', user.email, ':', otp);
    
    res.json({
      success: true,
      message: 'OTP sent to your email address',
      // Remove this in production, only for testing
      debug_otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process request'
    });
  }
};

//  Verify OTP and reset password
// POST /api/auth/reset-password
// Public
const resetPassword = async (req, res) => {
  try {
    console.log('🔄 Reset Password Request Received');
    console.log('📧 Request Body:', req.body);
    
    const { email, otp, newPassword } = req.body;
    
    console.log('📧 Email:', email);
    console.log('🔐 OTP provided:', otp);
    console.log('🔑 New password length:', newPassword?.length);
    
    if (!email || !otp || !newPassword) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Please provide email, OTP and new password'
      });
    }
    
    if (newPassword.length < 6) {
      console.log('❌ Password too short');
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }
    
    console.log('🔍 Searching for user with email:', email.toLowerCase());
    const user = await User.findOne({ email: email.toLowerCase() });
    console.log('👤 User found:', user ? '✅ Yes' : '❌ No');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log('📊 Stored OTP in DB:', user.resetOTP);
    console.log('📊 Provided OTP:', otp);
    console.log('⏰ OTP Expiry (stored):', user.resetOTPExpire);
    console.log('⏰ Current time:', Date.now());
    console.log('⏰ Is OTP expired?', user.resetOTPExpire < Date.now());
    
    // Check if OTP exists and is valid
    if (!user.resetOTP) {
      console.log('❌ No OTP found in database');
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new one.'
      });
    }
    
    if (user.resetOTP !== otp) {
      console.log('❌ OTP mismatch - Stored:', user.resetOTP, 'Provided:', otp);
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }
    
    // Check if OTP is expired
    if (user.resetOTPExpire < Date.now()) {
      console.log('❌ OTP expired');
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }
    
    console.log('✅ OTP verified successfully');
    
    //  FIX: Use updateOne to bypass pre-save hook
    // Hash the password manually
    console.log('🔐 Hashing new password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    console.log('🔑 New hashed password:', hashedPassword);
    
    // Update using updateOne to bypass pre-save hooks
    const result = await User.updateOne(
      { email: email.toLowerCase() },
      { 
        $set: { 
          password: hashedPassword,
          resetOTP: null,
          resetOTPExpire: null,
          resetPasswordToken: null,
          resetPasswordExpire: null
        }
      }
    );
    
    console.log('📊 Update result:', result);
    
    if (result.modifiedCount === 0) {
      console.log('⚠️ No document was modified');
      return res.status(500).json({
        success: false,
        message: 'Failed to update password'
      });
    }
    
    // Verify the password was saved correctly
    const savedUser = await User.findOne({ email: email.toLowerCase() });
    const verifyMatch = await bcrypt.compare(newPassword, savedUser.password);
    console.log(`🔍 Password verification: ${verifyMatch ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (!verifyMatch) {
      console.log('⚠️ Verification failed after update!');
      return res.status(500).json({
        success: false,
        message: 'Password update failed verification'
      });
    }
    
    console.log('✅ Password updated successfully for user:', user.email);
    
    res.json({
      success: true,
      message: 'Password reset successfully. Please login with your new password.'
    });
  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

//  Resend OTP
// POST /api/auth/resend-otp
// Public
const resendOTP = async (req, res) => {
  try {
    console.log('🔄 Resend OTP Request Received');
    console.log('📧 Email:', req.body.email);
    
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address'
      });
    }
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Generate new OTP
    const otp = generateOTP();
    const otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    user.resetOTP = otp;
    user.resetOTPExpire = otpExpire;
    await user.save();
    
    console.log('📱 New OTP for', user.email, ':', otp);
    
    const message = `
      Hello ${user.name},
      
      Here is your new OTP for password reset:
      
      🔐 ${otp}
      
      This OTP is valid for 10 minutes.
      
      Best regards,
      ShopVerse Team
    `;
    
    await sendEmail({
      email: user.email,
      subject: 'New Password Reset OTP - ShopVerse',
      message: message
    });
    
    res.json({
      success: true,
      message: 'New OTP sent to your email',
      debug_otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP'
    });
  }
};

module.exports = {
  forgotPassword,
  resetPassword,
  resendOTP
};