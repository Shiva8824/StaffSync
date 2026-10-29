import React from 'react';
import { Outlet, Link } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div
      className="min-vh-100 d-flex flex-column align-items-center justify-content-center py-5 px-3"
      style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F3C68 100%)',
      }}
    >
      <div className="mb-4 text-center">
        <Link to="/" className="text-decoration-none d-inline-flex align-items-center gap-2">
          <div
            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center shadow"
            style={{ width: '48px', height: '48px', fontSize: '1.5rem' }}
          >
            <i className="bi bi-diagram-3-fill"></i>
          </div>
          <span className="fs-3 fw-bold text-white tracking-tight">StaffSync</span>
        </Link>
        <p className="text-light text-opacity-75 small mt-1 mb-0">
          Smart Human Resource Management Platform
        </p>
      </div>

      <div className="w-100" style={{ maxWidth: '480px' }}>
        <Outlet />
      </div>

      <div className="mt-4 text-center text-light text-opacity-50 small">
        StaffSync &copy; {new Date().getFullYear()} &bull; SmartBridge Experiential Learning Capstone
      </div>
    </div>
  );
};

export default AuthLayout;
