import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="container py-5 text-center my-auto">
      <div className="card shadow-sm p-5 mx-auto border-0" style={{ maxWidth: '540px' }}>
        <div className="text-secondary mb-3">
          <i className="bi bi-question-circle" style={{ fontSize: '4rem' }}></i>
        </div>
        <h1 className="fw-bold text-dark display-5">404</h1>
        <h4 className="fw-semibold text-secondary mb-2">Page Not Found</h4>
        <p className="text-muted mb-4">
          The page or resource you are looking for does not exist or has been relocated.
        </p>
        <div>
          <Link to="/" className="btn btn-primary px-4">
            <i className="bi bi-arrow-left me-2"></i>Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
