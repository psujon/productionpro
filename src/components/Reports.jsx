import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios'
import { useAuthContext } from '../AuthContextProvider/AuthContextProvider';
import { useNavigate } from 'react-router-dom';
import { PDFViewer } from '@react-pdf/renderer';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import ProductionSheetReport from './Reports/ProductionSheetReport';
Font.register({
  family: "Roboto",
  src: "https://fonts.gstatic.com/s/roboto/v20/KFOmCnqEu92Fr1Mu4mxP.ttf"
});

const styles = StyleSheet.create({
  page: {
    padding: 25,
    fontFamily: "Roboto",
    fontSize: 11,
  },
  header: {
    textAlign: "center",
    fontSize: 12,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    borderBottom: "1px solid #000",
    padding: 4,
  },
  cell: {
    flexGrow: 1,
    paddingRight: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 40,
    fontSize: 11,
  }
});

const MyDocument = ({ data }) => (
  <Document>
    {data.map((item, index) => (
      <Page size="A4" style={styles.page} key={index}>
        <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 4 }}>GARMENTS FACTORY LTD.</Text>
        <Text style={styles.header}>Jarun, Konabari, Gazipur</Text>
        <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 10 }}>PRODUCTION REPORT</Text>
        <View>
          <Text>NAME: {item.name}</Text>
          <Text>SECTION: {item.section}</Text>
          <Text>CARD NO: {item.card}</Text>
          <Text>MONTH: {item.month}</Text>
        </View>
        <View style={[styles.row]}> 
          <Text style={[styles.cell, { flexBasis: '20%' }]}>DATE</Text>
          <Text style={[styles.cell, { flexBasis: '30%' }]}>STYLE NO</Text>
          <Text style={[styles.cell, { flexBasis: '15%' }]}>TYPE</Text>
          <Text style={[styles.cell, { flexBasis: '15%', textAlign: 'right' }]}>QTY</Text>
          <Text style={[styles.cell, { flexBasis: '20%' }]}>REMARKS</Text>
        </View>
        {item.rows.map((r, i) => (
          <View style={styles.row} key={i}>
            <Text style={[styles.cell, { flexBasis: '20%' }]}>{r.date}</Text>
            <Text style={[styles.cell, { flexBasis: '30%' }]}>{r.style}</Text>
            <Text style={[styles.cell, { flexBasis: '15%' }]}>{r.type}</Text>
            <Text style={[styles.cell, { flexBasis: '15%', textAlign: 'right' }]}>{r.qty}</Text>
            <Text style={[styles.cell, { flexBasis: '20%' }]}>{r.remarks}</Text>
          </View>
        ))}
        <Text style={{ marginTop: 20, fontSize: 14 }}>
          Total: {item.total} Pcs
        </Text>
        <View style={styles.footer}>
          <Text>Worker Signature</Text>
          <Text>Supervisor</Text>
          <Text>Page {index + 1} of {data.length}</Text>
        </View>
      </Page>
    ))}
  </Document>
);
const Reports = () => {
  const {server_url, user, LoadSectionData} = useAuthContext();
  const [sectionList, setSectionList] = useState([]);
  const [productionList, setProductionsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const pageSize = 50;
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [formData, setFormData] = useState({
    prod_date: '',
    section: '',
    style: '',
    process: '',
    from_date: new Date(Date.now()).toISOString().slice(0, 10),
    till_date: new Date(Date.now()).toISOString().slice(0, 10),
    cardno:''    
  });
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
//   console.log(user);

useEffect(() => {
    if (!user) {
        navigate('/login');
    }
}, [user, navigate]);

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
        section : e.target.section.value,
        style : e.target.style.value,
        process : e.target.process.value,
        from_date : e.target.from_date.value,
        till_date : e.target.till_date.value,
        cardno : e.target.cardno.value
    }  
    const submissionData = {...data, login_user:user}      
    
    // Submit data
    axios.post(`${server_url}/production/SearchData`, submissionData)
      .then(res => {
        setProductionsList(res.data);
        setCurrentPage(1);
      })
      .catch(err => {
        if(err.response && err.response.data && err.response.data.message){
            console.error('Error:', err.response.data);
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


  // When section changes, update form data and reload styles for that section
  const handleSectionChange = async (e) => {
    // Update the form state first
    handleInputChange(e);

    // const data = {
    //     section: e.target.value,
    //     unit: user.unit,
    // }
    
    // try {
    //   // show loader and clear previous lists while fetching
    //   setStyleLoading(true);
    //   setStyleList([]);
    //   setProcessList([]);
    //   const loadedStyles = await LoadStylesData(data);

    //   if (Array.isArray(loadedStyles)) {
    //     setStyleList(loadedStyles);
    //   } else if (loadedStyles && Array.isArray(loadedStyles.styles)) {
    //     setStyleList(loadedStyles.styles);
    //   } else if (loadedStyles && Array.isArray(loadedStyles.data)) {
    //     setStyleList(loadedStyles.data);
    //   } else {
    //     console.warn('Unexpected LoadStylesData response shape, clearing styleList', loadedStyles);
    //     setStyleList([]);
    //   }
    // } catch (err) {
    //   console.error('Failed to load styles for section:', err);
    // } finally {
    //   setStyleLoading(false);
    // }
  };

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
    section: '80px',
    cardno: '80px',
    emp_name: '100px',
    prod_date: '80px',
    style: '200px',
    process: '180px',
    quantity: '50px',
    actions: '30px'
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

  const [produtionSheetData, setProductionSheetData] = useState(null);
  
  const handleProductionSheet = async () => {
    const section = document.getElementById('section').value;
    const start_date = document.getElementById('from_date').value;
    const end_date = document.getElementById('till_date').value;
    const cardno = document.getElementById('cardno').value;

    if (!section) {
      window.alert('Select section');
      return;
    }
    if (!start_date || !end_date) {
      window.alert('Select date range');
      return;
    }

    // Clear previous data to trigger refresh
    setProductionSheetData(null);

    const payload = {
        section,
        start_date,
        end_date,
        cardno,
        login_user: user
      };

    try {
      // const res = await axios.post(
      // `${server_url}/production_sheet`,
      // payload,
      // { responseType: 'blob' }
      // );
      // // Create a blob URL and open/download the PDF
      // const blob = new Blob([res.data], { type: 'application/pdf' });
      // const url = window.URL.createObjectURL(blob);
      // window.open(url, '_blank');
      const res = await axios.post(
        `${server_url}/generate-pdf`,
        { data: payload },
        { responseType: 'blob' }
      );
      // Create a blob URL for PDFViewer
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      setProductionSheetData(url);
      // Optionally, setProductionSheetData(url) if you want to use it elsewhere
    } catch (err) {
      console.error('Failed to fetch production sheet data', err);
      window.alert('Failed to fetch production sheet data');
    }
  }

  
  return (
    <div className="p-8  min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Reporting Engine</h1>
          <p className="text-gray-500 font-medium mt-1">Generate and analyze production and financial performance reports.</p>
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
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-4 py-2.5 premium-card border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm text-sm font-medium"
            />
          </div>
          
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="bg-emerald-600 text-white px-6 py-2.5 rounded-2xl hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xl shadow-emerald-100 transition-all flex items-center justify-center font-black text-sm active:scale-95"
          >
            <svg className={`w-4 h-4 mr-2 transition-transform duration-300 ${isFormOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {isFormOpen ? 'HIDE FILTERS' : 'SHOW FILTERS'}
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isFormOpen ? 'max-h-[1000px] opacity-100 mb-10' : 'max-h-0 opacity-0'}`}>
        <div className="premium-card rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="px-8 py-5  border-b border-gray-100">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              Report Configuration
            </h3>
          </div>
          <form onSubmit={handleSubmit} className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Section</label>
                <select
                  name="section"
                  id="section"
                  required
                  value={formData.section}
                  onChange={handleSectionChange}
                  className="w-full px-4 py-3  border-transparent rounded-2xl focus:premium-card focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold text-slate-800 transition-all cursor-pointer appearance-none"
                >
                  <option value="">Select Section</option>
                  {(sectionList || []).map((section, idx) => (
                    <option key={section.id ?? idx} value={section.section}>{section.section}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Date From</label>
                <input
                  type="date"
                  name="from_date"
                  id="from_date"
                  value={formData.from_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3  border-transparent rounded-2xl focus:premium-card focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold text-slate-800 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Date To</label>
                <input
                  type="date"
                  name="till_date"
                  id="till_date"
                  value={formData.till_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3  border-transparent rounded-2xl focus:premium-card focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold text-slate-800 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Employee Card</label>
                <input
                  type="text"
                  name="cardno"
                  id="cardno"
                  placeholder="Optional card no..."
                  value={formData.cardno}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3  border-transparent rounded-2xl focus:premium-card focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold text-slate-800 transition-all"
                />
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="premium-card p-10 group cursor-pointer overflow-hidden relative" onClick={handleProductionSheet}>
          <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
            <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm1.83 14L12 18.83 8.17 15l1.41-1.41L11 15.17V9h2v6.17l1.42-1.41L15.83 16z" /></svg>
          </div>
          <div className="relative z-10 space-y-6">
            <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 w-fit group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 17v-2a2 2 0 00-2-2H5a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v8m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Production Summary</h3>
              <p className="text-gray-500 font-medium mt-2">Export detailed production sheets for auditing and analysis.</p>
            </div>
            <div className="flex items-center text-emerald-600 text-xs font-black uppercase tracking-widest gap-2">
              Generate PDF Report
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </div>
          </div>
        </div>

        <div className="premium-card p-10 group cursor-pointer overflow-hidden relative">
          <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
            <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
          </div>
          <div className="relative z-10 space-y-6">
            <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 w-fit group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Wages & Payouts</h3>
              <p className="text-gray-500 font-medium mt-2">Calculate and verify payroll based on active production records.</p>
            </div>
            <div className="flex items-center text-emerald-600 text-xs font-black uppercase tracking-widest gap-2">
              Review Wages Sheet
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </div>
          </div>
        </div>
      </div>   

      {/* PDF Viewport */}
      {produtionSheetData && (
        <div className="premium-card overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-500">
          <div className="px-8 py-4 bg-gray-900 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              <span className="text-xs font-black text-white uppercase tracking-widest">Document Preview</span>
            </div>
            <button onClick={() => setProductionSheetData(null)} className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="h-[800px] bg-gray-100">
            <ProductionSheetReport productionSheetData={produtionSheetData} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
