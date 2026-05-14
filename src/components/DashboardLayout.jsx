import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import DashboardNavbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuthContext } from '../AuthContextProvider/AuthContextProvider';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { bgColor } = useAuthContext();

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-500" style={{ backgroundColor: bgColor }}>
      {/* Navbar stays at top */}
      <DashboardNavbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto relative custom-scrollbar">
          <div className="w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
