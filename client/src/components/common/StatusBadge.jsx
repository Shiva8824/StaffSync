import React from 'react';

const StatusBadge = ({ status }) => {
  if (!status) return null;

  const normalized = status.toString().trim().toLowerCase();

  let badgeClass = 'badge ';
  let icon = null;

  switch (normalized) {
    case 'present':
    case 'approved':
    case 'active':
    case 'completed':
      badgeClass += 'badge-present';
      icon = <i className="bi bi-check-circle me-1"></i>;
      break;

    case 'absent':
    case 'rejected':
    case 'terminated':
    case 'cancelled':
      badgeClass += 'badge-absent';
      icon = <i className="bi bi-x-circle me-1"></i>;
      break;

    case 'pending':
    case 'upcoming':
      badgeClass += 'badge-pending';
      icon = <i className="bi bi-clock me-1"></i>;
      break;

    case 'late':
      badgeClass += 'badge-late';
      icon = <i className="bi bi-exclamation-triangle me-1"></i>;
      break;

    case 'half-day':
    case 'ongoing':
    case 'in-progress':
    case 'on leave':
      badgeClass += 'badge-half-day';
      icon = <i className="bi bi-hourglass-split me-1"></i>;
      break;

    default:
      badgeClass += 'bg-secondary text-white';
  }

  return (
    <span className={badgeClass}>
      {icon}
      {status}
    </span>
  );
};

export default StatusBadge;
