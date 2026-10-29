import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationApi } from '../../api/services';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const fetchUnreadCount = async () => {
      try {
        const res = await notificationApi.getAll();
        if (res.data.success && isMounted) {
          setUnreadCount(res.data.unreadCount || 0);
        }
      } catch (err) {
        // Silently handle
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const roleBadgeColor = {
    HR: 'bg-primary',
    Manager: 'bg-success',
    Employee: 'bg-info text-dark',
  }[user?.role] || 'bg-secondary';

  return (
    <header className="topbar">
      <div className="d-flex align-items-center gap-3">
        <button
          className="btn btn-sm btn-light d-lg-none text-secondary"
          type="button"
          onClick={toggleSidebar}
          aria-label="Toggle Navigation"
        >
          <i className="bi bi-list fs-4"></i>
        </button>

        <div className="d-none d-sm-block">
          <span className="text-secondary small">Welcome back, </span>
          <strong className="text-dark">{user?.name}</strong>
        </div>
      </div>

      <div className="d-flex align-items-center gap-3">
        {/* Role Badge */}
        <span className={`badge ${roleBadgeColor} px-2.5 py-1.5`} style={{ fontSize: '0.78rem' }}>
          {user?.role} Portal
        </span>

        {/* Notifications Icon */}
        <Link
          to="/notifications"
          className="btn btn-light position-relative rounded-circle p-2 text-secondary"
          title="Notifications"
          style={{ width: '40px', height: '40px' }}
        >
          <i className="bi bi-bell fs-5"></i>
          {unreadCount > 0 && (
            <span
              className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-white"
              style={{ fontSize: '0.65rem' }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User profile dropdown (React state controlled) */}
        <div className="position-relative" ref={dropdownRef}>
          <button
            className="btn btn-light d-flex align-items-center gap-2 p-1.5 pe-3 rounded-pill border shadow-sm"
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-expanded={dropdownOpen}
          >
            <div
              className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
              style={{ width: '32px', height: '32px', fontSize: '0.85rem' }}
            >
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="small fw-semibold text-dark d-none d-md-inline">
              {user?.name?.split(' ')[0]}
            </span>
            <i className={`bi bi-chevron-${dropdownOpen ? 'up' : 'down'} text-muted small`}></i>
          </button>

          {dropdownOpen && (
            <div
              className="dropdown-menu dropdown-menu-end show shadow border-0 py-2 mt-2 position-absolute end-0"
              style={{ minWidth: '220px', zIndex: 1050 }}
            >
              <div className="px-3 py-2 border-bottom mb-1">
                <div className="fw-bold text-dark">{user?.name}</div>
                <div className="text-muted small text-truncate" style={{ maxWidth: '190px' }}>
                  {user?.email}
                </div>
                <div className="badge bg-light text-dark border mt-1">
                  {user?.employeeProfile?.employeeId || user?.role}
                </div>
              </div>
              <Link
                className="dropdown-item py-2 d-flex align-items-center"
                to="/profile"
                onClick={() => setDropdownOpen(false)}
              >
                <i className="bi bi-person me-2 text-primary"></i>My Profile
              </Link>
              <Link
                className="dropdown-item py-2 d-flex align-items-center"
                to="/notifications"
                onClick={() => setDropdownOpen(false)}
              >
                <i className="bi bi-bell me-2 text-info"></i>Notifications
              </Link>
              <div className="dropdown-divider my-1"></div>
              <button
                className="dropdown-item py-2 text-danger d-flex align-items-center fw-semibold"
                onClick={handleLogout}
              >
                <i className="bi bi-box-arrow-right me-2"></i>Sign Out
              </button>
            </div>
          )}
        </div>

        {/* Dedicated Visible Logout Button on Topbar */}
        <button
          className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill shadow-sm fw-semibold"
          onClick={handleLogout}
          title="Sign out of StaffSync"
        >
          <i className="bi bi-box-arrow-right"></i>
          <span className="d-none d-sm-inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
