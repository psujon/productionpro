import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios'
import { useAuthContext } from '../AuthContextProvider/AuthContextProvider';

const EmployeeInformation = () => {
  const { server_url, user } = useAuthContext();
  const [sectionList, setSectionList] = useState([]);
  const [employeeList, setEmployeeList] = useState([]);
  const [departmentList, setDepartmentList] = useState([]);
  const [blockList, setBlockList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState([]);
  const [formData, setFormData] = useState({
    cardno: '',
    emp_name: '',
    designation: '',
    joining_date: new Date().toISOString().split('T')[0],
    department: '',
    section: '',
    block: '',
    status: '',
  });

  useEffect(() => {
    if (!server_url || !user) return;
    (async () => {
      try {
        axios.post(`${server_url}/employee/get/list`, user)
          .then(res => {
            const result = res.data;
            if (Array.isArray(result)) {
              setEmployeeList(result);
            }
            setCurrentPage(1);
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
        const department = await axios.get(`${server_url}/globalFetch/department/list`);
        if (mounted && Array.isArray(department.data)) setDepartmentList(department.data);

        const sections = await axios.get(`${server_url}/globalFetch/section/list`);
        if (mounted && Array.isArray(sections.data)) setSectionList(sections.data);

        const blocks = await axios.get(`${server_url}/globalFetch/block/list`);
        if (mounted && Array.isArray(blocks.data)) setBlockList(blocks.data);
      } catch (err) {
        console.error('Failed to load initial department/section data:', err);
      }
    })();
    return () => { mounted = false; };
  }, [server_url]);

  // Search functionality
  const filteredBuyers = employeeList.filter(emp =>
    Object.values(emp || {}).some(value =>
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

  const handleEdit = async (employee_data) => {
    // console.log(employee_data);
    setEditingBuyer(employee_data);
    setFormData({
      cardno: employee_data.CARDNO,
      emp_name: employee_data.EMP_NAME,
      designation: employee_data.DESIGNATION,
      joining_date: new Date(employee_data.JOINING_DATE).toISOString().split(['T'])[0],
      department: employee_data.DEPARTMENT,
      section: employee_data.SECTION,
      block: employee_data.BLOCK,
      status: employee_data.ACTIVE_STATUS,
    });
    // console.log(formData);
    setIsFormOpen(true);
  };

  const handleAddNewEmployee = () => {
    setEditingBuyer(null);
    setFormData({
      cardno: '',
      emp_name: '',
      designation: '',
      joining_date: new Date().toISOString().split('T')[0],
      department: '',
      section: '',
      block: '',
      status: '',
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this buyer?')) {
      axios.delete(`${server_url}/employee/delete/${id}`)
        .then(res => {
          alert(res.data.message);
          setEmployeeList(prev => prev.filter(buyer => buyer.id !== id));
        })
        .catch(err => {
          alert(err);
        });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Prepare data for submission
    const submissionData = {
      ...formData,
      user: user
    };

    if (editingBuyer && editingBuyer.id) {
      submissionData.id = editingBuyer.id;
    }

    if (editingBuyer) {
      // Update data
      axios.put(`${server_url}/employee/update/${editingBuyer.id}`, submissionData)
        .then(res => {
          alert(res.data.message);
          setIsFormOpen(false);
          // Update the list with the edited data
          setEmployeeList(prev => prev.map(item =>
            item.id === editingBuyer.id ? { ...item, ...submissionData } : item
          ));
          // Reset form
          setFormData({
            cardno: '',
            emp_name: '',
            designation: '',
            joining_date: new Date().toISOString().split('T')[0],
            department: '',
            section: '',
            block: '',
            status: '',
          });
          setEditingBuyer(null);
        })
        .catch(err => {
          alert(err);
        });
    } else {
      // Submit data
      axios.post(`${server_url}/employee/insert`, submissionData)
        .then(res => {
          alert(res.data.message);
          setIsFormOpen(false);
          // Reset form
          setFormData({
            cardno: '',
            emp_name: '',
            designation: '',
            joining_date: new Date().toISOString().split('T')[0],
            department: '',
            section: '',
            block: '',
            status: '',
          });
        })
        .catch(err => {
          // console.error('Error saving production entry:', err);
          alert('Error entry. Please try again.', err);
        });

    }

  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDepartmentChange = async (e) => {
    handleInputChange(e);
  }
  const handleSectionChange = async (e) => {
    handleInputChange(e);
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="text-gray-400">↕</span>;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const columns = [
    { key: 'ID', label: 'ID' },
    { key: 'CARDNO', label: 'CARDNO' },
    { key: 'EMP_NAME', label: 'EMP_NAME' },
    { key: 'DESIGNATION', label: 'DESIGNATION' },
    { key: 'JOIN_DATE', label: 'JOIN_DATE' },
    { key: 'DEPARTMENT', label: 'DEPARTMENT' },
    { key: 'SECTION', label: 'SECTION' },
    { key: 'BLOCK', label: 'BLOCK' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions' }
  ];

  const [colWidths, setColWidths] = useState({
    ID: '60px',
    CARDNO: '100px',
    EMP_NAME: '200px',
    DESIGNATION: '150px',
    JOIN_DATE: '120px',
    DEPARTMENT: '150px',
    SECTION: '150px',
    BLOCK: '100px',
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

  const handleCancelButton = () => {
    setFormData({
      cardno: '',
      emp_name: '',
      designation: '',
      joining_date: new Date().toISOString().split('T')[0],
      department: '',
      section: '',
      block: '',
      status: '',
    });
    setEditingBuyer(null);
    setIsFormOpen(false);
  }

  return (
    <div className="p-1">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-2">
        <div className='px-4 py-2'>
          <h1 className="text-2xl font-bold text-slate-800">Employee Management</h1>
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
              placeholder="Search Employee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
            />
          </div>

          {/* Add New Button */}
          <button
            onClick={handleAddNewEmployee}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {isFormOpen ? 'Close Form' : 'Add Employee'}
          </button>
        </div>
      </div>

      {/* Add/Edit Form Section */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isFormOpen ? 'max-h-[200px] opacity-100 mt-1' : 'max-h-0 opacity-0'} mb-2`}>
        <div className="premium-card rounded-lg shadow-lg border border-gray-200">

          <form onSubmit={handleSubmit} className="p-2 space-y-4 ">
            {/* Fixed fields section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Cardno
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="cardno"
                    value={formData.cardno}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border premium-card border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Employee Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="emp_name"
                    value={formData.emp_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border premium-card border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Designation
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border premium-card border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Joining Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="joining_date"
                    value={formData.joining_date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border premium-card border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                  />
                </div>
              </div>

              {/* department */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Department
                </label>
                <select
                  name="department"
                  value={formData.department}
                  required
                  onChange={handleDepartmentChange}
                  className="w-full px-3 py-2 border premium-card border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                >
                  <option value="">Select Department</option>
                  {(departmentList || []).map((department, idx) => (
                    <option key={department.id ?? idx} value={department.department}>{department.department}</option>
                  ))}
                </select>
              </div>
              {/* section */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Section
                </label>
                <select
                  name="section"
                  value={formData.section}
                  required
                  onChange={handleSectionChange}
                  className="w-full px-3 py-2 border premium-card border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                >
                  <option value="">Select Section</option>
                  {(sectionList || []).map((section, idx) => (
                    <option key={section.id ?? idx} value={section.section}>{section.section}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Block
                </label>
                <div className="relative">
                  <select
                    name="block"
                    value={formData.block}
                    required
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border premium-card border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                  >
                    <option value="">Select Line/Block</option>
                    {(blockList || []).map((block, idx) => (
                      <option key={block.id ?? idx} value={block.block}>{block.block}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                >
                  <option value="">Select Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
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
                Save Employee
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
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-slate-800">{employeeList.length}</p>
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
              <p className="text-sm font-medium text-gray-600">Active Employees</p>
              <p className="text-2xl font-bold text-slate-800">
                {employeeList.filter(b => b.ACTIVE_STATUS === 'Active').length}
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
              <p className="text-sm font-medium text-gray-600">Inactive Employees</p>
              <p className="text-2xl font-bold text-slate-800">
                {employeeList.filter(b => b.ACTIVE_STATUS === 'Inactive').length}
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
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-slate-800">
                {employeeList.length}
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
                  value={pageSize}
                  onChange={async (e) => {
                    const newSize = parseInt(e.target.value, 10);
                    if (newSize === 0) return;
                    setCurrentPage(1);
                    setPageSize(newSize);
                    try {
                      const res = await axios.post(`${server_url}/employee/get/list`, { ...user, limit: newSize });
                      setEmployeeList(res.data);
                    } catch (err) {
                      console.error('Failed to fetch:', err);
                    }
                  }}
                  className="border border-gray-300 rounded px-2 py-1"
                >
                  <option value={0}>Select</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                  <option value={300}>300</option>
                  <option value={400}>400</option>
                  <option value={500}>500</option>
                  <option value={1000}>1000</option>
                  <option value={5000}>5000</option>
                  <option value={10000}>10000</option>
                </select>
              </div>
            </div>
          </div>
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <colgroup>
              {columns.map(col => (
                <col key={col.key} style={{ width: colWidths[col.key] }} />
              ))}
            </colgroup>
            <thead className="">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-2 py-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:bg-gray-100 transition duration-200 relative group/resize"
                    onClick={() => column.key !== 'actions' && handleSort(column.key)}
                  >
                    <div className="flex items-center space-x-1 justify-center">
                      <span>{column.label}</span>
                      {column.key !== 'actions' && <SortIcon field={column.key} />}
                    </div>
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
            <tbody className="premium-card divide-y divide-gray-200">
              {sortedBuyers.length > 0 ? (
                sortedBuyers.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((employee) => (
                  <tr key={employee.ID} className="hover: transition duration-200">
                    <td className='px-2 py-2 break-words'>
                      <div className="text-sm text-slate-800">{employee.ID}</div>
                    </td>
                    <td className="px-2 py-2 break-words">
                      <div className="text-sm font-medium text-slate-800">{employee.CARDNO}</div>
                    </td>
                    <td className="px-2 py-2 break-words">
                      <div className="text-sm text-slate-800">{employee.EMP_NAME}</div>
                    </td>
                    <td className="px-2 py-2 break-words">
                      <div className="text-sm text-slate-800">{employee.DESIGNATION}</div>
                    </td>
                    <td className="px-2 py-2 break-words">
                      <div className="text-sm text-slate-800">{
                        new Date(employee.JOINING_DATE).toISOString().split('T')[0]
                      }</div>
                    </td>
                    <td className="px-2 py-2 break-words">
                      {employee.DEPARTMENT}
                    </td>
                    <td className="px-2 py-2 break-words">
                      {employee.SECTION}
                    </td>
                    <td className="px-2 py-2 break-words">
                      {employee.BLOCK}
                    </td>
                    <td className="px-2 py-2 break-words">
                      {getStatusBadge(employee.ACTIVE_STATUS)}
                    </td>
                    <td className="px-2 py-2 text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(employee)}
                          className="text-blue-600 hover:text-blue-900 transition duration-200 p-1 rounded hover:bg-blue-50"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(employee?.id)}
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

export default EmployeeInformation;
