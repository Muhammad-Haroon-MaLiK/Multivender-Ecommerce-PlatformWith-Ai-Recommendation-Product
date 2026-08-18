// src/pages/HelpPage.jsx
import { Link } from "react-router-dom";
import "./HelpPage.css";

const HelpPage = () => {
  return (
    <div className="help-page">
      <div className="help-hero">
        <h1>How Can We Help You?</h1>
        <p>Our support team is ready to assist you</p>
      </div>

      <div className="help-container">
        <div className="help-contact-cta">
          <h2>Get in Touch</h2>
          <p>Have questions or need assistance? We're here to help!</p>
          <Link to="/contact" className="help-contact-btn">
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;