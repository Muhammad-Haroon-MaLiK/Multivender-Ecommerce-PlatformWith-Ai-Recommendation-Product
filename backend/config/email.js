const nodemailer = require('nodemailer');

// Create transporter based on environment
const createTransporter = () => {
  // For Gmail
  if (process.env.EMAIL_SERVICE === 'gmail') {
    console.log('📧 Configuring Gmail transporter...');
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s/g, '') : '',
      },
    });
  }
  
  // For Outlook/Hotmail
  if (process.env.EMAIL_SERVICE === 'outlook') {
    console.log('📧 Configuring Outlook transporter...');
    return nodemailer.createTransport({
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  
  // For SendGrid
  if (process.env.EMAIL_SERVICE === 'sendgrid') {
    console.log('📧 Configuring SendGrid transporter...');
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }
  
  // For SMTP (generic)
  console.log('📧 Configuring SMTP transporter...');
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send email function with better error handling
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    
    // Verify connection configuration
    console.log('📧 Verifying email transporter...');
    await transporter.verify();
    console.log('✅ Email transporter verified successfully');
    
    const mailOptions = {
      from: `"ShopVerse" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html || options.text,
      text: options.text || options.html?.replace(/<[^>]*>/g, ''),
    };
    
    console.log(`📧 Sending email to: ${options.to}`);
    console.log(`📧 Subject: ${options.subject}`);
    
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email error:', error);
    console.error('❌ Error details:', {
      code: error.code,
      response: error.response,
      command: error.command
    });
    return { success: false, error: error.message };
  }
};

// Email templates - Make sure this is exported properly
const emailTemplates = {
  // Welcome email
  welcome: (name, email) => ({
    subject: 'Welcome to ShopVerse! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ShopVerse</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #eee; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 Welcome to ShopVerse!</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          <p>Thank you for joining ShopVerse! We're excited to have you on board.</p>
          <p>Your account has been created successfully with email: <strong>${email}</strong></p>
          <p>You can now start exploring and shopping from hundreds of vendors.</p>
          <div style="text-align: center;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}" class="button">
              Start Shopping
            </a>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
            If you didn't create this account, please ignore this email.
          </p>
        </div>
        <div class="footer">
          <p>&copy; 2024 ShopVerse. All rights reserved.</p>
        </div>
      </body>
      </html>
    `,
  }),

  // Login notification
  loginNotification: (name, email, loginTime, ip, device) => ({
    subject: '🔐 New Login to Your Account',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login Alert</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
          .header { background: linear-gradient(135deg, #f56565 0%, #c53030 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: #f0f4ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; background: #f56565; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #eee; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔐 New Login Alert</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          <p>We detected a new login to your ShopVerse account.</p>
          <div class="info-box">
            <p><strong>📧 Email:</strong> ${email}</p>
            <p><strong>🕐 Time:</strong> ${loginTime}</p>
            <p><strong>🌐 IP Address:</strong> ${ip || 'Unknown'}</p>
            <p><strong>💻 Device:</strong> ${device || 'Unknown'}</p>
          </div>
          <p>If this was you, you can safely ignore this email.</p>
          <p style="color: #f56565;"><strong>⚠️ If this wasn't you, please reset your password immediately.</strong></p>
          <div style="text-align: center;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/forgot-password" class="button">
              Reset Password
            </a>
          </div>
        </div>
        <div class="footer">
          <p>&copy; 2024 ShopVerse. All rights reserved.</p>
        </div>
      </body>
      </html>
    `,
  }),

  // Order confirmation
  orderConfirmation: (name, orderNumber, items, total, address) => ({
    subject: `✅ Order Confirmed! #${orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmed</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
          .header { background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
          .order-items { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .item-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; }
          .total-row { display: flex; justify-content: space-between; padding: 10px 0; font-weight: bold; font-size: 18px; border-top: 2px solid #667eea; margin-top: 10px; }
          .address-box { background: #f0f4ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #eee; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>✅ Order Confirmed!</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          <p>Your order <strong>#${orderNumber}</strong> has been placed successfully!</p>
          
          <div class="order-items">
            <h3 style="margin-top: 0;">📦 Order Items:</h3>
            ${items.map(item => `
              <div class="item-row">
                <span>${item.name} x ${item.quantity}</span>
                <span>$${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            `).join('')}
            <div class="total-row">
              <span>Total</span>
              <span style="color: #667eea;">$${total.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="address-box">
            <h3 style="margin-top: 0;">📬 Shipping Address:</h3>
            <p>${address.fullName}<br>
            ${address.address}<br>
            ${address.city}, ${address.state} ${address.zipCode}<br>
            📞 ${address.phone}</p>
          </div>
          
          <p>You will receive another email when your order ships.</p>
          <div style="text-align: center;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/orders" class="button">
              View My Orders
            </a>
          </div>
        </div>
        <div class="footer">
          <p>&copy; 2024 ShopVerse. All rights reserved.</p>
        </div>
      </body>
      </html>
    `,
  }),

  // Order status update
  orderStatusUpdate: (name, orderNumber, status) => ({
    subject: `📦 Order #${orderNumber} Status Update: ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Status Update</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
          .status-box { text-align: center; padding: 20px; margin: 20px 0; background: #f0f4ff; border-radius: 10px; }
          .status-box p { font-size: 24px; font-weight: bold; color: #667eea; margin: 0; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #eee; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📦 Order Status Update</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          <p>Your order <strong>#${orderNumber}</strong> status has been updated.</p>
          
          <div class="status-box">
            <p>${status.charAt(0).toUpperCase() + status.slice(1)}</p>
          </div>
          
          <p>You can track your order status anytime in your account.</p>
          <div style="text-align: center;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/orders" class="button">
              Track My Order
            </a>
          </div>
        </div>
        <div class="footer">
          <p>&copy; 2024 ShopVerse. All rights reserved.</p>
        </div>
      </body>
      </html>
    `,
  }),

  // Password reset OTP - THIS IS THE CRITICAL ONE
  passwordResetOTP: (name, otp) => ({
    subject: '🔑 Password Reset OTP - ShopVerse',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset OTP</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { text-align: center; padding: 20px; margin: 20px 0; background: #f0f4ff; border-radius: 10px; }
          .otp-box p { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea; margin: 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #eee; margin-top: 20px; }
          .warning { color: #f56565; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔑 Password Reset</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          <p>You requested to reset your ShopVerse password.</p>
          <div class="otp-box">
            <p>${otp}</p>
          </div>
          <p>This OTP is valid for <strong>10 minutes</strong>.</p>
          <p class="warning">If you didn't request this, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 ShopVerse. All rights reserved.</p>
        </div>
      </body>
      </html>
    `,
  }),

  // Contact form confirmation (to user)
  contactConfirmation: (name) => ({
    subject: '✅ We Received Your Message - ShopVerse',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Message Received</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
          .header { background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #eee; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>✅ Message Received!</h1>
        </div>
        <div class="content">
          <h2>Dear ${name},</h2>
          <p>Thank you for contacting ShopVerse. We have received your message and will get back to you within 24-48 hours.</p>
          <p>Our team is dedicated to providing you with the best possible support.</p>
          <p style="color: #666;">Best regards,<br>The ShopVerse Team</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 ShopVerse. All rights reserved.</p>
        </div>
      </body>
      </html>
    `,
  }),

  // Contact form notification (to admin)
  contactNotification: (name, email, subject, message) => ({
    subject: `📩 New Contact Message: ${subject}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact Message</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
          .header { background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
          .message-box { background: #f0f4ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #eee; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📩 New Contact Message</h1>
        </div>
        <div class="content">
          <h2>New message from ShopVerse contact form</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <div class="message-box">
            <p><strong>Message:</strong></p>
            <p>${message}</p>
          </div>
        </div>
        <div class="footer">
          <p>&copy; 2024 ShopVerse. All rights reserved.</p>
        </div>
      </body>
      </html>
    `,
  }),
};

// Make sure both functions are exported
module.exports = {
  sendEmail,
  emailTemplates,
};