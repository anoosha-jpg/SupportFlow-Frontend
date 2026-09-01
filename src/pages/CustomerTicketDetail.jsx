import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Wrench, Sparkles, Clock, Star, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import StarRating from '../components/StarRating';
import Conversation from '../components/Conversation';

const CustomerTicketDetail = () => {
  const { id } = useParams();
  const { socket, joinTicketRoom, leaveTicketRoom } = useSocket();
  const [ticket, setTicket] = useState(null);
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Review Form State
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewError, setReviewError] = useState('');

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/tickets/${id}`);
      if (res.data.success) {
        setTicket(res.data.data.ticket);
        setReview(res.data.data.review);
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

  // Real-time status / priority updates
  useEffect(() => {
    if (!socket) return;

    const handleTicketUpdate = (updatedTicket) => {
      if (updatedTicket._id === id) {
        setTicket(updatedTicket);
      }
    };

    const handleReviewSubmitted = (submittedReview) => {
      if (submittedReview.ticket === id || submittedReview.ticket?._id === id) {
        setReview(submittedReview);
      }
    };

    socket.on('ticket-accepted', handleTicketUpdate);
    socket.on('ticket-rejected', handleTicketUpdate);
    socket.on('ticket-status-updated', handleTicketUpdate);
    socket.on('ticket-priority-updated', handleTicketUpdate);
    socket.on('ticket-resolved', handleTicketUpdate);
    socket.on('review-submitted', handleReviewSubmitted);

    return () => {
      socket.off('ticket-accepted', handleTicketUpdate);
      socket.off('ticket-rejected', handleTicketUpdate);
      socket.off('ticket-status-updated', handleTicketUpdate);
      socket.off('ticket-priority-updated', handleTicketUpdate);
      socket.off('ticket-resolved', handleTicketUpdate);
      socket.off('review-submitted', handleReviewSubmitted);
    };
  }, [socket, id]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess('');

    if (!ratingInput || ratingInput < 1 || ratingInput > 5) {
      setReviewError('Please select a star rating between 1 and 5.');
      return;
    }

    try {
      setSubmittingReview(true);
      const res = await api.post(`/tickets/${id}/review`, {
        rating: ratingInput,
        comment: commentInput.trim()
      });
      if (res.data.success) {
        setReview(res.data.data);
        setReviewSuccess('Thank you! Your review and rating have been recorded.');
      }
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner-container">
        <div className="spinner"></div>
        <p>Loading request details...</p>
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
        <Link to="/customer" className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const isResolved = ticket.status === 'Resolved';

  return (
    <div className="dashboard-container">
      <div className="detail-top-nav">
        <Link to="/customer" className="back-breadcrumb">
          <ArrowLeft size={16} /> Back to My Requests
        </Link>
      </div>

      <div className="detail-layout">
        {/* Left Column: Request Details & Review */}
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
                <strong>Created:</strong> {new Date(ticket.createdAt).toLocaleString()}
              </span>
              {ticket.resolvedAt && (
                <span className="meta-item resolved-timestamp">
                  <strong>Resolved:</strong> {new Date(ticket.resolvedAt).toLocaleString()}
                </span>
              )}
            </div>

            <div className="ticket-description-box">
              <h3>Description</h3>
              <p>{ticket.description}</p>
            </div>

            {/* AI Triage Card */}
            {ticket.aiTriage && (
              <div className="ai-triage-card">
                <div className="ai-triage-header">
                  <Sparkles size={16} className="sparkle" />
                  <span>Deterministic AI Triage Analysis</span>
                  <span className="confidence-pill">
                    {Math.round((ticket.aiTriage.confidence || 0.85) * 100)}% Confidence
                  </span>
                </div>
                <p className="ai-triage-summary">{ticket.aiTriage.summary}</p>
                <div className="ai-triage-footer">
                  <span>Detected Category: <strong>{ticket.aiTriage.category}</strong></span>
                  <span>Calculated Urgency: <strong>{ticket.aiTriage.priority}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* 5-Star Customer Review Card */}
          <div className="section-card review-section-card">
            <div className="section-title-row">
              <div className="title-with-icon">
                <Star size={20} className="star-icon-header" />
                <h3>Customer Service Review</h3>
              </div>
            </div>

            {review ? (
              // Submitted Review View
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
                  <p className="review-comment-text text-muted">No written comment provided.</p>
                )}
                <div className="review-author">
                  <CheckCircle2 size={14} className="verified-icon" /> Verified Customer Feedback
                </div>
              </div>
            ) : isResolved ? (
              // Review Submission Form
              <div className="review-form-box">
                <p className="review-prompt">
                  Your request has been resolved! Please share your feedback and rate the service provided by{' '}
                  <strong>{ticket.assignedWorker?.name || 'the assigned worker'}</strong>.
                </p>

                {reviewSuccess && (
                  <div className="alert alert-success">
                    <CheckCircle2 size={16} />
                    <span>{reviewSuccess}</span>
                  </div>
                )}

                {reviewError && (
                  <div className="alert alert-error">
                    <AlertCircle size={16} />
                    <span>{reviewError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitReview} className="review-form">
                  <div className="rating-selector-wrapper">
                    <label>Overall Experience Rating (1 - 5 Stars) *</label>
                    <StarRating
                      value={ratingInput}
                      onChange={(newRating) => setRatingInput(newRating)}
                      size={28}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="reviewComment">Review Comment (Optional)</label>
                    <textarea
                      id="reviewComment"
                      className="form-control textarea"
                      rows={3}
                      placeholder="Share details about the quality, timeliness, and resolution..."
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      maxLength={1000}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submittingReview}
                  >
                    {submittingReview ? 'Submitting Review...' : 'Submit 5-Star Review'}
                  </button>
                </form>
              </div>
            ) : (
              // Not yet resolved message
              <div className="review-disabled-box">
                <Clock size={20} className="clock-icon" />
                <p>
                  Review and rating functionality will become available once the worker resolves this request.
                </p>
              </div>
            )}
          </div>

          {/* Status Timeline History */}
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
                <p className="text-muted">No timeline recorded.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Worker Profile & Conversation */}
        <div className="detail-side-col">
          {/* Worker Info Card */}
          <div className="section-card worker-profile-card">
            <h3>Assigned Support Specialist</h3>
            {ticket.assignedWorker ? (
              <div className="worker-info-box">
                <div className="worker-avatar-large">
                  <Wrench size={24} />
                </div>
                <div className="worker-info-details">
                  <h4>{ticket.assignedWorker.name}</h4>
                  <p className="worker-role-title">Certified Support Specialist</p>
                  <p className="worker-email">{ticket.assignedWorker.email}</p>
                </div>
              </div>
            ) : (
              <div className="unassigned-notice">
                <Clock size={20} />
                <p>This request is currently in the worker pool awaiting acceptance.</p>
              </div>
            )}
          </div>

          {/* Real-time Conversation Chat */}
          <Conversation ticketId={ticket._id} ticketStatus={ticket.status} />
        </div>
      </div>
    </div>
  );
};

export default CustomerTicketDetail;
