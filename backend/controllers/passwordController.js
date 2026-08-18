const User = require('../models/User');
const { sendEmail, emailTemplates } = require('../config/email');

// Generate random OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTPs in memory
const otpStore = new Map();

// Forgot Password - Send OTP
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log(`🔑 Password reset requested for: ${email}`);
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Generate OTP
    const otp = generateOTP();
    console.log(`🔑 OTP generated for ${email}: ${otp}`);
    
    // Store OTP with expiry (10 minutes)
    otpStore.set(email.toLowerCase(), {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000
    });
    
    // Check if emailTemplates exists
    if (!emailTemplates || typeof emailTemplates.passwordResetOTP !== 'function') {
      console.error('❌ emailTemplates.passwordResetOTP is not available');
      return res.status(500).json({
        success: false,
        message: 'Email template not found. Please try again later.'
      });
    }
    
    // Send OTP email
    console.log(`📧 Attempting to send OTP email to: ${email}`);
    const otpEmail = emailTemplates.passwordResetOTP(user.name, otp);
    
    try {
      const result = await sendEmail({
        to: user.email,
        subject: otpEmail.subject,
        html: otpEmail.html
      });
      
      if (result.success) {
        console.log(`✅ OTP email sent successfully to ${email}`);
        return res.json({
          success: true,
          message: 'Password reset OTP sent to your email',
          debug: process.env.NODE_ENV === 'development' ? { otp } : undefined
        });
      } else {
        console.error(`❌ Failed to send OTP email to ${email}:`, result.error);
        return res.status(500).json({
          success: false,
          message: 'Failed to send OTP email. Please try again later.',
          error: process.env.NODE_ENV === 'development' ? result.error : 'Email sending failed'
        });
      }
    } catch (emailError) {
      console.error(`❌ Email sending error:`, emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? emailError.message : 'Email sending failed'
      });
    }
    
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process request'
    });
  }
};

// Reset Password with OTP
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    console.log(`🔑 Password reset attempt for: ${email}`);
    
    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required'
      });
    }
    
    const storedData = otpStore.get(email.toLowerCase());
    
    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new one.'
      });
    }
    
    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({
        success: false,
        message: 'OTP expired. Please request a new one.'
      });
    }
    
    if (storedData.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    user.password = newPassword;
    await user.save();
    
    otpStore.delete(email.toLowerCase());
    
    console.log(`✅ Password reset successful for: ${email}`);
    
    res.json({
      success: true,
      message: 'Password reset successfully'
    });
    
  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reset password'
    });
  }
};

// Resend OTP
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    console.log(`🔄 Resend OTP requested for: ${email}`);
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const otp = generateOTP();
    console.log(`🔄 New OTP for ${email}: ${otp}`);
    
    otpStore.set(email.toLowerCase(), {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000
    });
    
    const otpEmail = emailTemplates.passwordResetOTP(user.name, otp);
    const result = await sendEmail({
      to: user.email,
      subject: otpEmail.subject,
      html: otpEmail.html
    });
    
    if (result.success) {
      console.log(`✅ New OTP sent successfully to ${email}`);
      res.json({
        success: true,
        message: 'New OTP sent to your email',
        debug: process.env.NODE_ENV === 'development' ? { otp } : undefined
      });
    } else {
      console.error(`❌ Failed to send new OTP to ${email}:`, result.error);
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again later.'
      });
    }
    
  } catch (error) {
    console.error('❌ Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to resend OTP'
    });
  }
};

module.exports = {
  forgotPassword,
  resetPassword,
  resendOTP
};