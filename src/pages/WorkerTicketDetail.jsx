import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Sparkles,
  Clock,
  Star,
  CheckCircle2,
  AlertCircle,
  Play,
  Check,
  X,
  Flame,
  ShieldCheck
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import StarRating from '../components/StarRating';
import Conversation from '../components/Conversation';

const WorkerTicketDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket, joinTicketRoom, leaveTicketRoom } = useSocket();
  const [ticket, setTicket] = useState(null);
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [priorityLoading, setPriorityLoading] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/tickets/${id}`);
      if (res.data.success) {
        setTicket(res.data.data.ticket);
        setReview(res.data.data.review);
        setSelectedPriority(res.data.data.ticket.priority);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load request details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
    joinTicketRoom(id);

    return () => {
      leaveTicketRoom(id);
    };
  }, [id]);

  // Real-time socket events for live sync
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (updatedTicket) => {
      if (updatedTicket._id === id) {
        setTicket(updatedTicket);
        setSelectedPriority(updatedTicket.priority);
      }
    };

    const handleReview = (submittedReview) => {
      if (submittedReview.ticket === id || submittedReview.ticket?._id === id) {
        setReview(submittedReview);
      }
    };

    socket.on('ticket-status-updated', handleUpdate);
    socket.on('ticket-priority-updated', handleUpdate);
    socket.on('ticket-resolved', handleUpdate);
    socket.on('review-submitted', handleReview);

    return () => {
      socket.off('ticket-status-updated', handleUpdate);
      socket.off('ticket-priority-updated', handleUpdate);
      socket.off('ticket-resolved', handleUpdate);
      socket.off('review-submitted', handleReview);
    };
  }, [socket, id]);

  // Handle Accept
  const handleAccept = async () => {
    setError('');
    setMessage('');
    try {
      setActionLoading(true);
      const res = await api.post(`/workers/requests/${id}/accept`);
      if (res.data.success) {
        setTicket(res.data.data);
        setMessage('Request accepted. You are now the assigned specialist.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept request.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject
  const handleReject = async () => {
    setError('');
    setMessage('');
    try {
      setActionLoading(true);
      const res = await api.post(`/workers/requests/${id}/reject`, {
        reason: statusReason || 'Capacity unavailable'
      });
      if (res.data.success) {
        setTicket(res.data.data);
        setMessage('Request rejected.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject request.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Strict Status Transitions: Accepted -> In Progress -> Resolved
  const handleTransitionStatus = async (nextStatus) => {
    setError('');
    setMessage('');
    try {
      setActionLoading(true);
      const res = await api.put(`/workers/requests/${id}/status`, {
        status: nextStatus,
        reason: statusReason
      });
      if (res.data.success) {
        setTicket(res.data.data);
        setStatusReason('');
        setMessage(`Status transitioned to '${nextStatus}'.`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Priority Update
  const handlePriorityChange = async (newPriority) => {
    if (newPriority === ticket.priority) return;
    setError('');
    setMessage('');
    try {
      setPriorityLoading(true);
      const res = await api.put(`/workers/requests/${id}/priority`, {
        priority: newPriority
      });
      if (res.data.success) {
        setTicket(res.data.data);
        setSelectedPriority(newPriority);
        setMessage(`Operational priority updated to ${newPriority}. Customer has been notified.`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update priority.');
    } finally {
      setPriorityLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner-container">
        <div className="spinner"></div>
        <p>Loading worker request workspace...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="dashboard-container">
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error || 'Request not found.'}</span>
        </div>
        <Link to="/worker" className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to Worker Console
        </Link>
      </div>
    );
  }

  const isAssignedToMe = ticket.assignedWorker?._id === user._id || ticket.assignedWorker === user._id;

  return (
    <div className="dashboard-container">
      <div className="detail-top-nav">
        <Link to="/worker" className="back-breadcrumb">
          <ArrowLeft size={16} /> Back to Worker Dashboard
        </Link>
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

      <div className="detail-layout">
        {/* Left Column: Request Details, Status Action Controls, AI Triage, History */}
        <div className="detail-main-col">
          {/* Header Card */}
          <div className="section-card detail-header-card">
            <div className="ticket-header-meta">
              <span className="ticket-id-large">{ticket.ticketNumber}</span>
              <div className="badges-row">
                <PriorityBadge priority={ticket.priority} />
                <StatusBadge status={ticket.status} />
              </div>
            </div>

            <h1 className="ticket-detail-title">{ticket.subject}</h1>

            <div className="ticket-meta-strip">
              <span className="meta-item">
                <strong>Category:</strong> {ticket.category}
              </span>
              <span className="meta-item">
                <strong>Submitted:</strong> {new Date(ticket.createdAt).toLocaleString()}
              </span>
              {ticket.acceptedAt && (
                <span className="meta-item">
                  <strong>Accepted:</strong> {new Date(ticket.acceptedAt).toLocaleString()}
                </span>
              )}
            </div>

            <div className="ticket-description-box">
              <h3>Customer Problem Statement</h3>
              <p>{ticket.description}</p>
            </div>

            {/* AI Triage Card */}
            {ticket.aiTriage && (
              <div className="ai-triage-card">
                <div className="ai-triage-header">
                  <Sparkles size={16} className="sparkle" />
                  <span>Deterministic Rule AI Classification</span>
                  <span className="confidence-pill">
                    {Math.round((ticket.aiTriage.confidence || 0.85) * 100)}% Confidence
                  </span>
                </div>
                <p className="ai-triage-summary">{ticket.aiTriage.summary}</p>
                <div className="ai-triage-footer">
                  <span>Category Match: <strong>{ticket.aiTriage.category}</strong></span>
                  <span>Calculated Urgency: <strong>{ticket.aiTriage.priority}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Workflow Action Control Card - STRICT ONE-WAY STATE MACHINE */}
          <div className="section-card workflow-actions-card">
            <div className="section-title-row">
              <h3>Next Workflow Action</h3>
              <span className="workflow-subtext">One-way state progression</span>
            </div>

            {ticket.status === 'Pending' && (
              <div className="workflow-action-box">
                <p>This customer request is pending worker review. Accept to start or reject if out of capacity.</p>
                <div className="action-buttons-group large">
                  <button
                    className="btn btn-success"
                    onClick={handleAccept}
                    disabled={actionLoading}
                  >
                    <Check size={16} /> Accept Request
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={handleReject}
                    disabled={actionLoading}
                  >
                    <X size={16} /> Reject Request
                  </button>
                </div>
              </div>
            )}

            {ticket.status === 'Accepted' && isAssignedToMe && (
              <div className="workflow-action-box">
                <p>You have accepted this request. Transition to <strong>In Progress</strong> when actively diagnosing or working on the solution.</p>
                <button
                  className="btn btn-primary large-action"
                  onClick={() => handleTransitionStatus('In Progress')}
                  disabled={actionLoading}
                >
                  <Play size={16} /> Start Work (Move to In Progress)
                </button>
              </div>
            )}

            {ticket.status === 'In Progress' && isAssignedToMe && (
              <div className="workflow-action-box">
                <p>You are actively resolving this request. Once completed and verified, mark as <strong>Resolved</strong>.</p>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Resolution notes (e.g. Fixed database connection pool limit and added index)..."
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                  />
                </div>
                <button
                  className="btn btn-success large-action"
                  onClick={() => handleTransitionStatus('Resolved')}
                  disabled={actionLoading}
                >
                  <CheckCircle2 size={16} /> Mark Request as Resolved
                </button>
              </div>
            )}

            {ticket.status === 'Resolved' && (
              <div className="workflow-finalized-box resolved">
                <CheckCircle2 size={24} className="finalized-icon" />
                <div>
                  <h4>Request Completed & Resolved</h4>
                  <p>This request reached the finalized state on {new Date(ticket.resolvedAt || ticket.updatedAt).toLocaleString()}.</p>
                </div>
              </div>
            )}

            {ticket.status === 'Rejected' && (
              <div className="workflow-finalized-box rejected">
                <X size={24} className="finalized-icon" />
                <div>
                  <h4>Request Finalized (Rejected)</h4>
                  <p>This request was rejected and cannot return to the active workflow.</p>
                </div>
              </div>
            )}
          </div>

          {/* Customer Review Card (Visible if resolved) */}
          {review && (
            <div className="section-card review-section-card">
              <div className="section-title-row">
                <div className="title-with-icon">
                  <Star size={20} className="star-icon-header" />
                  <h3>Customer Rating & Review Received</h3>
                </div>
              </div>
              <div className="existing-review-box">
                <div className="review-header">
                  <StarRating value={review.rating} readOnly size={22} />
                  <span className="review-date">
                    Submitted on {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {review.comment ? (
                  <p className="review-comment-text">"{review.comment}"</p>
                ) : (
                  <p className="review-comment-text text-muted">Customer submitted a rating without text comment.</p>
                )}
              </div>
            </div>
          )}

          {/* Status Timeline */}
          <div className="section-card">
            <h3>Status History</h3>
            <div className="timeline">
              {ticket.statusHistory && ticket.statusHistory.length > 0 ? (
                ticket.statusHistory.map((step, idx) => (
                  <div key={idx} className="timeline-item">
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <div className="timeline-status-header">
                        <StatusBadge status={step.status} />
                        <span className="timeline-time">
                          {new Date(step.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {step.reason && <p className="timeline-reason">{step.reason}</p>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted">No status history recorded.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Customer Info, Priority Selector, Chat */}
        <div className="detail-side-col">
          {/* Customer Info Card */}
          <div className="section-card customer-info-card">
            <h3>Customer Details</h3>
            <div className="customer-meta-row">
              <div className="customer-avatar-badge">
                <User size={20} />
              </div>
              <div className="customer-meta-text">
                <h4>{ticket.customer?.name || 'Customer'}</h4>
                <p>{ticket.customer?.email || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Worker Operational Priority Control */}
          <div className="section-card priority-control-card">
            <div className="priority-header">
              <Flame size={18} className="flame-icon" />
              <h3>Operational Priority Control</h3>
            </div>
            <p className="priority-subtext">
              As the assigned specialist, you control operational priority. Adjusting this notifies the customer.
            </p>

            <div className="priority-buttons-grid">
              {['Low', 'Medium', 'High', 'Critical', 'Urgent'].map((pr) => (
                <button
                  key={pr}
                  type="button"
                  className={`priority-select-btn ${pr.toLowerCase()} ${selectedPriority === pr ? 'active' : ''}`}
                  onClick={() => handlePriorityChange(pr)}
                  disabled={priorityLoading || !isAssignedToMe || ticket.status === 'Resolved' || ticket.status === 'Rejected'}
                >
                  {pr}
                </button>
              ))}
            </div>
          </div>

          {/* Real-time Conversation */}
          <Conversation ticketId={ticket._id} ticketStatus={ticket.status} />
        </div>
      </div>
    </div>
  );
};

export default WorkerTicketDetail;
