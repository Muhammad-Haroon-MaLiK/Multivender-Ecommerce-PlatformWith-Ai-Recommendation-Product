import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Wishlist.css";

const API_URL = 'https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api](https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api/api';

const Wishlist = ({ user }) => {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Get token from localStorage
  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchWishlist();
  }, [user]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await axios.get(`${API_URL}/wishlist`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setWishlist(response.data.wishlist || []);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      showMessage('error', 'Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      const token = getToken();
      const response = await axios.delete(`${API_URL}/wishlist/remove/${productId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Remove item from local state
        setWishlist(wishlist.filter(item => item.product._id !== productId));
        showMessage('success', 'Item removed from wishlist');
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      showMessage('error', 'Failed to remove item');
    }
  };

  const addToCart = async (productId) => {
    try {
      const token = getToken();
      const response = await axios.post(
        `${API_URL}/cart/add`,
        { productId, quantity: 1 },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        showMessage('success', 'Added to cart successfully!');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      showMessage('error', 'Failed to add to cart');
    }
  };

  if (loading) {
    return (
      <div className="wishlist-page">
        <div className="container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your wishlist...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <div className="container">
        <div className="wishlist-header">
          <h1>My Wishlist</h1>
          <p>{wishlist.length} items saved</p>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        {wishlist.length === 0 ? (
          <div className="empty-wishlist">
            <div className="empty-icon">❤️</div>
            <h3>Your wishlist is empty</h3>
            <p>Start adding items you love to your wishlist!</p>
            <Link to="/products" className="btn-primary">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="wishlist-grid">
            {wishlist.map((item) => (
              <div key={item._id} className="wishlist-card">
                <div className="wishlist-card-image">
                  {item.product?.images && item.product.images.length > 0 ? (
                    <img 
                      src={`${API_URL}${item.product.images[0]}`}
                      alt={item.product.name}
                      onError={(e) => {
                        e.target.src = '/placeholder-image.png';
                      }}
                    />
                  ) : (
                    <div className="placeholder-image">📦</div>
                  )}
                  <button 
                    className="remove-btn"
                    onClick={() => removeFromWishlist(item.product._id)}
                  >
                    ×
                  </button>
                </div>
                
                <div className="wishlist-card-body">
                  <Link to={`/products/${item.product._id}`}>
                    <h3 className="product-name">{item.product.name}</h3>
                  </Link>
                  <p className="product-description">{item.product.description?.slice(0, 60)}...</p>
                  <p className="product-price">${item.product.price?.toFixed(2)}</p>
                  <div className="product-meta">
                    <span className="product-stock">
                      {item.product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                    </span>
                    <span className="product-rating">
                      ★ {item.product.rating || 0}
                    </span>
                  </div>
                  <button 
                    className="add-to-cart-btn"
                    onClick={() => addToCart(item.product._id)}
                    disabled={item.product.stock === 0}
                  >
                    {item.product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;