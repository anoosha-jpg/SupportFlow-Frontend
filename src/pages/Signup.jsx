import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, Lock, Mail, User, ShieldCheck, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'customer'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      const res = await signup(formData);
      if (res.success) {
        if (res.requiresApproval) {
          navigate('/login', {
            state: {
              message: 'Worker application submitted successfully! Your account is Pending Approval by an Administrator before you can sign in.'
            }
          });
        } else {
          navigate('/customer');
        }
      } else {
        setError(res.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.errors?.length > 0
          ? err.response.data.errors.join('. ')
          : err.response?.data?.message || 'Registration failed. Please check your details and try again.';
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
          <h1>Create Account</h1>
          <p className="auth-subtitle">Join SupportFlow service platform</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input
                id="name"
                name="name"
                type="text"
                className="form-control"
                placeholder="Jane Doe"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                id="email"
                name="email"
                type="email"
                className="form-control"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="role">Account Type *</label>
            <div className="input-with-icon">
              <ShieldCheck size={18} className="input-icon" />
              <select
                id="role"
                name="role"
                className="form-control"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="customer">Customer (Request Support & Services)</option>
                <option value="worker">Worker (Review & Handle Requests)</option>
              </select>
            </div>
          </div>

          {formData.role === 'worker' && (
            <div className="alert alert-info">
              <Info size={16} />
              <span>
                <strong>Worker Verification:</strong> Worker registrations require Administrator approval before account activation.
              </span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                name="password"
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
