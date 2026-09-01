import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Mail, AlertCircle, ArrowLeft, CheckCircle2, Key, RefreshCw } from 'lucide-react';
import api from '../services/api';

const VerifyOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const initialEmail = location.state?.email || sessionStorage.getItem('reset_email') || '';
  const initialOtp = location.state?.otp || sessionStorage.getItem('reset_otp') || '';

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [displayedOtp, setDisplayedOtp] = useState(initialOtp);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(location.state?.message || '');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
      sessionStorage.setItem('reset_email', initialEmail);
    }
    if (initialOtp) {
      setDisplayedOtp(initialOtp);
      sessionStorage.setItem('reset_otp', initialOtp);
    }
  }, [initialEmail, initialOtp]);

  const handleAutoFill = () => {
    if (displayedOtp) {
      setOtp(displayedOtp);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setSuccessMessage('');
    if (!email.trim()) {
      setError('Please provide your email address to resend OTP.');
      return;
    }

    try {
      setResending(true);
      const res = await api.post('/auth/forgot-password', { email: email.trim() });
      if (res.data.success) {
        setSuccessMessage('A new 6-digit OTP has been generated!');
        if (res.data.otp) {
          setDisplayedOtp(res.data.otp);
          sessionStorage.setItem('reset_otp', res.data.otp);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP code.');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    const cleanOtp = otp.trim();

    if (!cleanEmail || !cleanOtp) {
      setError('Please enter your email and the 6-digit OTP code.');
      return;
    }

    if (cleanOtp.length !== 6) {
      setError('The verification code must be exactly 6 digits.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/verify-otp', {
        email: cleanEmail,
        otp: cleanOtp
      });

      if (res.data.success) {
        sessionStorage.setItem('verified_email', cleanEmail);
        sessionStorage.setItem('verified_otp', cleanOtp);

        navigate('/reset-password', {
          state: {
            email: cleanEmail,
            otp: cleanOtp,
            message: 'OTP verified successfully! Please enter your new password.'
          }
        });
      } else {
        setError(res.data.message || 'OTP verification failed.');
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.errors?.length > 0
          ? err.response.data.errors.join('. ')
          : err.response?.data?.message || 'Invalid or expired OTP code. Please check and try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <img src="/supportflow-logo.png" alt="SupportFlow logo" />
          </div>
          <h1>Verify Security Code</h1>
          <p className="auth-subtitle">Enter the 6-digit OTP code dispatched to your account</p>
        </div>

        {displayedOtp && (
          <div className="otp-demo-card" onClick={handleAutoFill} title="Click to auto-fill">
            <div className="otp-demo-header">
              <Key size={14} />
              <span>Your 6-Digit OTP Code</span>
              <span className="click-fill-tag">Click to Auto-fill</span>
            </div>
            <div className="otp-demo-digits">{displayedOtp}</div>
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success">
            <CheckCircle2 size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                id="email"
                type="email"
                className="form-control"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="otp">6-Digit Verification Code</label>
              {displayedOtp && (
                <button
                  type="button"
                  className="quick-fill-btn"
                  onClick={handleAutoFill}
                >
                  Auto-fill ({displayedOtp})
                </button>
              )}
            </div>
            <input
              id="otp"
              type="text"
              className="form-control otp-input"
              placeholder="123456"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              required
              autoFocus
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading || otp.length !== 6}>
            {loading ? 'Verifying OTP...' : 'Verify & Continue'}
          </button>
        </form>

        <div className="auth-footer-split">
          <button
            type="button"
            className="btn-text-action"
            onClick={handleResendOTP}
            disabled={resending}
          >
            <RefreshCw size={14} className={resending ? 'spin-icon' : ''} />
            {resending ? 'Resending...' : 'Resend OTP Code'}
          </button>

          <Link to="/login" className="back-link">
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
