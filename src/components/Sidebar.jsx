import React, { useState } from 'react';
import { useAuthContext } from '../AuthContextProvider/AuthContextProvider';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ isOpen }) => {
  const { user, logout, permissions } = useAuthContext();
  const [openDropdown, setOpenDropdown] = useState(null);
  const location = useLocation();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      href: '/dashboard'
    },
    {
      id: 'BuyerOrder',
      label: 'Order Management',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      submenu: [
        { id: 'Buyer', label: 'Buyers', href: '/dashboard/Buyer' },
        { id: 'Style', label: 'Styles', href: '/dashboard/Style' },
        { id: 'StyleRate', label: 'Piece Rates', href: '/dashboard/StyleRate' },
        { id: 'BuyerOrder', label: 'Buyer Orders', href: '/dashboard/BuyerOrder' },
      ]
    },
    {
      id: 'Production',
      label: 'Production Control',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      submenu: [
        { id: 'ProductionEntry', label: 'New Entry', href: '/dashboard/ProductionEntry' },
        { id: 'ProductionShow', label: 'View History', href: '/dashboard/ProductionShow' },
        { id: 'ProductionReceived', label: 'Received Logs', href: '/dashboard/ProductionReceived' },
      ]
    },
    {
      id: 'EmployeeInfo',
      label: 'Employees',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      submenu: [
        { id: 'employeeInformation', label: 'Employees List', href: '/dashboard/employeeInformation' },
      ]
    },
    {
      id: 'Process',
      label: 'Process',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18m0 0a9 9 0 11-2.096-3.085" />
        </svg>
      ),
      href: '/dashboard/Process'
    },
    {
      id: 'Reports',
      label: 'Reporting',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a2 2 0 00-2-2H5a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v8m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      href: '/dashboard/Reports'
    },
    {
      id: 'user_management',
      label: 'Access Control',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 003 11c0-2.778.563-5.393 1.582-7.766M15.5 10.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zM13.5 22h4.5m1-5h1.15a3 3 0 012.97 2.505l.369 2.213a1.5 1.5 0 01-1.488 1.747h-5.926a1.5 1.5 0 01-1.487-1.747l.368-2.213a3 3 0 012.97-2.505H18.5z" />
        </svg>
      ),
      submenu: [
        { id: 'users', label: 'User List', href: '/dashboard/users' },
        { id: 'Useractivitylogs', label: 'Activity Logs', href: '/dashboard/Useractivitylogs' },
        { id: 'Permission', label: 'Permission', href: '/dashboard/permission', adminOnly: true }
      ]
    },
    {
      id: 'Settings',
      label: 'System Config',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      submenu: [
        { id: 'country', label: 'Countries', href: '/dashboard/country' },
        { id: 'department', label: 'Departments', href: '/dashboard/department' },
        { id: 'section', label: 'Sections', href: '/dashboard/section' },
        { id: 'blockLine', label: 'Blocks/Lines', href: '/dashboard/blockline' },
      ]
    },
    {
      id: 'community',
      label: 'Community',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      href: '/dashboard/community'
    },
    {
      id: 'tickets',
      label: 'Tickets',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      ),
      href: '/dashboard/tickets'
    },
    {
      id: 'backup',
      label: 'DB Backup',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
      href: '/dashboard/backup',
      adminOnly: true
    }
  ];

  // Helper to check if user has access to a menu/submenu
  const hasAccess = (item) => {
    if (user?.role === 'admin' || user?.role === 'Admin') return true;
    if (item.adminOnly) return false;

    // Check database permissions
    const perm = permissions.find(p => p.menu_id === (item.id || item.label));
    return perm ? perm.has_access : false;
  };

  const filteredMenuItems = menuItems
    .filter(item => hasAccess(item))
    .map(item => {
      if (item.submenu) {
        return {
          ...item,
          submenu: item.submenu.filter(sub => hasAccess(sub))
        };
      }
      return item;
    })
    .filter(item => !item.submenu || item.submenu.length > 0);

  const toggleDropdown = (id) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  const isActive = (path) => location.pathname === path;
  const isSubActive = (submenu) => submenu.some(item => location.pathname === item.href);

  return (
    <div className={`
      flex flex-col h-full premium-card border-r border-gray-200 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
      ${isOpen ? 'w-90' : 'w-0 lg:w-24'} overflow-hidden mt-2 ml-2
    `}>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 space-y-1.5 custom-scrollbar pt-4 mb-6">
        {filteredMenuItems.map((item) => (
          <div key={item.id} className="group/nav">
            {item.submenu ? (
              <div className="space-y-1">
                <button
                  onClick={() => toggleDropdown(item.id)}
                  className={`
                    w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300
                    ${(openDropdown === item.id || isSubActive(item.submenu))
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-gray-500 hover: hover:text-slate-800'}
                  `}
                >
                  <div className="flex items-center">
                    <span className={`transition-colors duration-300 ${(openDropdown === item.id || isSubActive(item.submenu)) ? 'text-emerald-600' : 'text-gray-400 group-hover/nav:text-gray-600'}`}>
                      {item.icon}
                    </span>
                    {isOpen && <span className="ml-4 text-xs font-black uppercase tracking-widest">{item.label}</span>}
                  </div>
                  {isOpen && (
                    <svg className={`w-4 h-4 transition-transform duration-300 ${openDropdown === item.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
                {isOpen && openDropdown === item.id && (
                  <div className="ml-10 space-y-1.5 py-2 animate-in slide-in-from-top-2 duration-300">
                    {item.submenu.map((sub, idx) => (
                      <Link
                        key={idx}
                        to={sub.href}
                        className={`
                          block px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all
                          ${isActive(sub.href) ? 'text-emerald-600 bg-emerald-50/50' : 'text-gray-400 hover:text-slate-800 hover:translate-x-1'}
                        `}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                to={item.href}
                className={`
                  flex items-center px-4 py-3 rounded-2xl transition-all duration-300
                  ${isActive(item.href) ? 'bg-emerald-600 text-white shadow-2xl shadow-emerald-100' : 'text-gray-500 hover: hover:text-slate-800'}
                `}
              >
                <span className={`transition-colors duration-300 ${isActive(item.href) ? 'text-white' : 'text-gray-400 group-hover/nav:text-gray-600'}`}>
                  {item.icon}
                </span>
                {isOpen && <span className="ml-4 text-xs font-black uppercase tracking-widest">{item.label}</span>}
              </Link>
            )}
          </div>
        ))}
      </div>
    </div >
  );
};

export default Sidebar;
