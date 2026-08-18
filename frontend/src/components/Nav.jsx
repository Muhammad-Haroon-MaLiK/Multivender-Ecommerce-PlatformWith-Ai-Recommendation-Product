// src/components/Nav.jsx
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Nav.css";

const Nav = ({ cartCount = 0, wishlistCount = 0 }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCategories, setShowCategories] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const categoriesRef = useRef(null);
  const userMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const categories = [
    { name: "All", icon: "📋", path: "/products" },
    { name: "Fashion", icon: "👗", path: "/products?category=Fashion" },
    { name: "Electronics", icon: "📱", path: "/products?category=Electronics" },
    { name: "Home & Living", icon: "🏠", path: "/products?category=Home%20%26%20Living" },
    { name: "Footwear", icon: "👟", path: "/products?category=Footwear" },
    { name: "Beauty", icon: "💄", path: "/products?category=Beauty" },
    { name: "Kids & Toys", icon: "🧸", path: "/products?category=Kids%20%26%20Toys" },
  ];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        setUser(null);
      }
    }
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoriesRef.current && !categoriesRef.current.contains(event.target)) {
        setShowCategories(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setShowCategories(false);
    }
  };

  // Handle category click
  const handleCategoryClick = (path) => {
    navigate(path);
    setShowCategories(false);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShowUserMenu(false);
    navigate('/');
    setTimeout(() => window.location.reload(), 100);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setShowCategories(false);
    setShowUserMenu(false);
  };

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Check if link is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Top bar */}
      <div className="topbar">
        <div className="topbar-left">
          <Link to="/vendor/register" className="topbar-link">
            Sell on ShopVerse
          </Link>
          {user?.role === 'vendor' && (
            <Link to="/vendor/dashboard" className="topbar-link">
              Dashboard
            </Link>
          )}
          {user?.role === 'admin' && (
            <Link to="/admin/dashboard" className="topbar-link">
              Admin Panel
            </Link>
          )}
        </div>
        <div className="topbar-right">
          <Link to="/help" className="topbar-link">
            Help & Contact
          </Link>
          {!user && (
            <Link to="/register" className="topbar-link topbar-link--highlight">
              Sign Up
            </Link>
          )}
        </div>
      </div>

      {/* Main nav */}
      <nav className="nav" role="navigation" aria-label="Main navigation">
        <div className="nav-container">
          {/* Logo */}
          <Link to="/" className="nav-logo" aria-label="ShopVerse Home">
            shop<span>verse</span>
          </Link>

 {/* Categories dropdown */}
            <div className="cat-dropdown-wrapper" ref={categoriesRef}>
              <button
                className="cat-btn"
                onClick={() => setShowCategories((prev) => !prev)}
                aria-expanded={showCategories}
                aria-haspopup="true"
              >
                <span className="cat-btn-icon" aria-hidden="true">☰</span>
                <span className="cat-btn-text">CATEGORIES</span>
                <span className={`cat-btn-arrow ${showCategories ? 'open' : ''}`} aria-hidden="true">▾</span>
              </button>

              {showCategories && (
                <div className="cat-dropdown" role="menu">
                  {categories.map((cat) => (
                    <button
                      key={cat.name}
                      className="cat-dropdown-item"
                      onClick={() => handleCategoryClick(cat.path)}
                      role="menuitem"
                    >
                      <span className="cat-dropdown-icon" aria-hidden="true">{cat.icon}</span>
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

          {/* Search - Always visible */}
          <form className="search_bar" onSubmit={handleSearch} role="search">
            <input
              type="text"
              placeholder="Search for products, categories or shops..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search products, categories or shops"
            />
            <button type="submit" aria-label="Submit search">
              <span aria-hidden="true">🔍</span>
            </button>
          </form>

          {/* Mobile menu toggle */}
          <button 
            className="nav-mobile-toggle"
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          >
            <span className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>

          {/* Desktop Navigation */}
          <div 
            className={`nav-desktop ${isMobileMenuOpen ? 'active' : ''}`}
            ref={mobileMenuRef}
          >
           

            {/* Nav actions */}
            <div className="nav-actions">
              {user ? (
                <div className="nav-user-wrapper" ref={userMenuRef}>
                  <button 
                    className="nav-user-btn"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    aria-expanded={showUserMenu}
                    aria-haspopup="true"
                  >
                    <span className="nav-user-avatar" aria-hidden="true">
                      {getInitials(user?.name)}
                    </span>
                    <span className="nav-user-name">
                      {user?.name?.split(' ')[0] || 'User'}
                    </span>
                    <span className={`nav-user-arrow ${showUserMenu ? 'open' : ''}`} aria-hidden="true">▾</span>
                  </button>

                  {showUserMenu && (
                    <div className="nav-user-dropdown" role="menu">
                      <Link to="/profile" className="dropdown-item" onClick={() => setShowUserMenu(false)} role="menuitem">
                        <span className="dropdown-icon" aria-hidden="true">👤</span>
                        My Profile
                      </Link>
                      <Link to="/orders" className="dropdown-item" onClick={() => setShowUserMenu(false)} role="menuitem">
                        <span className="dropdown-icon" aria-hidden="true">📦</span>
                        My Orders
                      </Link>
                      <Link to="/wishlist" className="dropdown-item" onClick={() => setShowUserMenu(false)} role="menuitem">
                        <span className="dropdown-icon" aria-hidden="true">❤️</span>
                        Wishlist
                      </Link>
                      {user?.role === 'vendor' && (
                        <Link to="/vendor/dashboard" className="dropdown-item" onClick={() => setShowUserMenu(false)} role="menuitem">
                          <span className="dropdown-icon" aria-hidden="true">📊</span>
                          Dashboard
                        </Link>
                      )}
                      {user?.role === 'admin' && (
                        <Link to="/admin/dashboard" className="dropdown-item" onClick={() => setShowUserMenu(false)} role="menuitem">
                          <span className="dropdown-icon" aria-hidden="true">⚙️</span>
                          Admin
                        </Link>
                      )}
                      <div className="dropdown-divider" role="separator"></div>
                      <button className="dropdown-item dropdown-item--danger" onClick={handleLogout} role="menuitem">
                        <span className="dropdown-icon" aria-hidden="true">🚪</span>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className={`nav-action ${isActive('/login') ? 'active' : ''}`}>
                  <span className="nav-action-icon" aria-hidden="true">👤</span>
                  <span className="nav-action-label">Log In</span>
                </Link>
              )}

              {/* Cart - with badge */}
              <Link to="/cart" className={`nav-action nav-action--badge ${isActive('/cart') ? 'active' : ''}`}>
                <span className="nav-action-icon" aria-hidden="true">🛒</span>
                <span className="nav-action-label">Cart</span>
                {cartCount > 0 && (
                  <span className="nav-badge" aria-label={`${cartCount} items in cart`}>
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>

              {/* Wishlist - with badge */}
              <Link to="/wishlist" className={`nav-action nav-action--badge ${isActive('/wishlist') ? 'active' : ''}`}>
                <span className="nav-action-icon" aria-hidden="true">♡</span>
                <span className="nav-action-label">Wishlist</span>
                {wishlistCount > 0 && (
                  <span className="nav-badge nav-badge--red" aria-label={`${wishlistCount} items in wishlist`}>
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Nav;