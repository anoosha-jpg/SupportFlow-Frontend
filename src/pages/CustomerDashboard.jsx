import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Clock, CheckCircle2, AlertCircle, Wrench, Sparkles, Eye } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import CreateTicketModal from '../components/CreateTicketModal';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    inProgress: 0,
    resolved: 0
  });
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tickets/my');
      if (res.data.success) {
        setTickets(res.data.data);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      console.error('[CustomerDashboard] Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleTicketCreated = (newTicket) => {
    setTickets((prev) => [newTicket, ...prev]);
    setStats((prev) => ({
      ...prev,
      total: prev.total + 1,
      pending: prev.pending + 1
    }));
  };

  const filteredTickets = tickets.filter((t) => {
    if (filter === 'all') return true;
    return t.status.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Customer Support Center</h1>
          <p className="dashboard-subtitle">
            Welcome back, <strong>{user?.name}</strong>. Manage your service requests and track real-time resolution.
          </p>
        </div>
        <button className="btn btn-primary btn-create" onClick={() => setIsModalOpen(true)}>
          <PlusCircle size={18} />
          <span>New Support Request</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card" onClick={() => setFilter('all')}>
          <div className="metric-icon total">
            <Clock size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Requests</span>
            <span className="metric-value">{stats.total}</span>
          </div>
        </div>

        <div className="metric-card" onClick={() => setFilter('pending')}>
          <div className="metric-icon pending">
            <Clock size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Pending Review</span>
            <span className="metric-value">{stats.pending}</span>
          </div>
        </div>

        <div className="metric-card" onClick={() => setFilter('accepted')}>
          <div className="metric-icon accepted">
            <Wrench size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Accepted</span>
            <span className="metric-value">{stats.accepted}</span>
          </div>
        </div>

        <div className="metric-card" onClick={() => setFilter('in progress')}>
          <div className="metric-icon in-progress">
            <AlertCircle size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-label">In Progress</span>
            <span className="metric-value">{stats.inProgress}</span>
          </div>
        </div>

        <div className="metric-card" onClick={() => setFilter('resolved')}>
          <div className="metric-icon resolved">
            <CheckCircle2 size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Resolved</span>
            <span className="metric-value">{stats.resolved}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="section-card">
        <div className="table-header-row">
          <div className="tabs-container">
            {['all', 'pending', 'accepted', 'in progress', 'resolved'].map((st) => (
              <button
                key={st}
                className={`tab-btn ${filter === st ? 'active' : ''}`}
                onClick={() => setFilter(st)}
              >
                {st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            ))}
          </div>
          <span className="items-count-badge">Showing {filteredTickets.length} requests</span>
        </div>

        {/* Requests Table */}
        {loading ? (
          <div className="loading-spinner-container">
            <div className="spinner"></div>
            <p>Loading your support requests...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <h3>No requests found in this view</h3>
            <p>Need assistance with a technical issue or billing inquiry? Submit a new request.</p>
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              <PlusCircle size={16} /> Create Request
            </button>
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
                  <th>Assigned Worker</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr key={ticket._id}>
                    <td>
                      <span className="ticket-id-tag">{ticket.ticketNumber}</span>
                    </td>
                    <td>
                      <div className="ticket-subject-cell">
                        <Link to={`/customer/tickets/${ticket._id}`} className="ticket-title-link">
                          {ticket.subject}
                        </Link>
                        {ticket.aiTriage?.summary && (
                          <div className="ai-brief-snippet">
                            <Sparkles size={12} /> {ticket.aiTriage.summary.slice(0, 75)}...
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
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td>
                      {ticket.assignedWorker ? (
                        <div className="worker-cell">
                          <span className="worker-avatar">{(ticket.assignedWorker.name || 'W')[0]}</span>
                          <span className="worker-name">{ticket.assignedWorker.name}</span>
                        </div>
                      ) : (
                        <span className="unassigned-text">Awaiting Worker</span>
                      )}
                    </td>
                    <td className="date-cell">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <Link to={`/customer/tickets/${ticket._id}`} className="btn btn-outline-sm">
                        <Eye size={14} /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateTicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleTicketCreated}
      />
    </div>
  );
};

export default CustomerDashboard;
