import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: 'Engineering',
    jobTitle: 'Software Engineer',
    phoneNumber: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const user = await register(formData);
      showToast('Registration successful! Welcome to StaffSync.', 'success');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to register account.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card shadow-lg border-0 p-4 p-sm-5 rounded-4 bg-white">
      <div className="text-center mb-4">
        <h3 className="fw-bold text-dark">Employee Registration</h3>
        <p className="text-secondary small">Create your employee self-service account</p>
      </div>

      <div className="alert alert-info py-2 small d-flex align-items-center gap-2 mb-3">
        <i className="bi bi-info-circle-fill"></i>
        <span>Public registration creates an Employee account. HR profiles are provisioned by administrators.</span>
      </div>

      {errorMessage && (
        <div className="alert alert-danger py-2 small d-flex align-items-center gap-2 mb-3">
          <i className="bi bi-exclamation-octagon-fill"></i>
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label" htmlFor="name">Full Name</label>
          <input
            id="name"
            name="name"
            type="text"
            className="form-control"
            placeholder="e.g. Jane Doe"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="regEmail">Work Email</label>
          <input
            id="regEmail"
            name="email"
            type="email"
            className="form-control"
            placeholder="jane@company.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="regPassword">Password (minimum 6 characters)</label>
          <input
            id="regPassword"
            name="password"
            type="password"
            className="form-control"
            placeholder="Create a strong password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
          />
        </div>

        <div className="row g-2 mb-3">
          <div className="col-sm-6">
            <label className="form-label" htmlFor="department">Department</label>
            <select
              id="department"
              name="department"
              className="form-select"
              value={formData.department}
              onChange={handleChange}
            >
              <option value="Engineering">Engineering</option>
              <option value="Marketing">Marketing</option>
              <option value="Sales">Sales</option>
              <option value="Finance">Finance</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Operations">Operations</option>
            </select>
          </div>
          <div className="col-sm-6">
            <label className="form-label" htmlFor="jobTitle">Job Title</label>
            <input
              id="jobTitle"
              name="jobTitle"
              type="text"
              className="form-control"
              placeholder="e.g. QA Engineer"
              value={formData.jobTitle}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="form-label" htmlFor="phoneNumber">Phone Number (Optional)</label>
          <input
            id="phoneNumber"
            name="phoneNumber"
            type="text"
            className="form-control"
            placeholder="+1 (555) 000-0000"
            value={formData.phoneNumber}
            onChange={handleChange}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary w-100 py-2.5 fw-bold shadow-sm"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Creating Account...
            </>
          ) : (
            'Complete Registration'
          )}
        </button>
      </form>

      <div className="text-center mt-4 pt-2 border-top">
        <span className="text-secondary small">Already have an account? </span>
        <Link to="/login" className="small fw-bold text-decoration-none text-primary">
          Sign In
        </Link>
      </div>
    </div>
  );
};

export default RegisterPage;
