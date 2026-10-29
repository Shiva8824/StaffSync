import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import Navbar from '../components/common/Navbar';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
      <div className="main-content">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="page-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
