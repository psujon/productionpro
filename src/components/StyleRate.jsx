import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios'
import { useAuthContext } from '../AuthContextProvider/AuthContextProvider';
import toast from 'react-hot-toast';

const StyleRate = () => {
  const { server_url, user } = useAuthContext();
  const [sectionList, setSectionList] = useState([]);
  const [styles, setStyles] = useState([]);
  const [processList, setProcessList] = useState([]);
  const [styleList, setStyleList] = useState([])
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    id: null,
    section: '',
    style: '',
    process: '',
    price: 0,
    effective_date: new Date().toISOString().slice(0, 10)
  });
  const [processDropdownVisible, setProcessDropdownVisible] = useState(false);
  const [styleDropdownVisible, setStyleDropdownVisible] = useState(false);
  const [styleLoading, setStyleLoading] = useState(false);
  const [processLoading, setProcessLoading] = useState(false);
  const processDropdownRef = useRef(null);
  const styleDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (processDropdownRef.current && !processDropdownRef.current.contains(event.target)) {
        setProcessDropdownVisible(false);
      }
      if (styleDropdownRef.current && !styleDropdownRef.current.contains(event.target)) {
        setStyleDropdownVisible(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const [colWidths, setColWidths] = useState({
    id: '60px',
    section: '120px',
    style: '150px',
    process: '200px',
    price: '100px',
    effective_date: '80px',
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

  useEffect(() => {
    if (!server_url || !user) return;
    (async () => {
      try {
        axios.post(`${server_url}/style/rate/get`, user)
          .then(res => {
            setStyles(res.data);
            setCurrentPage(1);
          })
          .catch(err => {
            console.error('Failed to fetch style rates:', err);
          })
      } catch (err) {
        console.error('Failed to fetch style rates:', err);
      }
    })();

  }, [server_url, user]);

  useEffect(() => {
    if (!server_url) return;
    let mounted = true;
    (async () => {
      try {
        const sections = await axios.get(`${server_url}/globalFetch/section/list`);
        if (mounted && Array.isArray(sections.data)) setSectionList(sections.data);
      } catch (err) {
        console.error('Failed to load initial section data:', err);
      }
    })();
    return () => { mounted = false; };
  }, [server_url]);

  const filteredItems = styles.filter(item =>
    Object.values(item).some(value =>
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

  const goToPage = (page) => {
    const totalPages = Math.ceil(sortedItems.length / pageSize);
    const p = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(p);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      id: item.id,
      section: item.section,
      style: item.style,
      process: item.process,
      price: item.price,
      effective_date: item.effective_date
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this rate?')) {
      axios.delete(`${server_url}/styleRate/delete/${id}`)
        .then(res => {
          setStyles(prev => prev.filter(item => item.id !== id));
          toast.success("Rate deleted successfully");
        })
        .catch(err => {
          toast.error("Failed to delete");
        });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...user, ...formData };

    if (!data.section || !data.style || !data.process || !data.price || Number(data.price) <= 0) {
      alert('Please fill all required fields correctly.');
      return;
    }

    if (editingItem) {
      axios.put(`${server_url}/styleRate/update/${editingItem.id}`, data)
        .then(() => {
          setStyles(styles.map(item => item.id === editingItem.id ? { ...item, ...formData } : item));
          setIsFormOpen(false);
          setEditingItem(null);
          toast.success("Rate updated successfully");
        })
        .catch(err => toast.error("Failed to update"));
    } else {
      axios.post(`${server_url}/styleRate/insert`, data)
        .then(res => {
          setIsFormOpen(false);
          toast.success("Rate added successfully");
          axios.post(`${server_url}/style/rate/get`, user).then(res => setStyles(res.data));
        })
        .catch(err => toast.error("Failed to insert"));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  async function LoadSectionWiseStyleData(data) {
    setStyleLoading(true);
    try {
      const res = await axios.post(`${server_url}/globalFetch/sectionWiseStyleLoad/list`, data);
      const loadedStyles = res.data;
      if (Array.isArray(loadedStyles)) setStyleList(loadedStyles);
      else setStyleList(loadedStyles.styles || loadedStyles.data || []);
    } catch (err) {
      console.error('Failed to load styles:', err);
    } finally {
      setStyleLoading(false);
    }
  }
  const handleSectionChange = async (e) => {
    handleInputChange(e);
    const sectionValue = e.target.value;
    const data = { section: sectionValue, unit: user.unit };
    LoadSectionWiseStyleData(data);
  };

  async function LoadSectionStyleWiseProcessData(data) {
    setProcessLoading(true);
    try {
      const loadProcess = await axios.post(`${server_url}/globalFetch/styleWiseProcessLoad/list`, data);
      const loadedProcesses = loadProcess.data;
      if (Array.isArray(loadedProcesses)) setProcessList(loadedProcesses);
      else setProcessList(loadedProcesses.process || loadedProcesses.data || []);
    } catch (error) {
      console.error('Failed to load processes:', error);
    } finally {
      setProcessLoading(false);
    }
  }
  const handleStyleChange = async (e) => {
    handleInputChange(e);
    const styleValue = e.target.value;
    const data = {
      unit: user.unit,
      section: formData.section,
      style: styleValue
    }
    LoadSectionStyleWiseProcessData(data);
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="text-gray-400">↕</span>;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'section', label: 'Section' },
    { key: 'style', label: 'Style' },
    { key: 'process', label: 'Process' },
    { key: 'price', label: 'Price' },
    { key: 'effective_date', label: 'Effective Date' },
    { key: 'actions', label: 'Actions' }
  ];

  return (
    <div className="p-2  min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-2 gap-4">
        <div>
          <h1 className="text-3xl px-8 font-bold text-slate-800 tracking-tight">Style Rates</h1>
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
              placeholder="Filter rates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-4 py-2.5 premium-card border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
            />
          </div>

          <button
            onClick={() => { setIsFormOpen(!isFormOpen); setEditingItem(null); setFormData({ id: null, section: '', style: '', process: '', price: 0 }); }}
            className={`${isFormOpen ? 'bg-gray-100 text-slate-600 hover:bg-gray-200' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'} px-6 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center active:scale-95`}
          >
            <svg className={`w-5 h-5 mr-2 transition-transform duration-300 ${isFormOpen ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {isFormOpen ? 'Close Editor' : 'New Rate'}
          </button>
        </div>
      </div>

      {/* Editor Section */}
      <div className={`transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${isFormOpen ? 'max-h-[1000px] opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
        <div className="premium-card rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4  border-b border-gray-100">
            <h3 className="text-lg font-bold text-slate-700">{editingItem ? 'Edit Style Rate' : 'Create New Piece Rate'}</h3>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Section</label>
                <select name="section" value={formData.section} required onChange={handleSectionChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none font-medium transition-all">
                  {
                    user.role == "Operator" ? (
                      <option value={user.section}>{user.section}</option>
                    ) : (
                      <>
                        <option value="">Select Section</option>
                        {sectionList.map((s, i) => <option key={i} value={s.section}>{s.section}</option>)}
                      </>
                    )
                  }
                </select>
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Style</label>
                <input type="text" name="style" value={formData.style} onChange={(e) => { handleStyleChange(e); setStyleDropdownVisible(true); }} onFocus={() => setStyleDropdownVisible(true)} required placeholder="Search style..." className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none font-medium transition-all" />
                {styleDropdownVisible && (
                  <div ref={styleDropdownRef} className="absolute z-50 w-full mt-2 premium-card border border-gray-100 rounded-xl shadow-2xl max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                    {styleLoading ? <div className="p-4 text-center text-gray-400 text-sm">Searching...</div> : (
                      styleList.filter(s => s.style.toLowerCase().includes(formData.style.toLowerCase())).map((s, i) => (
                        <div key={i} className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-sm font-medium transition-colors border-b border-gray-50 last:border-0" onClick={() => { setFormData(prev => ({ ...prev, style: s.style })); handleStyleChange({ target: { name: 'style', value: s.style } }); setStyleDropdownVisible(false); }}>{s.style}</div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Process</label>
                <input type="text" name="process" value={formData.process} onChange={(e) => { handleInputChange(e); setProcessDropdownVisible(true); }} onFocus={() => setProcessDropdownVisible(true)} required placeholder="Search process..." className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none font-medium transition-all" />
                {processDropdownVisible && (
                  <div ref={processDropdownRef} className="absolute z-50 w-full mt-2 premium-card border border-gray-100 rounded-xl shadow-2xl max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                    {processLoading ? <div className="p-4 text-center text-gray-400 text-sm">Searching...</div> : (
                      processList.filter(p => p.process.toLowerCase().includes(formData.process.toLowerCase())).map((p, i) => (
                        <div key={i} className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-sm font-medium transition-colors border-b border-gray-50 last:border-0" onClick={() => { setFormData(prev => ({ ...prev, process: p.process })); setProcessDropdownVisible(false); }}>{p.process}</div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Rate (BDT)</label>
                <input type="number" step="0.01" name="price" value={formData.price} onChange={handleInputChange} required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none font-medium transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Effective Date</label>
                <input type="date" step="0.01" name="price" value={formData.effective_date} onChange={handleInputChange} required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none font-medium transition-all" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
              <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-slate-700 transition-colors">Discard</button>
              <button type="submit" className="px-10 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 shadow-xl shadow-gray-200 active:scale-95 transition-all">
                {editingItem ? 'Update Rate' : 'Save Rate'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        {[
          { label: 'Configured Rates', value: styles.length, icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'blue' },
          { label: 'Avg Rate', value: styles.length ? (styles.reduce((s, x) => s + (Number(x.price) || 0), 0) / styles.length).toFixed(2) : '0.00', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', color: 'green' },
          { label: 'Max Rate', value: styles.length ? Math.max(...styles.map(x => Number(x.price) || 0)).toFixed(2) : '0.00', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', color: 'purple' },
          { label: 'Sections', value: new Set(styles.map(x => x.section)).size, icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', color: 'orange' },
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

      {/* Main Table */}
      <div className="premium-card rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50">
          <h3 className="text-lg font-bold text-slate-700">Piece Rate Matrix</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 table-fixed">
            <thead className="bg-gray-50/50">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-blue-600 transition-colors relative group/resize"
                    style={{ width: colWidths[col.key] }}
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
              {sortedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-blue-50/20 transition-colors group">
                  <td className="px-6 py-4 text-xs font-bold text-gray-400 break-words">{item.id}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-[10px] font-black uppercase rounded-lg break-words inline-block">{item.section}</span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-800 break-words">{item.style}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-medium break-words">{item.process}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-black text-blue-600">৳ {(Number(item.price) || 0).toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-black text-blue-600">{item.effective_date}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
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
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="p-2 text-gray-400 hover:text-blue-600 disabled:opacity-30 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === Math.ceil(sortedItems.length / pageSize)} className="p-2 text-gray-400 hover:text-blue-600 disabled:opacity-30 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StyleRate;
