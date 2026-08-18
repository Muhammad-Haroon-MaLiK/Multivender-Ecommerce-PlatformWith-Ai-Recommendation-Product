// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import "./ModernHomepage.css";

const API_URL = 'https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api](https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api/api';
const BASE_URL = 'https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api](https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api';

const HomePage = ({ setPage }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recSource, setRecSource] = useState('');
  const [recHistoryCount, setRecHistoryCount] = useState(0);
  const [recMessage, setRecMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(true);
  const [slide, setSlide] = useState(0);
  const { addToCart } = useCart();

  // Hero Slides
  const HERO_SLIDES = [
    {
      id: 1,
      headline: "Present Your Products to Millions",
      sub: "Join thousands of vendors growing their business on ShopVerse",
      cta: "Open a Shop Now",
      ctaLink: "/vendor/register",
      bg: "#1a1a1a",
      img: "https://www.techavidus.com/images/case-studies/multi-vendor.webp",
    },
    {
      id: 2,
      headline: "New Season Arrivals Are Here",
      sub: "Shop the latest fashion, electronics, and home essentials",
      cta: "Shop Now",
      ctaLink: "/products",
      bg: "#0d1f0d",
      img: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80",
    },
    {
      id: 3,
      headline: "Flash Sale — Up to 50% Off",
      sub: "Limited time deals across all categories. Don't miss out.",
      cta: "See All Deals",
      ctaLink: "/products?sale=true",
      bg: "#1a0d00",
      img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80",
    },
  ];

  const FEATURES = [
    { icon: "🚚", text: "Same day delivery on all city orders" },
    { icon: "📲", text: "Pay with EasyPaisa or Cash on Delivery" },
    { icon: "🎧", text: "24/7 Pakistan-based customer service" },
  ];

  const CATEGORIES = [
    { name: "Fashion", icon: "👗" },
    { name: "Electronics", icon: "📱" },
    { name: "Home & Living", icon: "🏠" },
    { name: "Footwear", icon: "👟" },
    { name: "Beauty", icon: "💄" },
    { name: "Kids & Toys", icon: "🧸" },
  ];

  useEffect(() => {
    fetchData();
    fetchRecommendations();
  }, []);

  const hasVendor = (product) =>
    Boolean(product?.vendor?._id || product?.vendor?.id || product?.vendorId);

  const fetchData = async () => {
    try {
      setLoading(true);

      const productsRes = await axios.get(`${API_URL}/products`);
      const allProducts = productsRes.data.products || [];

      const processedProducts = allProducts.map(product => ({
        ...product,
        vendorId: product.vendor?._id || product.vendor?.id || product.vendorId || null,
        vendorName: product.vendor?.vendorDetails?.storeName || product.vendor?.name || 'Vendor'
      }));

      setProducts(processedProducts);
      setDeals(processedProducts.slice(0, 4));
      setFeaturedProducts(processedProducts.slice(0, 8));

      try {
        const vendorsRes = await axios.get(`${API_URL}/vendors`);
        const processedVendors = (vendorsRes.data.vendors || []).map(vendor => {
          const vendorProducts = processedProducts.filter(p => 
            p.vendorId === vendor._id || 
            p.vendor?._id === vendor._id || 
            p.vendor?.id === vendor._id
          );
          return {
            ...vendor,
            productCount: vendorProducts.length
          };
        });
        setVendors(processedVendors);
      } catch (vendorError) {
        console.error('Error fetching vendors:', vendorError);
        setVendors([]);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      setRecLoading(true);
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const isLoggedIn = !!token;
      let user = null;
      
      try {
        user = userStr ? JSON.parse(userStr) : null;
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
      }

      let url;
      if (isLoggedIn && user?.email) {
        url = `${API_URL}/recommendations/${user.email}`;
        console.log('📊 Fetching personalized recommendations for:', user.email);
      } else {
        url = `${API_URL}/recommendations/api/trending?limit=8`;
        console.log('📊 Fetching trending products (not logged in)');
      }

      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(url, { headers, timeout: 8000 });

      let recommendationsData = [];
      let historyCount = 0;
      let message = '';

      console.log('📊 API Response:', response.data);

      if (response.data && response.data.recommendations) {
        recommendationsData = response.data.recommendations.map(item => {
          if (item._id) {
            return {
              ...item,
              stock: item.stock !== undefined ? item.stock : 10,
              vendorId: item.vendor?._id || item.vendor?.id || item.vendorId || null,
              vendorName: item.vendor?.vendorDetails?.storeName || item.vendor?.name || 'Vendor'
            };
          }
          return {
            _id: item.productId || item._id || 'temp-' + Math.random(),
            name: item.name || 'Product',
            price: item.price || 0,
            category: item.category || 'General',
            images: item.images || [],
            stock: item.stock !== undefined ? item.stock : 10,
            vendorId: item.vendor?._id || item.vendor?.id || item.vendorId || null,
            vendorName: item.vendor?.vendorDetails?.storeName || item.vendor?.name || 'Vendor',
            score: item.score || 0
          };
        });
        
        historyCount = response.data.historyCount || 0;
        message = response.data.message || '';
        
        console.log('✅ Mapped recommendations:', recommendationsData.length);
        console.log('📊 History count:', historyCount);
        console.log('💬 Message:', message);
      } else if (response.data && response.data.products) {
        recommendationsData = response.data.products.map(product => ({
          ...product,
          _id: product._id,
          stock: product.stock !== undefined ? product.stock : 10,
          vendorId: product.vendor?._id || product.vendor?.id || product.vendorId || null,
          vendorName: product.vendor?.vendorDetails?.storeName || product.vendor?.name || 'Vendor'
        }));
        console.log('✅ Mapped from products array:', recommendationsData.length);
      } else {
        recommendationsData = [];
        console.log('⚠️ Unknown response format:', response.data);
      }

      setRecHistoryCount(historyCount);
      setRecMessage(message);
      setRecommendations(recommendationsData);
      setRecSource(isLoggedIn ? 'personalized' : 'trending');
      
      console.log(`📊 Recommendations loaded: ${recommendationsData.length} items (${isLoggedIn ? 'personalized' : 'trending'})`);
      
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      
      try {
        console.log('📊 Falling back to trending products...');
        const trendingResponse = await axios.get(`${API_URL}/recommendations/api/trending?limit=8`);
        
        if (trendingResponse.data && trendingResponse.data.products) {
          const fallbackData = trendingResponse.data.products.map(product => ({
            ...product,
            _id: product._id,
            stock: product.stock !== undefined ? product.stock : 10,
            vendorId: product.vendor?._id || product.vendor?.id || product.vendorId || null,
            vendorName: product.vendor?.vendorDetails?.storeName || product.vendor?.name || 'Vendor'
          }));
          setRecommendations(fallbackData);
          
          const token = localStorage.getItem('token');
          setRecSource(token ? 'personalized' : 'trending');
          console.log('📊 Using trending fallback:', fallbackData.length, 'items');
        } else {
          setRecommendations([]);
          setRecSource('error');
        }
      } catch (fallbackError) {
        console.error('Fallback trending also failed:', fallbackError);
        setRecommendations([]);
        setRecSource('error');
      }
    } finally {
      setRecLoading(false);
    }
  };

  // ✅ FIXED: getImageUrl with better handling
  const getImageUrl = (product) => {
    if (!product) return null;

    // Try to get image from various sources
    let imageUrl = null;

    // 1. Check images array
    if (product.images && product.images.length > 0) {
      const img = product.images[0];
      if (typeof img === 'string') {
        imageUrl = img;
      } else if (img && typeof img === 'object' && img.url) {
        imageUrl = img.url;
      }
    }

    // 2. Check image property
    if (!imageUrl && product.image) {
      imageUrl = product.image;
    }

    // 3. Check productImage property
    if (!imageUrl && product.productImage) {
      imageUrl = product.productImage;
    }

    // 4. Check imageUrl property
    if (!imageUrl && product.imageUrl) {
      imageUrl = product.imageUrl;
    }

    if (!imageUrl) {
      return null;
    }

    // Handle different URL formats
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }

    if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('/images/')) {
      return `${BASE_URL}${imageUrl}`;
    }

    if (imageUrl.startsWith('uploads/') || imageUrl.startsWith('images/')) {
      return `${BASE_URL}/${imageUrl}`;
    }

    if (!imageUrl.includes('/')) {
      return `${BASE_URL}/uploads/${imageUrl}`;
    }

    return `${BASE_URL}/${imageUrl}`;
  };

  const trackProductView = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.post(`${API_URL}/recommendations/track`,
        { productId, action: 'view' },
        { headers, timeout: 8000 }
      );
      
      console.log('✅ Product view tracked:', response.data);
      
      if (response.data.recommendationsReady) {
        console.log('🎯 ' + response.data.recommendationMessage);
        setRecMessage('🎯 Personalized recommendations ready! Refreshing...');
        setTimeout(() => {
          fetchRecommendations();
        }, 1000);
      } else if (response.data.historyCount !== undefined) {
        console.log('📊 ' + response.data.recommendationMessage);
        setRecHistoryCount(response.data.historyCount);
        setRecMessage(response.data.recommendationMessage);
      }
      
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const trackAddToCart = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.post(`${API_URL}/recommendations/track`,
        { productId, action: 'add_to_cart' },
        { headers, timeout: 8000 }
      );
      
      console.log('✅ Add to cart tracked:', response.data);
      
      if (response.data.recommendationsReady) {
        setRecMessage('🎯 Recommendations updated!');
        setTimeout(() => {
          fetchRecommendations();
        }, 1000);
      }
    } catch (error) {
      console.error('Error tracking add to cart:', error);
    }
  };

  const handleAddToCart = (product) => {
    const vendorId = product.vendorId || product.vendor?._id || product.vendor?.id || null;

    if (!vendorId) {
      console.warn('Skipped add-to-cart for vendor-less product:', product._id);
      return;
    }

    const productWithVendor = {
      ...product,
      vendorId,
    };

    addToCart(productWithVendor, 1);
    
    if (product._id) {
      trackAddToCart(product._id);
    }
    
    alert(`✅ ${product.name} added to cart!`);
  };

  const navigateTo = (page, vendorId = null) => {
    if (page === 'products') {
      navigate('/products');
    } else if (page === 'vendors') {
      navigate('/vendors');
    } else if (page === 'register') {
      navigate('/vendor/register');
    } else if (page === 'vendor-store' && vendorId) {
      navigate(`/vendors/${vendorId}`);
    } else if (page === 'product-detail' && vendorId) {
      navigate(`/products/${vendorId}`);
    } else if (typeof setPage === 'function') {
      setPage(page);
    }
  };

  // ✅ FIXED: handleProductClick - ONLY tracks view, NO navigation
  const handleProductClick = (product) => {
    if (product?._id) {
      trackProductView(product._id);
    }
    // Do NOT navigate - just track the view for recommendations
  };

  const getVendorAvatar = (vendor) => {
    let logo = null;
    
    if (vendor.vendorDetails?.storeLogo) {
      logo = vendor.vendorDetails.storeLogo;
    } else if (vendor.logo) {
      logo = vendor.logo;
    } else if (vendor.avatar) {
      logo = vendor.avatar;
    } else if (vendor.image) {
      logo = vendor.image;
    }

    if (logo) {
      if (logo.startsWith('http://') || logo.startsWith('https://')) {
        return logo;
      }
      if (logo.startsWith('/uploads/')) {
        return `${BASE_URL}${logo}`;
      }
      if (logo.startsWith('uploads/')) {
        return `${BASE_URL}/${logo}`;
      }
      if (!logo.includes('/')) {
        return `${BASE_URL}/uploads/${logo}`;
      }
      return `${BASE_URL}/${logo}`;
    }

    const storeName = vendor.vendorDetails?.storeName || vendor.name || 'Vendor';
    return storeName.charAt(0).toUpperCase();
  };

  const total = HERO_SLIDES.length;
  const current = HERO_SLIDES[slide];

  const prev = () => setSlide((s) => (s - 1 + total) % total);
  const next = () => setSlide((s) => (s + 1) % total);

  if (loading) {
    return (
      <div className="homepage">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="homepage">
      {/* Hero Banner */}
      <section className="hero" style={{ backgroundImage: `url(${current.img})` }}>
        <button className="hero-arrow hero-arrow--left" onClick={prev}>‹</button>
        <div className="hero-content">
          <h1 className="hero-headline">{current.headline}</h1>
          <p className="hero-sub">{current.sub}</p>
          <Link to={current.ctaLink} className="hero-cta">
            {current.cta} →
          </Link>
        </div>
        <div className="hero-visual">🛍️</div>
        <button className="hero-arrow hero-arrow--right" onClick={next}>›</button>
        <div className="hero-dots">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              className={`hero-dot${i === slide ? " hero-dot--active" : ""}`}
              onClick={() => setSlide(i)}
            />
          ))}
        </div>
      </section>

      {/* Feature Strip */}
      <div className="features-strip">
        {FEATURES.map((f, i) => (
          <div key={i} className="feature-item">
            <span className="feature-icon">{f.icon}</span>
            <span className="feature-text">{f.text}</span>
          </div>
        ))}
      </div>

      /* AI Recommendations Section */
      <section className="home-section home-section--white">
        <div className="section-header">
          <h2 className="section_title">
            {localStorage.getItem('token') ? '🎯 Recommended For You' : '🔥 Trending Now'}
          </h2>
          <button className="section-link" onClick={() => navigateTo('products')}>View all →</button>
        </div>
        
        {localStorage.getItem('token') && recMessage && (
          <div className="recommendation-status" style={{
            padding: '10px 20px',
            marginBottom: '20px',
            backgroundColor: '#f0f7ff',
            borderRadius: '8px',
            border: '1px solid #667eea',
            color: '#667eea',
            fontSize: '14px',
            textAlign: 'center',
            animation: 'fadeIn 0.5s ease'
          }}>
            {recMessage}
          </div>
        )}

        <div className="deals-grid">
          {recLoading ? (
            <div className="empty-state">Loading recommendations...</div>
          ) : recommendations.length === 0 ? (
            <div className="empty-state">
              {localStorage.getItem('token') 
                ? '🌟 View 2-3 products to get personalized recommendations!' 
                : 'No recommendations available'}
            </div>
          ) : (
            recommendations.slice(0, 4).map((item) => {
              const product = item;
              if (!product || !product._id) {
                console.warn('Invalid product item:', item);
                return null;
              }

              const imageUrl = getImageUrl(product);
              const isOutOfStock = product.stock === 0;
              const isUnavailable = !hasVendor(product);
              const isDisabled = isOutOfStock || isUnavailable;

              return (
                <div
                  key={product._id}
                  className={`deal-card ${isOutOfStock ? 'out-of-stock' : ''}`}
                  onClick={() => handleProductClick(product)}
                >
                  <div className="deal-img">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="deal-product-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<div class="deal-emoji">📦</div>';
                        }}
                      />
                    ) : (
                      <div className="deal-emoji">📦</div>
                    )}
                    {isOutOfStock && <span className="out-of-stock-badge">Out of Stock</span>}
                  </div>
                  <div className="deal-info">
                    <p className="deal-name">{product.name}</p>
                    <div className="deal-prices">
                      <span className="deal-price">Rs{product.price?.toLocaleString()}</span>
                      {product.discountedPrice && (
                        <span className="deal-old">Rs{product.discountedPrice?.toLocaleString()}</span>
                      )}
                    </div>
                    <button
                      className="add-to-cart-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      disabled={isDisabled}
                    >
                      {isOutOfStock ? 'Out of Stock' : isUnavailable ? 'Unavailable' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      /* Deals of the Month */
      <section className="home-section home-section--white">
        <div className="section-header">
          <h2 className="section_title">🛒 Deals of the Month</h2>
          <button className="section-link" onClick={() => navigateTo('products')}>View all →</button>
        </div>
        <div className="deals-grid">
          {deals.length === 0 ? (
            <div className="empty-state">No products available yet</div>
          ) : (
            deals.map((product) => {
              const discount = product.discountedPrice ?
                Math.round(((product.price - product.discountedPrice) / product.price) * 100) : 0;
              const imageUrl = getImageUrl(product);
              const isOutOfStock = product.stock === 0;
              const isUnavailable = !hasVendor(product);
              const isDisabled = isOutOfStock || isUnavailable;

              return (
                <div key={product._id} className={`deal-card ${isOutOfStock ? 'out-of-stock' : ''}`}>
                  <div className="deal-img">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="deal-product-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<div class="deal-emoji">📦</div>';
                        }}
                      />
                    ) : (
                      <div className="deal-emoji">📦</div>
                    )}
                    {discount > 0 && <span className="discount-badge">-{discount}%</span>}
                    {isOutOfStock && <span className="out-of-stock-badge">Out of Stock</span>}
                  </div>
                  <div className="deal-info">
                    <p className="deal-name">{product.name}</p>
                    <div className="deal-prices">
                      <span className="deal-price">Rs{product.price?.toLocaleString()}</span>
                      {product.discountedPrice && (
                        <span className="deal-old">Rs{product.discountedPrice?.toLocaleString()}</span>
                      )}
                    </div>
                    <button
                      className="add-to-cart-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      disabled={isDisabled}
                    >
                      {isOutOfStock ? 'Out of Stock' : isUnavailable ? 'Unavailable' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      /* Categories */
      <section className="home-section home-section--gray">
        <div className="section-header">
          <h2 className="section_title">📂 Shop by Category</h2>
          <button className="section-link" onClick={() => navigateTo('products')}>View all →</button>
        </div>
        <div className="categories-grid">
          {CATEGORIES.map((cat) => (
            <button key={cat.name} className="cat-card" onClick={() => navigateTo('products')}>
              <span className="cat-card-icon">{cat.icon}</span>
              <span className="cat-card-name">{cat.name}</span>
              <span className="cat-card-count">
                {products.filter(p => p.category?.toLowerCase() === cat.name.toLowerCase()).length} items
              </span>
            </button>
          ))}
        </div>
      </section>

      /* Featured Products */
      <section className="home-section home-section--white">
        <div className="section-header">
          <h2 className="section_title">⭐ Featured Products</h2>
          <button className="section-link" onClick={() => navigateTo('products')}>View all →</button>
        </div>
        <div className="deals-grid">
          {featuredProducts.length === 0 ? (
            <div className="empty-state">No featured products yet</div>
          ) : (
            featuredProducts.slice(0, 4).map((product) => {
              const imageUrl = getImageUrl(product);
              const isOutOfStock = product.stock === 0;
              const isUnavailable = !hasVendor(product);
              const isDisabled = isOutOfStock || isUnavailable;

              return (
                <div key={product._id} className={`deal-card ${isOutOfStock ? 'out-of-stock' : ''}`}>
                  <div className="deal-img">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="deal-product-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<div class="deal-emoji">📦</div>';
                        }}
                      />
                    ) : (
                      <div className="deal-emoji">📦</div>
                    )}
                    <span className="discount-badge" style={{ background: '#667eea' }}>Featured</span>
                    {isOutOfStock && <span className="out-of-stock-badge">Out of Stock</span>}
                  </div>
                  <div className="deal-info">
                    <p className="deal-name">{product.name}</p>
                    <div className="deal-prices">
                      <span className="deal-price">Rs{product.price?.toLocaleString()}</span>
                    </div>
                    <button
                      className="add-to-cart-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      disabled={isDisabled}
                    >
                      {isOutOfStock ? 'Out of Stock' : isUnavailable ? 'Unavailable' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Top Verified Vendors */}
      <section className="home-section home-section--gray">
        <div className="section-header">
          <h2 className="section_title">🏪 Top Verified Vendors</h2>
          <button className="section-link" onClick={() => navigateTo('vendors')}>View all →</button>
        </div>
        <div className="vendors-grid">
          {vendors.length === 0 ? (
            <div className="empty-state">No vendors available yet</div>
          ) : (
            vendors.slice(0, 4).map((vendor) => {
              const avatar = getVendorAvatar(vendor);
              const isImage = typeof avatar === 'string' && (avatar.startsWith('http://') || avatar.startsWith('https://'));
              const productCount = vendor.productCount || 0;
              const storeName = vendor.vendorDetails?.storeName || vendor.name || 'Vendor';

              return (
                <div 
                  key={vendor._id} 
                  className="vendor-card"
                  onClick={() => navigateTo('vendor-store', vendor._id)}
                >
                  <div className="vendor-avatar">
                    {isImage ? (
                      <img 
                        src={avatar} 
                        alt={storeName}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const parent = e.target.parentElement;
                          parent.textContent = storeName.charAt(0).toUpperCase();
                          parent.style.fontSize = '24px';
                          parent.style.fontWeight = '600';
                          parent.style.color = '#00b894';
                          parent.style.display = 'flex';
                          parent.style.alignItems = 'center';
                          parent.style.justifyContent = 'center';
                          parent.style.width = '52px';
                          parent.style.height = '52px';
                          parent.style.borderRadius = '50%';
                          parent.style.background = '#e8f8f5';
                          parent.style.border = '2px solid #00b894';
                        }}
                      />
                    ) : (
                      <span style={{ 
                        fontSize: '24px', 
                        fontWeight: '600',
                        color: '#00b894',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%'
                      }}>
                        {avatar}
                      </span>
                    )}
                  </div>
                  <div className="vendor-info">
                    <p className="vendor-name">{storeName}</p>
                    <p className="vendor-meta">
                      {productCount} {productCount === 1 ? 'product' : 'products'}
                    </p>
                    <span className="vendor-verified">✓ Verified</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Customer Satisfaction */}
      <div className="satisfaction-section">
        <div className="satisfaction-content">
          <div className="satisfaction-icon">😊</div>
          <div className="satisfaction-text">
            <h3>98% Customer Satisfaction</h3>
            <p>Join thousands of happy customers who trust us for their shopping needs</p>
          </div>
          <div className="satisfaction-stats">
            <div className="satisfaction-stat">
              <span className="stat-value">4.8★</span>
              <span className="stat-label">Average Rating</span>
            </div>
            <div className="satisfaction-stat">
              <span className="stat-value">10k+</span>
              <span className="stat-label">Happy Customers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dual Banner */}
      <div className="banner-row">
        <div className="banner-card banner-card--dark">
          <div className="banner-text">
            <h3>Become a Vendor</h3>
            <p>Reach millions of customers across Pakistan</p>
            <button className="banner-btn" onClick={() => navigateTo('register')}>
              Open a Shop Now
            </button>
          </div>
          <span className="banner-emoji">🏪</span>
        </div>
        <div className="banner-card banner-card--green">
          <div className="banner-text">
            <h3>Flash Sale — Ends Tonight</h3>
            <p>Up to 50% off on electronics &amp; fashion</p>
            <button className="banner-btn banner-btn--dark" onClick={() => navigateTo('products')}>
              Shop the Sale
            </button>
          </div>
          <span className="banner-emoji">⚡</span>
        </div>
      </div>

      {/* Footer Strip */}
      <div className="footer-strip">
        © 2026 <strong>ShopVerse</strong> — Pakistan's modern multi-vendor marketplace
      </div>
    </div>
  );
};

export default HomePage;