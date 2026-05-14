import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthContext } from '../AuthContextProvider/AuthContextProvider';
import toast from 'react-hot-toast';

const Permission = () => {
  const { server_url, user } = useAuthContext();
  const [userList, setUserList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Define the menu structure (matching Sidebar.jsx)
  const menuStructure = [
    { id: 'dashboard', label: 'Dashboard' },
    {
      id: 'BuyerOrder',
      label: 'Order Management',
      submenus: [
        { id: 'Buyer', label: 'Buyers' },
        { id: 'Style', label: 'Styles' },
        { id: 'StyleRate', label: 'Piece Rates' },
        { id: 'BuyerOrder', label: 'Buyer Orders' },
      ]
    },
    {
      id: 'Production',
      label: 'Production Control',
      submenus: [
        { id: 'ProductionEntry', label: 'New Entry' },
        { id: 'ProductionShow', label: 'View History' },
        { id: 'ProductionReceived', label: 'Received Logs' },
      ]
    },
    {
      id: 'EmployeeInfo',
      label: 'Employees',
      submenus: [
        { id: 'employeeInformation', label: 'Employees List' },
      ]
    },
    { id: 'Reports', label: 'Reporting' },
    {
      id: 'user_management',
      label: 'Access Control',
      submenus: [
        { id: 'users', label: 'User List' },
        { id: 'Useractivitylogs', label: 'Activity Logs' },
        { id: 'Permission', label: 'Permission' },
      ]
    },
    {
      id: 'Settings',
      label: 'System Config',
      submenus: [
        { id: 'country', label: 'Countries' },
        { id: 'department', label: 'Departments' },
        { id: 'section', label: 'Sections' },
        { id: 'blockLine', label: 'Blocks/Lines' },
      ]
    }
  ];

  useEffect(() => {
    if (!server_url || !user) return;
    FetchUsers();
  }, [server_url, user]);

  const FetchUsers = async () => {
    try {
      const response = await axios.post(`${server_url}/users/list`, user);
      setUserList(response.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      toast.error('Failed to load user directory');
    }
  };

  const FetchUserPermissions = async (targetUser) => {
    setLoading(true);
    try {
      const response = await axios.post(`${server_url}/users/permissions/get`, { username: targetUser.username });
      const permsMap = {};
      response.data.forEach(p => {
        permsMap[p.menu_id] = p.has_access;
      });
      setPermissions(permsMap);
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
      toast.error('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (targetUser) => {
    setSelectedUser(targetUser);
    FetchUserPermissions(targetUser);
  };

  const handleToggle = (menuId) => {
    setPermissions(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      const permsArray = Object.keys(permissions).map(key => ({
        menu_id: key,
        has_access: permissions[key]
      }));
      // Filter out submenus if they are false (optional) or just send all
      await axios.post(`${server_url}/users/permissions/update`, {
        username: selectedUser.username,
        permissions: permsArray
      });
      toast.success(`Permissions updated for ${selectedUser.username}`);
    } catch (err) {
      console.error('Failed to save permissions:', err);
      toast.error('Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  const handleGrantAll = () => {
    const allPerms = {};
    menuStructure.forEach(menu => {
      allPerms[menu.id] = true;
      if (menu.submenus) {
        menu.submenus.forEach(sub => {
          allPerms[sub.id] = true;
        });
      }
    });
    setPermissions(allPerms);
  };

  const filteredUsers = userList.filter(u => 
    u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-2 min-h-screen bg-slate-50/50">
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* User Sidebar */}
        <div className="lg:w-1/3 flex flex-col gap-4">
          <div className="premium-card p-6 rounded-2xl border border-gray-100 shadow-sm bg-white">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-4">User Directory</h2>
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-medium"
              />
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
              {filteredUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => handleUserSelect(u)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 ${
                    selectedUser?.username === u.username
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200'
                      : 'bg-white border-slate-100 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/50'
                  }`}
                >
                  <div className="font-black text-xs uppercase tracking-widest">{u.full_name}</div>
                  <div className={`text-[10px] mt-1 ${selectedUser?.username === u.username ? 'text-emerald-100' : 'text-slate-400'}`}>@{u.username} • {u.user_role}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Permissions Panel */}
        <div className="lg:flex-1">
          {selectedUser ? (
            <div className="premium-card p-8 rounded-2xl border border-gray-100 shadow-sm bg-white animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Access Control for {selectedUser.full_name}</h2>
                  <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">Configure granular permissions for this account</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={handleGrantAll}
                    className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-emerald-600 transition-colors"
                  >
                    Grant All
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-8 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 shadow-xl shadow-slate-200 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Permissions'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {menuStructure.map(menu => (
                  <div key={menu.id} className="p-5 rounded-2xl bg-slate-50/50 border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">{menu.label}</h3>
                      {!menu.submenus && (
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={!!permissions[menu.id]} 
                            onChange={() => handleToggle(menu.id)}
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      )}
                    </div>
                    {menu.submenus && (
                      <div className="space-y-3">
                        {menu.submenus.map(sub => (
                          <div key={sub.id} className="flex items-center justify-between pl-4 py-1.5 border-l-2 border-slate-200">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{sub.label}</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={!!permissions[sub.id]} 
                                onChange={() => handleToggle(sub.id)}
                                className="sr-only peer" 
                              />
                              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex items-center justify-center premium-card rounded-2xl border border-dashed border-slate-200 bg-white">
              <div className="text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 003 11c0-2.778.563-5.393 1.582-7.766M15.5 10.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zM13.5 22h4.5m1-5h1.15a3 3 0 012.97 2.505l.369 2.213a1.5 1.5 0 01-1.488 1.747h-5.926a1.5 1.5 0 01-1.487-1.747l.368-2.213a3 3 0 012.97-2.505H18.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Select a User</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Pick an account from the directory to manage their access</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Permission;
