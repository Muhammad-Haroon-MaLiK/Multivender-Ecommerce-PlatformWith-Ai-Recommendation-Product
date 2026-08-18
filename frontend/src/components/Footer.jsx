import { Link } from "react-router-dom";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="footer__col footer__col--brand">
          <p className="footer__logo">shop<span>verse</span></p>
          <p className="footer__tagline">
            Pakistan's modern multi-vendor marketplace. Shop thousands of verified products, fast delivery, and secure payments.
          </p>
          <div className="footer__socials">
            <a href="#" aria-label="Facebook">📘</a>
            <a href="#" aria-label="Instagram">📷</a>
            <a href="#" aria-label="Twitter">🐦</a>
            <a href="#" aria-label="YouTube">▶️</a>
          </div>
        </div>

        <div className="footer__col">
          <h4 className="footer__heading">Shop</h4>
          <ul className="footer__links">
            <li><Link to="/products">All Products</Link></li>
            <li><Link to="/products?sale=true">Deals & Sales</Link></li>
            <li><Link to="/products?sort=newest">New Arrivals</Link></li>
            <li><Link to="/vendors">Top Vendors</Link></li>
            <li><Link to="/search">Search</Link></li>
          </ul>
        </div>

        <div className="footer__col">
          <h4 className="footer__heading">Account</h4>
          <ul className="footer__links">
            <li><Link to="/login">Log In</Link></li>
            <li><Link to="/register">Register</Link></li>
            <li><Link to="/orders">My Orders</Link></li>
            <li><Link to="/wishlist">Wishlist</Link></li>
            <li><Link to="/profile">Profile</Link></li>
          </ul>
        </div>

        <div className="footer__col">
          <h4 className="footer__heading">Sell on ShopVerse</h4>
          <ul className="footer__links">
            <li><Link to="/vendor/register">Open a Shop</Link></li>
            <li><Link to="/vendor/dashboard">Vendor Dashboard</Link></li>
            <li><Link to="/vendor/orders">Vendor Orders</Link></li>
          </ul>
        </div>

        <div className="footer__col">
          <h4 className="footer__heading">Help</h4>
          <ul className="footer__links">
            <li><Link to="/help">Help Center</Link></li>
            <li><a href="mailto:support@shopverse.pk">Contact Us</a></li>
            <li><Link to="/returns">Returns Policy</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer__bottom">
        <p>© 2026 ShopVerse. All rights reserved.</p>
        <div className="footer__payments">
          <span>EasyPaisa</span>
          <span>JazzCash</span>
          <span>Cash on Delivery</span>
          <span>Bank Transfer</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;