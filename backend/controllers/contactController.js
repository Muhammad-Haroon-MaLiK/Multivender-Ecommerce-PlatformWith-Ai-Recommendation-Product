const { sendEmail, emailTemplates } = require('../config/email');

// Send contact message
const sendContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    console.log(`📧 Contact message from: ${email}`);
    
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }
    
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@shopverse.com';
    
    // Send notification to admin
    const adminEmailContent = emailTemplates.contactNotification(name, email, subject, message);
    const adminResult = await sendEmail({
      to: adminEmail,
      subject: adminEmailContent.subject,
      html: adminEmailContent.html
    });
    
    if (!adminResult.success) {
      console.error('❌ Failed to send admin notification:', adminResult.error);
    }
    
    // Send confirmation to user
    const userEmailContent = emailTemplates.contactConfirmation(name);
    const userResult = await sendEmail({
      to: email,
      subject: userEmailContent.subject,
      html: userEmailContent.html
    });
    
    if (!userResult.success) {
      console.error('❌ Failed to send user confirmation:', userResult.error);
    }
    
    if (adminResult.success && userResult.success) {
      console.log(`✅ Contact messages sent successfully to admin and ${email}`);
      res.json({
        success: true,
        message: 'Message sent successfully! We will get back to you soon.'
      });
    } else {
      console.log(`⚠️ Partial success: Admin: ${adminResult.success}, User: ${userResult.success}`);
      res.json({
        success: true,
        message: 'Your message has been received. We will get back to you soon.'
      });
    }
    
  } catch (error) {
    console.error('❌ Contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later.'
    });
  }
};

module.exports = {
  sendContactMessage
};