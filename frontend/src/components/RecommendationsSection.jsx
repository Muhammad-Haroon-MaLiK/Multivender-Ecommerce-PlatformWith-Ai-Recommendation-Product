import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './RecommendationsSection.css';

const API_URL = 'http://localhost:5000/api';

const RecommendationsSection = ({ setPage, addToCart }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommendationType, setRecommendationType] = useState('trending');
  const [message, setMessage] = useState('');
  
  // Use try-catch to handle if useAuth is not available
  let isAuthenticated = false;
  let authContext;
  
  try {
    authContext = useAuth();
    isAuthenticated = authContext?.isAuthenticated || false;
  } catch (error) {
    console.warn('Auth context not available:', error);
    isAuthenticated = false;
  }
  
  const { addToCart: cartAdd } = useCart();

  useEffect(() => {
    fetchRecommendations();
  }, [isAuthenticated]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      let data;
      
      if (isAuthenticated) {
        // Get personalized recommendations for logged-in users
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/recommendations/recommendations?limit=8`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        data = response.data;
        setRecommendationType(data.type || 'trending');
        setMessage(data.message || '');
        setProducts(data.products || []);
      } else {
        // Get trending products for guests
        const response = await axios.get(`${API_URL}/recommendations/trending?limit=8`);
        data = response.data;
        setRecommendationType('trending');
        setMessage('Trending products on the platform');
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (product) => {
    // Track product view
    if (isAuthenticated) {
      trackProductView(product._id);
    }
    if (setPage) {
      setPage('product-detail');
    }
  };

  const trackProductView = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/recommendations/track`, 
        { productId, action: 'view' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    if (addToCart) {
      addToCart(product);
    } else {
      cartAdd(product, 1);
    }
    
    // Track add to cart
    if (isAuthenticated) {
      axios.post(`${API_URL}/recommendations/track`, 
        { productId: product._id, action: 'add_to_cart' },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      ).catch(() => {});
    }
    alert(`✅ ${product.name} added to cart!`);
  };

  const getImageUrl = (product) => {
    if (product?.images && product.images.length > 0) {
      const img = product.images[0];
      if (typeof img === 'string') {
        if (img.startsWith('http')) return img;
        if (img.startsWith('/')) return `http://localhost:5000${img}`;
        return `http://localhost:5000/uploads/${img}`;
      } else if (img?.url) {
        if (img.url.startsWith('http')) return img.url;
        if (img.url.startsWith('/')) return `http://localhost:5000${img.url}`;
        return `http://localhost:5000/uploads/${img.url}`;
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className="recommendations-section">
        <div className="recommendations-loading">
          <div className="spinner"></div>
          <p>Loading recommendations...</p>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="recommendations-section">
      <div className="section-header">
        <div className="section-title-group">
          <h2 className="section-title">
            {recommendationType === 'personalized' && '🎯 Recommended For You'}
            {recommendationType === 'category-based' && '📂 Based on Your Interests'}
            {recommendationType === 'trending' && '🔥 Trending Now'}
          </h2>
          {message && <p className="section-message">{message}</p>}
        </div>
        <button className="view-all-btn" onClick={() => setPage && setPage('products')}>
          View all →
        </button>
      </div>

      <div className="recommendations-grid">
        {products.map((product) => {
          const imageUrl = getImageUrl(product);
          const discount = product.discountedPrice ? 
            Math.round(((product.price - product.discountedPrice) / product.price) * 100) : 0;
          
          return (
            <div 
              key={product._id} 
              className="recommendation-card"
              onClick={() => handleProductClick(product)}
            >
              <div className="product-image-container">
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt={product.name} 
                    className="product-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<div class="product-placeholder">📦</div>';
                    }}
                  />
                ) : (
                  <div className="product-placeholder">📦</div>
                )}
                {discount > 0 && (
                  <span className="discount-badge">-{discount}%</span>
                )}
                {product.stock === 0 && (
                  <span className="out-of-stock-badge">Out of Stock</span>
                )}
              </div>
              
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-vendor">
                  {product.vendor?.vendorDetails?.storeName || product.vendor?.name}
                </p>
                <div className="product-pricing">
                  <span className="product-price">${product.price}</span>
                  {product.discountedPrice && (
                    <span className="product-old-price">${product.discountedPrice}</span>
                  )}
                </div>
                <button 
                  className="add-to-cart-btn"
                  onClick={(e) => handleAddToCart(e, product)}
                  disabled={product.stock === 0}
                >
                  {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendationsSection;