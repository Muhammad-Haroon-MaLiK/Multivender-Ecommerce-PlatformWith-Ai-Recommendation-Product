// src/pages/CartPage.jsx
import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { trackAddToCart } from '../services/recommendationService';

const API_URL = "https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api](https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api";

const CartPage = () => {
  const navigate = useNavigate();
  const cartContext = useCart();
  
  const cartItems = cartContext?.cartItems || [];
  const removeFromCart = cartContext?.removeFromCart || (() => {});
  const updateQuantity = cartContext?.updateQuantity || (() => {});
  const getCartTotal = cartContext?.getCartTotal || (() => 0);

  // Debug: Log cart items
  useEffect(() => {
    console.log('🛒 Cart Items:', cartItems);
    if (cartItems.length > 0) {
      console.log('📸 First item:', cartItems[0]);
      console.log('🖼️ Image:', cartItems[0]?.image);
      console.log('📁 Images array:', cartItems[0]?.images);
    }
  }, [cartItems]);

  // Get image URL from cart item - FIXED
  const getImageUrl = (item) => {
    if (!item) return null;
    
    // Try multiple sources for image
    let imageUrl = null;
    
    // 1. Check if there's an image property
    if (item.image) {
      imageUrl = item.image;
    }
    
    // 2. Check if there's an images array
    if (!imageUrl && item.images && item.images.length > 0) {
      const img = item.images[0];
      if (typeof img === 'string') {
        imageUrl = img;
      } else if (img && img.url) {
        imageUrl = img.url;
      }
    }
    
    // 3. Check if there's a productImage property
    if (!imageUrl && item.productImage) {
      imageUrl = item.productImage;
    }
    
    // If no image found, return null
    if (!imageUrl) {
      console.warn('No image found for item:', item.name);
      return null;
    }
    
    // Handle different URL formats
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // If it starts with /uploads/ or /images/
    if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('/images/')) {
      return `${API_URL}${imageUrl}`;
    }
    
    // If it starts with uploads/ or images/
    if (imageUrl.startsWith('uploads/') || imageUrl.startsWith('images/')) {
      return `${API_URL}/${imageUrl}`;
    }
    
    // If it's just a filename, assume it's in uploads
    if (!imageUrl.includes('/')) {
      return `${API_URL}/uploads/${imageUrl}`;
    }
    
    // Default: try to prepend API_URL
    return `${API_URL}/${imageUrl}`;
  };

  // If cart is empty
  if (!cartItems || cartItems.length === 0) {
    return (
      <div style={{ 
        minHeight: '60vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f5f5f5',
        padding: '2rem'
      }}>
        <div style={{ 
          textAlign: 'center', 
          background: '#fff', 
          padding: '4rem 2rem', 
          borderRadius: '12px',
          maxWidth: '500px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          border: '1px solid #e8e8e8'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '1rem' }}>🛒</div>
          <h2 style={{ color: '#1a1a2e', marginBottom: '0.5rem' }}>Your cart is empty</h2>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>Discover amazing products from our vendors.</p>
          <Link to="/products">
            <button
              style={{
                padding: '12px 32px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 15px rgba(102,126,234,0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              Start Shopping
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // Calculate totals
  const subtotal = cartItems.reduce((total, item) => total + (item?.price || 0) * (item?.quantity || 1), 0);
  const shipping = subtotal > 100 ? 0 : 8.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const handleCheckout = () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) {
      alert('Please login to proceed to checkout');
      navigate('/login');
      return;
    }

    // Strongest purchase-intent signal short of an actual purchase —
    // reinforces these products for the recommendation model.
    cartItems.forEach((item) => {
      const productId = item?._id || item?.id;
      if (productId) trackAddToCart(productId);
    });

    navigate('/checkout');
  };

  const handleRemoveItem = (id) => {
    if (removeFromCart) {
      removeFromCart(id);
    }
  };

  const handleUpdateQuantity = (id, quantity) => {
    if (updateQuantity) {
      updateQuantity(id, quantity);
    }
  };

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '40px 20px', 
      background: '#f5f5f5', 
      minHeight: '100vh' 
    }}>
      <h1 style={{ 
        fontSize: '28px', 
        fontWeight: '700', 
        color: '#1a1a2e', 
        marginBottom: '2rem' 
      }}>
        Shopping Cart ({cartItems.length} items)
      </h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
        {/* Cart Items */}
        <div>
          {cartItems.map((item) => {
            const imageUrl = getImageUrl(item);
            const productId = item?._id || item?.id || item?.productId;
            
            return (
              <div 
                key={productId || Math.random()} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  color: '#1a1a2e',
                  background: '#fff',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '1rem',
                  border: '1px solid #e8e8e8',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Product Image */}
                <div style={{
                  width: '100px',
                  height: '100px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0,
                  border: '1px solid #e8e8e8',
                  position: 'relative'
                }}>
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt={item?.name || 'Product'} 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover' 
                      }}
                      onError={(e) => {
                        console.error('Image failed to load:', imageUrl);
                        e.target.style.display = 'none';
                        // Show fallback
                        const parent = e.target.parentElement;
                        const fallback = document.createElement('span');
                        fallback.textContent = '📦';
                        fallback.style.fontSize = '40px';
                        fallback.style.display = 'flex';
                        fallback.style.alignItems = 'center';
                        fallback.style.justifyContent = 'center';
                        fallback.style.width = '100%';
                        fallback.style.height = '100%';
                        // Remove any existing fallback
                        const oldFallback = parent.querySelector('.fallback-emoji');
                        if (oldFallback) oldFallback.remove();
                        fallback.className = 'fallback-emoji';
                        parent.appendChild(fallback);
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: '40px' }}>📦</span>
                  )}
                </div>
                
                {/* Product Info */}
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 5px 0', color: '#1a1a2e', fontSize: '16px' }}>
                    {item?.name || 'Unnamed Product'}
                  </h3>
                  <p style={{ 
                    color: '#999', 
                    fontSize: '12px', 
                    margin: '0 0 5px 0', 
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {item?.category || 'Uncategorized'}
                  </p>
                  <p style={{ 
                    color: '#667eea', 
                    fontWeight: 'bold', 
                    margin: 0, 
                    fontSize: '18px' 
                  }}>
                    Rs {(item?.price || 0).toFixed(0)}
                  </p>
                </div>
                
                {/* Quantity Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}>
                    <button 
                      onClick={() => handleUpdateQuantity(productId, (item?.quantity || 1) - 1)}
                      disabled={item?.quantity <= 1}
                      style={{
                        width: '32px',
                        height: '32px',
                        background: '#f8f9fa',
                        border: 'none',
                        cursor: item?.quantity <= 1 ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        transition: 'all 0.2s',
                        color: '#1a1a2e',
                        opacity: item?.quantity <= 1 ? 0.4 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!e.target.disabled) {
                          e.target.style.background = '#667eea';
                          e.target.style.color = '#fff';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = '#f8f9fa';
                        e.target.style.color = '#1a1a2e';
                      }}
                    >
                      −
                    </button>
                    <span style={{ 
                      minWidth: '40px', 
                      textAlign: 'center', 
                      fontWeight: '600',
                      fontSize: '14px'
                    }}>
                      {item?.quantity || 1}
                    </span>
                    <button 
                      onClick={() => handleUpdateQuantity(productId, (item?.quantity || 1) + 1)}
                      disabled={item?.quantity >= item?.stock}
                      style={{
                        width: '32px',
                        height: '32px',
                        background: '#f8f9fa',
                        border: 'none',
                        cursor: item?.quantity >= item?.stock ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        transition: 'all 0.2s',
                        color: '#1a1a2e',
                        opacity: item?.quantity >= item?.stock ? 0.4 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!e.target.disabled) {
                          e.target.style.background = '#667eea';
                          e.target.style.color = '#fff';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = '#f8f9fa';
                        e.target.style.color = '#1a1a2e';
                      }}
                    >
                      +
                    </button>
                  </div>
                  <button 
                    onClick={() => handleRemoveItem(productId)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#f56565',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      padding: '4px 8px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.color = '#dc2626';
                      e.target.style.textDecoration = 'underline';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = '#f56565';
                      e.target.style.textDecoration = 'none';
                    }}
                  >
                    Remove
                  </button>
                </div>
                
                {/* Item Total */}
                <div style={{ 
                  textAlign: 'right', 
                  minWidth: '200px',
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#1a1a2e',
                  
                }}>
                  Rs {((item?.price || 0) * (item?.quantity || 1)).toFixed(0)}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Order Summary */}
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid #e8e8e8',
          height: 'fit-content',
          position: 'sticky',
          top: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
        }}>
          <h3 style={{ 
            marginBottom: '1.5rem', 
            color: '#1a1a2e',
            fontSize: '18px',
            fontWeight: '700'
          }}>
            Order Summary
          </h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0', color: '#666' }}>
            <span>Subtotal</span>
            <span>Rs {subtotal.toFixed(0)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0', color: '#666' }}>
            <span>Shipping</span>
            <span>{shipping === 0 ? 'Free' : `Rs ${shipping.toFixed(0)}`}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0', color: '#666' }}>
            <span>Tax (est.)</span>
            <span>Rs {tax.toFixed(0)}</span>
          </div>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            margin: '15px 0', 
            paddingTop: '10px', 
            borderTop: '1px solid #ddd', 
            fontWeight: 'bold',
            fontSize: '20px',
            color: '#1a1a2e'
          }}>
            <span>Total</span>
            <span style={{ color: '#667eea' }}>Rs {total.toFixed(0)}</span>
          </div>
          
          <button 
            onClick={handleCheckout}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '16px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 15px rgba(102,126,234,0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            Proceed to Checkout
          </button>
          
          <Link to="/products">
            <button 
              style={{
                width: '100%',
                padding: '12px',
                marginTop: '10px',
                background: 'none',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                color: '#666',
                fontWeight: '500',
                fontSize: '14px'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.color = '#667eea';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = '#ddd';
                e.target.style.color = '#666';
              }}
            >
              Continue Shopping
            </button>
          </Link>
          
          {subtotal < 100 && subtotal > 0 && (
            <p style={{ 
              fontSize: '12px', 
              color: '#48bb78', 
              textAlign: 'center', 
              marginTop: '15px' 
            }}>
              🎉 Add Rs {(100 - subtotal).toFixed(0)} more for free shipping!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartPage;