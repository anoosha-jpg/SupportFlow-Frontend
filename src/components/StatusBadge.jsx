import React from 'react';

const StatusBadge = ({ status }) => {
  const getStatusClass = (st) => {
    switch (st?.toLowerCase()) {
      case 'new':
        return 'badge-new';
      case 'pending':
        return 'badge-pending';
      case 'accepted':
        return 'badge-accepted';
      case 'in progress':
        return 'badge-in-progress';
      case 'resolved':
        return 'badge-resolved';
      case 'rejected':
        return 'badge-rejected';
      default:
        return 'badge-default';
    }
  };

  return <span className={`status-badge ${getStatusClass(status)}`}>{status || 'Pending'}</span>;
};

export default StatusBadge;
