import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { dashboardApi, leaveApi, attendanceApi } from '../../api/services';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate, formatTime } from '../../utils/formatters';
import { Modal, Button, Form } from 'react-bootstrap';

const ManagerDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('Approved');
  const [reviewerComments, setReviewerComments] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  // Manager personal attendance
  const [managerNotes, setManagerNotes] = useState('');
  const [attLoading, setAttLoading] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await dashboardApi.getStats();
      if (res.data.success) {
        setDashboardData(res.data.data);
      }
    } catch (err) {
      showToast('Failed to load manager dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const openReviewModal = (leave, initialStatus = 'Approved') => {
    setSelectedLeave(leave);
    setReviewStatus(initialStatus);
    setReviewerComments('');
    setReviewModalOpen(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLeave) return;

    setReviewLoading(true);
    try {
      const res = await leaveApi.review(selectedLeave._id, {
        status: reviewStatus,
        reviewerComments,
      });
      showToast(res.data.message || `Leave ${reviewStatus.toLowerCase()} successfully!`, 'success');
      setReviewModalOpen(false);
      fetchDashboard();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to review leave', 'error');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleManagerCheckIn = async () => {
    setAttLoading(true);
    try {
      const res = await attendanceApi.checkIn({ notes: managerNotes });
      showToast(res.data.message || 'Checked in successfully!', 'success');
      fetchDashboard();
    } catch (err) {
      showToast(err.response?.data?.message || 'Check in failed', 'error');
    } finally {
      setAttLoading(false);
    }
  };

  const handleManagerCheckOut = async () => {
    setAttLoading(true);
    try {
      const res = await attendanceApi.checkOut({ notes: managerNotes });
      showToast(res.data.message || 'Checked out successfully!', 'success');
      fetchDashboard();
    } catch (err) {
      showToast(err.response?.data?.message || 'Check out failed', 'error');
    } finally {
      setAttLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading team supervision metrics..." />;
  }

  const {
    metrics,
    teamAttendance,
    managerTodayAttendance,
    pendingLeaves,
    teamMembers,
    recentAnnouncements,
  } = dashboardData || {};

  const isCheckedIn = !!managerTodayAttendance;
  const isCheckedOut = !!(managerTodayAttendance && managerTodayAttendance.checkOut);

  return (
    <div className="container-fluid px-0">
      {/* Welcome Banner */}
      <div
        className="card border-0 text-white p-4 mb-4 rounded-4 shadow-sm position-relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1E293B 0%, #0F3C68 100%)' }}
      >
        <div className="row align-items-center">
          <div className="col-md-8">
            <span className="badge bg-success bg-opacity-25 text-white mb-2 px-3 py-1.5">
              Manager Supervision Portal
            </span>
            <h2 className="fw-bold mb-1">Hello, Manager {user?.name}!</h2>
            <p className="mb-0 text-white-50">
              Department: {user?.employeeProfile?.department || 'Engineering'} &bull; Team Roster: {metrics?.teamSize || 0} Direct Reports
            </p>
          </div>
          <div className="col-md-4 text-md-end mt-3 mt-md-0">
            <Link to="/attendance" className="btn btn-light fw-semibold text-dark px-3 py-2 shadow-sm me-2">
              <i className="bi bi-clock-history me-1"></i>Team Attendance
            </Link>
            <Link to="/leaves" className="btn btn-outline-light px-3 py-2">
              All Leaves
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-3">
          <StatCard
            title="Team Size"
            value={metrics?.teamSize || 0}
            icon="bi-people"
            color="primary"
            subtitle="Direct reports assigned"
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <StatCard
            title="Present Today"
            value={metrics?.presentToday || 0}
            icon="bi-check-circle"
            color="success"
            subtitle={`${teamAttendance?.late || 0} checked in late`}
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <StatCard
            title="Absent Today"
            value={metrics?.absentToday || 0}
            icon="bi-person-x"
            color="danger"
            subtitle="Team members absent"
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <StatCard
            title="Pending Approvals"
            value={metrics?.pendingLeaveApprovals || 0}
            icon="bi-hourglass-split"
            color="warning"
            subtitle="Team leaves requiring review"
          />
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Pending Team Leaves */}
        <div className="col-lg-8">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-header bg-white border-bottom py-3 d-flex align-items-center justify-content-between">
              <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-calendar-check text-warning"></i>
                Pending Team Leave Requests
              </h6>
              <span className="badge bg-warning text-dark">{pendingLeaves?.length || 0} Pending</span>
            </div>
            <div className="card-body p-0">
              {pendingLeaves && pendingLeaves.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Type</th>
                        <th>Dates</th>
                        <th>Reason</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingLeaves.map((leave) => (
                        <tr key={leave._id}>
                          <td>
                            <div className="fw-bold text-dark">{leave.employee?.fullName}</div>
                            <div className="text-muted small">{leave.employee?.employeeId}</div>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border">{leave.leaveType}</span>
                          </td>
                          <td className="small text-secondary">
                            <div>{formatDate(leave.startDate)} to {formatDate(leave.endDate)}</div>
                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>({leave.daysCount} days)</span>
                          </td>
                          <td className="small text-secondary text-truncate" style={{ maxWidth: '180px' }}>
                            {leave.reason}
                          </td>
                          <td className="text-end">
                            <button
                              className="btn btn-sm btn-success py-1 px-2.5 me-1"
                              onClick={() => openReviewModal(leave, 'Approved')}
                              title="Approve"
                            >
                              <i className="bi bi-check-lg"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-danger py-1 px-2.5"
                              onClick={() => openReviewModal(leave, 'Rejected')}
                              title="Reject"
                            >
                              <i className="bi bi-x-lg"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center p-4 text-muted small">
                  <i className="bi bi-check2-circle text-success fs-3 d-block mb-2"></i>
                  All team leave requests are currently reviewed and up to date!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Manager Personal Attendance Quick Card */}
        <div className="col-lg-4">
          <div className="card h-100 shadow-sm border-0 p-3">
            <h6 className="fw-bold text-dark mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
              <i className="bi bi-fingerprint text-primary fs-5"></i>
              My Attendance (Manager)
            </h6>
            <div className="small text-secondary mb-2">
              Status:{' '}
              {managerTodayAttendance ? (
                <StatusBadge status={managerTodayAttendance.status} />
              ) : (
                <span className="text-muted">Not recorded today</span>
              )}
            </div>
            <div className="small text-secondary mb-3">
              Check-in:{' '}
              <strong className="text-dark">
                {managerTodayAttendance ? formatTime(managerTodayAttendance.checkIn) : '-'}
              </strong>
            </div>

            <div className="mt-auto">
              {!isCheckedIn ? (
                <button
                  className="btn btn-primary w-100 py-2 fw-semibold"
                  onClick={handleManagerCheckIn}
                  disabled={attLoading}
                >
                  <i className="bi bi-box-arrow-in-right me-1"></i>Check In
                </button>
              ) : !isCheckedOut ? (
                <button
                  className="btn btn-danger w-100 py-2 fw-semibold"
                  onClick={handleManagerCheckOut}
                  disabled={attLoading}
                >
                  <i className="bi bi-box-arrow-left me-1"></i>Check Out
                </button>
              ) : (
                <div className="alert alert-success py-2 text-center small mb-0">Shift Completed</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Team Roster Table */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white border-bottom py-3 d-flex align-items-center justify-content-between">
          <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
            <i className="bi bi-people-fill text-primary"></i>
            Team Member Roster
          </h6>
          <Link to="/employees" className="text-decoration-none small text-primary fw-semibold">
            View Details
          </Link>
        </div>
        <div className="card-body p-0">
          {teamMembers && teamMembers.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Full Name</th>
                    <th>Role / Title</th>
                    <th>Department</th>
                    <th>Phone</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((member) => (
                    <tr key={member._id}>
                      <td className="fw-semibold text-primary">{member.employeeId}</td>
                      <td className="fw-bold text-dark">{member.fullName}</td>
                      <td>{member.jobTitle}</td>
                      <td>{member.department}</td>
                      <td className="small text-secondary">{member.phoneNumber || '-'}</td>
                      <td className="small text-secondary">{formatDate(member.joiningDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center p-4 text-muted small">No direct reports currently assigned.</div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      <Modal show={reviewModalOpen} onHide={() => setReviewModalOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">Review Leave Request</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleReviewSubmit}>
          <Modal.Body>
            <div className="mb-3 bg-light p-3 rounded-3 small">
              <div><strong>Applicant:</strong> {selectedLeave?.employee?.fullName}</div>
              <div><strong>Type:</strong> {selectedLeave?.leaveType}</div>
              <div><strong>Duration:</strong> {formatDate(selectedLeave?.startDate)} to {formatDate(selectedLeave?.endDate)} ({selectedLeave?.daysCount} days)</div>
              <div><strong>Reason:</strong> {selectedLeave?.reason}</div>
            </div>

            <div className="mb-3">
              <Form.Label className="fw-semibold small">Decision</Form.Label>
              <div className="d-flex gap-3">
                <Form.Check
                  type="radio"
                  id="decisionApprove"
                  name="reviewDecision"
                  label="Approve"
                  checked={reviewStatus === 'Approved'}
                  onChange={() => setReviewStatus('Approved')}
                />
                <Form.Check
                  type="radio"
                  id="decisionReject"
                  name="reviewDecision"
                  label="Reject"
                  checked={reviewStatus === 'Rejected'}
                  onChange={() => setReviewStatus('Rejected')}
                />
              </div>
            </div>

            <div className="mb-3">
              <Form.Label className="fw-semibold small">Reviewer Comments (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Add feedback or notes for the applicant..."
                value={reviewerComments}
                onChange={(e) => setReviewerComments(e.target.value)}
              />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setReviewModalOpen(false)} disabled={reviewLoading}>
              Cancel
            </Button>
            <Button
              variant={reviewStatus === 'Approved' ? 'success' : 'danger'}
              type="submit"
              disabled={reviewLoading}
            >
              {reviewLoading ? 'Submitting...' : `Confirm ${reviewStatus}`}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default ManagerDashboard;
