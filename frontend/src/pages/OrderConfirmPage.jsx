// src/pages/OrderConfirmPage.jsx
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { trackPurchase } from '../services/recommendationService';

const OrderConfirmPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get order from location state
  const order = location.state?.order;

  const orderNumber = order?.orderNumber || `ORD-${Math.floor(Math.random() * 9000 + 1000)}`;

  // Calculate estimated delivery date (3-5 days from now)
  const today = new Date();
  const deliveryStart = new Date(today);
  deliveryStart.setDate(today.getDate() + 3);
  const deliveryEnd = new Date(today);
  deliveryEnd.setDate(today.getDate() + 5);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Track purchases for recommendation model
  useEffect(() => {
    if (order?.items?.length) {
      order.items.forEach((item) => {
        const productId = item.productId || item._id || item.id;
        if (productId) trackPurchase(productId);
      });
    }
  }, [order]);

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
        padding: '4rem 3rem',
        borderRadius: '12px',
        maxWidth: '550px',
        width: '100%',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        border: '1px solid #e8e8e8'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '1rem' }}>🎉</div>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#1a1a2e',
          marginBottom: '0.5rem'
        }}>
          Order Confirmed!
        </h1>
        <p style={{ color: '#666', marginBottom: '0.5rem', fontSize: '16px' }}>
          Thank you for your purchase. Your order <strong style={{ color: '#667eea' }}>#{orderNumber}</strong> has been placed successfully.
        </p>
        <p style={{ color: '#999', fontSize: '14px', marginBottom: '2rem' }}>
          You'll receive a confirmation email shortly. Estimated delivery: <strong>{formatDate(deliveryStart)} – {formatDate(deliveryEnd)}</strong>
        </p>

        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => navigate('/orders')}
            style={{
              padding: '12px 32px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
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
            📦 Track Order
          </button>

          <button
            onClick={() => navigate('/products')}
            style={{
              padding: '12px 32px',
              background: 'transparent',
              color: '#667eea',
              border: '2px solid #667eea',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#667eea';
              e.target.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = '#667eea';
            }}
          >
            🛒 Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmPage;