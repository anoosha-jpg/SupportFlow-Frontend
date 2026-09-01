import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Users,
  Wrench,
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  AlertCircle,
  Check,
  X,
  Power,
  Layers,
  Sparkles,
  Eye
} from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';

const AdminDashboard = () => {
  const { socket } = useSocket();
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalWorkers: 0,
    pendingWorkers: 0,
    approvedWorkers: 0,
    rejectedWorkers: 0,
    totalTickets: 0,
    resolvedTickets: 0,
    totalReviews: 0
  });

  const [activeTab, setActiveTab] = useState('worker-requests');
  const [workerRequests, setWorkerRequests] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [ticketsList, setTicketsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, reqsRes, usersRes, ticketsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/worker-requests'),
        api.get('/admin/users'),
        api.get('/admin/tickets')
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (reqsRes.data.success) setWorkerRequests(reqsRes.data.data);
      if (usersRes.data.success) setUsersList(usersRes.data.data);
      if (ticketsRes.data.success) setTicketsList(ticketsRes.data.data);
    } catch (err) {
      console.error('[AdminDashboard] Error loading admin console:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Listen to Socket.IO real-time worker application submissions
  useEffect(() => {
    if (!socket) return;

    const handleNewWorkerApp = (app) => {
      setWorkerRequests((prev) => [
        {
          _id: app.workerId,
          name: app.name,
          email: app.email,
          role: 'worker',
          workerApprovalStatus: 'pending',
          isActive: false,
          createdAt: app.createdAt
        },
        ...prev
      ]);
      setStats((prev) => ({
        ...prev,
        totalWorkers: prev.totalWorkers + 1,
        pendingWorkers: prev.pendingWorkers + 1
      }));
    };

    socket.on('worker-application-created', handleNewWorkerApp);

    return () => {
      socket.off('worker-application-created', handleNewWorkerApp);
    };
  }, [socket]);

  // Handle Worker Approval
  const handleApproveWorker = async (workerId) => {
    setError('');
    setMessage('');
    try {
      setActionLoading((prev) => ({ ...prev, [workerId]: 'approve' }));
      const res = await api.post(`/admin/workers/${workerId}/approve`);
      if (res.data.success) {
        setMessage(res.data.message);
        setWorkerRequests((prev) =>
          prev.map((w) => (w._id === workerId ? { ...w, workerApprovalStatus: 'approved', isActive: true } : w))
        );
        setStats((prev) => ({
          ...prev,
          pendingWorkers: Math.max(0, prev.pendingWorkers - 1),
          approvedWorkers: prev.approvedWorkers + 1
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve worker.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [workerId]: null }));
    }
  };

  // Handle Worker Rejection
  const handleRejectWorker = async (workerId) => {
    setError('');
    setMessage('');
    try {
      setActionLoading((prev) => ({ ...prev, [workerId]: 'reject' }));
      const res = await api.post(`/admin/workers/${workerId}/reject`);
      if (res.data.success) {
        setMessage(res.data.message);
        setWorkerRequests((prev) =>
          prev.map((w) => (w._id === workerId ? { ...w, workerApprovalStatus: 'rejected', isActive: false } : w))
        );
        setStats((prev) => ({
          ...prev,
          pendingWorkers: Math.max(0, prev.pendingWorkers - 1),
          rejectedWorkers: prev.rejectedWorkers + 1
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject worker.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [workerId]: null }));
    }
  };

  // Toggle user activation status
  const handleToggleUser = async (userId) => {
    setError('');
    setMessage('');
    try {
      setActionLoading((prev) => ({ ...prev, [userId]: 'toggle' }));
      const res = await api.put(`/admin/users/${userId}/toggle-status`);
      if (res.data.success) {
        setMessage(res.data.message);
        setUsersList((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, isActive: res.data.data.isActive } : u))
        );
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user status.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: null }));
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Platform Administration Console</h1>
          <p className="dashboard-subtitle">
            System control center for Worker approvals, account governance, and overall platform monitoring.
          </p>
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

      {/* Admin Statistics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon customers">
            <Users size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Customers</span>
            <span className="metric-value">{stats.totalCustomers}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon total">
            <Wrench size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Workers</span>
            <span className="metric-value">{stats.totalWorkers}</span>
          </div>
        </div>

        <div className="metric-card" onClick={() => setActiveTab('worker-requests')}>
          <div className="metric-icon pending">
            <Clock size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Pending Worker Apps</span>
            <span className="metric-value">{stats.pendingWorkers}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon approved">
            <UserCheck size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Approved Workers</span>
            <span className="metric-value">{stats.approvedWorkers}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon rejected">
            <UserX size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Rejected Apps</span>
            <span className="metric-value">{stats.rejectedWorkers}</span>
          </div>
        </div>

        <div className="metric-card" onClick={() => setActiveTab('tickets')}>
          <div className="metric-icon resolved">
            <CheckCircle2 size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Resolved Requests</span>
            <span className="metric-value">{stats.resolvedTickets} / {stats.totalTickets}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="section-card">
        <div className="table-header-row">
          <div className="tabs-container">
            <button
              className={`tab-btn ${activeTab === 'worker-requests' ? 'active' : ''}`}
              onClick={() => setActiveTab('worker-requests')}
            >
              Worker Applications ({workerRequests.filter((w) => w.workerApprovalStatus === 'pending').length} Pending)
            </button>
            <button
              className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              User Governance ({usersList.length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'tickets' ? 'active' : ''}`}
              onClick={() => setActiveTab('tickets')}
            >
              All Support Requests ({ticketsList.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Worker Requests & Approvals */}
        {activeTab === 'worker-requests' && (
          <div>
            {loading ? (
              <div className="loading-spinner-container">
                <div className="spinner"></div>
                <p>Loading worker applications...</p>
              </div>
            ) : workerRequests.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👷</div>
                <h3>No Worker applications recorded</h3>
                <p>New worker registrations will appear here for review and authorization.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Applicant Name</th>
                      <th>Email Address</th>
                      <th>Application Date</th>
                      <th>Approval Status</th>
                      <th>Account State</th>
                      <th>Admin Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workerRequests.map((worker) => (
                      <tr key={worker._id}>
                        <td>
                          <strong>{worker.name}</strong>
                        </td>
                        <td>{worker.email}</td>
                        <td className="date-cell">
                          {new Date(worker.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          {worker.workerApprovalStatus === 'approved' && (
                            <span className="badge-approved">Approved</span>
                          )}
                          {worker.workerApprovalStatus === 'pending' && (
                            <span className="badge-pending">Pending Approval</span>
                          )}
                          {worker.workerApprovalStatus === 'rejected' && (
                            <span className="badge-rejected">Rejected</span>
                          )}
                        </td>
                        <td>
                          {worker.isActive ? (
                            <span className="status-pill active">Active</span>
                          ) : (
                            <span className="status-pill inactive">Inactive</span>
                          )}
                        </td>
                        <td>
                          <div className="action-buttons-group">
                            {worker.workerApprovalStatus === 'pending' ? (
                              <>
                                <button
                                  className="btn btn-success-sm"
                                  onClick={() => handleApproveWorker(worker._id)}
                                  disabled={!!actionLoading[worker._id]}
                                >
                                  <Check size={14} /> Approve
                                </button>
                                <button
                                  className="btn btn-danger-sm"
                                  onClick={() => handleRejectWorker(worker._id)}
                                  disabled={!!actionLoading[worker._id]}
                                >
                                  <X size={14} /> Reject
                                </button>
                              </>
                            ) : worker.workerApprovalStatus === 'approved' ? (
                              <button
                                className="btn btn-outline-danger-sm"
                                onClick={() => handleRejectWorker(worker._id)}
                                disabled={!!actionLoading[worker._id]}
                              >
                                Revoke Approval
                              </button>
                            ) : (
                              <button
                                className="btn btn-outline-success-sm"
                                onClick={() => handleApproveWorker(worker._id)}
                                disabled={!!actionLoading[worker._id]}
                              >
                                Re-Approve
                              </button>
                            )}
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

        {/* Tab 2: User Governance */}
        {activeTab === 'users' && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Account Status</th>
                  <th>Registered</th>
                  <th>Toggle State</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <strong>{u.name}</strong>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`role-pill pill-${u.role}`}>{u.role}</span>
                    </td>
                    <td>
                      {u.isActive ? (
                        <span className="status-pill active">Active</span>
                      ) : (
                        <span className="status-pill inactive">Deactivated</span>
                      )}
                    </td>
                    <td className="date-cell">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      {u.role !== 'admin' && (
                        <button
                          className={`btn ${u.isActive ? 'btn-outline-danger-sm' : 'btn-outline-success-sm'}`}
                          onClick={() => handleToggleUser(u._id)}
                          disabled={!!actionLoading[u._id]}
                        >
                          <Power size={14} /> {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: System Tickets */}
        {activeTab === 'tickets' && (
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
                  <th>Assigned Worker</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {ticketsList.map((ticket) => (
                  <tr key={ticket._id}>
                    <td>
                      <span className="ticket-id-tag">{ticket.ticketNumber}</span>
                    </td>
                    <td>
                      <div className="ticket-subject-cell">
                        <strong>{ticket.subject}</strong>
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
                    <td>{ticket.customer?.name}</td>
                    <td>{ticket.assignedWorker ? ticket.assignedWorker.name : 'Unassigned'}</td>
                    <td className="date-cell">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
