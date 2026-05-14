import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios'
import { useAuthContext } from '../AuthContextProvider/AuthContextProvider';
import toast from 'react-hot-toast';

const Style = () => {
  const { server_url, user } = useAuthContext();
  const [sectionList, setSectionList] = useState([]);
  const [styles, setStyles] = useState([]);
  const [buyerList, setBuyerList] = useState([])
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 100; // show 50 records on first page by default
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [editingBuyer, setEditingBuyer] = useState(null);
  const [formData, setFormData] = useState({
    id: null,
    section: '',
    buyer: '',
    style: '',
    process: '',
    last_process: '',
    status: ''
  });
  const notify = (message, type) => {
    switch (type) {
      case 'success':
        toast.success(message);
        break;
      case 'error':
        toast.error(message);
        break;
      case 'warning':
        toast.warning(message);
        break;
      case 'info':
        toast.info(message);
        break;
    }
  }

  // console.log(user)
  useEffect(() => {
    if (!server_url || !user) return;
    (async () => {
      try {
        axios.post(`${server_url}/style/get`, user)
          .then(res => {
            setStyles(res.data);
          })
          .catch(err => {
            console.error('Failed to fetch:', err);
          })
      } catch (err) {
        console.error('Failed to fetch:', err);
      }
    })();

  }, [server_url, user]);

  useEffect(() => {
    if (!server_url) return;
    let mounted = true;
    (async () => {
      try {
        if (user.role == "Operator") {
          setSectionList([{ section: user.section }]);
        } else {
          const sections = await axios.get(`${server_url}/globalFetch/section/list`);
          if (mounted && Array.isArray(sections.data)) setSectionList(sections.data);
        }

        const buyers = await axios.get(`${server_url}/globalFetch/buyer/getlist`);
        if (mounted && Array.isArray(buyers.data)) setBuyerList(buyers.data);

      } catch (err) {
        console.error('Failed to load initial section/buyer data:', err);
      }
    })();
    return () => { mounted = false; };
  }, [server_url]);

  // Search functionality
  const filteredBuyers = styles.filter(style =>
    Object.values(style).some(value =>
      (value || '').toString().toLowerCase().includes(searchTerm.toLowerCase())
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

  // Reset to first page when filters/sort/data change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortField, sortDirection, styles]);

  // Paginate sorted results
  const totalItems = sortedBuyers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedBuyers = sortedBuyers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const goToPage = (page) => {
    const p = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(p);
  };

  const handleAddNew = async () => {
    setEditingBuyer(null);
    // Use already-loaded sectionList and buyerList (loaded once on mount)


    setFormData({
      id: '',
      section: '',
      buyer: '',
      style: '',
      process: '',
      last_process: '',
      status: ''
    });

    setIsModalOpen(!isModalOpen);
  };

  const handleEdit = async (style) => {
    setEditingBuyer(style);
    setFormData({
      id: style.id,
      section: style.section,
      buyer: style.buyer,
      style: style.style,
      process: style.process,
      last_process: style.last_process,
      status: style.status
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this buyer?')) {
      axios.delete(`${server_url}/style/delete/${id}`)
        .then(res => {
          setStyles(prev => prev.filter(buyer => buyer.id !== id));
        })
        .catch(err => {
          console.error('Failed to delete:', err);
        });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // if editingBuyer has data then update or add new buyer
    if (editingBuyer) {
      // Update existing buyer

      axios.put(`${server_url}/style/update/${editingBuyer.id}`, formData)
        .then(res => {
        })
        .catch(err => {
          console.error('Failed to update:', err);
        })

      setStyles(styles.map(style =>
        style.id === editingBuyer.id
          ? { ...style, ...formData }
          : style
      ));
    }
    else // add new buyer to database
    {
      axios.post(`${server_url}/style/update`, formData)
        .then(res => {
          // axios responses provide parsed body on res.data
        })
        .catch(err => {
          console.error('Failed to insert:', err);
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
      Pending: 'bg-yellow-100 text-yellow-800',
      Yes: 'bg-green-100 text-green-800',
      No: 'bg-red-100 text-red-800'
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

  // Columns configuration and resizing state
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'section', label: 'Section' },
    { key: 'buyer', label: 'Buyer' },
    { key: 'style', label: 'Style' },
    { key: 'process', label: 'Process' },
    { key: 'last_process', label: 'Last Process' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions' }
  ];

  const [colWidths, setColWidths] = useState({
    id: '60px',
    section: '100px',
    buyer: '100px',
    style: '150px',
    process: '150px',
    last_process: '50px',
    status: '50px',
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
          <h1 className="text-3xl px-8 font-bold text-slate-800 tracking-tight">Style Information</h1>
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
              placeholder="Search styles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-4 py-2.5 premium-card border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
            />
          </div>

          <button
            onClick={handleAddNew}
            className={`px-6 py-2.5 rounded-xl font-semibold active:scale-95 transition-all flex items-center justify-center shadow-lg ${isModalOpen ? 'bg-gray-600 text-white shadow-gray-200' : 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700'}`}
          >
            <svg className={`w-5 h-5 mr-2 transition-transform duration-300 ${isModalOpen ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {isModalOpen ? 'Close Form' : 'Create Style'}
          </button>
        </div>
      </div>

      {/* Inline Form (Hide/Unhide) */}
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isModalOpen ? 'max-h-[1000px] opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
        <div className="premium-card rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="text-lg font-bold text-slate-700">{editingBuyer ? 'Update' : 'New'} Style Configuration</h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{editingBuyer ? 'Edit Mode' : 'Creation Mode'}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Section</label>
              <select name="section" value={formData.section} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none font-medium transition-all">
                {
                  user.role == "Operator" ? <option value={user.section}>{user.section}</option> : <>
                    <option value="">Select Section</option>
                    {sectionList.map((s, i) => <option key={i} value={s.section}>{s.section}</option>)}
                  </>
                }
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Buyer</label>
              <select name="buyer" value={formData.buyer} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none font-medium transition-all">
                <option value="">Select Buyer</option>
                {buyerList.map((b, i) => <option key={i} value={b.buyer}>{b.buyer}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Style Name</label>
              <input type="text" name="style" value={formData.style} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none font-medium transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Process / Size</label>
              <input type="text" name="process" value={formData.process} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none font-medium transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Last Process</label>
              <select name="last_process" value={formData.last_process} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none font-medium transition-all">
                <option value="">Select...</option>
                <option value="Yes">Yes (Completes Production)</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Status</label>
              <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none font-medium transition-all">
                <option value="">Select status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="lg:col-span-3 flex justify-end gap-3 mt-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-slate-700 transition-colors">Cancel</button>
              <button type="submit" className="px-8 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-95 transition-all">
                {editingBuyer ? 'Update Style' : 'Save Style'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        {[
          { label: 'Total Styles', value: styles.length, icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', color: 'blue' },
          { label: 'Active Styles', value: styles.filter(s => s.status === 'Active').length, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'green' },
          { label: 'Inactive', value: styles.filter(s => s.status === 'Inactive').length, icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'red' },
          { label: 'Pending Review', value: styles.filter(s => s.status === 'Pending').length, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'orange' },
        ].map((stat, i) => (
          <div key={i} className="premium-card p-2 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
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

      {/* Table Section */}
      <div className="premium-card rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 table-fixed">
            <thead className="bg-gray-50/50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none relative group/resize"
                    style={{ width: colWidths[column.key] }}
                    onClick={() => column.key !== 'actions' && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      {column.label}
                      {column.key !== 'actions' && <SortIcon field={column.key} />}
                    </div>
                    {/* Resize Handle */}
                    {column.key !== 'actions' && (
                      <div
                        onMouseDown={(e) => startResize(e, column.key)}
                        className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-400 group-hover/resize:bg-gray-300 transition-colors"
                      />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="premium-card divide-y divide-gray-50">
              {totalItems > 0 ? (
                paginatedBuyers.map((buyer) => (
                  <tr key={buyer.id} className="hover:bg-blue-50/20 transition-colors group">
                    <td className="px-4 py-3 text-sm font-bold text-slate-800 break-words">{buyer.id}</td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-800 break-words">{buyer.section}</td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-800 break-words">{buyer.buyer}</td>
                    <td className="px-4 py-3 text-sm font-bold text-blue-600 break-words">{buyer.style}</td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-800 break-words">{buyer.process}</td>
                    <td className="px-4 py-3">
                      {getStatusBadge(buyer.last_process)}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(buyer.status)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleEdit(buyer)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(buyer.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-20 text-center text-gray-400">
                    <p className="text-xl font-bold">No styles found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4  border-t border-gray-100">
          <div className="text-sm font-medium text-gray-500">
            Showing <span className="text-slate-800">{totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span>
            {' to '}
            <span className="text-slate-800">{Math.min(currentPage * pageSize, totalItems)}</span>
            {' of '}
            <span className="text-slate-800">{totalItems}</span> entries
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 text-gray-500 hover:text-blue-600 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${currentPage === p ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 text-gray-500 hover:text-blue-600 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal premium-card rounded-lg shadow-xl w-full max-w-md */}
      {/* {isModalOpen && (
        <div className="fixed inset-0 premium-card bg-opacity-75 p-2 z-50 flex justify-center">
          <div className="bg-green-200 rounded-lg shadow-xl  w-full max-w-9/12">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-center text-bold text-slate-800">
                {editingBuyer ? 'Edit Style' : 'Add New Style'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-1 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Section
                </label>
                <select
                  name="section"
                  value={formData.section}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border premium-card border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                >
                  {
                    (sectionList || []).map((section, idx) => (
                      <option key={section.id ?? idx} value={section.section}>{section.section}</option>
                    ))
                  }
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Buyer
                </label>
                <select
                  name="buyer"
                  value={formData.buyer}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border premium-card border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                >
                  {
                    (buyerList || []).map((buyer, idx) => (
                      <option key={buyer.id ?? idx} value={buyer.buyer}>{buyer.buyer}</option>
                    ))
                  }
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Style
                </label>
                <input
                  type="style"
                  name="style"
                  value={formData.style}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border  premium-card border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Process/Size
                </label>
                <input
                  type="text"
                  name="process"
                  value={formData.process}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border  premium-card border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Last Process (Complete)
                </label>
                <select
                  name="last_process"
                  value={formData.last_process}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border premium-card border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border premium-card border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div className="flex justify-start space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 premium-card border border-gray-300 rounded-lg hover: focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 w-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 w-full"
                >
                  {editingBuyer ? 'Update' : 'Add'} Style
                </button>
              </div>
            </form>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default Style;
