import React from 'react';

const PriorityBadge = ({ priority }) => {
  const getPriorityClass = (pr) => {
    switch (pr?.toLowerCase()) {
      case 'urgent':
        return 'priority-urgent';
      case 'critical':
        return 'priority-critical';
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return 'priority-medium';
    }
  };

  return <span className={`priority-badge ${getPriorityClass(priority)}`}>{priority || 'Medium'}</span>;
};

export default PriorityBadge;
