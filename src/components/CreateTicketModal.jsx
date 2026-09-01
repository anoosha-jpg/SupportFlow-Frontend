import React, { useState } from 'react';
import { X, Sparkles, AlertCircle } from 'lucide-react';
import api from '../services/api';

const CreateTicketModal = ({ isOpen, onClose, onCreated }) => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!subject.trim() || !description.trim()) {
      setError('Please provide both subject and description.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        subject: subject.trim(),
        description: description.trim()
      };
      if (category) {
        payload.category = category;
      }

      const res = await api.post('/tickets', payload);
      if (res.data.success) {
        setSubject('');
        setDescription('');
        setCategory('');
        onCreated(res.data.data);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <h2>Create New Support Request</h2>
            <p className="modal-subtitle">Our AI Triage system will automatically assess and prioritize your request for our workers.</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="subject">Subject / Problem Summary *</label>
            <input
              id="subject"
              type="text"
              className="form-control"
              placeholder="e.g., Cannot access billing invoice or download receipts"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category (Optional - AI will auto-categorize if left blank)</label>
            <select
              id="category"
              className="form-control"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Auto-Detect via AI Triage</option>
              <option value="Technical">Technical</option>
              <option value="Billing">Billing</option>
              <option value="Account">Account</option>
              <option value="Feature Request">Feature Request</option>
              <option value="General">General</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">Detailed Description *</label>
            <textarea
              id="description"
              className="form-control textarea"
              rows={5}
              placeholder="Please provide full details, error messages, or steps to reproduce..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="ai-hint-box">
            <Sparkles size={16} className="ai-sparkle-icon" />
            <div className="ai-hint-text">
              <strong>Smart Local AI Triage:</strong> SupportFlow analyzes your issue keywords locally to suggest initial priority and assign the best qualified worker.
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting Request...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicketModal;
