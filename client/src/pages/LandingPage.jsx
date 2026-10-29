import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { isAuthenticated, user } = useAuth();

  const getDashboardLink = () => {
    if (!user) return '/dashboard';
    if (user.role === 'HR') return '/hr-dashboard';
    if (user.role === 'Manager') return '/manager-dashboard';
    return '/dashboard';
  };

  return (
    <div className="bg-white min-vh-100 d-flex flex-column">
      {/* Navigation Bar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom py-3 sticky-top">
        <div className="container">
          <Link to="/" className="navbar-brand d-flex align-items-center gap-2">
            <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
              <i className="bi bi-diagram-3-fill"></i>
            </div>
            <span className="fw-bold fs-4 text-dark">StaffSync</span>
          </Link>

          <div className="d-flex align-items-center gap-2">
            {isAuthenticated ? (
              <Link to={getDashboardLink()} className="btn btn-primary px-4">
                <i className="bi bi-speedometer2 me-2"></i>Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-primary px-3">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary px-3 d-none d-sm-inline-block">
                  Register Employee
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-5 my-auto" style={{ background: 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)' }}>
        <div className="container py-4">
          <div className="row align-items-center gy-5">
            <div className="col-lg-7">
              <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill fw-semibold mb-3">
                <i className="bi bi-award-fill me-1"></i> SmartBridge Experiential Learning Capstone
              </span>
              <h1 className="display-4 fw-extrabold text-dark tracking-tight mb-3">
                Modern Human Resource Management Made Simple & Powerful
              </h1>
              <p className="lead text-secondary mb-4" style={{ fontSize: '1.2rem', lineHeight: '1.7' }}>
                StaffSync streamlines employee records, real-time daily attendance, multi-tiered leave approvals, corporate announcements, and employee upskilling in one unified MERN platform.
              </p>

              <div className="d-flex flex-wrap gap-3 mb-4">
                <Link to="/login" className="btn btn-primary btn-lg px-4 shadow-sm">
                  <i className="bi bi-box-arrow-in-right me-2"></i>Launch System
                </Link>
                <Link to="/register" className="btn btn-outline-secondary btn-lg px-4">
                  <i className="bi bi-person-plus me-2"></i>Employee Self-Service
                </Link>
              </div>

              {/* Demo Credentials Box */}
              <div className="card bg-light border p-3 rounded-3 shadow-sm">
                <div className="fw-bold text-dark small mb-2 d-flex align-items-center gap-2">
                  <i className="bi bi-key-fill text-warning"></i>
                  Quick Demonstration Accounts (Password: Password123!)
                </div>
                <div className="row g-2 small">
                  <div className="col-sm-4">
                    <span className="badge bg-primary text-white w-100 py-1.5">
                      HR: hr@staffsync.com
                    </span>
                  </div>
                  <div className="col-sm-4">
                    <span className="badge bg-success text-white w-100 py-1.5">
                      Manager: manager@staffsync.com
                    </span>
                  </div>
                  <div className="col-sm-4">
                    <span className="badge bg-info text-dark w-100 py-1.5">
                      Employee: employee@staffsync.com
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-5">
              <div className="card shadow-lg border-0 p-4 rounded-4" style={{ background: '#0F172A', color: '#fff' }}>
                <div className="d-flex align-items-center justify-content-between mb-4 border-bottom border-secondary border-opacity-50 pb-3">
                  <div className="d-flex align-items-center gap-2">
                    <span className="p-2 bg-primary rounded-circle text-white">
                      <i className="bi bi-shield-check"></i>
                    </span>
                    <strong className="fs-5">StaffSync Features</strong>
                  </div>
                  <span className="badge bg-success">Role-Based Access</span>
                </div>

                <div className="d-flex flex-column gap-3">
                  <div className="d-flex align-items-start gap-3">
                    <div className="bg-white bg-opacity-10 p-2 rounded-3 text-info">
                      <i className="bi bi-fingerprint fs-5"></i>
                    </div>
                    <div>
                      <div className="fw-bold">Smart Attendance Tracker</div>
                      <div className="small text-white-50">One-click daily check-in/out with duplicate prevention & duration tracking.</div>
                    </div>
                  </div>

                  <div className="d-flex align-items-start gap-3">
                    <div className="bg-white bg-opacity-10 p-2 rounded-3 text-warning">
                      <i className="bi bi-calendar2-check fs-5"></i>
                    </div>
                    <div>
                      <div className="fw-bold">Leave Approval Workflow</div>
                      <div className="small text-white-50">Conflict detection, overlap prevention, and manager review with instant notifications.</div>
                    </div>
                  </div>

                  <div className="d-flex align-items-start gap-3">
                    <div className="bg-white bg-opacity-10 p-2 rounded-3 text-success">
                      <i className="bi bi-people-fill fs-5"></i>
                    </div>
                    <div>
                      <div className="fw-bold">Employee Directory & Profiles</div>
                      <div className="small text-white-50">Comprehensive records, department filtering, and manager team supervision.</div>
                    </div>
                  </div>

                  <div className="d-flex align-items-start gap-3">
                    <div className="bg-white bg-opacity-10 p-2 rounded-3 text-primary">
                      <i className="bi bi-mortarboard-fill fs-5"></i>
                    </div>
                    <div>
                      <div className="fw-bold">Corporate Training Programs</div>
                      <div className="small text-white-50">Upskill teams, manage workshop capacities, and track employee enrollment.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-4 border-top bg-light mt-auto">
        <div className="container text-center text-secondary small">
          StaffSync &bull; Built with React, Express, MongoDB & Node.js &bull; SmartBridge Experiential Learning Capstone Project
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
