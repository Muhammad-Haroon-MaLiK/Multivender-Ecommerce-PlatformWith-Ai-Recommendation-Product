import React, { useState, useEffect } from 'react';

const PaymentProcessingPage = ({ setPage, orderData, paymentMethod, onPaymentComplete }) => {
  const [status, setStatus] = useState('processing');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [paypalPassword, setPaypalPassword] = useState('');
  const [paypalLoggedIn, setPaypalLoggedIn] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [userOtp, setUserOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: ''
  });

  useEffect(() => {
    if (paymentMethod === 'cod') {
      processCODOrder();
    } else if (paymentMethod === 'paypal') {
      setMessage('Redirecting to PayPal...');
      setTimeout(() => setStatus('paypal_login'), 1500);
    } else {
      setMessage('Initializing secure payment gateway...');
      setTimeout(() => setStatus('card_payment'), 1500);
    }
  }, []);

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  // Cash on Delivery Flow
  const processCODOrder = () => {
    setProgress(30);
    setMessage('Processing Cash on Delivery order...');
    
    setTimeout(() => {
      setProgress(70);
      setMessage('Order confirmed!');
      
      setTimeout(() => {
        setProgress(100);
        setMessage('Order placed successfully!');
        setStatus('success');
        
        setTimeout(() => {
          onPaymentComplete();
        }, 1500);
      }, 1500);
    }, 1500);
  };

  // Card Payment Flow
  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\s/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    const formatted = value.replace(/(\d{4})/g, '$1 ').trim();
    setCardDetails({ ...cardDetails, cardNumber: formatted });
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\//g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }
    setCardDetails({ ...cardDetails, expiry: value });
  };

  const processCardPayment = () => {
    if (!cardDetails.cardNumber || cardDetails.cardNumber.replace(/\s/g, '').length < 16) {
      alert('Please enter valid card number');
      return;
    }
    if (!cardDetails.cardName) {
      alert('Please enter card holder name');
      return;
    }
    if (!cardDetails.expiry || cardDetails.expiry.length < 5) {
      alert('Please enter valid expiry date');
      return;
    }
    if (!cardDetails.cvv || cardDetails.cvv.length < 3) {
      alert('Please enter valid CVV');
      return;
    }

    setStatus('card_processing');
    setProgress(20);
    setMessage('Validating card details...');
    
    setTimeout(() => {
      setProgress(50);
      setMessage('Processing payment...');
      
      setTimeout(() => {
        setProgress(80);
        setMessage('Payment successful!');
        
        setTimeout(() => {
          setProgress(100);
          setMessage('Order confirmed!');
          setStatus('success');
          
          setTimeout(() => {
            onPaymentComplete();
          }, 1500);
        }, 1500);
      }, 2000);
    }, 1500);
  };

  // PayPal Login Flow
  const handlePayPalLogin = () => {
    if (!paypalEmail) {
      alert('Please enter your PayPal email');
      return;
    }
    if (!paypalPassword) {
      alert('Please enter your PayPal password');
      return;
    }
    
    setStatus('paypal_otp');
    setMessage('Verifying credentials...');
    
    setTimeout(() => {
      sendPayPalOTP();
    }, 1500);
  };

  const sendPayPalOTP = () => {
    setOtpSent(true);
    setResendTimer(60);
    const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setOtpCode(mockOtp);
    console.log(`[DEMO] PayPal OTP: ${mockOtp}`);
    alert(`[DEMO] PayPal verification code: ${mockOtp}`);
  };

  const verifyPayPalOTP = () => {
    if (!userOtp) {
      setOtpError('Please enter verification code');
      return;
    }
    
    if (userOtp === otpCode) {
      setStatus('paypal_processing');
      setProgress(30);
      setMessage('Logging into PayPal...');
      
      setTimeout(() => {
        setProgress(60);
        setMessage('Processing PayPal payment...');
        
        setTimeout(() => {
          setProgress(90);
          setMessage('Payment confirmed!');
          
          setTimeout(() => {
            setProgress(100);
            setMessage('Order placed successfully!');
            setStatus('success');
            
            setTimeout(() => {
              onPaymentComplete();
            }, 1500);
          }, 2000);
        }, 2000);
      }, 1500);
    } else {
      setOtpError('Invalid verification code. Please try again.');
    }
  };

  // Render Cash on Delivery
  if (paymentMethod === 'cod' && status !== 'success') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.icon}>💰</div>
          <h2 style={styles.title}>Cash on Delivery</h2>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${progress}%` }} />
          </div>
          <p style={styles.message}>{message}</p>
          <p style={styles.note}>Please do not close this window...</p>
        </div>
      </div>
    );
  }

  // Render Card Payment Form
  if (status === 'card_payment') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.icon}>💳</div>
          <h2 style={styles.title}>Credit / Debit Card Payment</h2>
          <p style={styles.subtitle}>Enter your card details to complete payment</p>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Card Number</label>
            <input
              type="text"
              placeholder="1234 5678 9012 3456"
              value={cardDetails.cardNumber}
              onChange={handleCardNumberChange}
              maxLength="19"
              style={styles.input}
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Card Holder Name</label>
            <input
              type="text"
              placeholder="Name on card"
              value={cardDetails.cardName}
              onChange={(e) => setCardDetails({ ...cardDetails, cardName: e.target.value })}
              style={styles.input}
            />
          </div>
          
          <div style={styles.row}>
            <div style={styles.halfGroup}>
              <label style={styles.label}>Expiry Date</label>
              <input
                type="text"
                placeholder="MM/YY"
                value={cardDetails.expiry}
                onChange={handleExpiryChange}
                maxLength="5"
                style={styles.input}
              />
            </div>
            <div style={styles.halfGroup}>
              <label style={styles.label}>CVV</label>
              <input
                type="password"
                placeholder="123"
                value={cardDetails.cvv}
                onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                maxLength="4"
                style={styles.input}
              />
            </div>
          </div>
          
          <button onClick={processCardPayment} style={styles.payButton}>
            Pay ${orderData?.total?.toFixed(2)}
          </button>
          
          <button onClick={() => setPage('checkout')} style={styles.backButton}>
            ← Back to Checkout
          </button>
        </div>
      </div>
    );
  }

  // Render PayPal Login Form
  if (status === 'paypal_login') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.paypalLogo}>🅿️ PayPal</div>
          <h2 style={styles.title}>Sign in to PayPal</h2>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Email or Mobile Number</label>
            <input
              type="email"
              placeholder="your-email@example.com"
              value={paypalEmail}
              onChange={(e) => setPaypalEmail(e.target.value)}
              style={styles.input}
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="Enter your PayPal password"
              value={paypalPassword}
              onChange={(e) => setPaypalPassword(e.target.value)}
              style={styles.input}
            />
          </div>
          
          <button onClick={handlePayPalLogin} style={styles.paypalButton}>
            Log In to PayPal
          </button>
          
          <p style={styles.paypalNote}>
            <a href="#" style={{ color: '#0070ba' }}>Having trouble logging in?</a>
          </p>
          
          <button onClick={() => setPage('checkout')} style={styles.backButton}>
            ← Back to Checkout
          </button>
        </div>
      </div>
    );
  }

  // Render PayPal OTP Verification
  if (status === 'paypal_otp') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.paypalLogo}>🅿️ PayPal</div>
          <h2 style={styles.title}>Verify Your Identity</h2>
          <p style={styles.subtitle}>We've sent a verification code to your registered mobile number</p>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Enter Verification Code</label>
            <input
              type="text"
              placeholder="6-digit code"
              value={userOtp}
              onChange={(e) => setUserOtp(e.target.value)}
              maxLength="6"
              style={{ ...styles.input, textAlign: 'center', fontSize: '20px', letterSpacing: '4px' }}
            />
            {otpError && <p style={styles.error}>{otpError}</p>}
          </div>
          
          <div style={styles.row}>
            <button onClick={verifyPayPalOTP} style={styles.paypalButton}>
              Verify & Pay
            </button>
            <button
              onClick={sendPayPalOTP}
              disabled={resendTimer > 0}
              style={{
                ...styles.resendButton,
                opacity: resendTimer > 0 ? 0.6 : 1,
                cursor: resendTimer > 0 ? 'not-allowed' : 'pointer'
              }}
            >
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
            </button>
          </div>
          
          <button onClick={() => setStatus('paypal_login')} style={styles.backButton}>
            ← Back to Login
          </button>
        </div>
      </div>
    );
  }

  // Render Processing States
  if (status === 'card_processing' || status === 'paypal_processing') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.icon}>{status === 'card_processing' ? '💳' : '🅿️'}</div>
          <h2 style={styles.title}>
            {status === 'card_processing' ? 'Processing Card Payment' : 'Processing PayPal Payment'}
          </h2>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${progress}%` }} />
          </div>
          <p style={styles.message}>{message}</p>
          <p style={styles.note}>Please do not close this window...</p>
        </div>
      </div>
    );
  }

  // Render Success State
  if (status === 'success') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.successIcon}>✅</div>
          <h2 style={styles.successTitle}>
            {paymentMethod === 'cod' ? 'Order Placed Successfully!' : 'Payment Successful!'}
          </h2>
          <p style={styles.successMessage}>
            {paymentMethod === 'cod' 
              ? 'Your order has been placed. You will pay upon delivery.'
              : 'Your transaction has been completed successfully.'}
          </p>
          <div style={styles.transactionDetails}>
            <p>Amount: <strong>${orderData?.total?.toFixed(2)}</strong></p>
            <p>Transaction ID: {Math.random().toString(36).substring(2, 15).toUpperCase()}</p>
          </div>
          <p style={styles.redirectMessage}>Redirecting to order confirmation...</p>
        </div>
      </div>
    );
  }

  return null;
};

