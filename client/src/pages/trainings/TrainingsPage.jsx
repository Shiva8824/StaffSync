import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { trainingApi } from '../../api/services';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ConfirmModal from '../../components/common/ConfirmModal';
import { formatDate } from '../../utils/formatters';
import { Modal, Button, Form } from 'react-bootstrap';

const TrainingsPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isHR = user?.role === 'HR';
  const isManager = user?.role === 'Manager';
  const canCreate = isHR || isManager;

  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');

  // Create / Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    trainer: '',
    department: 'All',
    startDate: '',
    endDate: '',
    maxParticipants: 30,
    status: 'Upcoming',
  });
  const [formLoading, setFormLoading] = useState(false);

  // Participants modal
  const [participantsModalOpen, setParticipantsModalOpen] = useState(false);
  const [activeTraining, setActiveTraining] = useState(null);

  // Enroll state
  const [enrollLoadingId, setEnrollLoadingId] = useState(null);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchTrainings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await trainingApi.getAll({ status: filterStatus });
      if (res.data.success) {
        setTrainings(res.data.trainings);
      }
    } catch (err) {
      showToast('Failed to load training programs', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, showToast]);

  useEffect(() => {
    fetchTrainings();
  }, [fetchTrainings]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      description: '',
      trainer: '',
      department: 'All',
      startDate: '',
      endDate: '',
      maxParticipants: 30,
      status: 'Upcoming',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description,
      trainer: item.trainer,
      department: item.department || 'All',
      startDate: item.startDate ? item.startDate.slice(0, 10) : '',
      endDate: item.endDate ? item.endDate.slice(0, 10) : '',
      maxParticipants: item.maxParticipants || 30,
      status: item.status || 'Upcoming',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      showToast('End date cannot be earlier than start date', 'warning');
      return;
    }

    setFormLoading(true);
    try {
      if (editingItem) {
        await trainingApi.update(editingItem._id, formData);
        showToast('Training program updated successfully!', 'success');
      } else {
        await trainingApi.create(formData);
        showToast('Training program scheduled successfully!', 'success');
      }
      setModalOpen(false);
      fetchTrainings();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save training program', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEnroll = async (trainingId) => {
    setEnrollLoadingId(trainingId);
    try {
      const res = await trainingApi.enroll(trainingId, {});
      showToast(res.data.message || 'Enrolled successfully!', 'success');
      fetchTrainings();
    } catch (err) {
      showToast(err.response?.data?.message || 'Enrollment failed', 'error');
    } finally {
      setEnrollLoadingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleteLoading(true);
    try {
      await trainingApi.delete(itemToDelete._id);
      showToast('Training program removed', 'success');
      setDeleteModalOpen(false);
      fetchTrainings();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete training', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="container-fluid px-0">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Corporate Training & Upskilling</h3>
          <p className="text-secondary small mb-0">
            Professional workshops, certifications, and skill development programs
          </p>
        </div>

        <div className="d-flex gap-2">
          <select
            className="form-select form-select-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Completed">Completed</option>
          </select>

          {canCreate && (
            <button className="btn btn-primary px-3 py-2 shadow-sm fw-semibold text-nowrap" onClick={handleOpenCreate}>
              <i className="bi bi-mortarboard-fill me-1"></i>New Workshop
            </button>
          )}
        </div>
      </div>

      {/* Program Cards */}
      {loading ? (
        <LoadingSpinner message="Loading training curriculum..." />
      ) : trainings.length === 0 ? (
        <EmptyState
          icon="bi-mortarboard"
          title="No training programs found"
          description="Upcoming workshops and seminars will appear here."
          actionText={canCreate ? 'Create Training' : undefined}
          onAction={canCreate ? handleOpenCreate : undefined}
        />
      ) : (
        <div className="row g-4">
          {trainings.map((prog) => {
            const myEmployeeId = user?.employeeProfile?._id;
            const isEnrolled = prog.participants.some(
              (p) => p.employee?._id?.toString() === myEmployeeId?.toString() || p.employee?.toString() === myEmployeeId?.toString()
            );
            const isFull = prog.participants.length >= prog.maxParticipants;
            const canManage = isHR || prog.createdBy?._id === user?._id;

            return (
              <div key={prog._id} className="col-lg-6">
                <div className="card h-100 shadow-sm border-0 p-4 d-flex flex-column">
                  <div className="d-flex align-items-start justify-content-between mb-2">
                    <StatusBadge status={prog.status} />
                    <span className="badge bg-light text-secondary border">
                      Dept: {prog.department}
                    </span>
                  </div>

                  <h5 className="fw-bold text-dark mb-2">{prog.title}</h5>
                  <p className="text-secondary small mb-3 flex-grow-1" style={{ lineHeight: '1.6' }}>
                    {prog.description}
                  </p>

                  <div className="bg-light p-3 rounded-3 small text-secondary mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span><i className="bi bi-person-video3 me-1 text-primary"></i>Trainer:</span>
                      <strong className="text-dark">{prog.trainer}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span><i className="bi bi-calendar3 me-1 text-primary"></i>Schedule:</span>
                      <strong>{formatDate(prog.startDate)} - {formatDate(prog.endDate)}</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span><i className="bi bi-people me-1 text-primary"></i>Enrollment:</span>
                      <strong className={isFull ? 'text-danger' : 'text-success'}>
                        {prog.participants.length} / {prog.maxParticipants} Seats Filled
                      </strong>
                    </div>
                  </div>

                  <div className="d-flex align-items-center justify-content-between pt-2 border-top mt-auto">
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => {
                        setActiveTraining(prog);
                        setParticipantsModalOpen(true);
                      }}
                    >
                      <i className="bi bi-people me-1"></i>View Participants ({prog.participants.length})
                    </button>

                    <div className="d-flex gap-2">
                      {canManage && (
                        <>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleOpenEdit(prog)}
                            title="Edit"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => {
                              setItemToDelete(prog);
                              setDeleteModalOpen(true);
                            }}
                            title="Delete"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </>
                      )}

                      {isEnrolled ? (
                        <span className="badge bg-success bg-opacity-25 text-success border border-success px-3 py-2">
                          <i className="bi bi-check-circle-fill me-1"></i>Enrolled
                        </span>
                      ) : isFull ? (
                        <span className="badge bg-secondary px-3 py-2">Capacity Full</span>
                      ) : (
                        <button
                          className="btn btn-sm btn-primary px-3 fw-semibold"
                          onClick={() => handleEnroll(prog._id)}
                          disabled={enrollLoadingId === prog._id}
                        >
                          {enrollLoadingId === prog._id ? 'Enrolling...' : 'Enroll Now'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Participants Modal */}
      <Modal show={participantsModalOpen} onHide={() => setParticipantsModalOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">
            Enrolled Participants &bull; {activeTraining?.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {activeTraining?.participants && activeTraining.participants.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Enrolled On</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTraining.participants.map((p, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="fw-bold text-dark">{p.employee?.fullName || 'Employee'}</div>
                        <div className="text-muted small">{p.employee?.employeeId}</div>
                      </td>
                      <td className="small text-secondary">{p.employee?.department || '-'}</td>
                      <td className="small text-secondary">{formatDate(p.enrolledAt)}</td>
                      <td>
                        <StatusBadge status={p.status || 'Enrolled'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center p-4 text-muted small">No participants enrolled yet.</div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setParticipantsModalOpen(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Create / Edit Modal */}
      <Modal show={modalOpen} onHide={() => setModalOpen(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">
            {editingItem ? 'Edit Workshop Details' : 'Create Training Workshop'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4">
            <div className="mb-3">
              <Form.Label className="small fw-semibold">Workshop Title *</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Advanced System Architecture & Microservices"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="row g-2 mb-3">
              <div className="col-sm-6">
                <Form.Label className="small fw-semibold">Trainer / Instructor *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. Dr. Jane Smith"
                  value={formData.trainer}
                  onChange={(e) => setFormData({ ...formData, trainer: e.target.value })}
                  required
                />
              </div>

              <div className="col-sm-6">
                <Form.Label className="small fw-semibold">Target Department *</Form.Label>
                <Form.Select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  required
                >
                  <option value="All">All Departments</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="Finance">Finance</option>
                  <option value="Human Resources">Human Resources</option>
                </Form.Select>
              </div>
            </div>

            <div className="row g-2 mb-3">
              <div className="col-sm-4">
                <Form.Label className="small fw-semibold">Start Date *</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>

              <div className="col-sm-4">
                <Form.Label className="small fw-semibold">End Date *</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>

              <div className="col-sm-4">
                <Form.Label className="small fw-semibold">Maximum Capacity *</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                  required
                />
              </div>
            </div>

            {editingItem && (
              <div className="mb-3">
                <Form.Label className="small fw-semibold">Program Status</Form.Label>
                <Form.Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </Form.Select>
              </div>
            )}

            <div className="mb-3">
              <Form.Label className="small fw-semibold">Curriculum Description *</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Key learning outcomes, prerequisites, and workshop objectives..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setModalOpen(false)} disabled={formLoading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={formLoading}>
              {formLoading ? 'Saving...' : editingItem ? 'Save Changes' : 'Schedule Program'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={deleteModalOpen}
        onHide={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Remove Training Program"
        message={`Are you sure you want to remove "${itemToDelete?.title}"?`}
        confirmText="Confirm Removal"
        confirmVariant="danger"
        loading={deleteLoading}
      />
    </div>
  );
};

export default TrainingsPage;
