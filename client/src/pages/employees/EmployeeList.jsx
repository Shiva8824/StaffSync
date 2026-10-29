import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { employeeApi } from '../../api/services';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ConfirmModal from '../../components/common/ConfirmModal';
import EmployeeFormModal from './EmployeeFormModal';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { Modal, Button } from 'react-bootstrap';

const EmployeeList = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isHR = user?.role === 'HR';
  const isManager = user?.role === 'Manager';

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [status, setStatus] = useState('All');

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState(null);

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await employeeApi.getAll({
        search,
        department,
        status,
        page: currentPage,
        limit: 10,
      });

      if (res.data.success) {
        setEmployees(res.data.employees);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      }
    } catch (err) {
      showToast('Failed to retrieve employees list', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, department, status, currentPage, showToast]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleOpenAdd = () => {
    setEmployeeToEdit(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (emp) => {
    setEmployeeToEdit(emp);
    setFormModalOpen(true);
  };

  const handleOpenDetails = (emp) => {
    setSelectedEmployee(emp);
    setDetailsModalOpen(true);
  };

  const handleOpenDelete = (emp) => {
    setEmployeeToDelete(emp);
    setConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;
    setDeleteLoading(true);
    try {
      await employeeApi.delete(employeeToDelete._id);
      showToast('Employee deactivated and marked as Terminated', 'success');
      setConfirmModalOpen(false);
      fetchEmployees();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to deactivate employee', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="container-fluid px-0">
      {/* Page Title & Add Button */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">
            {isManager ? 'My Supervised Team' : 'Employee Directory'}
          </h3>
          <p className="text-secondary small mb-0">
            {isManager
              ? 'View and supervise direct reports in your engineering/department squad'
              : 'Manage organization-wide employee credentials, profiles, and employment status'}
          </p>
        </div>

        {isHR && (
          <button className="btn btn-primary px-3 py-2 shadow-sm fw-semibold" onClick={handleOpenAdd}>
            <i className="bi bi-person-plus-fill me-1"></i>Add New Employee
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card shadow-sm border-0 p-3 mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-light text-secondary border-end-0">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Search by name, ID, or job title..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <div className="col-sm-6 col-md-3">
            <select
              className="form-select"
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="All">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Marketing">Marketing</option>
              <option value="Sales">Sales</option>
              <option value="Finance">Finance</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Operations">Operations</option>
            </select>
          </div>

          <div className="col-sm-6 col-md-3">
            <select
              className="form-select"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Terminated">Terminated</option>
            </select>
          </div>

          <div className="col-md-1 text-md-end">
            <button
              className="btn btn-light w-100"
              title="Reset Filters"
              onClick={() => {
                setSearch('');
                setDepartment('All');
                setStatus('All');
                setCurrentPage(1);
              }}
            >
              <i className="bi bi-arrow-clockwise"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white border-bottom py-3 d-flex align-items-center justify-content-between">
          <span className="fw-bold text-dark small text-uppercase">
            Showing {employees.length} of {total} Employees
          </span>
          <span className="badge bg-light text-dark border">Page {currentPage} of {totalPages}</span>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <LoadingSpinner message="Searching employee records..." />
          ) : employees.length === 0 ? (
            <EmptyState
              icon="bi-people"
              title="No employees match your search"
              description="Try adjusting your department filter, status, or search keywords."
              actionText={isHR ? 'Create Employee' : undefined}
              onAction={isHR ? handleOpenAdd : undefined}
            />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Name & Email</th>
                    <th>Department</th>
                    <th>Job Title</th>
                    <th>Manager</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp._id}>
                      <td>
                        <span className="fw-bold text-primary font-monospace">{emp.employeeId}</span>
                      </td>
                      <td>
                        <div className="fw-bold text-dark">{emp.fullName}</div>
                        <div className="text-muted small">{emp.user?.email}</div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">{emp.department}</span>
                      </td>
                      <td className="small text-secondary">{emp.jobTitle}</td>
                      <td className="small text-secondary">
                        {emp.manager?.fullName || <span className="text-muted">None</span>}
                      </td>
                      <td>
                        <StatusBadge status={emp.employmentStatus} />
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-light border py-1 px-2 me-1"
                          onClick={() => handleOpenDetails(emp)}
                          title="View Details"
                        >
                          <i className="bi bi-eye"></i>
                        </button>

                        {isHR && (
                          <>
                            <button
                              className="btn btn-sm btn-outline-primary py-1 px-2 me-1"
                              onClick={() => handleOpenEdit(emp)}
                              title="Edit Employee"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            {emp.employmentStatus !== 'Terminated' && (
                              <button
                                className="btn btn-sm btn-outline-danger py-1 px-2"
                                onClick={() => handleOpenDelete(emp)}
                                title="Deactivate"
                              >
                                <i className="bi bi-person-x"></i>
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="card-footer bg-white border-top py-3 d-flex align-items-center justify-content-between">
            <span className="text-secondary small">
              Page {currentPage} of {totalPages}
            </span>
            <div className="btn-group">
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Employee Form Modal (Add / Edit) */}
      <EmployeeFormModal
        show={formModalOpen}
        onHide={() => setFormModalOpen(false)}
        employeeToEdit={employeeToEdit}
        onSuccess={fetchEmployees}
      />

      {/* Details Dossier Modal */}
      <Modal show={detailsModalOpen} onHide={() => setDetailsModalOpen(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">
            Employee Dossier &bull; {selectedEmployee?.fullName} ({selectedEmployee?.employeeId})
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedEmployee && (
            <div className="row g-4">
              <div className="col-md-6 border-end">
                <h6 className="fw-bold text-primary small text-uppercase mb-3">Professional Summary</h6>
                <div className="d-flex flex-column gap-2 small">
                  <div><strong>Email:</strong> {selectedEmployee.user?.email}</div>
                  <div><strong>System Role:</strong> <span className="badge bg-primary">{selectedEmployee.user?.role}</span></div>
                  <div><strong>Department:</strong> {selectedEmployee.department}</div>
                  <div><strong>Job Title:</strong> {selectedEmployee.jobTitle}</div>
                  <div><strong>Manager:</strong> {selectedEmployee.manager?.fullName || 'None'}</div>
                  <div><strong>Employment Status:</strong> <StatusBadge status={selectedEmployee.employmentStatus} /></div>
                  <div><strong>Date Joined:</strong> {formatDate(selectedEmployee.joiningDate)}</div>
                  {isHR && <div><strong>Salary:</strong> {formatCurrency(selectedEmployee.salary)} / year</div>}
                </div>
              </div>

              <div className="col-md-6">
                <h6 className="fw-bold text-primary small text-uppercase mb-3">Contact & Address</h6>
                <div className="d-flex flex-column gap-2 small">
                  <div><strong>Phone Number:</strong> {selectedEmployee.phoneNumber || 'Not provided'}</div>
                  <div><strong>Street:</strong> {selectedEmployee.address?.street || '-'}</div>
                  <div><strong>City / State / Zip:</strong> {[selectedEmployee.address?.city, selectedEmployee.address?.state, selectedEmployee.address?.zipCode].filter(Boolean).join(', ') || '-'}</div>
                  <div><strong>Country:</strong> {selectedEmployee.address?.country || 'USA'}</div>

                  <hr className="my-2" />
                  <h6 className="fw-bold text-secondary small text-uppercase mb-2">Emergency Contact</h6>
                  <div><strong>Contact Person:</strong> {selectedEmployee.emergencyContact?.name || '-'}</div>
                  <div><strong>Relationship:</strong> {selectedEmployee.emergencyContact?.relationship || '-'}</div>
                  <div><strong>Emergency Phone:</strong> {selectedEmployee.emergencyContact?.phone || '-'}</div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDetailsModalOpen(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete / Deactivate Confirmation */}
      <ConfirmModal
        show={confirmModalOpen}
        onHide={() => setConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Deactivate Employee"
        message={`Are you sure you want to terminate/deactivate employee ${employeeToDelete?.fullName} (${employeeToDelete?.employeeId})? This will disable their login access.`}
        confirmText="Confirm Deactivation"
        confirmVariant="danger"
        loading={deleteLoading}
      />
    </div>
  );
};

export default EmployeeList;