// Styles
const styles = {
  container: {
    maxWidth: '500px',
    margin: '0 auto',
    padding: '40px 20px',
    minHeight: '60vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  card: {
    background: 'white',
    borderRadius: '20px',
    padding: '40px',
    textAlign: 'center',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
    width: '100%'
  },
  icon: {
    fontSize: '60px',
    marginBottom: '20px'
  },
  title: {
    marginBottom: '10px',
    color: '#333'
  },
  subtitle: {
    color: '#666',
    marginBottom: '30px',
    fontSize: '14px'
  },
  formGroup: {
    marginBottom: '20px',
    textAlign: 'left'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '500',
    color: '#333'
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '16px'
  },
  row: {
    display: 'flex',
    gap: '15px',
    marginBottom: '20px'
  },
  halfGroup: {
    flex: 1
  },
  payButton: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginBottom: '10px'
  },
  paypalButton: {
    width: '100%',
    padding: '14px',
    background: '#0070ba',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginBottom: '10px'
  },
  backButton: {
    width: '100%',
    padding: '12px',
    background: 'none',
    border: '1px solid #ddd',
    borderRadius: '8px',
    cursor: 'pointer',
    color: '#666',
    marginTop: '10px'
  },
  resendButton: {
    flex: 1,
    padding: '14px',
    background: 'white',
    border: '1px solid #0070ba',
    borderRadius: '8px',
    cursor: 'pointer',
    color: '#0070ba',
    fontWeight: 'bold'
  },
  progressBar: {
    width: '100%',
    height: '8px',
    background: '#e0e0e0',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '20px'
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    transition: 'width 0.5s ease'
  },
  message: {
    color: '#667eea',
    fontWeight: '500',
    marginBottom: '20px'
  },
  note: {
    color: '#999',
    fontSize: '14px'
  },
  error: {
    color: '#f56565',
    fontSize: '14px',
    marginTop: '5px'
  },
  paypalLogo: {
    fontSize: '48px',
    marginBottom: '20px',
    color: '#0070ba'
  },
  paypalNote: {
    marginTop: '15px',
    fontSize: '12px',
    textAlign: 'center'
  },
  successIcon: {
    fontSize: '60px',
    marginBottom: '20px'
  },
  successTitle: {
    marginBottom: '10px',
    color: '#48bb78'
  },
  successMessage: {
    color: '#666',
    marginBottom: '20px'
  },
  transactionDetails: {
    background: '#f0f0f0',
    padding: '15px',
    borderRadius: '10px',
    marginBottom: '20px'
  },
  redirectMessage: {
    color: '#999',
    fontSize: '14px'
  }
};

export default PaymentProcessingPage;