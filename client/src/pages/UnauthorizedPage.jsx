import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const UnauthorizedPage = () => {
  const { user } = useAuth();

  const getHomeLink = () => {
    if (!user) return '/login';
    if (user.role === 'HR') return '/hr-dashboard';
    if (user.role === 'Manager') return '/manager-dashboard';
    return '/dashboard';
  };

  return (
    <div className="container py-5 text-center my-auto">
      <div className="card shadow-sm p-5 mx-auto border-0" style={{ maxWidth: '540px' }}>
        <div className="text-danger mb-3">
          <i className="bi bi-shield-lock-fill" style={{ fontSize: '4rem' }}></i>
        </div>
        <h2 className="fw-bold text-dark mb-2">Access Denied (403)</h2>
        <p className="text-secondary mb-4">
          You do not have the required role permissions ({user?.role}) to access this specific module or resource.
        </p>
        <div>
          <Link to={getHomeLink()} className="btn btn-primary px-4">
            <i className="bi bi-house-door-fill me-2"></i>Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
