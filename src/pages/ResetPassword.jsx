import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { KeyRound, Lock, AlertCircle, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import api from '../services/api';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const initialEmail = location.state?.email || sessionStorage.getItem('verified_email') || sessionStorage.getItem('reset_email') || '';
  const initialOtp = location.state?.otp || sessionStorage.getItem('verified_otp') || sessionStorage.getItem('reset_otp') || '';

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState(initialOtp);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtpField, setShowOtpField] = useState(!initialOtp);

  const message = location.state?.message;

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
    if (initialOtp) setOtp(initialOtp);
  }, [initialEmail, initialOtp]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    const cleanOtp = otp.trim();

    if (!cleanEmail || !cleanOtp || !newPassword || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify both passwords.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/reset-password', {
        email: cleanEmail,
        otp: cleanOtp,
        newPassword,
        confirmPassword
      });

      if (res.data.success) {
        // Clear session storage on success
        sessionStorage.removeItem('reset_email');
        sessionStorage.removeItem('reset_otp');
        sessionStorage.removeItem('verified_email');
        sessionStorage.removeItem('verified_otp');

        navigate('/login', {
          state: {
            message: 'Password reset successfully! You can now log in with your new password.'
          }
        });
      } else {
        setError(res.data.message || 'Failed to reset password.');
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.errors?.length > 0
          ? err.response.data.errors.join('. ')
          : err.response?.data?.message || 'Failed to reset password. Please check your OTP and try again.';
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
          <h1>Create New Password</h1>
          <p className="auth-subtitle">Choose a secure password for your account</p>
        </div>

        {otp && (
          <div className="verified-chip-bar">
            <ShieldCheck size={16} className="text-success" />
            <span>Verified OTP for <strong>{email}</strong></span>
          </div>
        )}

        {message && (
          <div className="alert alert-success">
            <CheckCircle2 size={16} />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {(!email || showOtpField) && (
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                id="email"
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}

          {(!otp || showOtpField) && (
            <div className="form-group">
              <label htmlFor="otp">6-Digit OTP Code *</label>
              <input
                id="otp"
                type="text"
                className="form-control"
                placeholder="123456"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="newPassword">New Password * (Min. 6 characters)</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="newPassword"
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password *</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="confirmPassword"
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Resetting Password...' : 'Save New Password & Sign In'}
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

export default ResetPassword;
