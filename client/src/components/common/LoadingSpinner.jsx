import React from 'react';

const LoadingSpinner = ({ message = 'Loading details...' }) => {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center p-5 my-3">
      <div className="spinner-border text-primary" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
        <span className="visually-hidden">Loading...</span>
      </div>
      {message && <p className="text-muted mt-3 mb-0 small">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
