import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Auth Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOTP from './pages/VerifyOTP';
import ResetPassword from './pages/ResetPassword';

// Dashboards
import CustomerDashboard from './pages/CustomerDashboard';
import CustomerTicketDetail from './pages/CustomerTicketDetail';
import WorkerDashboard from './pages/WorkerDashboard';
import WorkerTicketDetail from './pages/WorkerTicketDetail';
import AdminDashboard from './pages/AdminDashboard';
import NotificationsPage from './pages/NotificationsPage';

const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-spinner-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'worker') return <Navigate to="/worker" replace />;
  return <Navigate to="/customer" replace />;
};

function App() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="app-layout">
      {isAuthenticated && user && <Navbar />}
      <main className="main-content">
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Customer Routes */}
          <Route
            path="/customer"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/tickets/:id"
            element={
              <ProtectedRoute allowedRoles={['customer', 'admin']}>
                <CustomerTicketDetail />
              </ProtectedRoute>
            }
          />

          {/* Worker Routes */}
          <Route
            path="/worker"
            element={
              <ProtectedRoute allowedRoles={['worker']}>
                <WorkerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/worker/tickets/:id"
            element={
              <ProtectedRoute allowedRoles={['worker', 'admin']}>
                <WorkerTicketDetail />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Shared Protected Notification Center */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute allowedRoles={['customer', 'worker', 'admin']}>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Catch-all 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
