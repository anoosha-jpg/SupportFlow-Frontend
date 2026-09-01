import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, User, LogOut, Layers, CheckCircle2, MessageSquare, Shield, Wrench, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="role-pill pill-admin"><Shield size={12} /> Admin</span>;
      case 'worker':
        return <span className="role-pill pill-worker"><Wrench size={12} /> Worker</span>;
      default:
        return <span className="role-pill pill-customer"><User size={12} /> Customer</span>;
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <div className="brand-icon brand-icon-image">
            <img src="/supportflow-logo.png" alt="SupportFlow logo" />
          </div>
          <div className="brand-text">
            <span className="brand-name">SupportFlow</span>
            <span className="brand-badge">v2.0</span>
          </div>
        </Link>

        {isAuthenticated && user && (
          <nav className="navbar-nav">
            {user.role === 'customer' && (
              <>
                <Link to="/customer" className="nav-link">Dashboard</Link>
                <Link to="/notifications" className="nav-link">Notifications</Link>
              </>
            )}
            {user.role === 'worker' && (
              <>
                <Link to="/worker" className="nav-link">Worker Console</Link>
                <Link to="/notifications" className="nav-link">Notifications</Link>
              </>
            )}
            {user.role === 'admin' && (
              <>
                <Link to="/admin" className="nav-link">Admin Console</Link>
                <Link to="/notifications" className="nav-link">Notifications</Link>
              </>
            )}
          </nav>
        )}

        <div className="navbar-actions">
          {isAuthenticated && user ? (
            <>
              {/* Notification Bell Dropdown */}
              <div className="notification-wrapper" ref={notifRef}>
                <button
                  className="icon-btn notif-btn"
                  onClick={() => setShowNotifications(!showNotifications)}
                  aria-label="Notifications"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="unread-badge">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="notifications-dropdown">
                    <div className="dropdown-header">
                      <h4>Notifications</h4>
                      {unreadCount > 0 && (
                        <button className="mark-all-btn" onClick={markAllAsRead}>
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="dropdown-list">
                      {notifications.length === 0 ? (
                        <div className="dropdown-empty">
                          <p>No notifications yet</p>
                        </div>
                      ) : (
                        notifications.slice(0, 6).map((n) => (
                          <div
                            key={n._id}
                            className={`notif-dropdown-item ${!n.isRead ? 'unread' : ''}`}
                            onClick={() => {
                              if (!n.isRead) markAsRead(n._id);
                              setShowNotifications(false);
                              if (n.ticket) {
                                if (user.role === 'worker') {
                                  navigate(`/worker/tickets/${n.ticket._id || n.ticket}`);
                                } else {
                                  navigate(`/customer/tickets/${n.ticket._id || n.ticket}`);
                                }
                              }
                            }}
                          >
                            <div className="notif-content">
                              <div className="notif-title">{n.title}</div>
                              <div className="notif-desc">{n.message}</div>
                              <div className="notif-time">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                            {!n.isRead && <span className="unread-dot"></span>}
                          </div>
                        ))
                      )}
                    </div>

                    <div className="dropdown-footer">
                      <Link to="/notifications" onClick={() => setShowNotifications(false)}>
                        View all notifications
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Chip */}
              <div className="user-profile-chip">
                <div className="user-details">
                  <span className="user-name">{user.name}</span>
                  {getRoleBadge(user.role)}
                </div>
              </div>

              {/* Logout Button */}
              <button onClick={handleLogout} className="btn-logout" title="Sign Out">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <div className="auth-links">
              <Link to="/login" className="btn btn-outline-sm">Sign In</Link>
              <Link to="/signup" className="btn btn-primary-sm">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
