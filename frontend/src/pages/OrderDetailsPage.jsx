import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api](https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api/api';

const OrderDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to view order details');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('📦 Order details:', response.data);
      setOrder(response.data.order || response.data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError(error.response?.data?.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
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

  const getPaymentMethodIcon = (method) => {
    switch(method?.toLowerCase()) {
      case 'card': return '💳';
      case 'paypal': return '🅿️';
      case 'cod': return '💰';
      default: return '💳';
    }
  };

  const getPaymentMethodLabel = (method) => {
    switch(method?.toLowerCase()) {
      case 'card': return 'Credit / Debit Card';
      case 'paypal': return 'PayPal';
      case 'cod': return 'Cash on Delivery';
      default: return method || 'Not specified';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ 
        maxWidth: '900px', 
        margin: '0 auto', 
        padding: '60px 20px', 
        textAlign: 'center' 
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #f0f0f0',
          borderTop: '3px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }} />
        <p style={{ color: '#666' }}>Loading order details...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        maxWidth: '900px', 
        margin: '0 auto', 
        padding: '60px 20px', 
        textAlign: 'center' 
      }}>
        <div style={{ fontSize: '48px', marginBottom: '1rem' }}>⚠️</div>
        <h2 style={{ color: '#f56565', marginBottom: '0.5rem' }}>Error</h2>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>{error}</p>
        <button
          onClick={() => navigate('/orders')}
          style={{
            padding: '12px 32px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Back to Orders
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ 
        maxWidth: '900px', 
        margin: '0 auto', 
        padding: '60px 20px', 
        textAlign: 'center' 
      }}>
        <div style={{ fontSize: '48px', marginBottom: '1rem' }}>📦</div>
        <h2 style={{ color: '#1a1a2e', marginBottom: '0.5rem' }}>Order Not Found</h2>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>The order you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/orders')}
          style={{
            padding: '12px 32px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Back to Orders
        </button>
      </div>
    );
  }

  const statusInfo = getStatusColor(order.status);
  const orderNumber = order.orderNumber || `ORD-${order._id?.slice(-6) || '000000'}`;

  return (
    <div style={{ 
      maxWidth: '900px', 
      margin: '0 auto', 
      padding: '40px 20px',
      background: '#f5f5f5',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <button
          onClick={() => navigate('/orders')}
          style={{
            background: 'none',
            border: 'none',
            color: '#667eea',
            cursor: 'pointer',
            fontSize: '14px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          ← Back to Orders
        </button>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '15px',
          background: '#fff',
          padding: '20px 24px',
          borderRadius: '12px',
          border: '1px solid #e8e8e8'
        }}>
          <div>
            <h1 style={{ margin: 0, color: '#1a1a2e', fontSize: '24px' }}>
              Order Details
            </h1>
            <p style={{ color: '#666', marginTop: '5px', fontSize: '14px' }}>
              Order #{orderNumber}
            </p>
          </div>
          <div style={{
            background: statusInfo.bg,
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            <span>{statusInfo.icon}</span>
            <span>{statusInfo.text}</span>
          </div>
        </div>
      </div>

      {/* Order Info Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <div style={{ 
          background: '#fff', 
          borderRadius: '12px', 
          padding: '16px 20px',
          border: '1px solid #e8e8e8'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>📅</div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#999', textTransform: 'uppercase' }}>
            Order Date
          </h4>
          <p style={{ margin: 0, fontWeight: '600', color: '#1a1a2e' }}>
            {new Date(order.createdAt).toLocaleDateString()}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#999' }}>
            {new Date(order.createdAt).toLocaleTimeString()}
          </p>
        </div>

        <div style={{ 
          background: '#fff', 
          borderRadius: '12px', 
          padding: '16px 20px',
          border: '1px solid #e8e8e8'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>{getPaymentMethodIcon(order.paymentMethod)}</div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#999', textTransform: 'uppercase' }}>
            Payment Method
          </h4>
          <p style={{ margin: 0, fontWeight: '600', color: '#1a1a2e' }}>
            {getPaymentMethodLabel(order.paymentMethod)}
          </p>
        </div>

        <div style={{ 
          background: '#fff', 
          borderRadius: '12px', 
          padding: '16px 20px',
          border: '1px solid #e8e8e8'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>📦</div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#999', textTransform: 'uppercase' }}>
            Items
          </h4>
          <p style={{ margin: 0, fontWeight: '600', color: '#1a1a2e' }}>
            {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
          </p>
        </div>

        <div style={{ 
          background: '#fff', 
          borderRadius: '12px', 
          padding: '16px 20px',
          border: '1px solid #e8e8e8'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>💰</div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#999', textTransform: 'uppercase' }}>
            Total Amount
          </h4>
          <p style={{ margin: 0, fontWeight: '700', color: '#667eea', fontSize: '18px' }}>
            Rs{order.total?.toFixed(2) || '0.00'}
          </p>
        </div>
      </div>

      /* Shipping Information */
      <div style={{ 
        background: '#fff', 
        borderRadius: '12px', 
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid #e8e8e8'
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#1a1a2e', fontSize: '18px' }}>
          📍 Shipping Information
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>Full Name</p>
            <p style={{ margin: '4px 0 0', fontWeight: '500', color: '#1a1a2e' }}>
              {order.shippingAddress?.fullName || 'N/A'}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>Email</p>
            <p style={{ margin: '4px 0 0', fontWeight: '500', color: '#1a1a2e' }}>
              {order.shippingAddress?.email || 'N/A'}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>Phone</p>
            <p style={{ margin: '4px 0 0', fontWeight: '500', color: '#1a1a2e' }}>
              {order.shippingAddress?.phone || 'N/A'}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>Address</p>
            <p style={{ margin: '4px 0 0', fontWeight: '500', color: '#1a1a2e' }}>
              {order.shippingAddress?.address && order.shippingAddress?.city ? (
                <>
                  {order.shippingAddress.address}
                  <br />
                  {order.shippingAddress.city}
                  {order.shippingAddress.state && `, Rs${order.shippingAddress.state}`}
                  {order.shippingAddress.zipCode && ` Rs${order.shippingAddress.zipCode}`}
                </>
              ) : (
                'N/A'
              )}
            </p>
          </div>
        </div>
      </div>

      /* Order Items */
      <div style={{ 
        background: '#fff', 
        borderRadius: '12px', 
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid #e8e8e8'
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#1a1a2e', fontSize: '18px' }}>
          🛍️ Order Items
        </h3>
        
        {order.items && order.items.length > 0 ? (
          <div>
            {/* Table Header */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '2fr 1fr 1fr 1fr',
              padding: '10px 0',
              borderBottom: '2px solid #e8e8e8',
              fontWeight: '600',
              color: '#666',
              fontSize: '13px',
              textTransform: 'uppercase'
            }}>
              <span>Product</span>
              <span style={{ textAlign: 'center' }}>Price</span>
              <span style={{ textAlign: 'center' }}>Quantity</span>
              <span style={{ textAlign: 'right' }}>Total</span>
            </div>

            /* Items */
            {order.items.map((item, index) => (
              <div 
                key={item._id || item.productId || index}
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '2fr 1fr 1fr 1fr',
                  padding: '12px 0',
                  borderBottom: index < order.items.length - 1 ? '1px solid #f0f0f0' : 'none',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    flexShrink: 0
                  }}>
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} 
                      />
                    ) : (
                      '📦'
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: '500', color: '#1a1a2e' }}>{item.name}</div>
                    {item.category && (
                      <div style={{ fontSize: '12px', color: '#999' }}>{item.category}</div>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'center', color: '#666' }}>
                  Rs{item.price?.toFixed(2) || '0.00'}
                </div>
                <div style={{ textAlign: 'center', color: '#666' }}>
                  {item.quantity || 1}
                </div>
                <div style={{ textAlign: 'right', fontWeight: '600', color: '#1a1a2e' }}>
                  Rs{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
            No items found in this order
          </div>
        )}
      </div>

      /* Order Summary */
      <div style={{ 
        background: '#fff', 
        borderRadius: '12px', 
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid #e8e8e8'
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#1a1a2e', fontSize: '18px' }}>
          💳 Payment Summary
        </h3>
        <div style={{ maxWidth: '350px', marginLeft: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#666' }}>
            <span>Subtotal</span>
            <span>Rs{order.subtotal?.toFixed(2) || '0.00'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#666' }}>
            <span>Shipping</span>
            <span>{order.shipping === 0 ? 'Free' : `Rs${order.shipping?.toFixed(2) || '0.00'}`}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#666' }}>
            <span>Tax</span>
            <span>Rs{order.tax?.toFixed(2) || '0.00'}</span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            padding: '12px 0',
            marginTop: '8px',
            borderTop: '2px solid #e8e8e8',
            fontWeight: '700',
            fontSize: '18px',
            color: '#1a1a2e'
          }}>
            <span>Total</span>
            <span style={{ color: '#667eea' }}>Rs{order.total?.toFixed(2) || '0.00'}</span>
          </div>
        </div>
      </div>

      /* Action Buttons */
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <button
          onClick={handlePrint}
          style={{
            padding: '12px 28px',
            background: '#4a5568',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '500',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          🖨️ Print Order
        </button>
        
        <button
          onClick={() => navigate('/orders')}
          style={{
            padding: '12px 28px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '500',
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
          ← Back to Orders
        </button>
      </div>
    </div>
  );
};

export default OrderDetailsPage;