import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Inbox, CheckCircle2, AlertCircle, Star, Flame, Eye, Check, X, Sparkles } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import StarRating from '../components/StarRating';

const WorkerDashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [stats, setStats] = useState({
    available: 0,
    accepted: 0,
    inProgress: 0,
    highCritical: 0,
    resolved: 0,
    averageRating: 0,
    totalReviews: 0
  });
  const [availableTickets, setAvailableTickets] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [activeTab, setActiveTab] = useState('available');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, availRes, myRes] = await Promise.all([
        api.get('/workers/stats'),
        api.get('/workers/requests/available'),
        api.get('/workers/requests/my')
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (availRes.data.success) setAvailableTickets(availRes.data.data);
      if (myRes.data.success) setMyTickets(myRes.data.data);
    } catch (err) {
      console.error('[WorkerDashboard] Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Listen to Socket.IO real-time ticket events
  useEffect(() => {
    if (!socket) return;

    const handleNewAvailableTicket = (ticket) => {
      setAvailableTickets((prev) => [ticket, ...prev]);
      setStats((prev) => ({ ...prev, available: prev.available + 1 }));
    };

    const handleTicketClaimed = ({ ticketId }) => {
      setAvailableTickets((prev) => prev.filter((t) => t._id !== ticketId));
      setStats((prev) => ({ ...prev, available: Math.max(0, prev.available - 1) }));
    };

    socket.on('ticket-created', handleNewAvailableTicket);
    socket.on('ticket-state-changed', handleTicketClaimed);

    return () => {
      socket.off('ticket-created', handleNewAvailableTicket);
      socket.off('ticket-state-changed', handleTicketClaimed);
    };
  }, [socket]);

  const handleAccept = async (ticketId) => {
    setError('');
    setMessage('');
    try {
      setActionLoading((prev) => ({ ...prev, [ticketId]: 'accept' }));
      const res = await api.post(`/workers/requests/${ticketId}/accept`);
      if (res.data.success) {
        setMessage(`Successfully accepted request #${res.data.data.ticketNumber}!`);
        // Refresh local lists
        setAvailableTickets((prev) => prev.filter((t) => t._id !== ticketId));
        setMyTickets((prev) => [res.data.data, ...prev]);
        setStats((prev) => ({
          ...prev,
          available: Math.max(0, prev.available - 1),
          accepted: prev.accepted + 1
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept request.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [ticketId]: null }));
    }
  };

  const handleReject = async (ticketId) => {
    setError('');
    setMessage('');
    try {
      setActionLoading((prev) => ({ ...prev, [ticketId]: 'reject' }));
      const res = await api.post(`/workers/requests/${ticketId}/reject`, {
        reason: 'Worker capacity unavailable'
      });
      if (res.data.success) {
        setMessage(`Request rejected.`);
        setAvailableTickets((prev) => prev.filter((t) => t._id !== ticketId));
        setStats((prev) => ({
          ...prev,
          available: Math.max(0, prev.available - 1)
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject request.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [ticketId]: null }));
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Worker Operations Console</h1>
          <p className="dashboard-subtitle">
            Welcome, <strong>{user?.name}</strong>. Accept customer requests, coordinate solutions, and maintain high satisfaction.
          </p>
        </div>

        {/* Worker Dynamic Rating Badge */}
        <div className="worker-score-widget">
          <div className="score-top">
            <Star size={18} fill="#f59e0b" stroke="#f59e0b" />
            <span className="score-num">{stats.averageRating > 0 ? stats.averageRating : '5.0'}</span>
            <span className="score-scale">/ 5.0</span>
          </div>
          <div className="score-sub">{stats.totalReviews} verified customer reviews</div>
        </div>
      </div>

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

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card" onClick={() => setActiveTab('available')}>
          <div className="metric-icon pending">
            <Inbox size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Available Requests</span>
            <span className="metric-value">{stats.available}</span>
          </div>
        </div>

        <div className="metric-card" onClick={() => setActiveTab('my')}>
          <div className="metric-icon accepted">
            <Wrench size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-label">My Accepted</span>
            <span className="metric-value">{stats.accepted}</span>
          </div>
        </div>

        <div className="metric-card" onClick={() => setActiveTab('my')}>
          <div className="metric-icon in-progress">
            <AlertCircle size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-label">In Progress</span>
            <span className="metric-value">{stats.inProgress}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon high-priority">
            <Flame size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-label">High / Critical</span>
            <span className="metric-value">{stats.highCritical}</span>
          </div>
        </div>

        <div className="metric-card" onClick={() => setActiveTab('resolved')}>
          <div className="metric-icon resolved">
            <CheckCircle2 size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Resolved Work</span>
            <span className="metric-value">{stats.resolved}</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="section-card">
        <div className="table-header-row">
          <div className="tabs-container">
            <button
              className={`tab-btn ${activeTab === 'available' ? 'active' : ''}`}
              onClick={() => setActiveTab('available')}
            >
              Available Requests ({availableTickets.length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'my' ? 'active' : ''}`}
              onClick={() => setActiveTab('my')}
            >
              My Active Requests ({myTickets.filter((t) => t.status !== 'Resolved').length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'resolved' ? 'active' : ''}`}
              onClick={() => setActiveTab('resolved')}
            >
              Resolved History ({myTickets.filter((t) => t.status === 'Resolved').length})
            </button>
          </div>
        </div>

        {/* Tab 1: Available Requests */}
        {activeTab === 'available' && (
          <div>
            {loading ? (
              <div className="loading-spinner-container">
                <div className="spinner"></div>
                <p>Loading available requests...</p>
              </div>
            ) : availableTickets.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✨</div>
                <h3>No available requests at the moment</h3>
                <p>All customer requests have been assigned. New requests will appear here in real time.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Subject & AI Summary</th>
                      <th>Category</th>
                      <th>Priority</th>
                      <th>Customer</th>
                      <th>Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableTickets.map((ticket) => (
                      <tr key={ticket._id}>
                        <td>
                          <span className="ticket-id-tag">{ticket.ticketNumber}</span>
                        </td>
                        <td>
                          <div className="ticket-subject-cell">
                            <span className="ticket-title-bold">{ticket.subject}</span>
                            {ticket.aiTriage?.summary && (
                              <div className="ai-brief-snippet">
                                <Sparkles size={12} /> {ticket.aiTriage.summary}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="category-pill">{ticket.category}</span>
                        </td>
                        <td>
                          <PriorityBadge priority={ticket.priority} />
                        </td>
                        <td>
                          <span className="customer-name">{ticket.customer?.name || 'Customer'}</span>
                        </td>
                        <td className="date-cell">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <div className="action-buttons-group">
                            <button
                              className="btn btn-success-sm"
                              onClick={() => handleAccept(ticket._id)}
                              disabled={!!actionLoading[ticket._id]}
                              title="Accept this request"
                            >
                              <Check size={14} /> Accept
                            </button>
                            <button
                              className="btn btn-danger-sm"
                              onClick={() => handleReject(ticket._id)}
                              disabled={!!actionLoading[ticket._id]}
                              title="Reject this request"
                            >
                              <X size={14} /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: My Active Requests */}
        {activeTab === 'my' && (
          <div>
            {myTickets.filter((t) => t.status !== 'Resolved').length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>No active requests assigned</h3>
                <p>Accept an available request from the "Available Requests" tab to start working.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Subject</th>
                      <th>Category</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Customer</th>
                      <th>Accepted At</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myTickets
                      .filter((t) => t.status !== 'Resolved')
                      .map((ticket) => (
                        <tr key={ticket._id}>
                          <td>
                            <span className="ticket-id-tag">{ticket.ticketNumber}</span>
                          </td>
                          <td>
                            <Link to={`/worker/tickets/${ticket._id}`} className="ticket-title-link">
                              {ticket.subject}
                            </Link>
                          </td>
                          <td>
                            <span className="category-pill">{ticket.category}</span>
                          </td>
                          <td>
                            <PriorityBadge priority={ticket.priority} />
                          </td>
                          <td>
                            <StatusBadge status={ticket.status} />
                          </td>
                          <td>{ticket.customer?.name}</td>
                          <td className="date-cell">
                            {ticket.acceptedAt ? new Date(ticket.acceptedAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td>
                            <Link to={`/worker/tickets/${ticket._id}`} className="btn btn-primary-sm">
                              <Eye size={14} /> Handle
                            </Link>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Resolved History */}
        {activeTab === 'resolved' && (
          <div>
            {myTickets.filter((t) => t.status === 'Resolved').length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🏆</div>
                <h3>No resolved requests yet</h3>
                <p>Completed customer requests will be cataloged here along with verified customer ratings.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Subject</th>
                      <th>Category</th>
                      <th>Priority</th>
                      <th>Customer</th>
                      <th>Resolved At</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myTickets
                      .filter((t) => t.status === 'Resolved')
                      .map((ticket) => (
                        <tr key={ticket._id}>
                          <td>
                            <span className="ticket-id-tag">{ticket.ticketNumber}</span>
                          </td>
                          <td>
                            <Link to={`/worker/tickets/${ticket._id}`} className="ticket-title-link">
                              {ticket.subject}
                            </Link>
                          </td>
                          <td>
                            <span className="category-pill">{ticket.category}</span>
                          </td>
                          <td>
                            <PriorityBadge priority={ticket.priority} />
                          </td>
                          <td>{ticket.customer?.name}</td>
                          <td className="date-cell">
                            {ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td>
                            <Link to={`/worker/tickets/${ticket._id}`} className="btn btn-outline-sm">
                              <Eye size={14} /> View Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerDashboard;
