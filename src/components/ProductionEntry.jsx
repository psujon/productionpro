import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios'
import { useAuthContext } from '../AuthContextProvider/AuthContextProvider';
import toast from 'react-hot-toast';

const ProductionEntry = () => {
  const { server_url, user } = useAuthContext();
  const [sectionList, setSectionList] = useState([]);
  const [productionList, setProductionsList] = useState([]);
  const [processList, setProcessList] = useState([]);
  const [styleList, setStyleList] = useState([])
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [editingBuyer, setEditingBuyer] = useState(null);
  const [formData, setFormData] = useState({
    prod_date: '',
    section: '',
    style: '',
    process: '',
    entries: [
      { id: Date.now(), cardno: '', quantity: '', emp_name: '' }
    ]
  });
  const [processDropdownVisible, setProcessDropdownVisible] = useState(false);
  const [styleDropdownVisible, setStyleDropdownVisible] = useState(false);
  const [styleLoading, setStyleLoading] = useState(false);
  const [processLoading, setProcessLoading] = useState(false);
  const processDropdownRef = useRef(null);
  const styleDropdownRef = useRef(null);

  useEffect(() => {
    if (!server_url || !user) return;
    // fetchProduction(user);
    FetchSectionData();
  }, [server_url, user]);

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

  const fetchProduction = async (data) => {

    try {
      const res = await axios.post(`${server_url}/production/getProduction/list`, data);
      setProductionsList(res.data);
    } catch (err) {
      toast.error('Failed to fetch production list');
    }
  };

  async function FetchSectionData() {
    if (user.role == "Operator") {
      setFormData(prev => ({
        ...prev,
        section: user.section
      }));
      const data = {
        section: user.section,
        unit: user.unit
      }
      FetchSectionWiseStyleData(data);
    }
    else {
      try {
        const sections = await axios.get(`${server_url}/globalFetch/section/list`);
        if (Array.isArray(sections.data)) setSectionList(sections.data);
      } catch (err) {
        console.error('Failed to load initial section data:', err);
      }
    }
  }


  // Search functionality
  const filteredBuyers = productionList.filter(production =>
    Object.values(production).some(value =>
      (value || '').toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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

  const goToPage = (page) => {
    const totalPages = Math.ceil(sortedBuyers.length / pageSize);
    const p = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(p);
  };

  const handleEdit = async (production_data) => {
    setEditingBuyer(production_data);

    const formattedDate = production_data && production_data.prod_date
      ? (() => {
        const d = new Date(production_data.prod_date);
        if (isNaN(d.getTime())) return '';
        return d.toISOString().slice(0, 10);
      })()
      : '';
    setFormData({
      prod_date: formattedDate,
      section: production_data.section,
      style: production_data.style,
      process: production_data.process,
      entries: [
        { id: production_data.id, cardno: production_data.cardno, quantity: production_data.quantity }
      ]
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this buyer?')) {
      try {
        const res = await axios.delete(`${server_url}/production/delete/${id}`);
        alert(res.data.message);
        setProductionsList(prev => prev.filter(buyer => buyer.id !== id));
      } catch (err) {
        console.error('Delete error:', err);
        alert('Failed to delete item');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.prod_date > new Date().toISOString().slice(0, 10)) {
      alert('Invalid date.');
      return;
    }
    if (!formData.section) {
      alert('Please select a section.');
      return;
    }
    if (!formData.style) {
      alert('Please select a style.');
      return;
    }
    if (!formData.process) {
      alert('Please select a process.');
      return;
    }

    // Validate entries
    const invalidEntries = formData.entries.filter(
      entry => !entry.cardno || !entry.quantity || entry.quantity <= 0
    );
    if (invalidEntries.length > 0) {
      alert('Please fill in all cardno and quantities.');
      return;
    }

    // Prepare data for submission
    const submissionData = {
      ...formData,
      user
    };

    if (editingBuyer && editingBuyer.id) {
      submissionData.id = editingBuyer.id;
    }

    console.log(submissionData);


    if (editingBuyer && editingBuyer.id) {
      // Update data
      try {
        const res = await axios.put(`${server_url}/production/update/${editingBuyer.id}`, submissionData);
        toast.success(res.data.message);
        setIsFormOpen(false);


        setFormData({
          prod_date: '',
          section: '',
          style: '',
          process: '',
          entries: [{ id: Date.now(), cardno: '', quantity: '', emp_name: '' }]
        });
        setEditingBuyer(null);
        setStyleList([]);
        setProcessList([]);
      } catch (err) {
        console.error('Update error:', err);
        toast.error('Error updating record');
      }
    } else {
      try {
        const res = await axios.post(`${server_url}/production/batch/insert`, submissionData);
        toast.success(res.data.message);
        setIsFormOpen(false);
        setFormData({
          prod_date: '',
          section: '',
          style: '',
          process: '',
          entries: [{ id: Date.now(), cardno: '', quantity: '', emp_name: '' }]
        });
        setStyleList([]);
        setProcessList([]);
      } catch (err) {
        console.error('Insert error:', err);
        toast.error(err.response?.data?.error || 'Error saving production entry');
      }
    }

    fetchProduction(user);

  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEntryChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      entries: prev.entries.map((entry, i) =>
        i === index ? {
          ...entry,
          [field]: value
        } : entry
      )
    }));
  }

  const handleCardnoFieldLeave = async (cardno, index) => {
    if (!cardno) return;
    try {
      const res = await axios.post(`${server_url}/employee/filtered/show/list`, {
        unit: user.unit,
        search: cardno
      });
      const result = res.data;
      if (Array.isArray(result) && result.length > 0) {
        setFormData(prev => ({
          ...prev,
          entries: prev.entries.map((entry, i) =>
            i === index ? { ...entry, cardno: result[0].CARDNO, emp_name: result[0].EMP_NAME } : entry
          )
        }));
      } else {
        toast.error('Nothing matched');
        setFormData(prev => ({
          ...prev,
          entries: prev.entries.map((entry, i) =>
            i === index ? { ...entry, emp_name: '' } : entry
          )
        }));
        setTimeout(() => {
          const input = document.getElementById(`cardno_${index}`);
          if (input) input.focus();
        }, 100);
      }
    } catch (err) {
      console.error('Failed to fetch employee:', err);
    }
  };

  const addNewEntry = () => {
    setFormData(prev => ({
      ...prev,
      entries: [...prev.entries, { id: Date.now(), cardno: '', quantity: '', emp_name: '' }]
    }));
  };

  const removeEntry = (index) => {
    if (formData.entries.length > 1) {
      setFormData(prev => ({
        ...prev,
        entries: prev.entries.filter((_, i) => i !== index)
      }));
    }
  };

  async function FetchSectionWiseStyleData(data) {
    try {

      setStyleLoading(true);
      setStyleList([]);
      setProcessList([]);
      const loadedStyles = await axios.post(`${server_url}/globalFetch/sectionWiseStyleLoad/list`, data);

      if (Array.isArray(loadedStyles.data)) {
        setStyleList(loadedStyles.data);
      } else {
        console.warn('Unexpected LoadStylesData response shape, clearing styleList', loadedStyles);
        setStyleList([]);
      }
    } catch (err) {
      console.error('Failed to load styles for section:', err);
    } finally {
      setStyleLoading(false);
    }
  }

  const handleSectionChange = async (e) => {
    handleInputChange(e);
    const data = {
      section: e.target.value,
      unit: user.unit,
    }
    FetchSectionWiseStyleData(data);
  };

  async function FetchSectionStyleWiseProcessLoadData(data) {
    try {
      // show loader and clear previous process list while fetching
      setProcessLoading(true);
      setProcessList([]);
      const loadProcess = await axios.post(`${server_url}/globalFetch/styleWiseProcessLoad/list`, data);

      if (Array.isArray(loadProcess.data)) {
        setProcessList(loadProcess.data)
      } else {
        console.warn('Unexpected LoadStylesData response shape, clearing styleList', loadProcess);
        setProcessList([]);
      }
    } catch (error) {
      console.log(error)
    } finally {
      setProcessLoading(false);
    }
  }
  const handleStyleChange = async (e) => {

    handleInputChange(e);

    const data = {
      section: formData.section,
      style: e.target.value,
      unit: user.unit,
    }

    FetchSectionStyleWiseProcessLoadData(data);

  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="text-gray-400">↕</span>;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  // Columns configuration and resizing state
  const columns = [
    { key: 'id', label: 'id' },
    { key: 'section', label: 'section' },
    { key: 'cardno', label: 'cardno' },
    { key: 'emp_name', label: 'emp_name' },
    { key: 'prod_date', label: 'date' },
    { key: 'style', label: 'style' },
    { key: 'process', label: 'process' },
    { key: 'quantity', label: 'quantity' },
    { key: 'actions', label: 'Actions' }
  ];

  const [colWidths, setColWidths] = useState({
    id: '60px',
    section: '100px',
    cardno: '80px',
    emp_name: '120px',
    prod_date: '90px',
    style: '150px',
    process: '150px',
    quantity: '50px',
    actions: '60px'
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

  const handleCancelButton = () => {
    setFormData({
      prod_date: '',
      section: '',
      style: '',
      process: '',
      entries: [{ id: Date.now(), cardno: '', quantity: '' }]
    });
    setEditingBuyer(null);
    setIsFormOpen(false);
  };

  return (
    <div className="p-1">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-1 gap-4 p-2 ps-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Production Entry & Summary</h1>
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
              placeholder="Filter throughput..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-4 py-2.5 premium-card border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm text-sm font-medium"
            />
          </div>

          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className={`${isFormOpen ? 'bg-gray-100 text-slate-600 hover:bg-gray-200' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-100'} px-6 py-2.5 rounded-2xl font-black text-sm transition-all flex items-center justify-center active:scale-95`}
          >
            <svg className={`w-4 h-4 mr-2 transition-transform duration-500 ${isFormOpen ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {isFormOpen ? 'CLOSE EDITOR' : 'NEW BATCH ENTRY'}
          </button>
        </div>
      </div>

      {/* Expandable Form Section */}
      <div className={`transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${isFormOpen ? 'max-h-[2000px] opacity-100 mb-3' : 'max-h-0 opacity-0'}`}>
        <div className="premium-card rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="px-8 py-2  border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-md font-black text-slate-700">Batch Configuration</h3>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-sm font-bold uppercase rounded-lg tracking-widest">Active Session</span>
          </div>
          <form onSubmit={handleSubmit} className="p-3 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1">Production Date</label>
                <input type="date" name="prod_date" value={formData.prod_date} onChange={handleInputChange} required className="w-full bg-gray-100 px-4 py-2  border-transparent border-r-4 border-r-emerald-500 rounded-2xl focus:premium-card focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold text-slate-800 transition-all" />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1">Assigned Section</label>
                <select name="section" value={formData.section} required onChange={handleSectionChange} className="w-full bg-gray-100 px-4 py-2  border-transparent rounded-2xl focus:premium-card focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold text-slate-800 appearance-none transition-all cursor-pointer">
                  {
                    user.role == "Operator" ?
                      <option value={user.section}>{user.section}</option> :
                      <>
                        <option value="">Select section...</option>
                        {(sectionList || []).map((s, i) => <option key={i} value={s.section}>{s.section}</option>)}
                      </>
                  }
                </select>
              </div>
              <div className="relative space-y-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1">Style</label>
                <div className="relative">
                  <input type="text" name="style" value={formData.style} onChange={(e) => { handleStyleChange(e); setStyleDropdownVisible(true); }} onFocus={() => setStyleDropdownVisible(true)} required placeholder="Search Styles..." className="w-full bg-gray-100 px-4 py-2  border-transparent rounded-2xl focus:premium-card focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold text-slate-800 transition-all" />
                  {styleDropdownVisible && (
                    <div ref={styleDropdownRef} className="absolute z-50 w-full mt-2 premium-card border border-gray-100 rounded-2xl shadow-2xl max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                      {styleLoading ? <div className="p-5 text-center text-gray-400 text-[10px] font-black uppercase tracking-widest">Searching styles...</div> : (
                        styleList.filter(s => s.style.toLowerCase().includes(formData.style.toLowerCase())).map((s, i) => (
                          <div key={i} className="px-5 py-3.5 hover:bg-emerald-50 cursor-pointer text-sm font-bold text-slate-600 transition-colors border-b border-gray-50 last:border-0" onClick={() => { setFormData(old => ({ ...old, style: s.style })); handleStyleChange({ target: { name: 'style', value: s.style } }); setStyleDropdownVisible(false); }}>{s.style}</div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="relative space-y-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1">Process/Size</label>
                <div className="relative">
                  <input type="text" name="process" value={formData.process} onChange={(e) => { handleInputChange(e); setProcessDropdownVisible(true); }} onFocus={() => setProcessDropdownVisible(true)} required placeholder="Select process/size" className="w-full bg-gray-100 px-4 py-2  border-transparent rounded-2xl focus:premium-card focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold text-slate-800 transition-all" />
                  {processDropdownVisible && (
                    <div ref={processDropdownRef} className="absolute z-50 w-full mt-2 premium-card border border-gray-100 rounded-2xl shadow-2xl max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                      {processLoading ? <div className="p-5 text-center text-gray-400 text-[10px] font-black uppercase tracking-widest">Loading...</div> : (
                        processList.filter(p => p.process.toLowerCase().includes(formData.process.toLowerCase())).map((p, i) => (
                          <div key={i} className="px-5 py-3.5 hover:bg-emerald-50 cursor-pointer text-sm font-bold text-slate-600 transition-colors border-b border-gray-50 last:border-0" onClick={() => { setFormData(old => ({ ...old, process: p.process })); setProcessDropdownVisible(false); }}>{p.process}</div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between border-b border-gray-100 pb-1">
                <h4 className="text-sm font-black text-slate-700 flex items-center gap-2 uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  Employee Production Data
                </h4>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{formData.entries.length} ACTIVE SLOTS</span>
              </div>
              <div className="space-y-1">
                <div className="space-y-1 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {formData.entries.map((entry, index) => (
                    <div key={entry.id} className="flex flex-row items-center gap-2 p-2 bg-gray-50/50 border border-gray-100 rounded-2xl group transition-all hover:bg-white hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/20">

                      <button
                        type="button"
                        onClick={addNewEntry}
                        className="w-10 h-10 flex items-center justify-center border-2 border-dashed border-gray-100 rounded-2xl text-slate-400 uppercase tracking-widest hover:border-emerald-200 hover:text-emerald-500 hover:bg-emerald-50/30 transition-all group active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gray-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                        </div>
                      </button>

                      <div
                        className="hidden md:flex w-10 h-10 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-black text-slate-400 shadow-sm border border-gray-100 group-hover:text-emerald-600 group-hover:border-emerald-100 transition-colors">
                        {index + 1}
                      </div>

                      <div className=" w-full grid grid-cols-3 gap-2">
                        <div className="">
                          <input
                            type="text"
                            id={`cardno_${index}`}
                            value={entry.cardno}
                            onChange={(e) => handleEntryChange(index, 'cardno', e.target.value)}
                            onBlur={(e) => handleCardnoFieldLeave(e.target.value, index)}
                            required
                            className="w-full px-4 py-2.5 bg-white border border-transparent rounded-xl focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold text-slate-800 transition-all shadow-sm group-hover:shadow-md"
                            placeholder="0000-ID"
                          />
                        </div>

                        <div className="">
                          <input
                            type="text"
                            id={`employee_name_${index}`}
                            value={entry.emp_name || ''}
                            disabled
                            className="w-full px-4 py-2.5 bg-red-200 border border-transparent rounded-xl focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold text-slate-800 transition-all shadow-sm group-hover:shadow-md disabled:opacity-100 disabled:cursor-not-allowed"
                          />
                        </div>

                        <div className="">
                          <div className="">
                            <input
                              type="number"
                              value={entry.quantity}
                              onChange={(e) => handleEntryChange(index, 'quantity', e.target.value)}
                              onBlur={() => (index === formData.entries.length - 1 && entry.cardno) && addNewEntry()}
                              required
                              min="1"
                              className="w-full px-4 py-2.5 bg-white border border-transparent rounded-xl focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-black text-emerald-600 transition-all shadow-sm group-hover:shadow-md"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="w-12 shrink-0 flex items-center justify-center">
                        {formData.entries.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEntry(index)}
                            className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-50 group-hover:opacity-100 active:scale-90"
                            title="Remove Row"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>

            <div className="flex justify-end items-center gap-6 pt-2 border-t border-gray-100">
              <button type="button" onClick={handleCancelButton} className="text-xs font-black text-gray-400 hover:text-slate-800 transition-colors uppercase tracking-widest">Discard Batch</button>
              <button type="submit" className="px-12 py-4 bg-gray-900 text-white text-xs font-black rounded-2xl hover:bg-black shadow-2xl shadow-gray-200 active:scale-95 transition-all uppercase tracking-[0.2em]">
                {editingBuyer?.id ? 'Update Records' : 'Commit Production'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Stats Summary */}
      {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
        {[
          { label: 'System Logs', value: productionList.length, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', color: 'indigo' },
          { label: 'Shift Output', value: productionList.filter(p => new Date(p.prod_date).toDateString() === new Date().toDateString()).reduce((s, p) => s + p.quantity, 0), icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: 'emerald' },
          { label: 'Active Styles', value: new Set(productionList.map(p => p.style)).size, icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01', color: 'violet' },
          { label: 'Labor Force', value: new Set(productionList.map(p => p.cardno)).size, icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', color: 'amber' },
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
                <p className="text-3xl font-black text-slate-800 tracking-tight">{stat.value.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div> */}

      {/* History Table */}
      <div className="premium-card overflow-hidden">
        <div className="p-2 px-4 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-900 rounded-xl text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-lg font-black text-slate-700">Production Ledger</h3>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Show Limit:</span>
            <select
              onChange={async (e) => {
                const newSize = parseInt(e.target.value, 10);
                setCurrentPage(1);
                try {
                  const res = await axios.post(`${server_url}/production/getProduction/list`, { ...user, limit: newSize });
                  setProductionsList(res.data);
                } catch (err) { console.error(err); }
              }}
              className="text-xs font-black premium-card border border-gray-100 rounded-xl px-4 py-2 focus:ring-0 outline-none cursor-pointer hover: transition-colors"
            >
              {[100, 200, 300, 400, 500, 1000, 1500, 2000, 2500, 3000].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              {columns.map(col => (
                <col key={col.key} style={{ width: colWidths[col.key] }} />
              ))}
            </colgroup>
            <thead className="">
              <tr>
                {columns.map(col => (
                  <th
                    key={col.key}
                    className="px-2 py-2 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] cursor-pointer hover:text-emerald-600 transition-colors relative group/resize"
                    onClick={() => col.key !== 'actions' && handleSort(col.key)}
                  >
                    <div className="flex items-center gap-2">
                      {col.label}
                      {col.key !== 'actions' && <SortIcon field={col.key} />}
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
              {sortedBuyers.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((p, idx) => (
                <tr key={p.id || idx} className="hover:bg-emerald-50/20 transition-colors group cursor-default divided-y divide-gray-100">
                  <td className="px-2 py-2 text-xs font-bold text-gray-400 break-words">{p.id}</td>
                  <td className="px-2 py-2 break-words">
                    <span className="px-2 py-1 premium-card border border-gray-100 rounded-lg text-[10px] font-black uppercase text-gray-600 shadow-sm block text-center">
                      {p.section}
                    </span>
                  </td>

                  <td className="px-2 py-2 text-sm font-black text-slate-800 tracking-tight break-words">{p.cardno}</td>
                  <td className="px-2 py-2 text-sm text-gray-500 font-bold break-words">{p.emp_name}</td>
                  <td className="px-2 py-2 text-sm text-gray-400 font-bold break-words">
                    {(() => {
                      const d = new Date(p.prod_date);
                      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                    })()}
                  </td>
                  <td className="px-2 py-2 text-sm font-black text-emerald-600 group-hover:translate-x-1 transition-transform break-words">{p.style}</td>
                  <td className="px-2 py-2 break-words">
                    <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-md block text-center">{p.process}</span>
                  </td>
                  <td className="px-2 py-2 text-center text-sm font-black text-slate-800 break-words">{p.quantity}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => handleEdit(p)} className="p-2.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                      <button onClick={() => handleDelete(p.id)} className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-8 py-6  border-t border-gray-50 flex items-center justify-between">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Displaying Page {currentPage} of {Math.ceil(sortedBuyers.length / pageSize)}</span>
          <div className="flex gap-4">
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="p-3 premium-card border border-gray-100 rounded-2xl text-gray-400 hover:text-emerald-600 disabled:opacity-30 transition-all shadow-sm active:scale-90"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg></button>
            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === Math.ceil(sortedBuyers.length / pageSize)} className="p-3 premium-card border border-gray-100 rounded-2xl text-gray-400 hover:text-emerald-600 disabled:opacity-30 transition-all shadow-sm active:scale-90"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionEntry;
