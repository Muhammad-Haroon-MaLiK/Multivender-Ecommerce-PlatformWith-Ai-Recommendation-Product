// src/pages/ContactUsPage.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import "./ContactUsPage.css";

const ContactUsPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Send to your backend API
      const response = await fetch('https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api](https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSubmitStatus({
          type: 'success',
          message: '✅ Your message has been sent successfully! We\'ll get back to you soon.'
        });
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: ""
        });
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: '❌ Failed to send message. Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: '📍',
      title: 'Visit Us',
      details: '123 ShopVerse Street, New York, NY 10001'
    },
    {
      icon: '📞',
      title: 'Call Us',
      details: '+1 (555) 123-4567',
      sub: 'Mon-Fri: 9:00 AM - 6:00 PM'
    },
    {
      icon: '✉️',
      title: 'Email Us',
      details: 'support@shopverse.com',
      sub: 'We\'ll respond within 24 hours'
    },
    {
      icon: '💬',
      title: 'Live Chat',
      details: 'Chat with our team',
      sub: 'Available 24/7'
    }
  ];

  const faqs = [
    {
      question: 'How do I track my order?',
      answer: 'You can track your order by logging into your account and visiting the Orders section. You\'ll also receive tracking information via email once your order ships.'
    },
    {
      question: 'What is your return policy?',
      answer: 'We offer a 30-day return policy on all unused items in their original packaging. Please visit our Returns page for detailed instructions.'
    },
    {
      question: 'How long does shipping take?',
      answer: 'Standard shipping takes 3-5 business days. Express shipping (1-2 business days) is available at checkout.'
    },
    {
      question: 'Do you offer international shipping?',
      answer: 'Yes, we ship to most countries worldwide. Shipping costs and delivery times vary by location.'
    }
  ];

  return (
    <div className="contact-page">
      <div className="contact-hero">
        <div className="contact-hero-content">
          <h1>Get in Touch</h1>
          <p>Have questions? We're here to help!</p>
        </div>
      </div>

      <div className="contact-container">
        <div className="contact-info-grid">
          {contactInfo.map((info, index) => (
            <div key={index} className="contact-info-card">
              <div className="contact-info-icon">{info.icon}</div>
              <h3>{info.title}</h3>
              <p>{info.details}</p>
              {info.sub && <span className="contact-info-sub">{info.sub}</span>}
            </div>
          ))}
        </div>

        <div className="contact-main">
          <div className="contact-form-section">
            <h2>Send Us a Message</h2>
            <p className="contact-form-subtitle">
              We'd love to hear from you! Fill out the form below and we'll get back to you as soon as possible.
            </p>

            {submitStatus && (
              <div className={`contact-submit-status ${submitStatus.type}`}>
                {submitStatus.message}
              </div>
            )}

            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Your Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="John Doe"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="john@example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="subject">Subject *</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  placeholder="What's this about?"
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="5"
                  placeholder="Describe your issue or question in detail..."
                />
              </div>

              <button 
                type="submit" 
                className="contact-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>

          <div className="faq-section">
            <h2>Frequently Asked Questions</h2>
            <div className="faq-list">
              {faqs.map((faq, index) => (
                <div key={index} className="faq-item">
                  <h3 className="faq-question">{faq.question}</h3>
                  <p className="faq-answer">{faq.answer}</p>
                </div>
              ))}
            </div>
            <div className="faq-cta">
              <p>Still have questions? <Link to="/faq">Visit our FAQ page</Link> for more answers.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUsPage;