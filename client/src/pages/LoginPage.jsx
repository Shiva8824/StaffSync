import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isExpired = searchParams.get('expired') === 'true';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const user = await login(email, password);
      showToast(`Welcome back, ${user.name}!`, 'success');

      // Navigate based on verified server-side role
      if (user.role === 'HR') {
        navigate('/hr-dashboard');
      } else if (user.role === 'Manager') {
        navigate('/manager-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to authenticate. Please check your credentials.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helper for 1-click demo login
  const fillDemoAccount = (role) => {
    if (role === 'HR') {
      setEmail('hr@staffsync.com');
      setPassword('Password123!');
    } else if (role === 'Manager') {
      setEmail('manager@staffsync.com');
      setPassword('Password123!');
    } else {
      setEmail('employee@staffsync.com');
      setPassword('Password123!');
    }
  };

  return (
    <div className="card shadow-lg border-0 p-4 p-sm-5 rounded-4 bg-white">
      <div className="text-center mb-4">
        <h3 className="fw-bold text-dark">Sign In</h3>
        <p className="text-secondary small">Access your StaffSync HRMS account</p>
      </div>

      {isExpired && (
        <div className="alert alert-warning py-2 small d-flex align-items-center gap-2 mb-3">
          <i className="bi bi-clock-history"></i>
          Your session expired. Please sign in again.
        </div>
      )}

      {errorMessage && (
        <div className="alert alert-danger py-2 small d-flex align-items-center gap-2 mb-3">
          <i className="bi bi-exclamation-octagon-fill"></i>
          {errorMessage}
        </div>
      )}

      {/* Demo Credentials Quick Switcher */}
      <div className="bg-light p-2.5 rounded-3 mb-4 border">
        <div className="text-muted small fw-semibold text-center mb-2" style={{ fontSize: '0.78rem' }}>
          <i className="bi bi-lightning-charge-fill text-warning me-1"></i>ONE-CLICK DEMO ACCOUNTS
        </div>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-primary flex-fill py-1 small"
            onClick={() => fillDemoAccount('HR')}
          >
            HR Admin
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-success flex-fill py-1 small"
            onClick={() => fillDemoAccount('Manager')}
          >
            Manager
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-info flex-fill py-1 small text-dark"
            onClick={() => fillDemoAccount('Employee')}
          >
            Employee
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label" htmlFor="email">Email Address</label>
          <div className="input-group">
            <span className="input-group-text bg-light text-secondary">
              <i className="bi bi-envelope"></i>
            </span>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="form-label" htmlFor="password">Password</label>
          <div className="input-group">
            <span className="input-group-text bg-light text-secondary">
              <i className="bi bi-lock"></i>
            </span>
            <input
              id="password"
              type="password"
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary w-100 py-2.5 fw-bold shadow-sm"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Authenticating...
            </>
          ) : (
            'Sign In to Dashboard'
          )}
        </button>
      </form>

      <div className="text-center mt-4 pt-2 border-top">
        <span className="text-secondary small">New employee? </span>
        <Link to="/register" className="small fw-bold text-decoration-none text-primary">
          Register for self-service
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
