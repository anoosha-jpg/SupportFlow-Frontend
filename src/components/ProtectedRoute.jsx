import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-spinner-container">
        <div className="spinner"></div>
        <p>Verifying authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check Worker Approval Status
  if (user.role === 'worker') {
    if (user.workerApprovalStatus === 'pending') {
      return (
        <div className="approval-blocked-card">
          <div className="status-icon pending">⏳</div>
          <h2>Worker Application Pending Approval</h2>
          <p>
            Thank you for registering, <strong>{user.name}</strong>! Your application is currently awaiting review and approval by an Administrator.
          </p>
          <p className="subtext">
            You will gain full access to the Worker dashboard as soon as your account is approved.
          </p>
          <button className="btn btn-outline" onClick={() => window.location.reload()}>
            Check Status
          </button>
        </div>
      );
    }

    if (user.workerApprovalStatus === 'rejected') {
      return (
        <div className="approval-blocked-card">
          <div className="status-icon rejected">🚫</div>
          <h2>Worker Application Not Approved</h2>
          <p>
            Your Worker application has been reviewed and was not approved by the Administrator.
          </p>
        </div>
      );
    }
  }

  // Check allowed roles
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to their respective default home
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'worker') return <Navigate to="/worker" replace />;
    return <Navigate to="/customer" replace />;
  }

  return children;
};

export default ProtectedRoute;
