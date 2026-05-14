import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios'
import { useAuthContext } from '../AuthContextProvider/AuthContextProvider';
import toast from 'react-hot-toast';
const Buyer = () => {
  const { server_url } = useAuthContext();
  const [buyers, setBuyers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [editingBuyer, setEditingBuyer] = useState(null);
  const [formData, setFormData] = useState({
    id: null,
    buyer: '',
    email: '',
    phone: '',
    country: '',
    address: '',
    status: ''
  });

  useEffect(() => {
    if (!server_url) return;
    (async () => {
      try {
        const res = await fetch(`${server_url}/Buyer`);
        const data = await res.json();
        // Ensure data is an array
        setBuyers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch:', err);
      }
    })();
  }, [server_url]);

  const notify = (message, type) => {
    switch (type) {
      case 1:
        toast.success(message);
        break;
      case 2:
        toast.error(message);
        break;
      case 3:
        toast.error(message);
        break;
      default:
        toast(message);
    }
  }
  // Search functionality
  const filteredBuyers = buyers.filter(buyer =>
    Object.values(buyer).some(value =>
      value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Sort functionality
  const sortedBuyers = [...filteredBuyers].sort((a, b) => {
    if (!sortField) return 0;

    const aValue = a[sortField];
    const bValue = b[sortField];

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleAddNew = () => {
    setEditingBuyer(null);
    setFormData({
      id: '',
      buyer: '',
      email: '',
      phone: '',
      country: '',
      address: '',
      status: ''
    });
    setIsModalOpen(!isModalOpen);
  };

  const handleEdit = (buyer) => {
    setIsModalOpen(true);
    setEditingBuyer(buyer);
    setFormData({
      id: buyer.id,
      buyer: buyer.buyer,
      email: buyer.email,
      phone: buyer.phone,
      country: buyer.country,
      address: buyer.address,
      status: buyer.status
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this buyer?')) {
      axios.delete(`${server_url}/Buyer/delete/${id}`)
        .then((res) => {
          // console.log(res.data);
          notify(res.data.message, 1);
          setBuyers(prev => prev.filter(buyer => buyer.id !== id));
        })
        .catch(err => {
          notify("Failed to delete", 2);
        });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // if editingBuyer has data then update or add new buyer
    if (editingBuyer) {
      // Update existing buyer

      axios.put(`${server_url}/Buyer/update/${editingBuyer.id}`, formData)
        .then(res => {
          // console.log(res.data);
          notify(res.data.message, 1);
        })
        .catch(err => {
          notify("Failed to update", 3);
        })

      setBuyers(buyers.map(buyer =>
        buyer.id === editingBuyer.id
          ? { ...buyer, ...formData }
          : buyer
      ));
    }
    else // add new buyer
    {
      axios.post(`${server_url}/Buyer`, formData)
        .then(res => {
          // console.log(res.data);
          notify(res.data.message, 1);
          setBuyers(...buyers, res.data);
        })
        .catch(err => {
          notify("Failed to add", 3);
        });
    }
    setIsModalOpen(false);
    setEditingBuyer(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      Active: 'bg-green-100 text-green-800',
      Inactive: 'bg-red-100 text-red-800',
      Pending: 'bg-yellow-100 text-yellow-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status]}`}>
        {status}
      </span>
    );
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="text-gray-400">↕</span>;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  // Column configuration and resizing state
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'buyer', label: 'Buyer' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'country', label: 'Country' },
    { key: 'status', label: 'Status' },
    { key: 'address', label: 'Address' },
    { key: 'actions', label: 'Actions' }
  ];

  const [colWidths, setColWidths] = useState({
    id: '60px',
    buyer: '150px',
    email: '200px',
    phone: '120px',
    country: '100px',
    status: '100px',
    address: '200px',
    actions: '80px'
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
    <div className="p-2  min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-2 gap-4">
        <div>
          <h1 className="text-3xl px-8 font-black text-slate-800 tracking-tight">Buyer Management</h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Filter buyers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-4 py-2.5 premium-card border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm text-sm font-medium"
            />
          </div>

          <button
            onClick={handleAddNew}
            className={`${isModalOpen ? 'bg-gray-100 text-slate-600 hover:bg-gray-200' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-100'} px-6 py-2.5 rounded-2xl font-black text-sm transition-all flex items-center justify-center active:scale-95`}
          >
            <svg className={`w-4 h-4 mr-2 transition-transform duration-500 ${isModalOpen ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {isModalOpen ? 'CLOSE EDITOR' : 'NEW BUYER REGISTRATION'}
          </button>
        </div>
      </div>

      {/* Dropdown Form Section */}
      <div className={`transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${isModalOpen ? 'max-h-[1000px] opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
        <div className="premium-card rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="px-8 py-5  border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-700">{editingBuyer ? 'Update Buyer Profile' : 'Register New Client'}</h3>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-lg tracking-widest">Configuration Mode</span>
          </div>

          <form onSubmit={handleSubmit} className="p-2 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              <div className="space-y-1.5 lg:col-span-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Buyer / Company Name</label>
                <input type="text" name="buyer" value={formData.buyer} onChange={handleInputChange} required className="w-full px-4 py-3 bg-gray-200 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold text-slate-800 transition-all" />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Official Email</label>
                <input type="text" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-200 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold text-slate-800 transition-all" />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contact Phone</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-200 border border-gray-300 rounded-2xl focus:bg-white focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold text-slate-800 transition-all" />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Origin Country</label>
                <input type="text" name="country" value={formData.country} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-200 border border-gray-300 rounded-2xl focus:bg-white focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold text-slate-800 transition-all" />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Account Status</label>
                <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-200 border border-gray-300 rounded-2xl focus:bg-white focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold text-slate-800 appearance-none transition-all cursor-pointer">
                  <option value="">Select Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="space-y-1.5 lg:col-span-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Business Address</label>
                <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-200 border border-gray-300 rounded-2xl focus:bg-white focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold text-slate-800 transition-all" />
              </div>
            </div>

            <div className="flex justify-end items-center gap-6 pt-3 border-t border-gray-100">
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-xs font-black text-gray-400 hover:text-slate-800 transition-colors uppercase tracking-widest">Discard Changes</button>
              <button type="submit" className="px-12 py-4 bg-gray-900 text-white text-xs font-black rounded-2xl hover:bg-black shadow-2xl shadow-gray-200 active:scale-95 transition-all uppercase tracking-[0.2em]">
                {editingBuyer ? 'Update Buyer' : 'Register Buyer'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        {[
          { label: 'Total Base', value: Array.isArray(buyers) ? buyers.length : 0, icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', color: 'emerald' },
          { label: 'Active Clients', value: Array.isArray(buyers) ? buyers.filter(b => b.status === 'Active').length : 0, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'emerald' },
          { label: 'Pending Review', value: Array.isArray(buyers) ? buyers.filter(b => b.status === 'Pending').length : 0, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'amber' },
          { label: 'Suspended', value: Array.isArray(buyers) ? buyers.filter(b => b.status === 'Inactive').length : 0, icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'red' },
        ].map((stat, i) => (
          <div key={i} className="premium-card p-2">
            <div className="flex items-center gap-5">
              <div className={`p-4 bg-${stat.color}-50 rounded-2xl text-${stat.color}-600 shadow-inner`}>
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={stat.icon} />
                </svg>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-3xl font-black text-slate-800 tracking-tight">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="premium-card rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 table-fixed">
            <colgroup>
              {columns.map(col => (
                <col key={col.key} style={{ width: colWidths[col.key] }} />
              ))}
            </colgroup>
            <thead className="bg-gray-50/50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none relative group/resize"
                    onClick={() => column.key !== 'actions' && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      {column.label}
                      {column.key !== 'actions' && <SortIcon field={column.key} />}
                    </div>
                    {column.key !== 'actions' && (
                      <div
                        onMouseDown={(e) => startResize(e, column.key)}
                        className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-emerald-400 group-hover/resize:bg-gray-300 transition-colors"
                      />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="premium-card divide-y divide-gray-50">
              {sortedBuyers.length > 0 ? (
                sortedBuyers.map((buyer) => (
                  <tr key={buyer.id} className="hover:bg-blue-50/20 transition-colors group cursor-default">
                    <td className="px-2 py-2 text-xs font-bold text-gray-400 break-words">{buyer.id}</td>
                    <td className="px-2 py-2 text-sm font-black text-slate-800 tracking-tight break-words">{buyer.buyer}</td>
                    <td className="px-2 py-2 text-sm text-gray-500 font-bold break-words">{buyer.email}</td>
                    <td className="px-2 py-2 text-sm text-gray-400 font-bold italic break-words">{buyer.phone}</td>
                    <td className="px-2 py-2 break-words">
                      <span className="px-2 py-1 premium-card border border-gray-100 rounded-lg text-[10px] font-black uppercase text-gray-600 shadow-sm">
                        {buyer.country}
                      </span>
                    </td>
                    <td className="px-2 py-2 break-words">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${buyer.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : buyer.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
                        {buyer.status}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-sm text-gray-400 font-bold italic break-words">{buyer.address}</td>
                    <td className="px-2 py-2 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => handleEdit(buyer)} className="p-2.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(buyer.id)} className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-20">
                      <svg className="w-16 h-16 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                      <p className="text-xl font-black text-slate-800 uppercase tracking-widest">No Client Data Found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Buyer;
