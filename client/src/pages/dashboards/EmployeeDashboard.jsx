import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { dashboardApi, attendanceApi } from '../../api/services';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate, formatTime } from '../../utils/formatters';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState('');

  const fetchDashboard = async () => {
    try {
      const res = await dashboardApi.getStats();
      if (res.data.success) {
        setDashboardData(res.data.data);
      }
    } catch (err) {
      showToast('Failed to load dashboard metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const res = await attendanceApi.checkIn({ notes });
      showToast(res.data.message || 'Checked in successfully!', 'success');
      setNotes('');
      fetchDashboard();
    } catch (err) {
      showToast(err.response?.data?.message || 'Check-in failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const res = await attendanceApi.checkOut({ notes });
      showToast(res.data.message || 'Checked out successfully!', 'success');
      setNotes('');
      fetchDashboard();
    } catch (err) {
      showToast(err.response?.data?.message || 'Check-out failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading your employee portal..." />;
  }

  const { employeeProfile, todayAttendance, leavesSummary, recentLeaves, recentAnnouncements, trainings } =
    dashboardData || {};

  const isCheckedIn = !!todayAttendance;
  const isCheckedOut = !!(todayAttendance && todayAttendance.checkOut);

  return (
    <div className="container-fluid px-0">
      {/* Welcome Banner */}
      <div className="card border-0 bg-primary text-white p-4 mb-4 rounded-4 shadow-sm position-relative overflow-hidden">
        <div className="row align-items-center position-relative" style={{ zIndex: 1 }}>
          <div className="col-md-8">
            <span className="badge bg-white bg-opacity-25 text-white mb-2 px-3 py-1.5">
              Employee Self-Service Portal
            </span>
            <h2 className="fw-bold mb-1">Welcome back, {user?.name}!</h2>
            <p className="mb-0 text-white-50">
              {employeeProfile?.jobTitle} &bull; {employeeProfile?.department} Department &bull; ID:{' '}
              {employeeProfile?.employeeId}
            </p>
          </div>
          <div className="col-md-4 text-md-end mt-3 mt-md-0">
            <Link to="/leaves" className="btn btn-light fw-semibold text-primary px-3 py-2 shadow-sm me-2">
              <i className="bi bi-calendar-plus me-1"></i>Apply Leave
            </Link>
            <Link to="/profile" className="btn btn-outline-light px-3 py-2">
              Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Attendance & Stats Row */}
      <div className="row g-3 mb-4">
        {/* Today's Attendance Card */}
        <div className="col-lg-5 col-xl-4">
          <div className="card h-100 shadow-sm border-0 p-3.5">
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
              <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-stopwatch text-primary fs-5"></i>
                Today's Attendance
              </h6>
              {todayAttendance && <StatusBadge status={todayAttendance.status} />}
            </div>

            <div className="mb-3">
              <div className="d-flex justify-content-between text-secondary small mb-1">
                <span>Date:</span>
                <strong className="text-dark">{new Date().toDateString()}</strong>
              </div>
              <div className="d-flex justify-content-between text-secondary small mb-1">
                <span>Check-in Time:</span>
                <strong className="text-dark">{todayAttendance ? formatTime(todayAttendance.checkIn) : 'Not checked in yet'}</strong>
              </div>
              <div className="d-flex justify-content-between text-secondary small mb-3">
                <span>Check-out Time:</span>
                <strong className="text-dark">{isCheckedOut ? formatTime(todayAttendance.checkOut) : isCheckedIn ? 'Active shift...' : '-'}</strong>
              </div>

              {!isCheckedOut && (
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Optional note / task summary..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              )}

              <div className="d-grid gap-2">
                {!isCheckedIn ? (
                  <button
                    className="btn btn-primary py-2 fw-semibold"
                    onClick={handleCheckIn}
                    disabled={actionLoading}
                  >
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    {actionLoading ? 'Recording...' : 'Check In Now'}
                  </button>
                ) : !isCheckedOut ? (
                  <button
                    className="btn btn-danger py-2 fw-semibold"
                    onClick={handleCheckOut}
                    disabled={actionLoading}
                  >
                    <i className="bi bi-box-arrow-left me-2"></i>
                    {actionLoading ? 'Recording...' : 'Check Out Now'}
                  </button>
                ) : (
                  <div className="alert alert-success py-2 text-center small mb-0">
                    <i className="bi bi-check-circle-fill me-1"></i>Shift completed for today!
                  </div>
                )}
              </div>
            </div>

            <div className="mt-auto pt-2 border-top text-center">
              <Link to="/attendance" className="text-decoration-none small text-primary fw-semibold">
                View Attendance History &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Leave Allowance Metrics */}
        <div className="col-lg-7 col-xl-8">
          <div className="row g-3 h-100">
            <div className="col-sm-6 col-md-4">
              <StatCard
                title="Annual Leave Balance"
                value={`${leavesSummary?.remainingAnnualAllowance ?? 24} Days`}
                icon="bi-sun"
                color="primary"
                subtitle="Out of 24 days annual quota"
              />
            </div>
            <div className="col-sm-6 col-md-4">
              <StatCard
                title="Pending Requests"
                value={leavesSummary?.pending || 0}
                icon="bi-hourglass-split"
                color="warning"
                subtitle="Awaiting manager review"
              />
            </div>
            <div className="col-sm-6 col-md-4">
              <StatCard
                title="Approved Leaves"
                value={leavesSummary?.approved || 0}
                icon="bi-check-all"
                color="success"
                subtitle="Total approved this year"
              />
            </div>

            {/* Quick Profile Summary Box */}
            <div className="col-12 mt-3">
              <div className="card shadow-sm border-0 p-3 bg-light">
                <div className="row align-items-center g-2 text-secondary small">
                  <div className="col-sm-4">
                    <i className="bi bi-person me-1 text-primary"></i>
                    Manager: <strong className="text-dark">{employeeProfile?.manager?.fullName || 'HR Direct'}</strong>
                  </div>
                  <div className="col-sm-4">
                    <i className="bi bi-telephone me-1 text-primary"></i>
                    Phone: <strong className="text-dark">{employeeProfile?.phoneNumber || 'Not provided'}</strong>
                  </div>
                  <div className="col-sm-4">
                    <i className="bi bi-calendar-event me-1 text-primary"></i>
                    Joined: <strong className="text-dark">{formatDate(employeeProfile?.joiningDate)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Sections: Leaves & Announcements */}
      <div className="row g-4">
        {/* Recent Leave Requests */}
        <div className="col-lg-6">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-header bg-white border-bottom py-3 d-flex align-items-center justify-content-between">
              <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-calendar2-range text-primary"></i>
                My Recent Leave Applications
              </h6>
              <Link to="/leaves" className="text-decoration-none small text-primary fw-semibold">
                Manage Leaves
              </Link>
            </div>
            <div className="card-body p-0">
              {recentLeaves && recentLeaves.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Dates</th>
                        <th>Days</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentLeaves.map((leave) => (
                        <tr key={leave._id}>
                          <td className="fw-semibold text-dark">{leave.leaveType}</td>
                          <td className="small text-secondary">
                            {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                          </td>
                          <td className="small">{leave.daysCount} d</td>
                          <td>
                            <StatusBadge status={leave.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center p-4 text-muted small">
                  No recent leave requests. Click "Apply Leave" above if you need time off.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Company Announcements */}
        <div className="col-lg-6">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-header bg-white border-bottom py-3 d-flex align-items-center justify-content-between">
              <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-megaphone text-info"></i>
                Company Announcements
              </h6>
              <Link to="/announcements" className="text-decoration-none small text-primary fw-semibold">
                View All
              </Link>
            </div>
            <div className="card-body p-3">
              {recentAnnouncements && recentAnnouncements.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                  {recentAnnouncements.map((item) => (
                    <div key={item._id} className="p-3 bg-light rounded-3 border-start border-3 border-primary">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span className="fw-bold text-dark">{item.title}</span>
                        <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                          {formatDate(item.publicationDate)}
                        </span>
                      </div>
                      <p className="text-secondary small mb-0 text-truncate">{item.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 text-muted small">No announcements posted currently.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
