import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import axios from "axios";
import "./ProductCard.css";

const API_URL = 'https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api](https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api/api';

const ProductCard = ({ product, onWishlistUpdate }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);

  // Check if user is logged in
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

  // Check if product is in wishlist
  useEffect(() => {
    if (user && product?._id) {
      checkWishlistStatus();
    }
  }, [user, product]);

  const getToken = () => localStorage.getItem('token');

  const checkWishlistStatus = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await axios.get(`${API_URL}/wishlist`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        const inWishlist = response.data.wishlist.some(
          item => item.product?._id === product._id || item.product === product._id
        );
        setIsInWishlist(inWishlist);
      }
    } catch (error) {
      console.error('Error checking wishlist:', error);
    }
  };

  // Helper function to get image URL
  const getImageUrl = (product) => {
    if (!product) return null;

    let imageUrl = null;

    // Try ALL possible image fields
    const possibleImageFields = [
      'image',
      'images',
      'imageUrl',
      'image_url',
      'thumbnail',
      'photo',
      'picture',
      'img',
      'productImage',
      'product_image',
      'imagePath',
      'image_path'
    ];

    for (const field of possibleImageFields) {
      if (product[field]) {
        const value = product[field];
        
        // If it's an array, take first item
        if (Array.isArray(value) && value.length > 0) {
          const firstItem = value[0];
          if (typeof firstItem === 'string') {
            imageUrl = firstItem;
            break;
          } else if (typeof firstItem === 'object' && firstItem !== null) {
            imageUrl = firstItem.url || firstItem.path || firstItem.file || null;
            if (imageUrl) break;
          }
        }
        // If it's a string
        else if (typeof value === 'string') {
          imageUrl = value;
          break;
        }
        // If it's an object with url
        else if (typeof value === 'object' && value !== null) {
          imageUrl = value.url || value.path || value.file || null;
          if (imageUrl) break;
        }
      }
    }

    // If no image found, use a placeholder
    if (!imageUrl) {
      return `https://via.placeholder.com/300x300/667eea/ffffff?text=${encodeURIComponent(product?.name || 'Product')}`;
    }

    // Process URL
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }

    if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('/images/') || imageUrl.startsWith('/static/')) {
      return `https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api](https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api${imageUrl}`;
    }

    if (imageUrl.startsWith('uploads/') || imageUrl.startsWith('images/') || imageUrl.startsWith('static/')) {
      return `https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api](https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api/${imageUrl}`;
    }

    if (!imageUrl.includes('/')) {
      return `https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api](https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api/uploads/${imageUrl}`;
    }

    return `https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api](https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api/uploads/${imageUrl}`;
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!product) {
      console.error('❌ Product is undefined');
      return;
    }

    const imageUrl = getImageUrl(product);

    const cartProduct = {
      _id: product._id,
      id: product._id,
      name: product.name || 'Unnamed Product',
      price: product.price || 0,
      category: product.category || 'Uncategorized',
      stock: product.stock || 0,
      image: imageUrl,
      vendorId: product.vendorId || product.vendor?._id || null,
      vendorName: product.vendor?.name || 'Unknown Vendor',
      quantity: 1
    };
    
    try {
      addToCart(cartProduct, 1);
      
      const btn = e.currentTarget;
      const originalText = btn.textContent;
      btn.textContent = '✓ Added!';
      btn.style.background = '#48bb78';
      btn.style.color = '#fff';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        btn.style.color = '';
      }, 1500);
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    }
  };

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate('/login');
      return;
    }

    setIsLoading(true);

    try {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      if (isInWishlist) {
        // Remove from wishlist
        const response = await axios.delete(`${API_URL}/wishlist/remove/${product._id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.data.success) {
          setIsInWishlist(false);
          if (onWishlistUpdate) onWishlistUpdate(product._id, false);
          showToast('Removed from wishlist', 'info');
        }
      } else {
        // Add to wishlist
        const response = await axios.post(
          `${API_URL}/wishlist/add`,
          { productId: product._id },
          { headers: { 'Authorization': `Bearer ${token}` } }
        );

        if (response.data.success) {
          setIsInWishlist(true);
          if (onWishlistUpdate) onWishlistUpdate(product._id, true);
          showToast('Added to wishlist! ❤️', 'success');
        }
      }
    } catch (error) {
      console.error('Wishlist error:', error);
      showToast(error.response?.data?.message || 'Failed to update wishlist', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Toast notification
  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 24px;
      background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#e53935' : '#667eea'};
      color: white;
      border-radius: 8px;
      font-weight: 500;
      z-index: 9999;
      animation: slideIn 0.3s ease;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  const getCategoryEmoji = (category) => {
    const emojis = {
      'Electronics': '📱',
      'Fashion': '👗',
      'Clothing': '👕',
      'Home & Living': '🏠',
      'Footwear': '👟',
      'Beauty': '💄',
      'Kids & Toys': '🧸',
      'Sports': '⚽',
      'Books': '📚',
      'Health': '💊',
      'Automotive': '🚗'
    };
    return emojis[category] || '📦';
  };

  const imageUrl = getImageUrl(product);
  const inStock = product?.stock > 0;

  return (
    <div className="product-card">
      {/* Wishlist Heart Button */}
      <button
        className={`wishlist-heart-btn ${isInWishlist ? 'active' : ''}`}
        onClick={handleWishlistToggle}
        disabled={isLoading}
        title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        {isLoading ? '⏳' : isInWishlist ? '❤️' : '🤍'}
      </button>

      <Link to={`/products/${product._id}`} className="product-card__image">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={product?.name || 'Product'}
            onError={(e) => {
              console.error(`❌ Failed to load image: ${imageUrl}`);
              e.target.style.display = 'none';
              const fallback = e.target.parentElement?.querySelector('.product-card__fallback');
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className="product-card__fallback"
          style={{ display: imageUrl ? 'none' : 'flex' }}
        >
          {getCategoryEmoji(product?.category)}
        </div>
        {!inStock && (
          <span className="product-card__out-of-stock">Out of Stock</span>
        )}
      </Link>

      <div className="product-card__content">
        <div className="product-card__category">{product?.category || 'Uncategorized'}</div>
        <Link to={`/products/${product._id}`} className="product-card__name">
          {product?.name || 'Unnamed Product'}
        </Link>

        <div className="product-card__price-row">
          <span className="product-card__price">${(product?.price || 0).toFixed(2)}</span>
          {product?.originalPrice && (
            <span className="product-card__old-price">${product.originalPrice?.toFixed(2)}</span>
          )}
          {product?.rating && (
            <span className="product-card__rating">★ {product.rating}</span>
          )}
        </div>

        <div className="product-card__stock">
          {inStock ? (
            <span className="product-card__stock-in">In Stock: {product.stock}</span>
          ) : (
            <span className="product-card__stock-out">Out of Stock</span>
          )}
        </div>

        <button
          className={`product-card__btn ${!inStock ? 'product-card__btn--disabled' : ''}`}
          onClick={handleAddToCart}
          disabled={!inStock}
        >
          {inStock ? '🛒 Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;