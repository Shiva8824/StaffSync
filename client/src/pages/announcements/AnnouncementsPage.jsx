import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { announcementApi } from '../../api/services';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ConfirmModal from '../../components/common/ConfirmModal';
import { formatDate } from '../../utils/formatters';
import { Modal, Button, Form } from 'react-bootstrap';

const AnnouncementsPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isHR = user?.role === 'HR';
  const isManager = user?.role === 'Manager';
  const canCreate = isHR || isManager;

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    audience: isHR ? 'All' : user?.employeeProfile?.department || 'Employee',
    priority: 'Normal',
  });
  const [formLoading, setFormLoading] = useState(false);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await announcementApi.getAll();
      if (res.data.success) {
        setAnnouncements(res.data.announcements);
      }
    } catch (err) {
      showToast('Failed to load announcements', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      content: '',
      audience: isHR ? 'All' : user?.employeeProfile?.department || 'Employee',
      priority: 'Normal',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      content: item.content,
      audience: item.audience,
      priority: item.priority || 'Normal',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (editingItem) {
        await announcementApi.update(editingItem._id, formData);
        showToast('Announcement updated successfully!', 'success');
      } else {
        await announcementApi.create(formData);
        showToast('Announcement broadcasted successfully!', 'success');
      }
      setModalOpen(false);
      fetchAnnouncements();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save announcement', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleteLoading(true);
    try {
      await announcementApi.delete(itemToDelete._id);
      showToast('Announcement deleted successfully', 'success');
      setDeleteModalOpen(false);
      fetchAnnouncements();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete announcement', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="container-fluid px-0">
      {/* Page Header */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Company Announcements</h3>
          <p className="text-secondary small mb-0">
            Internal organization notices, holiday schedules, and department bulletins
          </p>
        </div>

        {canCreate && (
          <button className="btn btn-primary px-3 py-2 shadow-sm fw-semibold" onClick={handleOpenCreate}>
            <i className="bi bi-broadcast me-1"></i>New Announcement
          </button>
        )}
      </div>

      {/* Announcements List */}
      {loading ? (
        <LoadingSpinner message="Loading bulletins and announcements..." />
      ) : announcements.length === 0 ? (
        <EmptyState
          icon="bi-megaphone"
          title="No announcements posted"
          description="Company bulletins and team news will be broadcasted here."
          actionText={canCreate ? 'Post Announcement' : undefined}
          onAction={canCreate ? handleOpenCreate : undefined}
        />
      ) : (
        <div className="row g-3">
          {announcements.map((item) => {
            const isAuthor = item.createdBy?._id === user?._id;
            const canManage = isHR || isAuthor;

            const priorityBadge = {
              Urgent: 'bg-danger text-white',
              High: 'bg-warning text-dark',
              Normal: 'bg-light text-secondary border',
            }[item.priority] || 'bg-light text-secondary border';

            return (
              <div key={item._id} className="col-12">
                <div className="card shadow-sm border-0 p-4">
                  <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-2">
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <span className={`badge ${priorityBadge} px-2.5 py-1`}>
                        {item.priority} Priority
                      </span>
                      <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25">
                        <i className="bi bi-people me-1"></i>Audience: {item.audience}
                      </span>
                    </div>

                    {canManage && (
                      <div className="btn-group">
                        <button
                          className="btn btn-sm btn-outline-secondary py-0.5 px-2"
                          onClick={() => handleOpenEdit(item)}
                          title="Edit"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger py-0.5 px-2"
                          onClick={() => {
                            setItemToDelete(item);
                            setDeleteModalOpen(true);
                          }}
                          title="Delete"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    )}
                  </div>

                  <h5 className="fw-bold text-dark mb-2">{item.title}</h5>
                  <p className="text-secondary small mb-3 text-break" style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                    {item.content}
                  </p>

                  <div className="border-top pt-2 d-flex align-items-center justify-content-between text-muted small" style={{ fontSize: '0.78rem' }}>
                    <span>
                      <i className="bi bi-person me-1"></i>
                      Published by <strong>{item.createdBy?.name || 'HR Admin'}</strong> ({item.createdBy?.role})
                    </span>
                    <span>
                      <i className="bi bi-clock me-1"></i>
                      {formatDate(item.publicationDate)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal show={modalOpen} onHide={() => setModalOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">
            {editingItem ? 'Edit Announcement' : 'Broadcast Announcement'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4">
            <div className="mb-3">
              <Form.Label className="small fw-semibold">Announcement Title *</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Q4 Company All-Hands Meeting"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="row g-2 mb-3">
              <div className="col-sm-6">
                <Form.Label className="small fw-semibold">Target Audience *</Form.Label>
                <Form.Select
                  value={formData.audience}
                  onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                  required
                >
                  {isHR && <option value="All">All Organization</option>}
                  <option value="Employee">All Employees</option>
                  <option value="Manager">Managers Only</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="Finance">Finance</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Operations">Operations</option>
                </Form.Select>
              </div>

              <div className="col-sm-6">
                <Form.Label className="small fw-semibold">Priority Level *</Form.Label>
                <Form.Select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  required
                >
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </Form.Select>
              </div>
            </div>

            <div className="mb-3">
              <Form.Label className="small fw-semibold">Announcement Content *</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                placeholder="Type the message body to be broadcasted..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
              />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setModalOpen(false)} disabled={formLoading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={formLoading}>
              {formLoading ? 'Publishing...' : editingItem ? 'Save Changes' : 'Broadcast Now'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={deleteModalOpen}
        onHide={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Announcement"
        message={`Are you sure you want to permanently delete "${itemToDelete?.title}"?`}
        confirmText="Yes, Delete"
        confirmVariant="danger"
        loading={deleteLoading}
      />
    </div>
  );
};

export default AnnouncementsPage;
