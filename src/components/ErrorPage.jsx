import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios'
import { useAuthContext } from '../AuthContextProvider/AuthContextProvider';

const ErrorPage = () => {
  const {server_url, user, LoadSectionData, LoadStylesData, LoadSectionStyleWiseProcessData} = useAuthContext();
  const [sectionList, setSectionList] = useState([]);
  const [productionList, setProductionsList] = useState([]);
  const [processList, setProcessList] = useState([]);
  const [styleList, setStyleList] = useState([])
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState([]);
  const [formData, setFormData] = useState({
    prod_date: '',
    section: '',
    style: '',
    process: '',
    entries: [
      { id: Date.now(), cardno: '', quantity: '' }
    ]
  });
  const [processDropdownVisible, setProcessDropdownVisible] = useState(false);
  const [styleDropdownVisible, setStyleDropdownVisible] = useState(false);
  const [styleLoading, setStyleLoading] = useState(false);
  const [processLoading, setProcessLoading] = useState(false);
  const processDropdownRef = useRef(null);
  const styleDropdownRef = useRef(null);
//   console.log(user);

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

  useEffect(() => {
    if (!server_url || !user) return;
    (async () => {
      try {
        axios.post(`${server_url}/production/getData`,user)
        .then(res => {         
            
          setProductionsList(res.data);
          setCurrentPage(1); 
        })
        .catch(err=>{
          console.error('Failed to fetch:', err);
        })
      } catch (err) {
        console.error('Failed to fetch:', err);
      }
    })();

  }, [server_url, user]);

  // Load sections and buyers once when the page first mounts (or when server_url becomes available)
  useEffect(() => {
    if (!server_url) return;
    let mounted = true;
    (async () => {
      try {
        const sections = await LoadSectionData();
        if (mounted && Array.isArray(sections)) setSectionList(sections);
      } catch (err) {
        console.error('Failed to load initial section data:', err);
      }
    })();
    return () => { mounted = false; };
  }, [server_url, LoadSectionData]);
  
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
        // console.log(formData);
        setIsFormOpen(true);
  };

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
    
    // Validate required fields
    if (!formData.prod_date) {
      alert('Please select a production date.');
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
      username: user?.username,
      role: user?.role,
      unit: user?.unit
    };

    if( editingBuyer && editingBuyer.id ) {
        submissionData.id = editingBuyer.id;
    } 

    if(editingBuyer) {
        // Update data
        axios.put(`${server_url}/production/update/${editingBuyer.id}`, submissionData)
          .then(res => {
            alert(res.data.message);
            setIsFormOpen(false);
            // Update the list with the edited data
            setProductionsList(prev => prev.map(item => 
              item.id === editingBuyer.id ? { ...item, ...submissionData } : item
            ));
            // Reset form
            setFormData({
              prod_date: '',
              section: '',
              style: '',
              process: '',
              entries: [{ id: Date.now(), cardno: '', quantity: '' }]
            });
            setEditingBuyer(null);
            setStyleList(null);
            setProcessList(null);
          })
          .catch(err => {            
            alert(err);
          });
    } else {
    // Submit data
    axios.post(`${server_url}/production/insert`, submissionData)
      .then(res => {
        alert(res.data.message);
        setIsFormOpen(false);
        // Reset form
        setFormData({
          prod_date: '',
          section: '',
          style: '',
          process: '',
          entries: [{ id: Date.now(), cardno: '', quantity: '' }]
        });
        setStyleList(null);
        setProcessList(null);
      })
      .catch(err => {
        // console.error('Error saving production entry:', err);
        alert('Error saving production entry. Please try again.', err);
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

  // When section changes, update form data and reload styles for that section
  const handleSectionChange = async (e) => {
    // Update the form state first
    handleInputChange(e);

    const data = {
        section: e.target.value,
        unit: user.unit,
    }

    try {
      // show loader and clear previous lists while fetching
      setStyleLoading(true);
      setStyleList([]);
      setProcessList([]);
      const loadedStyles = await LoadStylesData(data);

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
  };

  const handleStyleChange = async (e) => {

    handleInputChange(e);

    const data = {
        section: formData.section,
        style: e.target.value,
        unit: user.unit,
    }

    try {
          // show loader and clear previous process list while fetching
          setProcessLoading(true);
          setProcessList([]);
          const loadProcess = await LoadSectionStyleWiseProcessData(data);
          // console.log(loadProcess);
          if(Array.isArray(loadProcess)){
              setProcessList(loadProcess)
          } else if (loadProcess && Array.isArray(loadProcess.process)) {
          setProcessList(loadProcess.process);
        } else if (loadProcess && Array.isArray(loadProcess.data)) {
          setProcessList(loadProcess.data);
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

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="text-gray-400">↕</span>;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="p-1">
      <div className="mb-2">
        <div>
          <h1 className="text-9xl font-bold text-slate-800 text-center">Nothing Found</h1>          
        </div>      
      </div>
    </div>
  );
};

export default ErrorPage;
