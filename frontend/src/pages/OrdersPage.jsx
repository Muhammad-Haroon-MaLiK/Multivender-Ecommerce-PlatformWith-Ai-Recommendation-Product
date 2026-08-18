import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './OrdersPage.css';

const API_URL = 'http://https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api](https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api/api';

const OrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to view your orders');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('📦 Orders response:', response.data);
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Cancel Order Function
  const cancelOrder = async (orderId) => {
    // Confirm cancellation
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/orders/${orderId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Update the order status in the local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === orderId 
              ? { ...order, status: 'cancelled' } 
              : order
          )
        );
        setToast('✅ Order cancelled successfully!');
      } else {
        setToast('❌ ' + (response.data.message || 'Failed to cancel order'));
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      setToast('❌ ' + (err.response?.data?.message || 'Failed to cancel order'));
    }

    // Clear toast after 3 seconds
    setTimeout(() => setToast(''), 3000);
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'delivered': return { bg: '#48bb78', text: 'Delivered', icon: '✅' };
      case 'shipped': return { bg: '#4299e1', text: 'Shipped', icon: '🚚' };
      case 'processing': return { bg: '#ed8936', text: 'Processing', icon: '⚙️' };
      case 'confirmed': return { bg: '#38a169', text: 'Confirmed', icon: '✓' };
      case 'cancelled': return { bg: '#f56565', text: 'Cancelled', icon: '❌' };
      default: return { bg: '#a0aec0', text: 'Pending', icon: '⏳' };
    }
  };

  // ✅ Check if order can be cancelled
  const canCancelOrder = (status) => {
    const cancellableStatuses = ['pending', 'confirmed', 'processing'];
    return cancellableStatuses.includes(status?.toLowerCase());
  };

  const handleViewOrder = (orderId) => {
    navigate(`/orders/${orderId}`);
  };

  // If no token (user not logged in)
  if (!localStorage.getItem('token')) {
    return (
      <div className="orders-page">
        <div className="orders-container">
          <div className="empty-orders">
            <div className="empty-icon">🔒</div>
            <h2>Please Login</h2>
            <p>You need to be logged in to view your orders.</p>
            <button className="shop-now-btn" onClick={() => navigate('/login')}>
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="orders-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-page">
        <div className="orders-container">
          <div className="orders-error">
            <div className="empty-icon">⚠️</div>
            <h2 style={{ color: '#f56565' }}>Error</h2>
            <p>{error}</p>
            <button className="retry-btn" onClick={fetchOrders}>Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="orders-page">
        <div className="orders-container">
          <div className="empty-orders">
            <div className="empty-icon">📦</div>
            <h2>No Orders Yet</h2>
            <p>You haven't placed any orders yet. Start shopping to place your first order!</p>
            <button className="shop-now-btn" onClick={() => navigate('/products')}>
              Start Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      {toast && <div className="orders-toast">{toast}</div>}

      <div className="orders-container">
        <div className="orders-header">
          <h1>My Orders</h1>
          <p className="orders-subtitle">
            {orders.length} order{orders.length > 1 ? 's' : ''} placed
          </p>
        </div>
        
        <div className="orders-list">
          {orders.map(order => {
            const statusInfo = getStatusColor(order.status);
            const totalItems = order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
            const canCancel = canCancelOrder(order.status);
            
            return (
              <div key={order._id} className="order-card">
                <div className="order-card-header">
                  <div className="order-info">
                    <span className="order-id">
                      {order.orderNumber || `#${order._id.slice(-6).toUpperCase()}`}
                    </span>
                    <span className="order-date">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="order-status">
                    <span 
                      className="status-badge" 
                      style={{ backgroundColor: statusInfo.bg }}
                    >
                      {statusInfo.icon} {statusInfo.text}
                    </span>
                  </div>
                </div>

                <div className="order-card-body">
                  <div className="order-items-summary">
                    <span className="items-count">
                      {totalItems} item{totalItems > 1 ? 's' : ''}
                    </span>
                    <span className="order-total">
                      Total: Rs{order.total?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  
                  {order.items && order.items.length > 0 && (
                    <div className="order-items-preview">
                      {order.items.slice(0, 3).map((item, index) => (
                        <span key={index} className="item-preview">
                          {item.name || item.productName || 'Product'}
                          {index < Math.min(order.items.length - 1, 2) && ', '}
                        </span>
                      ))}
                      {order.items.length > 3 && (
                        <span className="more-items">
                          +{order.items.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="order-card-footer">
                  <button 
                    className="view-details-btn"
                    onClick={() => handleViewOrder(order._id)}
                  >
                    View Details →
                  </button>
                  
                  {/* ✅ Cancel Order Button */}
                  {canCancel && (
                    <button 
                      className="cancel-order-btn"
                      onClick={() => cancelOrder(order._id)}
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;