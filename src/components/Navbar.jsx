import React, { useState } from 'react';
import { useAuthContext } from '../AuthContextProvider/AuthContextProvider';

const DashboardNavbar = ({ onToggleSidebar }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, logout, bgColor, setBgColor } = useAuthContext();

  return (
    <nav className="premium-card rounded-none border-b border-gray-50 h-20 sticky top-0 z-50 transition-all duration-300">
      <div className="mx-auto px-8 h-full">
        <div className="flex justify-between items-center h-full">
          {/* Left Section */}
          <div className="flex items-center gap-6">
            <button
              onClick={onToggleSidebar}
              className="p-3 rounded-2xl text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all active:scale-90"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="h-10 w-10 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-base font-black text-slate-800 tracking-tight">Production Pro</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{user?.unit || 'Manufacturing OS'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Color Picker */}
            <div className="flex items-center gap-2 mr-2 px-3 py-1.5  rounded-2xl border border-gray-100">
              <label htmlFor="bg-picker" className="text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer">Theme</label>
              <input
                id="bg-picker"
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-6 h-6 rounded-lg cursor-pointer border-none bg-transparent"
              />
            </div>

            {/* Notification Bell */}
            <button className="p-3 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all relative group">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM10.5 3.75a6 6 0 0 0-6 6v2.25l-2.47 2.47a.75.75 0 0 0 .53 1.28h15.88a.75.75 0 0 0 .53-1.28L16.5 12V9.75a6 6 0 0 0-6-6z" />
              </svg>
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            <div className="h-8 w-[1px] bg-gray-100 mx-2"></div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 pl-1 pr-4 py-1 rounded-3xl hover: transition-all border border-transparent hover:border-gray-100 active:scale-95"
              >
                <div className="h-10 w-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-lg shadow-emerald-100 ring-2 ring-white">
                  {user?.username?.slice(0, 1).toUpperCase()}
                </div>
                <div className="hidden md:flex flex-col items-start text-left">
                  <span className="text-sm font-black text-slate-800 tracking-tight">{user?.username}</span>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{user?.role}</span>
                </div>
                <svg className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-4 w-64 premium-card rounded-3xl shadow-2xl border border-gray-100 py-3 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="px-6 py-4 border-b border-gray-50 mb-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Authenticated As</p>
                    <p className="text-base font-black text-slate-800 truncate">{user?.username}</p>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">{user?.email || 'enterprise-id-verified'}</p>
                  </div>
                  <div className="px-3 space-y-1">
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-600 hover: hover:text-emerald-600 rounded-2xl transition-all">
                      <div className="p-2  rounded-lg group-hover:bg-emerald-50 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                      Account Security
                    </button>
                    <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-2xl transition-all">
                      <div className="p-2 bg-red-50 rounded-lg">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      </div>
                      Terminate Session
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default DashboardNavbar;
