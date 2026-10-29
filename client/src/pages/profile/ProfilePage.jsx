import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { employeeApi, authApi } from '../../api/services';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/formatters';

const ProfilePage = () => {
  const { user, updateUserProfile } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);

  const [formData, setFormData] = useState({
    phoneNumber: '',
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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authApi.getMe();
        if (res.data.success && res.data.user.employeeProfile) {
          const emp = res.data.user.employeeProfile;
          setProfile(emp);
          setFormData({
            phoneNumber: emp.phoneNumber || '',
            address: {
              street: emp.address?.street || '',
              city: emp.address?.city || '',
              state: emp.address?.state || '',
              zipCode: emp.address?.zipCode || '',
              country: emp.address?.country || 'USA',
            },
            emergencyContact: {
              name: emp.emergencyContact?.name || '',
              relationship: emp.emergencyContact?.relationship || '',
              phone: emp.emergencyContact?.phone || '',
            },
          });
        }
      } catch (err) {
        showToast('Failed to load profile details', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [showToast]);

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
    if (!profile) return;

    setSaving(true);
    try {
      const res = await employeeApi.update(profile._id, formData);
      if (res.data.success) {
        showToast('Profile information updated successfully!', 'success');
        updateUserProfile(res.data.employee);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Retrieving employee profile..." />;
  }

  return (
    <div className="container-fluid px-0">
      <div className="mb-4">
        <h3 className="fw-bold text-dark mb-1">My Employee Profile</h3>
        <p className="text-secondary small mb-0">
          Manage your personal contact details, residential address, and emergency information
        </p>
      </div>

      <div className="row g-4">
        {/* Left Column: Read-Only System Information */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 p-4 text-center mb-4">
            <div
              className="rounded-circle bg-primary text-white mx-auto d-flex align-items-center justify-content-center fw-bold shadow mb-3"
              style={{ width: '80px', height: '80px', fontSize: '2rem' }}
            >
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>

            <h5 className="fw-bold text-dark mb-1">{user?.name}</h5>
            <p className="text-secondary small mb-2">{profile?.jobTitle || user?.role}</p>
            <div className="mb-3">
              <StatusBadge status={profile?.employmentStatus || 'Active'} />
            </div>

            <div className="badge bg-light text-dark border font-monospace py-1.5 px-3 mb-3">
              {profile?.employeeId || 'ID: PENDING'}
            </div>

            <hr className="my-2" />

            <div className="d-flex flex-column gap-2 text-start small mt-2">
              <div className="d-flex justify-content-between">
                <span className="text-muted">Work Email:</span>
                <strong className="text-dark">{user?.email}</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Department:</span>
                <strong className="text-dark">{profile?.department}</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Reporting Manager:</span>
                <strong className="text-dark">{profile?.manager?.fullName || 'HR Management'}</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Date Joined:</span>
                <strong className="text-dark">{formatDate(profile?.joiningDate)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Contact & Address Information */}
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 p-4">
            <h5 className="fw-bold text-dark mb-3 pb-2 border-bottom">
              <i className="bi bi-pencil-square text-primary me-2"></i>
              Edit Contact Information
            </h5>

            <form onSubmit={handleSubmit}>
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label" htmlFor="profilePhone">Phone Number</label>
                  <input
                    id="profilePhone"
                    type="text"
                    name="phoneNumber"
                    className="form-control"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <h6 className="fw-bold text-secondary text-uppercase small mb-3">Residential Address</h6>
              <div className="row g-3 mb-4">
                <div className="col-12">
                  <label className="form-label" htmlFor="street">Street Address</label>
                  <input
                    id="street"
                    type="text"
                    name="address.street"
                    className="form-control"
                    placeholder="123 Innovation Street, Apt 4"
                    value={formData.address.street}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label" htmlFor="city">City</label>
                  <input
                    id="city"
                    type="text"
                    name="address.city"
                    className="form-control"
                    placeholder="San Francisco"
                    value={formData.address.city}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label" htmlFor="state">State / Province</label>
                  <input
                    id="state"
                    type="text"
                    name="address.state"
                    className="form-control"
                    placeholder="CA"
                    value={formData.address.state}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label" htmlFor="zipCode">Zip Code</label>
                  <input
                    id="zipCode"
                    type="text"
                    name="address.zipCode"
                    className="form-control"
                    placeholder="94105"
                    value={formData.address.zipCode}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <h6 className="fw-bold text-secondary text-uppercase small mb-3">Emergency Contact</h6>
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <label className="form-label" htmlFor="ecName">Contact Name</label>
                  <input
                    id="ecName"
                    type="text"
                    name="emergencyContact.name"
                    className="form-control"
                    placeholder="e.g. Sarah Connor"
                    value={formData.emergencyContact.name}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label" htmlFor="ecRel">Relationship</label>
                  <input
                    id="ecRel"
                    type="text"
                    name="emergencyContact.relationship"
                    className="form-control"
                    placeholder="e.g. Spouse / Brother"
                    value={formData.emergencyContact.relationship}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label" htmlFor="ecPhone">Emergency Phone</label>
                  <input
                    id="ecPhone"
                    type="text"
                    name="emergencyContact.phone"
                    className="form-control"
                    placeholder="+1 (555) 999-9999"
                    value={formData.emergencyContact.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end">
                <button type="submit" className="btn btn-primary px-4 fw-semibold shadow-sm" disabled={saving}>
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving Profile...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
