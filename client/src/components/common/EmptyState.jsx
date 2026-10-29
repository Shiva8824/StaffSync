import React from 'react';

const EmptyState = ({
  icon = 'bi-inbox',
  title = 'No records found',
  description = 'There are no items to display at this time.',
  actionText,
  onAction,
}) => {
  return (
    <div className="card text-center p-5 my-3 border-dashed">
      <div className="mb-3 text-muted">
        <i className={`bi ${icon}`} style={{ fontSize: '3rem', opacity: 0.6 }}></i>
      </div>
      <h5 className="fw-semibold text-dark mb-1">{title}</h5>
      <p className="text-secondary small mb-3 mx-auto" style={{ maxWidth: '400px' }}>
        {description}
      </p>
      {actionText && onAction && (
        <div>
          <button className="btn btn-outline-primary btn-sm px-3" onClick={onAction}>
            {actionText}
          </button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
