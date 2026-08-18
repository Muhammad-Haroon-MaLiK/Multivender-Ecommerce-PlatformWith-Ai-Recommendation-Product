import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './AuthPages.css';

const API_URL = 'https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api](https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api/api';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState('email'); // email | otp | reset
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [debugOtp, setDebugOtp] = useState('');

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
      
      if (response.data.success) {
        setSuccess('OTP sent to your email! Please check your inbox.');
        setStep('otp');
        setResendTimer(60);
        if (response.data.debug_otp) {
          setDebugOtp(`📱 Debug OTP: ${response.data.debug_otp}`);
        }
        startTimer();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/auth/reset-password`, {
        email,
        otp,
        newPassword
      });
      
      if (response.data.success) {
        setSuccess('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/resend-otp`, { email });
      
      if (response.data.success) {
        setSuccess('New OTP sent!');
        setResendTimer(60);
        startTimer();
        if (response.data.debug_otp) {
          setDebugOtp(`📱 New Debug OTP: ${response.data.debug_otp}`);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const startTimer = () => {
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--wide">
        {/* Logo */}
        <Link to="/" className="auth-logo">
          shop<span>verse</span>
        </Link>

        <h1 className="auth-title">
          {step === 'email' && 'Forgot Password'}
          {step === 'otp' && 'Verify OTP'}
          {step === 'reset' && 'Reset Password'}
        </h1>
        <p className="auth-sub">
          {step === 'email' && 'Enter your email to receive a password reset code'}
          {step === 'otp' && 'Enter the 6-digit code sent to your email'}
          {step === 'reset' && 'Create your new password'}
        </p>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}
        {debugOtp && (
          <div className="debug-otp">
            {debugOtp}
          </div>
        )}

        {step === 'email' && (
          <form onSubmit={handleSendOTP} className="auth-form">
            <div className="auth-field">
              <label>Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <button type="submit" disabled={loading} className="auth-btn">
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOTP} className="auth-form">
            <div className="auth-field">
              <label>Enter OTP Code</label>
              <input
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit code"
                maxLength="6"
                style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '20px' }}
              />
            </div>
            <div className="auth-field">
              <label>New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 chars)"
              />
            </div>
            <div className="auth-field">
              <label>Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            <button type="submit" disabled={loading} className="auth-btn">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            <div style={{ marginTop: '15px', textAlign: 'center' }}>
              {resendTimer > 0 ? (
                <span style={{ color: '#666', fontSize: '14px' }}>
                  Resend OTP in {resendTimer}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#4caf50',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    textDecoration: 'underline'
                  }}
                >
                  Resend OTP
                </button>
              )}
            </div>
          </form>
        )}

        <div className="auth-footer">
          <p>
            Remember your password? <Link to="/login">Sign in</Link>
          </p>
          <p style={{ marginTop: '8px' }}>
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;