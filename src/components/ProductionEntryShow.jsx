import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios'
import { useAuthContext } from '../AuthContextProvider/AuthContextProvider';
import { useNavigate } from 'react-router-dom';

const ProductionEntryShow = () => {
  const { server_url, user } = useAuthContext();
  const [sectionList, setSectionList] = useState([]);
  const [productionList, setProductionsList] = useState([]);
  const [processList, setProcessList] = useState([]);
  const [styleList, setStyleList] = useState([])
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 100;
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [editingBuyer, setEditingBuyer] = useState([]);
  const [formData, setFormData] = useState({
    prod_date: '',
    section: '',
    style: '',
    process: '',
    from_date: new Date(Date.now()).toISOString().slice(0, 10),
    till_date: new Date(Date.now()).toISOString().slice(0, 10),
    cardno: ''

  });
  const [processDropdownVisible, setProcessDropdownVisible] = useState(false);
  const [styleDropdownVisible, setStyleDropdownVisible] = useState(false);
  const [styleLoading, setStyleLoading] = useState(false);
  const [processLoading, setProcessLoading] = useState(false);
  const processDropdownRef = useRef(null);
  const styleDropdownRef = useRef(null);
  const navigate = useNavigate();
  //   console.log(user);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
    if (user.role == "Operator") {
      setFormData({
        ...formData,
        section: user.section,
      });
      const data = {
        section: user.section,
        unit: user.unit,
      }
      LoadStylesData(data);
    } else if (user.role == "Admin") {
      LoadSectionData();
    }
  }, [user, navigate]);

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

  async function LoadSectionData() {
    try {
      const sections = await axios.get(`${server_url}/globalFetch/section/list`);
      if (Array.isArray(sections.data)) setSectionList(sections.data);
    } catch (err) {
      console.error('Failed to load initial section data:', err);
    }
  }

  // Search functionality
  const filteredBuyers = productionList.filter(style =>
    Object.values(style).some(value =>
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
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

  //   const handleEdit = async (production_data) => {
  //       setEditingBuyer(production_data);

  //       const formattedDate = production_data && production_data.prod_date
  //         ? (() => {
  //             const d = new Date(production_data.prod_date);
  //             if (isNaN(d.getTime())) return '';
  //             return d.toISOString().slice(0, 10);
  //           })()
  //         : '';
  //       setFormData({
  //             prod_date: formattedDate,
  //             section: production_data.section,
  //             style: production_data.style,
  //             process: production_data.process,
  //             entries: [
  //             { id: production_data.id, cardno: production_data.cardno, quantity: production_data.quantity }
  //             ]
  //         });
  //         // console.log(formData);
  //         setIsFormOpen(true);
  //   };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this buyer?')) {
      axios.delete(`${server_url}/production/delete/${id}`)
        .then(res => {
          alert(res.data.message);
          setProductionsList(prev => prev.filter(buyer => buyer.id !== id));
        })
        .catch(err => {
          alert(err);
        });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const data = {
      section: e.target.section.value,
      style: e.target.style.value,
      process: e.target.process.value,
      from_date: e.target.from_date.value,
      till_date: e.target.till_date.value,
      cardno: e.target.cardno.value,
      login_user: user
    }
    const submissionData = { ...data, login_user: user }

    // Submit data
    axios.post(`${server_url}/production/productionDataShow`, submissionData)
      .then(res => {
        console.log(res.data);
        setProductionsList(res.data);
        setCurrentPage(1);
      })
      .catch(err => {
        if (err.response && err.response.data && err.response.data.message) {
          console.log(err.response.data);
        }
      });
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
        i === index ? { ...entry, [field]: value } : entry
      )
    }));
  };

  const addNewEntry = () => {
    setFormData(prev => ({
      ...prev,
      entries: [...prev.entries, { id: Date.now(), cardno: '', quantity: '' }]
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

  async function LoadStylesData(data) {
    try {
      setStyleLoading(true);
      setStyleList([]);
      const loadedStyles = await axios.post(`${server_url}/globalFetch/sectionWiseStyleLoad/list`, data);

      if (Array.isArray(loadedStyles)) {
        setStyleList(loadedStyles);
      } else if (loadedStyles && Array.isArray(loadedStyles.styles)) {
        setStyleList(loadedStyles.styles);
      } else if (loadedStyles && Array.isArray(loadedStyles.data)) {
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

    LoadStylesData(data);
  };

  async function LoadStyleWiseProcessData(data) {
    formData.process = '';
    try {

      setProcessLoading(true);
      setProcessList([]);
      const loadProcess = await axios.post(`${server_url}/globalFetch/styleWiseProcessLoad/list`, data);
      // console.log(loadProcess);
      if (Array.isArray(loadProcess)) {
        setProcessList(loadProcess)
      } else if (loadProcess && Array.isArray(loadProcess.process)) {
        setProcessList(loadProcess.process);
      } else if (loadProcess && Array.isArray(loadProcess.data)) {
        setProcessList(loadProcess.data);
      } else {
        //   
        setProcessList([]); console.warn('Unexpected LoadStylesData response shape, clearing styleList', loadProcess);
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
      unit: user.unit,
      section: formData.section,
      style: e.target.value,
    }
    // console.log(data);
    LoadStyleWiseProcessData(data);
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="text-gray-400">↕</span>;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  // Columns configuration and resizable state
  const columns = [
    { key: 'id', label: 'id' },
    { key: 'section', label: 'section' },
    { key: 'cardno', label: 'cardno' },
    { key: 'emp_name', label: 'emp_name' },
    { key: 'prod_date', label: 'date' },
    { key: 'style', label: 'style' },
    { key: 'process', label: 'process' },
    { key: 'quantity', label: 'Qty' },
    { key: 'actions', label: '' }
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
    actions: '40px'
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
      from_date: new Date(Date.now()).toISOString().slice(0, 10),
      till_date: new Date(Date.now()).toISOString().slice(0, 10),
      cardno: ''
    });
    setEditingBuyer(null);
    setIsFormOpen(false);
  }
  return (
    <div className="p-1">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 px-4 py-2">Production Data Show</h1>
          {/* <p className="text-gray-600 mt-1">Manage your buyers and their information</p> */}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-4 lg:mt-0">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search styles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
            />
          </div>

          {/* Add New Button */}
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {isFormOpen ? 'Close Filter' : 'Filter Search'}
          </button>
        </div>
      </div>

      {/* Add/Edit Form Section */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isFormOpen ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
        <div className="premium-card rounded-lg shadow-lg border border-gray-200">

          <form onSubmit={handleSubmit} className="p-2">
            {/* Fixed fields section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">


              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Section
                </label>
                <select
                  name="section"
                  required
                  value={formData.section}
                  onChange={handleSectionChange}
                  className="w-full px-3 py-2 border premium-card border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                >
                  {
                    user.role == "Operator" ?
                      <option value={user.section}>{user.section}</option> : (
                        <>
                          <option value="">Select Section</option>
                          {(sectionList || []).map((section, idx) => (
                            <option key={section.id ?? idx} value={section.section}>{section.section}</option>
                          ))}
                        </>
                      )
                  }

                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Style
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="style"
                    value={formData.style}
                    onChange={(e) => {
                      handleStyleChange(e);
                      setStyleDropdownVisible(true);
                    }}
                    onFocus={() => setStyleDropdownVisible(true)}

                    className="w-full px-3 py-2 border premium-card border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                    placeholder="Type to search style..."
                  />
                  {styleDropdownVisible && (
                    <div ref={styleDropdownRef} className="absolute z-50 w-full mt-1 premium-card border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {styleLoading ? (
                        <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4 text-gray-500" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                          </svg>
                          Loading styles...
                        </div>
                      ) : (
                        <>
                          {((styleList || []).filter(s => s.style && s.style.toLowerCase().includes(formData.style.toLowerCase())).length > 0) ? (
                            (styleList || [])
                              .filter(style => style.style && style.style.toLowerCase().includes(formData.style.toLowerCase()))
                              .map((style, idx) => (
                                <div
                                  key={style.id ?? idx}
                                  className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, style: style.style }));
                                    handleStyleChange({ target: { name: 'style', value: style.style } });
                                    setStyleDropdownVisible(false);
                                  }}
                                >
                                  {style.style}
                                </div>
                              ))
                          ) : (
                            <div className="px-4 py-2 text-sm text-gray-500">No styles found</div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Process/Size
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="process"
                    value={formData.process}
                    onChange={(e) => {
                      handleInputChange(e);
                      setProcessDropdownVisible(true);
                    }}
                    onFocus={() => setProcessDropdownVisible(true)}

                    className="w-full px-3 py-2 border premium-card border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                    placeholder="Type to search process..."
                  />
                  {processDropdownVisible && (
                    <div ref={processDropdownRef} className="absolute z-50 w-full mt-1 premium-card border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {processLoading ? (
                        <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4 text-gray-500" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                          </svg>
                          Loading processes...
                        </div>
                      ) : (
                        <>
                          {((processList || []).filter(p => p.process && p.process.toLowerCase().includes(formData.process.toLowerCase())).length > 0) ? (
                            (processList || [])
                              .filter(process => process.process && process.process.toLowerCase().includes(formData.process.toLowerCase()))
                              .map((pro, idx) => (
                                <div
                                  key={pro.id ?? idx}
                                  className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, process: pro.process }));
                                    setProcessDropdownVisible(false);
                                  }}
                                >
                                  {pro.process}
                                </div>
                              ))
                          ) : (
                            <div className="px-4 py-2 text-sm text-gray-500">No processes found</div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  name="from_date"
                  value={formData.from_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border premium-card border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Till Date
                </label>
                <input
                  type="date"
                  name="till_date"
                  value={formData.till_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border premium-card border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Cardno
                </label>
                <input
                  type="text"
                  name="cardno"
                  onChange={handleInputChange}

                  className="w-full px-3 py-2 border premium-card border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                />
              </div>

            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={handleCancelButton}
                className="px-4 py-2 text-sm font-medium text-slate-600 premium-card border border-gray-300 rounded-lg hover: focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              >
                Search Production Data
                {/* {editingBuyer ? 'Search Production' : 'Search Production'} */}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
        <div className="premium-card p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Styles</p>
              <p className="text-2xl font-bold text-slate-800">{
                // count unique non-empty style strings
                (new Set((productionList || []).map(p => (p.style || '').toString().trim()).filter(Boolean))).size
              }</p>
            </div>
          </div>
        </div>

        <div className="premium-card p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-slate-800">
                {productionList.filter(b => b.status === 'Active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="premium-card p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-slate-800">
                {productionList.filter(b => b.status === 'Inactive').length}
              </p>
            </div>
          </div>
        </div>

        <div className="premium-card p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Salary Qty (Pcs)</p>
              <p className="text-2xl font-bold text-slate-800">
                {productionList.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="premium-card shadow-lg rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <label htmlFor="recordCount" className="mr-2 font-medium text-slate-600">Show Records</label>
                <select
                  id="recordCount"
                  // value={pageSize}
                  onChange={async (e) => {
                    // Update page size and fetch data from server
                    const newSize = parseInt(e.target.value, 50);
                    // setPageSize(newSize);
                    setCurrentPage(1);

                    // try {
                    //     const res = await axios.post(`${server_url}/production/getData`, { ...user, limit: newSize });
                    //     setProductionsList(res.data);
                    // } catch (err) {
                    //     console.error('Failed to fetch:', err);
                    // }
                  }}
                  className="border border-gray-300 rounded px-2 py-1"
                >
                  <option value={0}>Select</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                  <option value={300}>300</option>
                  <option value={400}>400</option>
                  <option value={500}>500</option>
                  <option value={1000}>1000</option>
                  <option value={2000}>2000</option>
                  <option value={3000}>3000</option>
                  <option value={5000}>5000</option>
                  <option value={10000}>10000</option>
                  <option value={20000}>20000</option>
                </select>
              </div>
            </div>
          </div>
          <table className="min-w-full divide-y divide-gray-200 table-fixed w-full border border-amber-300" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              {columns.map(col => (
                <col key={col.key} style={{ width: colWidths[col.key] }} />
              ))}
            </colgroup>
            <thead className=" border border-amber-300">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="relative px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hover:bg-gray-100 transition duration-200 border border-amber-300"
                    onClick={() => column.key !== 'actions' && handleSort(column.key)}
                    style={{ userSelect: 'none' }}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>{column.label}</span>
                      {column.key !== 'actions' && <SortIcon field={column.key} />}
                    </div>
                    {/* resizer */}
                    {column.key !== 'actions' && (
                      <div
                        onMouseDown={(e) => startResize(e, column.key)}
                        className="absolute right-0 top-0 h-full w-2 -mr-1 z-10 hover:bg-blue-100"
                        style={{ cursor: 'col-resize' }}
                        role="separator"
                        aria-orientation="vertical"
                      />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="premium-card divide-y divide-gray-200">
              {sortedBuyers.length > 0 ? (
                sortedBuyers.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((buyer) => (
                  <tr key={buyer.id} className="hover: transition duration-200">
                    <td className='px-2 py-2 border border-amber-300'>
                      <div className="text-sm text-slate-800 break-words">{buyer.id}</div>
                    </td>
                    <td className="px-2 py-2 border border-amber-300">
                      <div className="text-sm font-medium text-slate-800 break-words">{buyer.section}</div>
                    </td>
                    <td className="px-2 py-2 border border-amber-300">
                      <div className="text-sm text-slate-800 break-words">{buyer.cardno}</div>
                    </td>
                    <td className="px-2 py-2 border border-amber-300">
                      <div className="text-sm text-slate-800 break-words">{buyer.emp_name}</div>
                    </td>
                    <td className="px-2 py-2 border border-amber-300">
                      <div className="text-sm text-slate-800 break-words">{
                        buyer.prod_date && !isNaN(new Date(buyer.prod_date).getTime())
                          ? new Date(buyer.prod_date).toISOString().slice(0, 10)
                          : 'N/A'
                      }</div>
                    </td>
                    <td className="px-2 py-2 border border-amber-300">
                      <div className="text-sm text-slate-800 break-words">{buyer.style}</div>
                    </td>
                    <td className="px-2 py-2 border border-amber-300">
                      <div className="text-sm text-slate-800 break-words">{buyer.process}</div>
                    </td>
                    <td className="px-2 py-2 border border-amber-300">
                      <div className="text-sm text-slate-800 break-words">{buyer.quantity}</div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm font-medium border border-amber-300">
                      <div className="flex items-center space-x-2">
                        {/* <button
                          onClick={() => handleEdit(buyer)}
                          className="text-blue-600 hover:text-blue-900 transition duration-200 p-1 rounded hover:bg-blue-50"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button> */}
                        <button
                          onClick={() => handleDelete(buyer?.id)}
                          className="text-red-600 hover:text-red-900 transition duration-200 p-1 rounded hover:bg-red-50"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="mt-2 text-lg font-medium">Nothing found</p>
                      <p className="mt-1">Try adjusting your search criteria</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination controls */}
        <div className="flex items-center justify-between px-4 py-3 premium-card border-t border-gray-200">
          <div className="text-sm text-slate-600">
            Showing <span className="font-medium">{sortedBuyers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span>
            {' - '}
            <span className="font-medium">{Math.min(currentPage * pageSize, sortedBuyers.length)}</span>
            {' of '}
            <span className="font-medium">{sortedBuyers.length}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 border rounded ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Prev
            </button>

            {/* simple numeric pagination (show up to 7 pages centered) */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.ceil(sortedBuyers.length / pageSize) }).map((_, i) => {
                const pageNum = i + 1;
                // show first, last, current +/-2
                if (
                  pageNum === 1 ||
                  pageNum === Math.ceil(sortedBuyers.length / pageSize) ||
                  Math.abs(pageNum - currentPage) <= 2
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`px-2 py-1 rounded border ${pageNum === currentPage ? 'bg-blue-600 text-white' : ''}`}
                    >
                      {pageNum}
                    </button>
                  );
                }
                // show ellipsis placeholder where appropriate
                if (
                  (pageNum === currentPage - 3 && pageNum > 1) ||
                  (pageNum === currentPage + 3 && pageNum < Math.ceil(sortedBuyers.length / pageSize))
                ) {
                  return <span key={pageNum} className="px-2">...</span>;
                }
                return null;
              })}
            </div>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === Math.ceil(sortedBuyers.length / pageSize)}
              className={`px-3 py-1 border rounded ${currentPage === Math.ceil(sortedBuyers.length / pageSize) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ProductionEntryShow;
