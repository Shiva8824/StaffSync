import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { dashboardApi } from '../../api/services';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/formatters';

const HrDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await dashboardApi.getStats();
      if (res.data.success) {
        setDashboardData(res.data.data);
      }
    } catch (err) {
      showToast('Failed to load HR dashboard metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Calculating organization HR metrics..." />;
  }

  const {
    metrics,
    departmentDistribution,
    attendanceSummary,
    recentPendingLeaves,
    recentAnnouncements,
  } = dashboardData || {};

  return (
    <div className="container-fluid px-0">
      {/* Welcome Banner */}
      <div
        className="card border-0 text-white p-4 mb-4 rounded-4 shadow-sm position-relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1044A9 100%)' }}
      >
        <div className="row align-items-center">
          <div className="col-md-7">
            <span className="badge bg-white bg-opacity-25 text-white mb-2 px-3 py-1.5">
              Human Resources Command Center
            </span>
            <h2 className="fw-bold mb-1">Welcome, HR Admin {user?.name}!</h2>
            <p className="mb-0 text-white-50">
              Organization Overview &bull; Total Workforce: {metrics?.totalEmployees || 0} Registered Employees
            </p>
          </div>
          <div className="col-md-5 text-md-end mt-3 mt-md-0 d-flex flex-wrap gap-2 justify-content-md-end">
            <Link to="/employees" className="btn btn-light text-primary fw-semibold px-3 py-2 shadow-sm">
              <i className="bi bi-person-plus-fill me-1"></i>Employee Directory
            </Link>
            <Link to="/attendance" className="btn btn-outline-light px-3 py-2">
              Attendance
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-3">
          <StatCard
            title="Active Workforce"
            value={metrics?.activeEmployees || 0}
            icon="bi-people-fill"
            color="primary"
            subtitle={`${metrics?.onLeaveEmployees || 0} on official leave`}
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <StatCard
            title="Present Today"
            value={metrics?.todayPresent || 0}
            icon="bi-calendar-check-fill"
            color="success"
            subtitle={`${attendanceSummary?.late || 0} marked late`}
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <StatCard
            title="Absent Today"
            value={metrics?.todayAbsent || 0}
            icon="bi-person-x-fill"
            color="danger"
            subtitle="Not checked in today"
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <StatCard
            title="Pending Leaves"
            value={metrics?.pendingLeaves || 0}
            icon="bi-hourglass-split"
            color="warning"
            subtitle="Awaiting authorization"
          />
        </div>
      </div>

      {/* Shortcuts & Operations Bar */}
      <div className="card shadow-sm border-0 mb-4 p-3 bg-light">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <span className="fw-bold text-dark small text-uppercase" style={{ letterSpacing: '0.05em' }}>
            <i className="bi bi-lightning-fill text-warning me-1"></i>Quick Actions
          </span>
          <div className="d-flex flex-wrap gap-2">
            <Link to="/employees" className="btn btn-sm btn-white border shadow-sm">
              <i className="bi bi-person-plus text-primary me-1"></i>Add / Manage Employees
            </Link>
            <Link to="/attendance" className="btn btn-sm btn-white border shadow-sm">
              <i className="bi bi-file-earmark-spreadsheet text-success me-1"></i>Attendance Logs
            </Link>
            <Link to="/leaves" className="btn btn-sm btn-white border shadow-sm">
              <i className="bi bi-check2-square text-warning me-1"></i>Review Leaves
            </Link>
            <Link to="/announcements" className="btn btn-sm btn-white border shadow-sm">
              <i className="bi bi-broadcast text-info me-1"></i>Broadcast Announcement
            </Link>
            <Link to="/trainings" className="btn btn-sm btn-white border shadow-sm">
              <i className="bi bi-mortarboard text-danger me-1"></i>New Training
            </Link>
          </div>
        </div>
      </div>

      {/* Department Breakdown & Today's Attendance Overview */}
      <div className="row g-4 mb-4">
        {/* Department Overview */}
        <div className="col-lg-5">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-header bg-white border-bottom py-3 d-flex align-items-center justify-content-between">
              <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-pie-chart-fill text-primary"></i>
                Department Distribution
              </h6>
              <span className="badge bg-light text-dark border">
                {departmentDistribution?.length || 0} Departments
              </span>
            </div>
            <div className="card-body p-3">
              {departmentDistribution && departmentDistribution.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                  {departmentDistribution.map((dept) => {
                    const percentage = Math.round(
                      (dept.count / (metrics?.activeEmployees || 1)) * 100
                    );
                    return (
                      <div key={dept._id}>
                        <div className="d-flex justify-content-between small fw-semibold text-dark mb-1">
                          <span>{dept._id || 'Unassigned'}</span>
                          <span>
                            {dept.count} members ({percentage}%)
                          </span>
                        </div>
                        <div className="progress" style={{ height: '7px' }}>
                          <div
                            className="progress-bar bg-primary rounded-pill"
                            role="progressbar"
                            style={{ width: `${percentage}%` }}
                            aria-valuenow={percentage}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center p-4 text-muted small">No department data recorded yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Company-Wide Pending Leaves */}
        <div className="col-lg-7">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-header bg-white border-bottom py-3 d-flex align-items-center justify-content-between">
              <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-clock-history text-warning"></i>
                Pending Leave Applications
              </h6>
              <Link to="/leaves" className="text-decoration-none small text-primary fw-semibold">
                View All ({metrics?.pendingLeaves || 0})
              </Link>
            </div>
            <div className="card-body p-0">
              {recentPendingLeaves && recentPendingLeaves.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Department</th>
                        <th>Type</th>
                        <th>Dates</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentPendingLeaves.map((leave) => (
                        <tr key={leave._id}>
                          <td>
                            <div className="fw-bold text-dark">{leave.employee?.fullName}</div>
                            <div className="text-muted small">{leave.employee?.employeeId}</div>
                          </td>
                          <td className="small text-secondary">{leave.employee?.department}</td>
                          <td>
                            <span className="badge bg-light text-dark border">{leave.leaveType}</span>
                          </td>
                          <td className="small text-secondary">
                            {formatDate(leave.startDate)} to {formatDate(leave.endDate)}
                          </td>
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
                  <i className="bi bi-check2-all text-success fs-3 d-block mb-2"></i>
                  Zero pending leave applications. Everything is up to date!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HrDashboard;
