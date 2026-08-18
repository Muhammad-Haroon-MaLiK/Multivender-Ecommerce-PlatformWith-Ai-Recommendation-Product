// src/pages/CheckoutPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_URL = 'http://https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api](https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api/api';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user, isAuthenticated, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [showPaypalLogin, setShowPaypalLogin] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState('');
  const [paypalPassword, setPaypalPassword] = useState('');
  const [paypalError, setPaypalError] = useState('');
  const [orderError, setOrderError] = useState('');
  const [orderData, setOrderData] = useState(null);

  // Shipping form state
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: ''
  });

  // Card payment state
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: ''
  });

  const subtotal = getCartTotal();
  const shipping = subtotal > 100 ? 0 : 8.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  // Check if cart is empty
  useEffect(() => {
    if (!cartItems || cartItems.length === 0) {
      navigate('/products');
    }
  }, [cartItems, navigate]);

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.name || prev.fullName,
        email: user.email || prev.email
      }));
    }
  }, [user]);

  // OTP Timer
  useEffect(() => {
    let timer;
    if (showOtpVerification && otpTimer > 0) {
      timer = setTimeout(() => {
        setOtpTimer(otpTimer - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [showOtpVerification, otpTimer]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCardChange = (e) => {
    setCardDetails({
      ...cardDetails,
      [e.target.name]: e.target.value
    });
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    setCardDetails({ ...cardDetails, cardNumber: formatted });
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + (v.length > 2 ? '/' + v.substring(2, 4) : '');
    }
    return v;
  };

  const handleExpiryChange = (e) => {
    const formatted = formatExpiry(e.target.value);
    setCardDetails({ ...cardDetails, expiry: formatted });
  };

  const generateOTP = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    console.log('📱 Your OTP is:', otp);
    return otp;
  };

  const handleSendOTP = () => {
    setOtpError('');
    setOtpTimer(60);
    setCanResend(false);
    const otp = generateOTP();
    setShowOtpVerification(true);
    alert(`📱 Verification code sent to your registered mobile: ${otp}`);
  };

  const handleVerifyOTP = () => {
    if (!otpCode || otpCode.length !== 6) {
      setOtpError('Please enter a valid 6-digit verification code');
      return;
    }

    if (otpCode === generatedOtp) {
      setOtpError('');
      saveOrder();
    } else {
      setOtpError('Invalid verification code. Please try again.');
      setOtpCode('');
    }
  };

  const handleResendOTP = () => {
    if (canResend) {
      setOtpTimer(60);
      setCanResend(false);
      const otp = generateOTP();
      alert(`📱 New verification code sent: ${otp}`);
    }
  };

  // PayPal Login Handler
  const handlePaypalLogin = () => {
    setPaypalError('');
    
    if (!paypalEmail || !paypalEmail.includes('@')) {
      setPaypalError('Please enter a valid PayPal email');
      return;
    }
    
    if (!paypalPassword || paypalPassword.length < 6) {
      setPaypalError('Please enter your PayPal password');
      return;
    }

    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      saveOrder();
    }, 2000);
  };

  // SAVE ORDER - Complete Fix with Better Validation
  const saveOrder = async () => {
    setLoading(true);
    setOrderError('');

    try {
      // Get token from multiple sources
      const authToken = token || localStorage.getItem('token');
      
      // Check if user is logged in
      if (!authToken) {
        setOrderError('Please login to place an order');
        setLoading(false);
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      // Get user from auth context or localStorage
      const currentUser = user || JSON.parse(localStorage.getItem('user') || '{}');
      const userId = currentUser?._id || currentUser?.id || currentUser?.userId;

      if (!userId) {
        setOrderError('User not found. Please login again.');
        setLoading(false);
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      if (!cartItems || cartItems.length === 0) {
        setOrderError('Your cart is empty');
        setLoading(false);
        return;
      }

      console.log('🔍 === DEBUG START ===');
      console.log('👤 User ID:', userId);
      console.log('🔑 Token exists:', !!authToken);
      console.log('📦 Cart Items:', JSON.stringify(cartItems, null, 2));

      // ✅ Prepare order items - WITH BETTER VALIDATION
      const orderItems = [];
      let hasInvalidItem = false;
      let invalidItemNames = [];

      for (const item of cartItems) {
        // Get product ID from multiple sources
        const productId = item._id || item.id || item.productId || null;
        
        // Get vendor ID from multiple sources
        const vendorId = item.vendorId || 
                         item.vendor?._id || 
                         item.vendor?.id || 
                         null;

        // Skip invalid items
        if (!productId) {
          console.error('❌ Item has no product ID:', item);
          hasInvalidItem = true;
          invalidItemNames.push(item.name || 'Unknown');
          continue;
        }

        if (!vendorId) {
          console.error('❌ Item has no vendor ID:', item);
          hasInvalidItem = true;
          invalidItemNames.push(item.name || 'Unknown');
          continue;
        }

        orderItems.push({
          productId: productId,
          vendorId: vendorId,
          name: item.name || 'Unnamed Product',
          price: parseFloat(item.price) || 0,
          quantity: parseInt(item.quantity) || 1,
          image: item.image || null,
          vendorEarnings: 0,
          adminCommission: 0
        });
      }

      // If there were invalid items, show specific message
      if (hasInvalidItem) {
        setOrderError(`Some items are missing vendor information: ${invalidItemNames.join(', ')}. Please remove and re-add them to cart.`);
        setLoading(false);
        return;
      }

      if (orderItems.length === 0) {
        setOrderError('No valid items in order. Please add products to cart.');
        setLoading(false);
        return;
      }

      console.log('📦 Processed order items:', JSON.stringify(orderItems, null, 2));

      // Calculate totals
      const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const shipping = subtotal > 100 ? 0 : 8.99;
      const tax = subtotal * 0.08;
      const total = subtotal + shipping + tax;

      // Generate order number
      const now = new Date();
      const orderNumber = `ORD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

      // Create order data
      const orderDataToSend = {
        orderNumber: orderNumber,
        user: userId,
        items: orderItems,
        shippingAddress: {
          fullName: formData.fullName,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          state: formData.state || '',
          zipCode: formData.zipCode || '',
          phone: formData.phone
        },
        paymentMethod: paymentMethod,
        subtotal: subtotal,
        shipping: shipping,
        tax: tax,
        total: total,
        status: 'pending'
      };

      console.log('📦 FINAL ORDER DATA:', JSON.stringify(orderDataToSend, null, 2));

      // Send to server
      const response = await axios.post(`${API_URL}/orders`, orderDataToSend, {
        headers: { 
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Order response:', response.data);

      if (response.data.success) {
        setOrderData(response.data.order || orderDataToSend);
        setOrderPlaced(true);
        clearCart();
        setShowOtpVerification(false);
        setShowPaypalLogin(false);
        
        setTimeout(() => {
          navigate('/order-confirm', { state: { order: response.data.order || orderDataToSend } });
        }, 2000);
      } else {
        setOrderError(response.data.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('❌ Error saving order:', error);
      console.error('❌ Error response:', error.response?.data);
      
      if (error.response?.status === 401) {
        setOrderError('Your session has expired. Please login again.');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 400) {
        const errorMsg = error.response?.data?.message || 'Invalid order data. Please check your cart.';
        setOrderError(errorMsg);
      } else {
        let errorMessage = 'Failed to place order. ';
        if (error.response?.data?.message) {
          errorMessage += error.response.data.message;
        } else if (error.message) {
          errorMessage += error.message;
        }
        setOrderError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.fullName || !formData.email || !formData.address || !formData.city || !formData.phone) {
      alert('Please fill in all required shipping fields');
      return false;
    }

    if (!formData.email.includes('@')) {
      alert('Please enter a valid email address');
      return false;
    }

    if (paymentMethod === 'card') {
      if (!cardDetails.cardNumber || cardDetails.cardNumber.replace(/\s/g, '').length < 16) {
        alert('Please enter a valid card number');
        return false;
      }
      if (!cardDetails.cardName) {
        alert('Please enter card holder name');
        return false;
      }
      if (!cardDetails.expiry || cardDetails.expiry.length < 5) {
        alert('Please enter valid expiry date (MM/YY)');
        return false;
      }
      if (!cardDetails.cvv || cardDetails.cvv.length < 3) {
        alert('Please enter valid CVV');
        return false;
      }
    }

    if (paymentMethod === 'paypal') {
      if (!paypalEmail || !paypalEmail.includes('@')) {
        alert('Please enter a valid PayPal email');
        return false;
      }
    }

    return true;
  };

  const handlePlaceOrder = () => {
    if (!validateForm()) return;
    
    // Check authentication before proceeding
    const authToken = token || localStorage.getItem('token');
    if (!authToken) {
      alert('Please login to place an order');
      navigate('/login');
      return;
    }
    
    if (paymentMethod === 'cod') {
      saveOrder();
      return;
    }
    
    if (paymentMethod === 'card') {
      handleSendOTP();
      return;
    }
    
    if (paymentMethod === 'paypal') {
      setShowPaypalLogin(true);
      return;
    }
  };

  // If cart is empty
  if (!cartItems || cartItems.length === 0) {
    return null;
  }

  // If order placed
  if (orderPlaced) {
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
          <div style={{ fontSize: '64px', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ color: '#1a1a2e', marginBottom: '0.5rem' }}>Order Placed!</h2>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>Your order has been placed successfully.</p>
          <div style={{ 
            background: '#f0f4ff', 
            padding: '1rem', 
            borderRadius: '8px',
            marginBottom: '1.5rem'
          }}>
            <p style={{ margin: 0, color: '#667eea' }}>
              Order #{orderData?.orderNumber || 'ORD-' + Math.floor(Math.random() * 10000)}
            </p>
            <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#666' }}>
              Payment: {paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod === 'card' ? 'Card' : 'PayPal'}
            </p>
          </div>
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
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            View Orders
          </button>
        </div>
      </div>
    );
  }

  // PayPal Login Modal
  if (showPaypalLogin) {
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
          background: '#fff',
          padding: '2.5rem',
          borderRadius: '12px',
          maxWidth: '450px',
          width: '100%',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          border: '1px solid #e8e8e8'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '56px', marginBottom: '0.5rem' }}>🅿️</div>
            <h2 style={{ color: '#1a1a2e' }}>PayPal Login</h2>
            <p style={{ color: '#666', fontSize: '14px' }}>
              Sign in to your PayPal account to complete payment
            </p>
          </div>

          {paypalError && (
            <div style={{
              background: '#fef0f0',
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '1rem',
              color: '#f56565',
              fontSize: '13px'
            }}>
              {paypalError}
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666', fontSize: '13px' }}>
              PayPal Email *
            </label>
            <input
              type="email"
              placeholder="your-email@paypal.com"
              value={paypalEmail}
              onChange={(e) => {
                setPaypalEmail(e.target.value);
                setPaypalError('');
              }}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666', fontSize: '13px' }}>
              Password *
            </label>
            <input
              type="password"
              placeholder="Enter your PayPal password"
              value={paypalPassword}
              onChange={(e) => {
                setPaypalPassword(e.target.value);
                setPaypalError('');
              }}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{
            background: '#fff8e1',
            padding: '10px 14px',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            fontSize: '13px',
            color: '#856404',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🔒 You will be redirected to PayPal to complete your payment securely.
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', margin: '1rem 0' }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid #f0f0f0',
                borderTop: '3px solid #0070ba',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto'
              }} />
              <p style={{ color: '#666', marginTop: '10px' }}>Processing PayPal payment...</p>
            </div>
          ) : (
            <>
              <button
                onClick={handlePaypalLogin}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: '#0070ba',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Pay Rs{total.toFixed(0)} with PayPal
              </button>
              <button
                onClick={() => {
                  setShowPaypalLogin(false);
                  setPaypalEmail('');
                  setPaypalPassword('');
                  setPaypalError('');
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginTop: '10px',
                  background: 'none',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: '#666',
                  fontWeight: '500'
                }}
              >
                ← Back to Checkout
              </button>
            </>
          )}
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // OTP Verification Modal
  if (showOtpVerification) {
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
          background: '#fff',
          padding: '2.5rem',
          borderRadius: '12px',
          maxWidth: '450px',
          width: '100%',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          border: '1px solid #e8e8e8'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '48px', marginBottom: '0.5rem' }}>🔐</div>
            <h2 style={{ color: '#1a1a2e' }}>Card Verification</h2>
            <p style={{ color: '#666', fontSize: '14px' }}>
              Enter the 6-digit code sent to your registered mobile
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666', fontSize: '13px' }}>
              Verification Code *
            </label>
            <input
              type="text"
              placeholder="000000"
              value={otpCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                if (value.length <= 6) {
                  setOtpCode(value);
                  setOtpError('');
                }
              }}
              maxLength="6"
              style={{
                width: '100%',
                padding: '14px',
                border: `2px solid ${otpError ? '#f56565' : '#ddd'}`,
                borderRadius: '8px',
                fontSize: '24px',
                textAlign: 'center',
                letterSpacing: '8px',
                fontWeight: '600',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              autoFocus
            />
            {otpError && (
              <p style={{ color: '#f56565', fontSize: '13px', marginTop: '8px' }}>
                {otpError}
              </p>
            )}
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <span style={{ color: '#666', fontSize: '13px' }}>
              {canResend ? (
                <button
                  onClick={handleResendOTP}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#667eea',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '13px'
                  }}
                >
                  Resend Code
                </button>
              ) : (
                `Resend code in ${otpTimer}s`
              )}
            </span>
            <span style={{ color: '#666', fontSize: '13px' }}>
              💳 Card Payment
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', margin: '1rem 0' }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid #f0f0f0',
                borderTop: '3px solid #667eea',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto'
              }} />
              <p style={{ color: '#666', marginTop: '10px' }}>Verifying and processing...</p>
            </div>
          ) : (
            <>
              <button
                onClick={handleVerifyOTP}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Verify & Pay Rs{total.toFixed(0)}
              </button>
              <button
                onClick={() => {
                  setShowOtpVerification(false);
                  setOtpCode('');
                  setOtpError('');
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginTop: '10px',
                  background: 'none',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: '#666',
                  fontWeight: '500'
                }}
              >
                ← Back
              </button>
            </>
          )}
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Main Checkout Form
  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '40px 20px',
      background: '#f5f5f5',
      minHeight: '100vh'
    }}>
      {orderError && (
        <div style={{
          background: '#fef0f0',
          border: '1px solid #f56565',
          color: '#f56565',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '1.5rem'
        }}>
          {orderError}
        </div>
      )}

      <h1 style={{
        fontSize: '28px',
        fontWeight: '700',
        color: '#1a1a2e',
        marginBottom: '2rem'
      }}>
        Checkout
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem' }}>
        {/* Left Column - Forms */}
        <div>
          {/* Shipping Information */}
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            border: '1px solid #e8e8e8'
          }}>
            <h3 style={{ marginBottom: '1.5rem', color: '#1a1a2e' }}>
              Shipping Information
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666', fontSize: '14px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666', fontSize: '14px' }}>
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666', fontSize: '14px' }}>
                Address *
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="123 Main Street"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666', fontSize: '14px' }}>
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="City"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666', fontSize: '14px' }}>
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="State"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666', fontSize: '14px' }}>
                  ZIP Code
                </label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  placeholder="12345"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666', fontSize: '14px' }}>
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+1 555-0123"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          {/* Payment Method */}
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '1px solid #e8e8e8'
          }}>
            <h3 style={{ marginBottom: '1.5rem', color: '#1a1a2e' }}>
              Payment Method
            </h3>

            {/* Cash on Delivery */}
            <div style={{
              marginBottom: '1rem',
              border: paymentMethod === 'cod' ? '2px solid #667eea' : '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '1rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: paymentMethod === 'cod' ? '#f8f9ff' : '#fff'
            }}
            onClick={() => setPaymentMethod('cod')}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  style={{ width: '18px', height: '18px', accentColor: '#667eea' }}
                />
                <div>
                  <div style={{ fontWeight: '600', color: '#1a1a2e' }}>💰 Cash on Delivery</div>
                  <div style={{ fontSize: '13px', color: '#666' }}>Pay when you receive your order</div>
                </div>
              </label>
              {paymentMethod === 'cod' && (
                <div style={{
                  marginTop: '10px',
                  padding: '10px 14px',
                  background: '#f0faf0',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#2e7d32'
                }}>
                  ✓ No additional fees. Pay in cash when your order arrives.
                </div>
              )}
            </div>

            {/* Credit/Debit Card */}
            <div style={{
              marginBottom: '1rem',
              border: paymentMethod === 'card' ? '2px solid #667eea' : '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '1rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: paymentMethod === 'card' ? '#f8f9ff' : '#fff'
            }}
            onClick={() => setPaymentMethod('card')}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                  style={{ width: '18px', height: '18px', accentColor: '#667eea' }}
                />
                <div>
                  <div style={{ fontWeight: '600', color: '#1a1a2e' }}>💳 Credit / Debit Card</div>
                  <div style={{ fontSize: '13px', color: '#666' }}>Pay with your card securely</div>
                </div>
              </label>
              {paymentMethod === 'card' && (
                <div style={{ marginTop: '15px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#666' }}>
                      Card Number *
                    </label>
                    <input
                      type="text"
                      name="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={cardDetails.cardNumber}
                      onChange={handleCardNumberChange}
                      maxLength="19"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#666' }}>
                      Card Holder Name *
                    </label>
                    <input
                      type="text"
                      name="cardName"
                      placeholder="Name on card"
                      value={cardDetails.cardName}
                      onChange={handleCardChange}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#666' }}>
                        Expiry Date *
                      </label>
                      <input
                        type="text"
                        name="expiry"
                        placeholder="MM/YY"
                        value={cardDetails.expiry}
                        onChange={handleExpiryChange}
                        maxLength="5"
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#666' }}>
                        CVV *
                      </label>
                      <input
                        type="password"
                        name="cvv"
                        placeholder="123"
                        value={cardDetails.cvv}
                        onChange={handleCardChange}
                        maxLength="4"
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#48bb78', 
                    marginTop: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    🔒 Your payment is secure and encrypted
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#667eea', 
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    📱 A verification code will be sent to your phone
                  </div>
                </div>
              )}
            </div>

            {/* PayPal */}
            <div style={{
              border: paymentMethod === 'paypal' ? '2px solid #667eea' : '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '1rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: paymentMethod === 'paypal' ? '#f8f9ff' : '#fff'
            }}
            onClick={() => setPaymentMethod('paypal')}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="paypal"
                  checked={paymentMethod === 'paypal'}
                  onChange={() => setPaymentMethod('paypal')}
                  style={{ width: '18px', height: '18px', accentColor: '#667eea' }}
                />
                <div>
                  <div style={{ fontWeight: '600', color: '#1a1a2e' }}>🅿️ PayPal</div>
                  <div style={{ fontSize: '13px', color: '#666' }}>Pay with your PayPal account</div>
                </div>
              </label>
              {paymentMethod === 'paypal' && (
                <div style={{ marginTop: '15px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#666' }}>
                      PayPal Email *
                    </label>
                    <input
                      type="email"
                      placeholder="your-email@paypal.com"
                      value={paypalEmail}
                      onChange={(e) => setPaypalEmail(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#666', 
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    🔒 You will be redirected to PayPal to complete your payment securely.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Order Summary */}
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid #e8e8e8',
          height: 'fit-content',
          position: 'sticky',
          top: '2rem'
        }}>
          <h3 style={{ marginBottom: '1.5rem', color: '#1a1a2e' }}>Order Summary</h3>

          {cartItems.map((item) => (
            <div key={item._id || item.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: '1px solid #f0f0f0',
              fontSize: '14px',
              color: '#333'
            }}>
              <span>{item.name} × {item.quantity}</span>
              <span>Rs{((item.price || 0) * (item.quantity || 1)).toFixed(0)}</span>
            </div>
          ))}

          <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #e8e8e8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#666' }}>
              <span>Subtotal</span>
              <span>Rs{subtotal.toFixed(0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#666' }}>
              <span>Shipping</span>
              <span>{shipping === 0 ? 'Free' : `Rs${shipping.toFixed(0)}`}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#666' }}>
              <span>Tax (est.)</span>
              <span>Rs{tax.toFixed(0)}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px 0',
              marginTop: '10px',
              borderTop: '2px solid #e8e8e8',
              fontWeight: 'bold',
              fontSize: '18px',
              color: '#1a1a2e'
            }}>
              <span>Total</span>
              <span style={{ color: '#667eea' }}>Rs{total.toFixed(0)}</span>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              marginTop: '20px',
              background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea, #764ba2)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {loading ? 'Processing...' : 
             paymentMethod === 'cod' ? 'Place Order' : 
             paymentMethod === 'card' ? 'Proceed to Verify' : 
             'Proceed to PayPal'}
          </button>

          <button
            onClick={() => navigate('/cart')}
            style={{
              width: '100%',
              padding: '12px',
              marginTop: '10px',
              background: 'none',
              border: '1px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer',
              color: '#666',
              fontWeight: '500'
            }}
          >
            ← Back to Cart
          </button>

          {subtotal < 100 && subtotal > 0 && (
            <p style={{
              fontSize: '12px',
              color: '#48bb78',
              textAlign: 'center',
              marginTop: '15px'
            }}>
              🎉 Add Rs{(100 - subtotal).toFixed(0)} more for free shipping!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;