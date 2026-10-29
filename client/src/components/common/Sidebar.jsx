import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const { user } = useAuth();
  const role = user?.role;

  // Determine dashboard destination based on role
  const dashboardPath =
    role === 'HR'
      ? '/hr-dashboard'
      : role === 'Manager'
      ? '/manager-dashboard'
      : '/dashboard';

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-backdrop d-lg-none"
          onClick={closeSidebar}
          aria-hidden="true"
        ></div>
      )}

      <aside className={`sidebar ${isOpen ? 'show' : ''}`}>
        <div className="brand">
          <i className="bi bi-diagram-3-fill fs-4"></i>
          <span>StaffSync</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-heading">Main Navigation</div>

          <NavLink
            to={dashboardPath}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={closeSidebar}
          >
            <i className="bi bi-speedometer2"></i>
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/attendance"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={closeSidebar}
          >
            <i className="bi bi-calendar-check"></i>
            <span>Attendance</span>
          </NavLink>

          <NavLink
            to="/leaves"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={closeSidebar}
          >
            <i className="bi bi-calendar2-range"></i>
            <span>Leave Requests</span>
          </NavLink>

          {/* HR Management Section */}
          {role === 'HR' && (
            <>
              <div className="nav-heading">Human Resources</div>
              <NavLink
                to="/employees"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <i className="bi bi-people-fill"></i>
                <span>Employee Directory</span>
              </NavLink>
            </>
          )}

          {/* Manager Team Section */}
          {role === 'Manager' && (
            <>
              <div className="nav-heading">Team Supervision</div>
              <NavLink
                to="/employees"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <i className="bi bi-people"></i>
                <span>My Team Roster</span>
              </NavLink>
            </>
          )}

          <div className="nav-heading">Company & Growth</div>

          <NavLink
            to="/announcements"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={closeSidebar}
          >
            <i className="bi bi-megaphone"></i>
            <span>Announcements</span>
          </NavLink>

          <NavLink
            to="/trainings"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={closeSidebar}
          >
            <i className="bi bi-mortarboard"></i>
            <span>Training Programs</span>
          </NavLink>

          <div className="nav-heading">Personal</div>

          <NavLink
            to="/notifications"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={closeSidebar}
          >
            <i className="bi bi-bell"></i>
            <span>Notifications</span>
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={closeSidebar}
          >
            <i className="bi bi-person-badge"></i>
            <span>My Profile</span>
          </NavLink>
        </nav>

        {/* Footer profile indicator */}
        <div className="p-3 border-top border-secondary border-opacity-25 mt-auto">
          <div className="d-flex align-items-center gap-2">
            <div
              className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
              style={{ width: '36px', height: '36px', fontSize: '0.9rem' }}
            >
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <div className="text-white text-truncate fw-semibold small">{user?.name}</div>
              <div className="text-muted text-truncate" style={{ fontSize: '0.75rem' }}>
                {user?.employeeProfile?.jobTitle || user?.role}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
