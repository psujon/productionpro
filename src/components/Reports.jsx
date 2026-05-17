import React, { useState, useEffect } from 'react';
import axios from 'axios'
import { useAuthContext } from '../AuthContextProvider/AuthContextProvider';
import { useNavigate } from 'react-router-dom';
import ProductionSheetReport from './Reports/ProductionSheetReport';
import toast from 'react-hot-toast';

const Reports = () => {
  const { server_url, user } = useAuthContext();
  const [sectionList, setSectionList] = useState([]);
  const [blocks, setBlockList] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [formData, setFormData] = useState({
    section: '',
    block: '',
    from_date: new Date().toISOString().slice(0, 10),
    till_date: new Date().toISOString().slice(0, 10),
    cardno: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!server_url) return;
    let mounted = true;
    (async () => {
      try {
        const sections = await axios.get(`${server_url}/globalFetch/section/list`, {
          headers: {
            'Authorization': user
          }
        });
        if (mounted && Array.isArray(sections.data)) setSectionList(sections.data);

        const blocks = await axios.get(`${server_url}/globalFetch/block/list`, {
          headers: {
            'Authorization': user
          }
        });
        if (mounted && Array.isArray(blocks.data)) setBlockList(blocks.data);
      } catch (err) {
        toast.error('Failed to load initial section data');
        console.error(err);
      }
    })();
    return () => { mounted = false; };
  }, [server_url, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };


  const handleMonthlyProductionSheet = async () => {
    const { section, block, from_date, till_date, cardno } = formData;

    if (!section) {
      toast.error('Please select a section');
      return;
    }

    const payload = {
      section,
      block,
      from_date,
      till_date,
      cardno: cardno || null,
      login_user: user
    };

    try {
      const response = await axios.post(`${server_url}/production/showDataByFilter`, payload, {
        headers: { Authorization: user.token }
      });

      const data = response.data;
      // console.log(data);
      if (!data || data.length === 0) {
        toast.error('No production data found for the selected criteria');
        return;
      }

      const groupedData = data.reduce((acc, curr) => {
        if (!acc[curr.IdCardNo]) {
          acc[curr.IdCardNo] = {
            EmployeeName: curr.EmployeeName,
            IdCardNo: curr.IdCardNo,
            Section: curr.Section,
            Block: curr.Block,
            Unit: curr.Unit || curr.unit || user.unit,
            Unit_address: curr.Unit_address || curr.unit_address || user.unit_address,
            prod_items: []
          };
        }
        acc[curr.IdCardNo].prod_items.push(curr);
        return acc;
      }, {});

      const employeeWiseData = Object.values(groupedData);

      // Generate HTML for the new window
      const printWindow = window.open('', '_blank');
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Production Sheet Report</title>
          <style>
            @media print {
              .page-break { page-break-after: always; }
              body { margin: 0; padding: 0; }
            }
            body { font-family: 'Arial', sans-serif; padding: 20px; color: #333; }
            .report-container { width: 100%; max-width: 900px; margin: 0 auto; }
            .header { text-align: center; position: relative; margin-bottom: 20px; }
            .header h1 { margin: 5px 0; font-size: 24px; text-decoration: none; }
            .header .company-name { font-size: 20px; font-weight: bold; }
            .header .address { font-size: 14px; margin-bottom: 10px; }
            .header .report-title { 
              display: inline-block;
              border: 1px solid #000;
              padding: 5px 20px;
              font-weight: bold;
              margin-top: 10px;
              text-transform: uppercase;
            }
            .header .ref-no { position: absolute; top: 0; right: 0; font-size: 12px; }
            .header .date { position: absolute; bottom: 0; right: 0; font-size: 12px; }
            
            .meta-info { width: 100%; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 10px 0; margin-bottom: 10px; }
            .meta-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .meta-item { flex: 1; font-size: 12px; display: flex; align-items: baseline; }
            .meta-label { font-weight: bold; margin-right: 5px; text-transform: uppercase; min-width: 100px; }
            .meta-value { border-bottom: 1px solid #333; flex-grow: 1; padding-left: 5px; }

            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #000; padding: 0px 1px 0px 1px; text-align: center; font-size: 11px; }
            th { background-color: #f2f2f2; font-weight: bold; text-transform: uppercase; }
            .total-row td { font-weight: bold; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            
            .footer { margin-top: 50px; display: flex; justify-content: space-between; font-size: 14px; }
            .signature-box { text-align: center; width: 200px; border-top: 1px solid #000; padding-top: 5px; }
            
            /* Dynamic Page Numbering */
            .report-container { counter-reset: page; }
            .page-number { text-align: center; margin-top: 20px; font-size: 12px; }
            /*.page-number::before { content: "Page " counter(page); }*/
            @page {
              @bottom-center {
                content: counter(page) "  of  " counter(pages);
              }
            }
          </style>
        </head>
        <body>
          ${employeeWiseData.map((emp, index) => `
            <div class="report-container ${index < employeeWiseData.length - 1 ? 'page-break' : ''}">
              <table>
                <thead>
                  <tr>
                    <td colspan="5" style="border: none; padding: 0;">
                      <div class="header">
                        <div class="ref-no">BWSL/PRD(MEN)/03/003</div>
                        <div class="company-name">${emp.Unit}</div>
                        <div class="address">${emp.Unit_address}</div>
                        <div class="report-title">Production Sheet</div>
                        <div class="date">Date: ${new Date().toLocaleDateString().slice(0, 10)}</div>
                      </div>

                      <div class="meta-info">
                        <div class="meta-row">
                          <div class="meta-item"><span class="meta-label">Name:</span> <span class="meta-value">${emp.EmployeeName}</span></div>
                          <div class="meta-item"><span class="meta-label">Machine No:</span> <span class="meta-value"></span></div>
                        </div>
                        <div class="meta-row">
                          <div class="meta-item"><span class="meta-label">Section:</span> <span class="meta-value">${emp.Section}</span></div>
                          <div class="meta-item"><span class="meta-label">Cardno:</span> <span class="meta-value">${emp.IdCardNo}</span></div>
                        </div>
                        <div class="meta-row">
                          <div class="meta-item"><span class="meta-label">Supervisor:</span> <span class="meta-value"></span></div>
                          <div class="meta-item"><span class="meta-label">Block:</span> <span class="meta-value">${emp.Block}</span></div>
                          <div class="meta-item"><span class="meta-label">Month:</span> <span class="meta-value">${new Date(from_date).toLocaleString('default', { month: 'short' })}-${new Date(till_date).toLocaleString('default', { month: 'short' })} ${new Date(till_date).getFullYear()}</span></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th style="width: 15%">Date of Issue</th>
                    <th style="width: 35%">Style No</th>
                    <th style="width: 30%">Type</th>
                    <th style="width: 10%">Qty</th>
                    <th style="width: 10%">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  ${emp.prod_items.map(item => `
                    <tr>
                      <td>${item.ProductionDay}</td>
                      <td class="text-left">${item.Style}</td>
                      <td class="text-left">${item.Size}</td>
                      <td>${item.Total}</td>
                      <td>${item?.remarks || ''}</td>
                    </tr>
                  `).join('')}
                  <tr class="total-row">
                    <td colspan="3" class="text-right">Total :</td>
                    <td>${emp.prod_items.reduce((sum, item) => sum + (item.Total || 0), 0)}</td>
                    <td>Pcs</td>
                  </tr>
                </tbody>
              </table>

              <div class="footer">
                <div class="signature-box">Supervisor</div>
                <div class="signature-box">Worker Signature</div>
                <div class="signature-box">In-Charge</div>
              </div>
              <div class="page-number"></div>
            </div>
          `).join('')}
          <script>
            window.onload = function() {
              window.print();
              // window.close(); // Optional: close window after printing
            };
          </script>
        </body>
        </html>
      `;
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } catch (err) {
      console.error('Failed to generate report:', err);
      toast.error('Failed to generate monthly production report');
    }
  }


  return (
    <div className="p-2 min-h-screen">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 gap-4">
        <div>
          <h1 className="text-3xl px-8 font-black text-slate-800 tracking-tight">Reporting Management</h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
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

      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isFormOpen ? 'max-h-[1000px] opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
        <div className="premium-card rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-100">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              Report Configuration
            </h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Section</label>
                <select
                  name="section"
                  required
                  value={formData.section}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-transparent rounded-2xl focus:premium-card focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold text-slate-800 transition-all cursor-pointer appearance-none"
                >
                  <option value="">Select Section</option>
                  {(sectionList || []).map((section, idx) => (
                    <option key={section.id ?? idx} value={section.section}>{section.section}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Block</label>
                <select
                  name="block"
                  required
                  value={formData.block}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-transparent rounded-2xl focus:premium-card focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold text-slate-800 transition-all cursor-pointer appearance-none"
                >
                  <option value="">Select Block</option>
                  {(blocks || []).map((block, idx) => (
                    <option key={block.id ?? idx} value={block.block}>{block.block}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Date From</label>
                <input
                  type="date"
                  name="from_date"
                  value={formData.from_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border-transparent rounded-2xl focus:premium-card focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold text-slate-800 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Date To</label>
                <input
                  type="date"
                  name="till_date"
                  value={formData.till_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border-transparent rounded-2xl focus:premium-card focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold text-slate-800 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Employee Card</label>
                <input
                  type="text"
                  name="cardno"
                  placeholder="Optional card no..."
                  value={formData.cardno}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-transparent rounded-2xl focus:premium-card focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold text-slate-800 transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-10 mb-4">
        <button onClick={() => handleMonthlyProductionSheet()} className="premium-card rounded-lg border border-gray-200 shadow-sm text-pink-600 font-bold text-md">
          Monthly Production Sheet
        </button>

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
              </p>
            </div>
          </div>
        </div>
      </div>

    </div >
  );
};

export default Reports;
