import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios'
import { useAuthContext } from '../AuthContextProvider/AuthContextProvider';
import toast from 'react-hot-toast';

const BuyerOrder = () => {
  const { server_url, user } = useAuthContext();
  const [sectionList, setSectionList] = useState([]);
  const [productionList, setProductionsList] = useState([]);
  const [buyerList, setBuyerList] = useState([]);
  const [styleList, setStyleList] = useState([])
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    section: '',
    buyer: '',
    style: '',
    order_quantity: '',
    excessProduction: '',
    remarks: '',
  });
  const [styleDropdownVisible, setStyleDropdownVisible] = useState(false);
  const [buyerDropdownVisible, setBuyerDropdownVisible] = useState(false);
  const [styleLoading, setStyleLoading] = useState(false);
  const [buyerLoading, setBuyerLoading] = useState(false);
  const styleDropdownRef = useRef(null);
  const buyerDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (styleDropdownRef.current && !styleDropdownRef.current.contains(event.target)) {
        setStyleDropdownVisible(false);
      }
      if (buyerDropdownRef.current && !buyerDropdownRef.current.contains(event.target)) {
        setBuyerDropdownVisible(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [colWidths, setColWidths] = useState({
    id: '60px',
    section: '100px',
    buyer: '150px',
    style: '150px',
    qty: '100px',
    excess: '100px',
    remarks: '200px',
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

  useEffect(() => {
    if (user.role == "Operator") {
      setFormData({
        ...formData,
        section: user.section
      });
      const data = {
        section: user.section,
        unit: user.unit
      }
      BuyerWiseStyleLoad(data);
    };

    if (!server_url || !user) return;
    axios.post(`${server_url}/Buyer/order/getData`, user)
      .then(res => {
        setProductionsList(res.data);
        setCurrentPage(1);
      })
      .catch(err => console.error('Failed to fetch:', err));
  }, [server_url, user]);

  useEffect(() => {
    if (!server_url) return;
    let mounted = true;
    (async () => {
      try {
        const sections = await axios.get(`${server_url}/globalFetch/section/list`);
        const buyers = await axios.get(`${server_url}/globalFetch/buyer/getlist`);
        if (mounted) {
          setSectionList(sections.data);
          setBuyerList(buyers.data);
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    })();
    return () => { mounted = false; };
  }, [server_url]);

  const filteredItems = useMemo(() => productionList.filter(item =>
    Object.values(item).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  ), [productionList, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const sortedItems = useMemo(() => [...filteredItems].sort((a, b) => {
    if (!sortField) return 0;
    const aValue = a[sortField];
    const bValue = b[sortField];
    if (sortDirection === 'asc') return aValue > bValue ? 1 : -1;
    return aValue < bValue ? 1 : -1;
  }), [filteredItems, sortField, sortDirection]);

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
      buyer: item.buyer,
      style: item.style,
      order_quantity: item.order_quantity,
      excessProduction: item.excessProduction,
      remarks: item.remarks,
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      axios.delete(`${server_url}/Buyer/order/delete/${id}`)
        .then(res => {
          toast.success(res.data.message);
          setProductionsList(prev => prev.filter(item => item.id !== id));
        })
        .catch(err => toast.error('Failed to delete order'));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submissionData = { ...formData, user };
    if (editingItem) {
      axios.put(`${server_url}/Buyer/order/update/${editingItem.id}`, submissionData)
        .then(res => {
          toast.success(res.data.message);
          setIsFormOpen(false);
          setProductionsList(prev => prev.map(item => item.id === editingItem.id ? { ...item, ...formData } : item));
          setEditingItem(null);
        })
        .catch(err => toast.error('Failed to update order'));
    } else {
      axios.post(`${server_url}/Buyer/order/insert`, submissionData)
        .then(res => {
          toast.success(res.data.message);
          setIsFormOpen(false);
          setFormData({ section: '', buyer: '', style: '', order_quantity: '', excessProduction: 'Yes', remarks: '' });
          axios.post(`${server_url}/Buyer/order/getData`, user).then(res => setProductionsList(res.data));
        })
        .catch(err => toast.error('Failed to create order'));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  async function BuyerWiseStyleLoad(data) {
    setStyleLoading(true);
    try {
      const res = await axios.post(`${server_url}/style/sectionBuyerWiseStyleList`, data);
      setStyleList(Array.isArray(res.data) ? res.data : (res.data.styles || res.data.data || []));
    } catch (error) {
      console.error(error);
    } finally {
      setStyleLoading(false);
    }
  }
  const handleBuyerSelection = async (buyerName) => {
    setFormData(prev => ({ ...prev, buyer: buyerName }));
    setBuyerDropdownVisible(false);
    const data = { section: formData.section, buyer: buyerName, unit: user.unit };
    BuyerWiseStyleLoad(data);
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'section', label: 'Section' },
    { key: 'buyer', label: 'Buyer' },
    { key: 'style', label: 'Style' },
    { key: 'qty', label: 'Order Qty' },
    { key: 'excess', label: 'Excess Allowed' },
    { key: 'remarks', label: 'Remarks' },
    { key: 'actions', label: 'Actions' }
  ];

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="text-gray-400">↕</span>;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="p-2  min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-2 gap-4">
        <div>
          <h1 className="text-3xl px-8 font-black text-slate-800 tracking-tight">Order Management</h1>

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
              placeholder="Filter orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-4 py-2.5 premium-card border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm text-sm font-medium"
            />
          </div>

          <button
            onClick={() => { setIsFormOpen(!isFormOpen); setEditingItem(null); if (!isFormOpen) setFormData({ section: '', buyer: '', style: '', order_quantity: '', excessProduction: 'Yes', remarks: '' }); }}
            className={`${isFormOpen ? 'bg-gray-100 text-slate-600 hover:bg-gray-200' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-100'} px-6 py-2.5 rounded-2xl font-black text-sm transition-all flex items-center justify-center active:scale-95`}
          >
            <svg className={`w-4 h-4 mr-2 transition-transform duration-500 ${isFormOpen ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {isFormOpen ? 'CLOSE EDITOR' : 'NEW ORDER ENTRY'}
          </button>
        </div>
      </div>

      {/* Editor Section */}
      <div className={`transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${isFormOpen ? 'max-h-[1000px] opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
        <div className="premium-card rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="px-8 py-3  border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-700">{editingItem ? 'Edit Production Order' : 'Configure New Order'}</h3>
          </div>
          <form onSubmit={handleSubmit} className="p-2 space-y-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Assigned Section</label>
                <select name="section" value={formData.section} required onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-200  border-transparent rounded-2xl focus:premium-card focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold text-slate-800 appearance-none transition-all cursor-pointer">
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

              <div className="relative space-y-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Client / Buyer</label>
                <div className="relative">
                  <input type="text" name="buyer" value={formData.buyer} onChange={(e) => { handleInputChange(e); setBuyerDropdownVisible(true); }} onFocus={() => setBuyerDropdownVisible(true)} required placeholder="Search clients..." className="w-full px-4 py-3 bg-gray-200  border-transparent rounded-2xl focus:premium-card focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold text-slate-800 transition-all" />
                  {buyerDropdownVisible && (
                    <div ref={buyerDropdownRef} className="absolute z-50 w-full mt-2 premium-card border border-gray-100 rounded-2xl shadow-2xl max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                      {buyerList.filter(b => b.buyer.toLowerCase().includes(formData.buyer.toLowerCase())).map((b, i) => (
                        <div key={i} className="px-5 py-3.5 hover:bg-emerald-50 cursor-pointer text-sm font-bold text-slate-600 transition-colors border-b border-gray-50 last:border-0" onClick={() => handleBuyerSelection(b.buyer)}>{b.buyer}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="relative space-y-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Style Identifier</label>
                <div className="relative">
                  <input type="text" name="style" value={formData.style} onChange={(e) => { handleInputChange(e); setStyleDropdownVisible(true); }} onFocus={() => setStyleDropdownVisible(true)} required placeholder="Search styles..." className="w-full px-4 py-3 bg-gray-200  border-transparent rounded-2xl focus:premium-card focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold text-slate-800 transition-all" />
                  {styleDropdownVisible && (
                    <div ref={styleDropdownRef} className="absolute z-50 w-full mt-2 premium-card border border-gray-100 rounded-2xl shadow-2xl max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                      {styleLoading ? <div className="p-5 text-center text-gray-400 text-[10px] font-black uppercase tracking-widest">Searching...</div> : (
                        styleList.filter(s => s.style.toLowerCase().includes(formData.style.toLowerCase())).map((s, i) => (
                          <div key={i} className="px-5 py-3.5 hover:bg-emerald-50 cursor-pointer text-sm font-bold text-slate-600 transition-colors border-b border-gray-50 last:border-0" onClick={() => { setFormData(p => ({ ...p, style: s.style })); setStyleDropdownVisible(false); }}>{s.style}</div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Order Quantity (Pcs)</label>
                <input type="number" name="order_quantity" value={formData.order_quantity} onChange={handleInputChange} required className="w-full px-4 py-3 bg-gray-200  border-transparent rounded-2xl focus:premium-card focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold text-slate-800 transition-all" />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Excess Allowance</label>
                <select name="excessProduction" value={formData.excessProduction} required onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-200  border-transparent rounded-2xl focus:premium-card focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold text-slate-800 appearance-none transition-all cursor-pointer">
                  <option value="">Select.....</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Notes / Remarks</label>
                <input type="text" name="remarks" value={formData.remarks} onChange={handleInputChange} placeholder="Additional details..." className="w-full px-4 py-3 bg-gray-200  border-transparent rounded-2xl focus:premium-card focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold text-slate-800 transition-all" />
              </div>
            </div>

            <div className="flex justify-end items-center gap-6 pt-2 border-t border-gray-100">
              <button type="button" onClick={() => setIsFormOpen(false)} className="text-xs font-black text-gray-400 hover:text-slate-800 transition-colors uppercase tracking-widest">Discard Changes</button>
              <button type="submit" className="px-12 py-4 bg-gray-900 text-white text-xs font-black rounded-2xl hover:bg-black shadow-2xl shadow-gray-200 active:scale-95 transition-all uppercase tracking-[0.2em]">
                {editingItem ? 'Update Order' : 'Commit Order'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Stats Summary */}
      {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
        {[
          { label: 'Active Orders', value: productionList.length, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', color: 'indigo' },
          { label: 'Total Volume', value: productionList.reduce((s, x) => s + (parseInt(x.order_quantity) || 0), 0).toLocaleString(), icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: 'emerald' },
          { label: 'Client Base', value: new Set(productionList.map(x => x.buyer)).size, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', color: 'violet' },
          { label: 'Style Portfolio', value: new Set(productionList.map(x => x.style)).size, icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01', color: 'amber' },
        ].map((stat, i) => (
          <div key={i} className="premium-card p-8">
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
      </div> */}

      {/* Main Table */}
      <div className="premium-card overflow-hidden">
        <div className="p-2 px-8 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-900 rounded-xl text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-lg font-black text-slate-700">Order Ledger</h3>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Entry Limit</span>
            <select
              value={pageSize}
              onChange={async (e) => {
                const newSize = parseInt(e.target.value, 10);
                setPageSize(newSize);
                setCurrentPage(1);
                try {
                  const res = await axios.post(`${server_url}/Buyer/order/getData`, { ...user, limit: newSize });
                  setProductionsList(res.data);
                } catch (err) { console.error(err); }
              }}
              className="text-xs font-black  premium-card border border-gray-100 rounded-xl px-4 py-2 focus:ring-0 outline-none cursor-pointer hover: transition-colors"
            >
              {[10, 20, 50, 100, 500].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-100 table-fixed">
            <thead className="bg-gray-50/50">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] cursor-pointer hover:text-emerald-600 transition-colors relative group/resize"
                    style={{ width: colWidths[col.key] }}
                    onClick={() => col.key !== 'actions' && handleSort(col.key === 'qty' ? 'order_quantity' : col.key === 'excess' ? 'excessProduction' : col.key)}
                  >
                    <div className="flex items-center gap-2">
                      {col.label}
                      {col.key !== 'actions' && <SortIcon field={col.key === 'qty' ? 'order_quantity' : col.key === 'excess' ? 'excessProduction' : col.key} />}
                    </div>
                    {col.key !== 'actions' && (
                      <div
                        onMouseDown={(e) => startResize(e, col.key)}
                        className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-emerald-400 group-hover/resize:bg-gray-300 transition-colors"
                      />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="premium-card divide-y divide-gray-50">
              {sortedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-emerald-50/20 transition-colors group cursor-default">
                  <td className="px-2 py-2 text-xs font-bold text-gray-400 break-words overflow-hidden">{item.id}</td>
                  <td className="px-4 py-4 overflow-hidden">
                    <span className="px-2.5 py-1 premium-card border border-gray-100 rounded-lg text-[10px] font-black uppercase text-gray-600 shadow-sm break-words inline-block">{item.section}</span>
                  </td>
                  <td className="px-4 py-4 text-sm font-black text-slate-800 tracking-tight break-words overflow-hidden">{item.buyer}</td>
                  <td className="px-4 py-4 text-sm text-gray-500 font-bold break-words overflow-hidden">{item.style}</td>
                  <td className="px-4 py-4 text-sm font-black text-emerald-600 break-words overflow-hidden">{(item.order_quantity || 0).toLocaleString()}</td>
                  <td className="px-4 py-4 overflow-hidden">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase break-words inline-block ${item.excessProduction === 'Yes' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {item.excessProduction === 'Yes' ? 'ALLOWED' : 'STRICT'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-400 font-bold italic break-words overflow-hidden">{item.remarks}</td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => handleEdit(item)} className="p-2.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                      <button onClick={() => handleDelete(item.id)} className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-8 py-6  border-t border-gray-50 flex items-center justify-between">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Displaying Page {currentPage} of {Math.ceil(sortedItems.length / pageSize)}</span>
          <div className="flex gap-4">
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="p-3 premium-card border border-gray-100 rounded-2xl text-gray-400 hover:text-emerald-600 disabled:opacity-30 transition-all shadow-sm active:scale-90"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg></button>
            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === Math.ceil(sortedItems.length / pageSize)} className="p-3 premium-card border border-gray-100 rounded-2xl text-gray-400 hover:text-emerald-600 disabled:opacity-30 transition-all shadow-sm active:scale-90"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerOrder;
