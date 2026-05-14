import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios'
import { useAuthContext } from '../AuthContextProvider/AuthContextProvider';

const Users = () => {
  const { server_url, user } = useAuthContext();
  const [sectionList, setSectionList] = useState([]);
  const [userList, setUserList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    section: '',
    full_name: '',
    username: '',
    password: '',
    user_role: '',
    status: ''
  });

  useEffect(() => {
    if (!server_url || !user) return;
    axios.post(`${server_url}/users/list`, user)
      .then(res => {
        setUserList(res.data);
        setCurrentPage(1);
      })
      .catch(err => console.error('Failed to fetch users:', err));
  }, [server_url, user]);


  async function FetchSectionData() {
    const sections = await axios.get(`${server_url}/globalFetch/section/list`);
    if (Array.isArray(sections.data)) setSectionList(sections.data);
  }

  useEffect(() => {
    if (!server_url) return;
    FetchSectionData();
  }, [server_url]);

  const filteredItems = userList.filter(u =>
    Object.values(u).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (!sortField) return 0;
    const aValue = a[sortField];
    const bValue = b[sortField];
    if (sortDirection === 'asc') return aValue > bValue ? 1 : -1;
    return aValue < bValue ? 1 : -1;
  });

  const handleSort = (field) => {
    if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
  };

  const goToPage = (page) => {
    const totalPages = Math.ceil(sortedItems.length / pageSize);
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      section: item.section,
      full_name: item.full_name,
      username: item.username,
      password: item.password,
      user_role: item.user_role,
      status: item.status
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      axios.delete(`${server_url}/user/delete/${id}`)
        .then(res => {
          alert(res.data.message);
          setUserList(prev => prev.filter(u => u.id !== id));
        })
        .catch(err => alert(err));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submissionData = { ...formData, user };
    if (editingItem) {
      axios.put(`${server_url}/users/update/${editingItem.id}`, submissionData)
        .then(res => {
          alert(res.data.message);
          setIsFormOpen(false);
          setUserList(prev => prev.map(item => item.id === editingItem.id ? { ...item, ...formData } : item));
          setEditingItem(null);
        })
        .catch(err => alert(err));
    } else {
      axios.post(`${server_url}/users/create`, submissionData)
        .then(res => {
          alert(res.data.message);
          setIsFormOpen(false);
          setFormData({
            section: '',
            full_name: '',
            username: '',
            password: '',
            user_role: '',
            status: ''
          });
        })
        .catch(err => alert(err));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getStatusBadge = (status) => {
    const colors = {
      Active: 'bg-green-100 text-green-700',
      Inactive: 'bg-red-100 text-red-700',
      Pending: 'bg-amber-100 text-amber-700'
    };
    return <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg ${colors[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="text-gray-400">↕</span>;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'full_name', label: 'Full Name' },
    { key: 'username', label: 'Username' },
    { key: 'user_role', label: 'Role' },
    { key: 'section', label: 'Section' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions' }
  ];

  const [colWidths, setColWidths] = useState({
    id: '60px',
    full_name: '200px',
    username: '150px',
    user_role: '100px',
    section: '150px',
    status: '100px',
    actions: '100px'
  });

  const resizingRef = useRef({ colKey: null, startX: 0, startWidth: 0 });

  const startResize = (e, key) => {
    e.preventDefault();
    resizingRef.current = {
      colKey: key,
      startX: e.clientX,
      startWidth: parseInt(colWidths[key], 10) || 100
    };
  };

  useEffect(() => {
    function onMouseMove(e) {
      const { colKey, startX, startWidth } = resizingRef.current;
      if (!colKey) return;
      const dx = e.clientX - startX;
      const newWidth = Math.max(40, startWidth + dx);
      setColWidths(prev => ({ ...prev, [colKey]: `${newWidth}px` }));
    }

    function onMouseUp() {
      resizingRef.current.colKey = null;
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [colWidths]);

  return (
    <div className="p-6  min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">User Management</h1>
          <p className="text-gray-500 mt-1">Manage system access, roles, and section assignments for operators and admins.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-4 py-2.5 premium-card border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
            />
          </div>

          <button
            onClick={() => { setIsFormOpen(!isFormOpen); setEditingItem(null); if (!isFormOpen) setFormData({ section: '', full_name: '', username: '', password: '', user_role: '', status: 'Active' }); }}
            className={`${isFormOpen ? 'bg-gray-100 text-slate-600 hover:bg-gray-200' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'} px-6 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center active:scale-95`}
          >
            <svg className={`w-5 h-5 mr-2 transition-transform duration-300 ${isFormOpen ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {isFormOpen ? 'Close Form' : 'Add User'}
          </button>
        </div>
      </div>

      {/* Editor Section */}
      <div className={`transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${isFormOpen ? 'max-h-[1000px] opacity-100 mb-8' : 'max-h-0 opacity-0'}`}>
        <div className="premium-card rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4  border-b border-gray-100">
            <h3 className="text-lg font-bold text-slate-700">{editingItem ? 'Edit User Credentials' : 'Create New User Account'}</h3>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Full Name</label>
                <input type="text" name="full_name" value={formData.full_name} onChange={handleInputChange} required placeholder="e.g. John Doe" className="w-full px-4 py-2.5  border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Username</label>
                <input type="text" name="username" value={formData.username} onChange={handleInputChange} required placeholder="johndoe123" className="w-full px-4 py-2.5  border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Password</label>
                <input type="password" name="password" value={formData.password} onChange={handleInputChange} required placeholder="••••••••" className="w-full px-4 py-2.5  border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">User Role</label>
                <select name="user_role" value={formData.user_role} required onChange={handleInputChange} className="w-full px-4 py-2.5  border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium">
                  <option value="">Select Role</option>
                  <option value="Admin">Admin</option>
                  <option value="Operator">Operator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Assigned Section</label>
                <select name="section" value={formData.section} required onChange={handleInputChange} className="w-full px-4 py-2.5  border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium">
                  <option value="">Select Section</option>
                  <option value="All">All-Admin</option>
                  {sectionList.map((s, i) => <option key={i} value={s.section}>{s.section}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Account Status</label>
                <select name="status" value={formData.status} required onChange={handleInputChange} className="w-full px-4 py-2.5  border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium">
                  <option value="">Select status....</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
              <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-slate-700 transition-colors">Discard</button>
              <button type="submit" className="px-10 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 shadow-xl shadow-gray-200 active:scale-95 transition-all">
                {editingItem ? 'Update User' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Users', value: userList.length, icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', color: 'blue' },
          { label: 'Admins', value: userList.filter(u => u.user_role === 'Admin').length, icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', color: 'purple' },
          { label: 'Active Now', value: userList.filter(u => u.status === 'Active').length, icon: 'M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.828a5 5 0 117.07 0m-4.242-4.242a1 1 0 111.414 0', color: 'green' },
          { label: 'Incomplete', value: userList.filter(u => u.status !== 'Active').length, icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', color: 'orange' },
        ].map((stat, i) => (
          <div key={i} className="premium-card p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className={`p-3 bg-${stat.color}-50 rounded-xl text-${stat.color}-600`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-black text-slate-800">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Table */}
      <div className="premium-card rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50">
          <h3 className="text-lg font-bold text-slate-700">User Directory</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 table-fixed">
            <colgroup>
              {columns.map(col => (
                <col key={col.key} style={{ width: colWidths[col.key] }} />
              ))}
            </colgroup>
            <thead className="">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-blue-600 transition-colors relative group/resize"
                    onClick={() => col.key !== 'actions' && handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1.5">
                      {col.label}
                      {col.key !== 'actions' && <SortIcon field={col.key} />}
                    </div>
                    {col.key !== 'actions' && (
                      <div
                        onMouseDown={(e) => startResize(e, col.key)}
                        className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-400 group-hover/resize:bg-gray-300 transition-colors"
                      />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="premium-card divide-y divide-gray-50">
              {sortedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((u, idx) => (
                <tr key={u.id || idx} className="hover:bg-blue-50/20 transition-colors group">
                  <td className="px-6 py-4 text-xs font-bold text-gray-400 break-words">{u.id}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-800 break-words">{u.full_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-medium break-words">@{u.username}</td>
                  <td className="px-6 py-4 break-words">
                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${u.user_role === 'Admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{u.user_role}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 break-words">{u.section}</td>
                  <td className="px-6 py-4 break-words">{getStatusBadge(u.status)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(u)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                      <button onClick={() => handleDelete(u.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4  border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-400 uppercase">Page {currentPage} of {Math.ceil(sortedItems.length / pageSize)}</span>
          <div className="flex gap-2">
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="p-2 text-gray-400 hover:text-blue-600 disabled:opacity-30 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg></button>
            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === Math.ceil(sortedItems.length / pageSize)} className="p-2 text-gray-400 hover:text-blue-600 disabled:opacity-30 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Users;
