/**
 * File: web/frontend/src/components/layout/DashboardLayout.jsx
 * AccellaX 361° - Dashboard Layout Component
 * 
 * Description:
 * Main layout for authenticated users with header, sidebar, and content area.
 * Handles responsive sidebar toggling and navigation.
 */

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/common/Header';
import Sidebar from '@/components/common/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/contexts/NotificationContext';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { notifications } = useNotifications();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <Header onMenuToggle={toggleSidebar} showMenuButton={true} />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Breadcrumb or Page Header could go here */}
            
            {/* Page Content */}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;