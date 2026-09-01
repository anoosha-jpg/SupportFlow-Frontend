import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Check, Clock, MessageSquare, Wrench, Shield, AlertCircle } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

const NotificationsPage = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  const handleNotificationClick = (n) => {
    if (!n.isRead) {
      markAsRead(n._id);
    }
    if (n.ticket) {
      const ticketId = n.ticket._id || n.ticket;
      if (user.role === 'worker') {
        navigate(`/worker/tickets/${ticketId}`);
      } else {
        navigate(`/customer/tickets/${ticketId}`);
      }
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Notifications Center</h1>
          <p className="dashboard-subtitle">
            Track real-time system alerts, ticket status transitions, worker messages, and approvals.
          </p>
        </div>

        {unreadCount > 0 && (
          <button className="btn btn-outline" onClick={markAllAsRead}>
            <CheckCheck size={16} /> Mark All as Read
          </button>
        )}
      </div>

      <div className="section-card">
        <div className="table-header-row">
          <div className="tabs-container">
            <button
              className={`tab-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Notifications ({notifications.length})
            </button>
            <button
              className={`tab-btn ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner-container">
            <div className="spinner"></div>
            <p>Loading notifications...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔔</div>
            <h3>No notifications found</h3>
            <p>You are all caught up! New events and updates will be delivered here automatically.</p>
          </div>
        ) : (
          <div className="notifications-feed">
            {filtered.map((n) => (
              <div
                key={n._id}
                className={`notification-card ${!n.isRead ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(n)}
              >
                <div className="notif-icon-col">
                  <div className="notif-badge-icon">
                    <Bell size={18} />
                  </div>
                </div>

                <div className="notif-body-col">
                  <div className="notif-card-header">
                    <h4>{n.title}</h4>
                    <span className="notif-date">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="notif-message-text">{n.message}</p>
                  {n.ticket && (
                    <span className="notif-ticket-link">
                      View Ticket #{n.ticket.ticketNumber || ''} &rarr;
                    </span>
                  )}
                </div>

                <div className="notif-action-col">
                  {!n.isRead && (
                    <button
                      className="btn-icon-check"
                      title="Mark as read"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(n._id);
                      }}
                    >
                      <Check size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
