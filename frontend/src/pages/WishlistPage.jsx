// src/pages/WishlistPage.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "./WishlistPage.css";

const WishlistPage = () => {
  const { wishlistItems, removeFromWishlist, addToCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  useEffect(() => {
    // Simulate loading for smooth UX
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleRemoveFromWishlist = (productId, productName) => {
    removeFromWishlist(productId);
    setToast(`🗑️ "${productName}" removed from wishlist`);
    setTimeout(() => setToast(""), 2500);
  };

  const handleAddToCart = (product) => {
    const productId = product._id || product.id || product.productId;
    
    if (!productId) {
      setToast("⚠️ Invalid product");
      setTimeout(() => setToast(""), 3000);
      return;
    }

    if (product.stock < 1) {
      setToast("⚠️ Out of stock");
      setTimeout(() => setToast(""), 3000);
      return;
    }

    addToCart(product, 1);
    setToast(`✓ "${product.name}" added to cart`);
    setTimeout(() => setToast(""), 2500);
  };

  const getImageUrl = (product) => {
    if (!product) return null;
    
    if (product.images && product.images.length > 0) {
      const img = product.images[0];
      if (typeof img === 'string') {
        return img.startsWith('http') ? img : `https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api](https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api${img}`;
      }
      if (img.url) {
        return img.url.startsWith('http') ? img.url : `https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api](https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api${img.url}`;
      }
    }
    
    if (product.image) {
      return product.image.startsWith('http') ? product.image : `https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api](https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api${product.image}`;
    }
    
    return null;
  };

  const getCategoryEmoji = (category) => {
    const emojis = {
      'Electronics': '📱',
      'Fashion': '👗',
      'Clothing': '👕',
      'Home & Living': '🏠',
      'Footwear': '👟',
      'Beauty': '💄',
      'Kids & Toys': '🧸'
    };
    return emojis[category] || '📦';
  };

  const getVendorName = (product) => {
    return product.vendor?.vendorDetails?.storeName || 
           product.vendor?.name || 
           product.vendorName || 
           'Unknown Vendor';
  };

  if (loading) {
    return (
      <div className="wishlist-page">
        <div className="wishlist-loading">
          <div className="wishlist-spinner"></div>
          <p>Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      {toast && <div className="wishlist-toast">{toast}</div>}

      {/* Header */}
      <div className="wishlist-header">
        <div>
          <h1 className="wishlist-title">❤️ My Wishlist</h1>
          <p className="wishlist-subtitle">
            {wishlistItems && wishlistItems.length > 0 
              ? `${wishlistItems.length} saved item${wishlistItems.length > 1 ? 's' : ''}`
              : 'No items saved yet'
            }
          </p>
        </div>
        {wishlistItems && wishlistItems.length > 0 && (
          <button 
            className="wishlist-clear-btn"
            onClick={() => {
              if (window.confirm('Are you sure you want to clear your wishlist?')) {
                wishlistItems.forEach(item => {
                  const id = item._id || item.id || item.productId;
                  if (id) removeFromWishlist(id);
                });
                setToast("🗑️ Wishlist cleared");
                setTimeout(() => setToast(""), 2500);
              }
            }}
          >
            Clear All
          </button>
        )}
      </div>

      {(!wishlistItems || wishlistItems.length === 0) && (
        <div className="wishlist-empty">
          <div className="wishlist-empty-icon">🛍️</div>
          <h2>Your wishlist is empty</h2>
          <p>Start saving your favorite items!</p>
          <Link to="/products" className="wishlist-empty-btn">
            Browse Products
          </Link>
        </div>
      )}

      {wishlistItems && wishlistItems.length > 0 && (
        <div className="wishlist-grid">
          {wishlistItems.map((product) => {
            const productId = product._id || product.id || product.productId;
            const imageUrl = getImageUrl(product);
            const inStock = product.stock > 0;
            const vendorName = getVendorName(product);
            
            return (
              <div key={productId} className="wishlist-item">
                <div className="wishlist-item-image">
                  <Link to={`/products/${productId}`}>
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={product.name}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const fallback = e.target.parentElement?.querySelector('.wishlist-item-fallback');
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="wishlist-item-fallback"
                      style={{ display: imageUrl ? 'none' : 'flex' }}
                    >
                      {getCategoryEmoji(product.category)}
                    </div>
                  </Link>
                  <button 
                    className="wishlist-item-remove"
                    onClick={() => handleRemoveFromWishlist(productId, product.name)}
                    aria-label="Remove from wishlist"
                  >
                    ×
                  </button>
                  {!inStock && (
                    <span className="wishlist-item-out-of-stock">Out of Stock</span>
                  )}
                </div>

                <div className="wishlist-item-content">
                  <div className="wishlist-item-category">{product.category || 'Products'}</div>
                  <Link to={`/products/${productId}`} className="wishlist-item-name">
                    {product.name}
                  </Link>
                  <div className="wishlist-item-vendor">by {vendorName}</div>
                  
                  {product.rating && product.rating > 0 && (
                    <div className="wishlist-item-rating">
                      <span className="wishlist-item-stars">
                        {'★'.repeat(Math.round(product.rating))}
                        {'☆'.repeat(5 - Math.round(product.rating))}
                      </span>
                      <span className="wishlist-item-rating-number">{product.rating.toFixed(1)}</span>
                    </div>
                  )}

                  <div className="wishlist-item-price-row">
                    <span className="wishlist-item-price">Rs {product.price?.toFixed(0)}</span>
                    {product.originalPrice && (
                      <span className="wishlist-item-old-price">Rs {product.originalPrice?.toFixed(0)}</span>
                    )}
                  </div>

                  <div className="wishlist-item-stock">
                    {inStock ? (
                      <span className="wishlist-item-stock-in">In Stock: {product.stock}</span>
                    ) : (
                      <span className="wishlist-item-stock-out">Out of Stock</span>
                    )}
                  </div>

                  <button
                    className={`wishlist-item-cart-btn ${!inStock ? 'disabled' : ''}`}
                    onClick={() => handleAddToCart(product)}
                    disabled={!inStock}
                  >
                    {inStock ? '🛒 Add to Cart' : 'Out of Stock'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;