import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { leaveApi } from '../../api/services';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ConfirmModal from '../../components/common/ConfirmModal';
import { formatDate } from '../../utils/formatters';
import { Modal, Button, Form } from 'react-bootstrap';

const LeavePage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isHR = user?.role === 'HR';
  const isManager = user?.role === 'Manager';
  const canReview = isHR || isManager;

  const [activeTab, setActiveTab] = useState('my'); // 'my' or 'review'

  // My leaves state
  const [myLeaves, setMyLeaves] = useState([]);
  const [myLoading, setMyLoading] = useState(true);

  // Review leaves state
  const [reviewLeaves, setReviewLeaves] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewFilterStatus, setReviewFilterStatus] = useState('Pending');

  // Apply modal
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applyFormData, setApplyFormData] = useState({
    leaveType: 'Annual',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [applyLoading, setApplyLoading] = useState(false);

  // Cancel modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [leaveToCancel, setLeaveToCancel] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Review modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [reviewDecision, setReviewDecision] = useState('Approved');
  const [reviewerComments, setReviewerComments] = useState('');
  const [reviewSubmitLoading, setReviewSubmitLoading] = useState(false);

  // Fetch my leaves
  const fetchMyLeaves = useCallback(async () => {
    setMyLoading(true);
    try {
      const res = await leaveApi.getMyLeaves();
      if (res.data.success) {
        setMyLeaves(res.data.leaves);
      }
    } catch (err) {
      showToast('Failed to load your leave history', 'error');
    } finally {
      setMyLoading(false);
    }
  }, [showToast]);

  // Fetch review leaves
  const fetchReviewLeaves = useCallback(async () => {
    if (!canReview) return;
    setReviewLoading(true);
    try {
      const res = await leaveApi.getForReview({
        status: reviewFilterStatus,
      });
      if (res.data.success) {
        setReviewLeaves(res.data.leaves);
      }
    } catch (err) {
      showToast('Failed to load leave review requests', 'error');
    } finally {
      setReviewLoading(false);
    }
  }, [canReview, reviewFilterStatus, showToast]);

  useEffect(() => {
    if (activeTab === 'my') {
      fetchMyLeaves();
    } else {
      fetchReviewLeaves();
    }
  }, [activeTab, fetchMyLeaves, fetchReviewLeaves]);

  // Apply submit
  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (new Date(applyFormData.endDate) < new Date(applyFormData.startDate)) {
      showToast('End date cannot be earlier than start date', 'warning');
      return;
    }

    setApplyLoading(true);
    try {
      const res = await leaveApi.apply(applyFormData);
      showToast(res.data.message || 'Leave applied successfully!', 'success');
      setApplyModalOpen(false);
      setApplyFormData({
        leaveType: 'Annual',
        startDate: '',
        endDate: '',
        reason: '',
      });
      fetchMyLeaves();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit leave request', 'error');
    } finally {
      setApplyLoading(false);
    }
  };

  // Cancel action
  const handleConfirmCancel = async () => {
    if (!leaveToCancel) return;
    setCancelLoading(true);
    try {
      await leaveApi.cancel(leaveToCancel._id);
      showToast('Leave request cancelled successfully', 'success');
      setCancelModalOpen(false);
      fetchMyLeaves();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel leave', 'error');
    } finally {
      setCancelLoading(false);
    }
  };

  // Review submit
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLeave) return;

    setReviewSubmitLoading(true);
    try {
      const res = await leaveApi.review(selectedLeave._id, {
        status: reviewDecision,
        reviewerComments,
      });
      showToast(res.data.message || `Leave ${reviewDecision.toLowerCase()} successfully`, 'success');
      setReviewModalOpen(false);
      fetchReviewLeaves();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to review leave', 'error');
    } finally {
      setReviewSubmitLoading(false);
    }
  };

  return (
    <div className="container-fluid px-0">
      {/* Page Title & Apply Button */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Leave Requests & Approvals</h3>
          <p className="text-secondary small mb-0">
            Submit time off requests, check quotas, and review departmental applications
          </p>
        </div>

        <button
          className="btn btn-primary px-3 py-2 shadow-sm fw-semibold"
          onClick={() => setApplyModalOpen(true)}
        >
          <i className="bi bi-calendar-plus me-1"></i>Apply for Leave
        </button>
      </div>

      {/* Tabs */}
      {canReview && (
        <ul className="nav nav-pills mb-4 gap-2 bg-light p-1.5 rounded-3 border">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'my' ? 'active' : ''}`}
              onClick={() => setActiveTab('my')}
            >
              <i className="bi bi-calendar2-heart me-1"></i>My Leave History
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'review' ? 'active' : ''}`}
              onClick={() => setActiveTab('review')}
            >
              <i className="bi bi-shield-check me-1"></i>
              Leave Approvals Desk {isManager ? '(Team)' : '(Company-Wide)'}
            </button>
          </li>
        </ul>
      )}

      {/* TAB 1: My Leaves */}
      {activeTab === 'my' && (
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white border-bottom py-3">
            <h6 className="fw-bold text-dark mb-0">Personal Leave History</h6>
          </div>
          <div className="card-body p-0">
            {myLoading ? (
              <LoadingSpinner message="Loading leave history..." />
            ) : myLeaves.length === 0 ? (
              <EmptyState
                icon="bi-calendar-x"
                title="No leave applications on file"
                description="When you apply for sick, casual, or annual leaves, they will be listed here."
                actionText="Apply for Leave"
                onAction={() => setApplyModalOpen(true)}
              />
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Leave Type</th>
                      <th>Dates Requested</th>
                      <th>Duration</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Reviewed By</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myLeaves.map((leave) => (
                      <tr key={leave._id}>
                        <td className="fw-bold text-dark">{leave.leaveType}</td>
                        <td className="small text-secondary">
                          {formatDate(leave.startDate)} to {formatDate(leave.endDate)}
                        </td>
                        <td className="small">{leave.daysCount} Day(s)</td>
                        <td className="small text-secondary text-truncate" style={{ maxWidth: '200px' }}>
                          {leave.reason}
                        </td>
                        <td>
                          <StatusBadge status={leave.status} />
                        </td>
                        <td className="small text-secondary">
                          {leave.reviewedBy ? (
                            <div>
                              <div className="fw-semibold text-dark">{leave.reviewedBy.name}</div>
                              {leave.reviewerComments && (
                                <span className="text-muted fst-italic" style={{ fontSize: '0.78rem' }}>
                                  "{leave.reviewerComments}"
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted">Awaiting Review</span>
                          )}
                        </td>
                        <td className="text-end">
                          {leave.status === 'Pending' && (
                            <button
                              className="btn btn-sm btn-outline-danger py-1 px-2.5"
                              onClick={() => {
                                setLeaveToCancel(leave);
                                setCancelModalOpen(true);
                              }}
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Review Desk (Manager / HR) */}
      {activeTab === 'review' && canReview && (
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white border-bottom py-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div>
              <h6 className="fw-bold text-dark mb-0">Leave Approvals Queue</h6>
              <span className="text-secondary small">
                Review and authorize requests with reviewer notes
              </span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <label className="small fw-semibold text-secondary mb-0">Filter Status:</label>
              <select
                className="form-select form-select-sm"
                value={reviewFilterStatus}
                onChange={(e) => setReviewFilterStatus(e.target.value)}
              >
                <option value="All">All Requests</option>
                <option value="Pending">Pending Only</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="card-body p-0">
            {reviewLoading ? (
              <LoadingSpinner message="Fetching pending requests..." />
            ) : reviewLeaves.length === 0 ? (
              <EmptyState
                icon="bi-check2-circle"
                title="No requests pending review"
                description={`There are no ${reviewFilterStatus.toLowerCase()} leave applications awaiting action.`}
              />
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Type</th>
                      <th>Date Range</th>
                      <th>Duration</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewLeaves.map((leave) => {
                      const isOwn =
                        user?.employeeProfile?._id &&
                        leave.employee?._id &&
                        leave.employee._id.toString() === user.employeeProfile._id.toString();

                      return (
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
                          <td className="small">{leave.daysCount} d</td>
                          <td className="small text-secondary text-truncate" style={{ maxWidth: '180px' }}>
                            {leave.reason}
                          </td>
                          <td>
                            <StatusBadge status={leave.status} />
                          </td>
                          <td className="text-end">
                            {leave.status === 'Pending' ? (
                              isOwn ? (
                                <span className="badge bg-secondary" title="You cannot review your own leave">
                                  Self
                                </span>
                              ) : (
                                <div className="btn-group">
                                  <button
                                    className="btn btn-sm btn-success py-1 px-2.5"
                                    onClick={() => {
                                      setSelectedLeave(leave);
                                      setReviewDecision('Approved');
                                      setReviewerComments('');
                                      setReviewModalOpen(true);
                                    }}
                                    title="Approve"
                                  >
                                    <i className="bi bi-check-lg"></i>
                                  </button>
                                  <button
                                    className="btn btn-sm btn-danger py-1 px-2.5"
                                    onClick={() => {
                                      setSelectedLeave(leave);
                                      setReviewDecision('Rejected');
                                      setReviewerComments('');
                                      setReviewModalOpen(true);
                                    }}
                                    title="Reject"
                                  >
                                    <i className="bi bi-x-lg"></i>
                                  </button>
                                </div>
                              )
                            ) : (
                              <span className="small text-muted">
                                {leave.reviewedBy?.name ? `Reviewed by ${leave.reviewedBy.name}` : '-'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      <Modal show={applyModalOpen} onHide={() => setApplyModalOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">Apply for Leave</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleApplySubmit}>
          <Modal.Body className="p-4">
            <div className="mb-3">
              <Form.Label className="small fw-semibold">Leave Type *</Form.Label>
              <Form.Select
                value={applyFormData.leaveType}
                onChange={(e) => setApplyFormData({ ...applyFormData, leaveType: e.target.value })}
                required
              >
                <option value="Annual">Annual Leave</option>
                <option value="Sick">Sick Leave</option>
                <option value="Casual">Casual Leave</option>
                <option value="Maternity">Maternity Leave</option>
                <option value="Paternity">Paternity Leave</option>
                <option value="Unpaid">Unpaid Leave</option>
              </Form.Select>
            </div>

            <div className="row g-2 mb-3">
              <div className="col-sm-6">
                <Form.Label className="small fw-semibold">Start Date *</Form.Label>
                <Form.Control
                  type="date"
                  value={applyFormData.startDate}
                  onChange={(e) => setApplyFormData({ ...applyFormData, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="col-sm-6">
                <Form.Label className="small fw-semibold">End Date *</Form.Label>
                <Form.Control
                  type="date"
                  value={applyFormData.endDate}
                  onChange={(e) => setApplyFormData({ ...applyFormData, endDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <Form.Label className="small fw-semibold">Reason for Absence *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Please state the purpose of your leave application..."
                value={applyFormData.reason}
                onChange={(e) => setApplyFormData({ ...applyFormData, reason: e.target.value })}
                required
              />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setApplyModalOpen(false)} disabled={applyLoading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={applyLoading}>
              {applyLoading ? 'Submitting Application...' : 'Submit Application'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Review Modal */}
      <Modal show={reviewModalOpen} onHide={() => setReviewModalOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">Authorizing Leave Request</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleReviewSubmit}>
          <Modal.Body className="p-4">
            <div className="bg-light p-3 rounded-3 small mb-3">
              <div><strong>Applicant:</strong> {selectedLeave?.employee?.fullName}</div>
              <div><strong>Type:</strong> {selectedLeave?.leaveType}</div>
              <div><strong>Dates:</strong> {formatDate(selectedLeave?.startDate)} to {formatDate(selectedLeave?.endDate)} ({selectedLeave?.daysCount} days)</div>
              <div><strong>Reason:</strong> {selectedLeave?.reason}</div>
            </div>

            <div className="mb-3">
              <Form.Label className="small fw-semibold">Decision</Form.Label>
              <div className="d-flex gap-4">
                <Form.Check
                  type="radio"
                  id="decisionApproveLeave"
                  name="reviewDecisionLeave"
                  label="Approve Request"
                  checked={reviewDecision === 'Approved'}
                  onChange={() => setReviewDecision('Approved')}
                />
                <Form.Check
                  type="radio"
                  id="decisionRejectLeave"
                  name="reviewDecisionLeave"
                  label="Reject Request"
                  checked={reviewDecision === 'Rejected'}
                  onChange={() => setReviewDecision('Rejected')}
                />
              </div>
            </div>

            <div className="mb-3">
              <Form.Label className="small fw-semibold">Comments for Employee (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Add feedback or instructions for the applicant..."
                value={reviewerComments}
                onChange={(e) => setReviewerComments(e.target.value)}
              />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setReviewModalOpen(false)} disabled={reviewSubmitLoading}>
              Close
            </Button>
            <Button
              variant={reviewDecision === 'Approved' ? 'success' : 'danger'}
              type="submit"
              disabled={reviewSubmitLoading}
            >
              {reviewSubmitLoading ? 'Saving...' : `Confirm ${reviewDecision}`}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        show={cancelModalOpen}
        onHide={() => setCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel Leave Application"
        message="Are you sure you want to cancel this pending leave request?"
        confirmText="Yes, Cancel Leave"
        confirmVariant="danger"
        loading={cancelLoading}
      />
    </div>
  );
};

export default LeavePage;
