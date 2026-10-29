import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { employeeApi } from '../../api/services';
import { useToast } from '../../context/ToastContext';

const EmployeeFormModal = ({ show, onHide, employeeToEdit, onSuccess }) => {
  const { showToast } = useToast();
  const isEditing = !!employeeToEdit;

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'Employee',
    department: 'Engineering',
    jobTitle: '',
    phoneNumber: '',
    salary: 60000,
    employmentStatus: 'Active',
    manager: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA',
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
    },
  });

  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load managers list for manager select field
  useEffect(() => {
    if (show) {
      const fetchManagers = async () => {
        try {
          const res = await employeeApi.getAll({ limit: 100 });
          if (res.data.success) {
            // Filter candidates who are Managers or HR
            setManagers(res.data.employees || []);
          }
        } catch (e) {
          // Ignore
        }
      };
      fetchManagers();
    }
  }, [show]);

  // Sync edit data if provided
  useEffect(() => {
    if (employeeToEdit) {
      setFormData({
        fullName: employeeToEdit.fullName || '',
        email: employeeToEdit.user?.email || '',
        password: '', // Don't prefill password
        role: employeeToEdit.user?.role || 'Employee',
        department: employeeToEdit.department || 'Engineering',
        jobTitle: employeeToEdit.jobTitle || '',
        phoneNumber: employeeToEdit.phoneNumber || '',
        salary: employeeToEdit.salary || 60000,
        employmentStatus: employeeToEdit.employmentStatus || 'Active',
        manager: employeeToEdit.manager?._id || employeeToEdit.manager || '',
        address: {
          street: employeeToEdit.address?.street || '',
          city: employeeToEdit.address?.city || '',
          state: employeeToEdit.address?.state || '',
          zipCode: employeeToEdit.address?.zipCode || '',
          country: employeeToEdit.address?.country || 'USA',
        },
        emergencyContact: {
          name: employeeToEdit.emergencyContact?.name || '',
          relationship: employeeToEdit.emergencyContact?.relationship || '',
          phone: employeeToEdit.emergencyContact?.phone || '',
        },
      });
    } else {
      setFormData({
        fullName: '',
        email: '',
        password: '',
        role: 'Employee',
        department: 'Engineering',
        jobTitle: '',
        phoneNumber: '',
        salary: 60000,
        employmentStatus: 'Active',
        manager: '',
        address: { street: '', city: '', state: '', zipCode: '', country: 'USA' },
        emergencyContact: { name: '', relationship: '', phone: '' },
      });
    }
  }, [employeeToEdit, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing) {
        await employeeApi.update(employeeToEdit._id, formData);
        showToast('Employee details updated successfully!', 'success');
      } else {
        await employeeApi.create(formData);
        showToast('Employee created and provisioned successfully!', 'success');
      }
      onSuccess();
      onHide();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save employee record', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title className="fs-6 fw-bold">
          {isEditing ? `Edit Employee (${employeeToEdit.employeeId})` : 'Register New Employee Record'}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="p-4">
          <h6 className="fw-bold text-primary mb-3 small text-uppercase">Basic Information</h6>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <Form.Label className="small fw-semibold">Full Name *</Form.Label>
              <Form.Control
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="e.g. Johnathan Smith"
                required
              />
            </div>

            <div className="col-md-6">
              <Form.Label className="small fw-semibold">Work Email Address *</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@staffsync.com"
                required
                disabled={isEditing}
              />
            </div>

            {!isEditing && (
              <div className="col-md-6">
                <Form.Label className="small fw-semibold">Initial Password *</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 6 characters (default: Password123!)"
                />
              </div>
            )}

            <div className="col-md-6">
              <Form.Label className="small fw-semibold">System Access Role *</Form.Label>
              <Form.Select name="role" value={formData.role} onChange={handleChange}>
                <option value="Employee">Employee (Standard Portal)</option>
                <option value="Manager">Manager (Team Supervision)</option>
                <option value="HR">HR Administrator</option>
              </Form.Select>
            </div>
          </div>

          <h6 className="fw-bold text-primary mb-3 small text-uppercase">Employment Details</h6>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <Form.Label className="small fw-semibold">Department *</Form.Label>
              <Form.Select name="department" value={formData.department} onChange={handleChange}>
                <option value="Engineering">Engineering</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="Finance">Finance</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Operations">Operations</option>
              </Form.Select>
            </div>

            <div className="col-md-6">
              <Form.Label className="small fw-semibold">Job Title *</Form.Label>
              <Form.Control
                type="text"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleChange}
                placeholder="e.g. Lead Frontend Architect"
                required
              />
            </div>

            <div className="col-md-6">
              <Form.Label className="small fw-semibold">Reporting Manager</Form.Label>
              <Form.Select name="manager" value={formData.manager} onChange={handleChange}>
                <option value="">No Manager (Reports to Executive / HR)</option>
                {managers.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.fullName} ({m.jobTitle} - {m.department})
                  </option>
                ))}
              </Form.Select>
            </div>

            <div className="col-md-6">
              <Form.Label className="small fw-semibold">Annual Base Salary (USD)</Form.Label>
              <Form.Control
                type="number"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                placeholder="50000"
                min="0"
              />
            </div>

            <div className="col-md-6">
              <Form.Label className="small fw-semibold">Employment Status</Form.Label>
              <Form.Select name="employmentStatus" value={formData.employmentStatus} onChange={handleChange}>
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Terminated">Terminated</option>
              </Form.Select>
            </div>

            <div className="col-md-6">
              <Form.Label className="small fw-semibold">Contact Phone</Form.Label>
              <Form.Control
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          <h6 className="fw-bold text-primary mb-3 small text-uppercase">Emergency Contact & Address</h6>
          <div className="row g-3">
            <div className="col-md-4">
              <Form.Label className="small fw-semibold">Contact Person</Form.Label>
              <Form.Control
                type="text"
                name="emergencyContact.name"
                value={formData.emergencyContact.name}
                onChange={handleChange}
                placeholder="Relative or spouse name"
              />
            </div>
            <div className="col-md-4">
              <Form.Label className="small fw-semibold">Relationship</Form.Label>
              <Form.Control
                type="text"
                name="emergencyContact.relationship"
                value={formData.emergencyContact.relationship}
                onChange={handleChange}
                placeholder="e.g. Spouse, Parent"
              />
            </div>
            <div className="col-md-4">
              <Form.Label className="small fw-semibold">Emergency Phone</Form.Label>
              <Form.Control
                type="text"
                name="emergencyContact.phone"
                value={formData.emergencyContact.phone}
                onChange={handleChange}
                placeholder="+1 (555) 999-9999"
              />
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="light" onClick={onHide} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Saving Record...' : isEditing ? 'Save Changes' : 'Create Employee'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default EmployeeFormModal;
