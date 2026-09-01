import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Mail, AlertCircle, ArrowLeft, Send } from 'lucide-react';
import api from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/forgot-password', { email: cleanEmail });
      if (res.data.success) {
        // Save to sessionStorage to survive any accidental page refresh
        sessionStorage.setItem('reset_email', res.data.email || cleanEmail);
        if (res.data.otp) {
          sessionStorage.setItem('reset_otp', res.data.otp);
        }

        navigate('/verify-otp', {
          state: {
            email: res.data.email || cleanEmail,
            otp: res.data.otp,
            message: res.data.message || 'OTP verification code has been dispatched.'
          }
        });
      } else {
        setError(res.data.message || 'Failed to request password reset code.');
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.errors?.length > 0
          ? err.response.data.errors.join('. ')
          : err.response?.data?.message || 'Failed to request password reset code. Please check your email.';
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
          <h1>Forgot Password</h1>
          <p className="auth-subtitle">Enter your registered email to receive a 6-digit OTP code</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Registered Email Address</label>
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
                autoComplete="email"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            <Send size={16} />
            {loading ? 'Generating OTP...' : 'Send Verification OTP'}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login" className="back-link">
            <ArrowLeft size={16} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
