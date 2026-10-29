import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layouts
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';

// Common Guard
import ProtectedRoute from '../components/common/ProtectedRoute';

// Public Pages
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import UnauthorizedPage from '../pages/UnauthorizedPage';
import NotFoundPage from '../pages/NotFoundPage';

// Dashboard Pages
import EmployeeDashboard from '../pages/dashboards/EmployeeDashboard';
import ManagerDashboard from '../pages/dashboards/ManagerDashboard';
import HrDashboard from '../pages/dashboards/HrDashboard';

// Module Pages
import EmployeeList from '../pages/employees/EmployeeList';
import AttendancePage from '../pages/attendance/AttendancePage';
import LeavePage from '../pages/leaves/LeavePage';
import AnnouncementsPage from '../pages/announcements/AnnouncementsPage';
import TrainingsPage from '../pages/trainings/TrainingsPage';
import NotificationsPage from '../pages/notifications/NotificationsPage';
import ProfilePage from '../pages/profile/ProfilePage';

// Helper component to route /dashboard to appropriate role dashboard
const DashboardRedirect = () => {
  const { user } = useAuth();
  if (user?.role === 'HR') return <Navigate to="/hr-dashboard" replace />;
  if (user?.role === 'Manager') return <Navigate to="/manager-dashboard" replace />;
  return <EmployeeDashboard />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Landing */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Access Denied & Not Found */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Protected Routes inside Main Layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          {/* General Dashboard Router */}
          <Route path="/dashboard" element={<DashboardRedirect />} />

          {/* Role-Specific Dashboards */}
          <Route
            path="/hr-dashboard"
            element={
              <ProtectedRoute allowedRoles={['HR']} />
            }
          >
            <Route index element={<HrDashboard />} />
          </Route>

          <Route
            path="/manager-dashboard"
            element={
              <ProtectedRoute allowedRoles={['Manager', 'HR']} />
            }
          >
            <Route index element={<ManagerDashboard />} />
          </Route>

          {/* Employee Directory */}
          <Route
            path="/employees"
            element={
              <ProtectedRoute allowedRoles={['HR', 'Manager']} />
            }
          >
            <Route index element={<EmployeeList />} />
          </Route>

          {/* Module Routes available to all authenticated employees */}
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/leaves" element={<LeavePage />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/trainings" element={<TrainingsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
