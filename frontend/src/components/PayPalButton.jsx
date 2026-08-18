import React from 'react';

const PayPalButton = ({ amount, onSuccess, onError }) => {
  // This is a mock PayPal button
  // For real integration, you would use @paypal/react-paypal-js
  
  const handlePayPalClick = () => {
    // Simulate PayPal popup
    const mockPayment = window.confirm(`Pay with PayPal: $${amount}\n\nThis is a demo. In production, this would open PayPal payment window.`);
    
    if (mockPayment) {
      onSuccess();
    } else {
      onError();
    }
  };

  return (
    <button
      onClick={handlePayPalClick}
      style={{
        width: '100%',
        padding: '12px',
        background: '#ffc439',
        color: '#000',
        border: 'none',
        borderRadius: '8px',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '16px'
      }}
    >
      🅿️ Pay with PayPal
    </button>
  );
};

export default PayPalButton;