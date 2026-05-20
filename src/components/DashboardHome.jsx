import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthContext } from '../AuthContextProvider/AuthContextProvider';

const DashboardHome = () => {
  const { server_url, user } = useAuthContext();
  const [summary, setSummary] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [yearlySummary, setYearlySummary] = useState([]);
  const [loadingYearly, setLoadingYearly] = useState(false);
  const [showAllYearly, setShowAllYearly] = useState(false);
  const [showAllMonthly, setShowAllMonthly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');


  const fetchInitialData = async () => {
    try {
      setLoadingYearly(true);
      const [yearlyRes] = await Promise.all([
        axios.post(`${server_url}/production/style/yearlySummary`, { ...user, year: new Date().getFullYear() })
      ]);

      setYearlySummary(Array.isArray(yearlyRes.data) ? yearlyRes.data : []);
    } catch (err) {
      console.error('Failed to load dashboard summary', err);
    }
    finally {

      setLoadingYearly(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [server_url, user]);


  const handleDataLoad = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const year = formData.get('year');
    const month = formData.get('month');
    const data = { ...user, year, month }
    // console.log(data);

    setLoadingSummary(true);
    await axios.post(`${server_url}/production/style/monthlySummary`, data)
      .then((res) => {
        setSummary(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error('Failed to load dashboard summary', err);
      })
      .finally(() => {
        setLoadingSummary(false);
      });
  }

  const handleRefreshButtonClick = async () => {
    fetchInitialData();
  };


  const chartData = React.useMemo(() => {
    if (!summary || summary.length === 0) return [];
    const sorted = [...summary].sort((a, b) => b.value - a.value);
    return sorted.slice(0, 6);
  }, [summary]);

  const handle12MonthsDataLoad = async (e) => {
    if (e) e.preventDefault();
    const year = e ? new FormData(e.currentTarget).get('year') : new Date().getFullYear();
    setLoadingYearly(true);
    await axios.post(`${server_url}/production/style/12MonthsSummary`, { ...user, year })
      .then((res) => {
        setYearlySummary(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error('Failed to load dashboard summary', err);
      })
      .finally(() => {
        setLoadingYearly(false);
      });
  }

  const filteredYearlySummary = React.useMemo(() => {
    if (!searchQuery) return yearlySummary;
    return yearlySummary.filter((item) => {
      const styleName = item.style_name || item.style || '';
      return styleName.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [yearlySummary, searchQuery]);

  const handleStyleSearch = (searchValue) => {
    setSearchQuery(searchValue);
  }

  return (
    <div className="p-2  min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
        <div className='px-8'>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">System Analytics</h1>
          <p className="text-gray-500 font-medium mt-1">Live performance monitoring and production summaries.</p>
        </div>
        <div className="flex items-center gap-4 premium-card px-4 py-2 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-sm font-bold text-gray-600">Operational</span>
          </div>
          <div className="h-4 w-px bg-gray-100" />
          <span className="text-sm font-bold text-emerald-600">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">

        {/* <div className="lg:col-span-2 premium-card overflow-hidden">
          <div className="p-2 border-b border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-2 /30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-slate-700">Monthly Throughput</h3>
            </div>
            <form onSubmit={handleDataLoad} className="flex items-center gap-2">
              <select
                name="year"
                className="px-3 py-2 premium-card border border-gray-200 rounded-xl text-xs font-bold text-gray-600 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                defaultValue={new Date().getFullYear()}
              >
                {Array.from({ length: 6 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
              <select
                name="month"
                className="px-3 py-2 premium-card border border-gray-200 rounded-xl text-xs font-bold text-gray-600 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                defaultValue={new Date().getMonth() + 1}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString('default', { month: 'short' })}
                  </option>
                ))}
              </select>
              <button className="px-4 py-2 bg-emerald-600 text-white text-xs font-black rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95">
                FILTER
              </button>
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="">
                <tr>
                  <th className="px-4 py-2 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">#</th>
                  <th className="px-8 py-2 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Style</th>
                  <th className="px-8 py-2 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Process</th>
                  <th className="px-8 py-2 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Quantity</th>
                </tr>
              </thead>
              <tbody className="premium-card divide-y divide-gray-50">
                {loadingSummary ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-[3px] border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
                        <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Syncing Database...</span>
                      </div>
                    </td>
                  </tr>
                ) : summary.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="p-3  rounded-2xl text-gray-300">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                        </div>
                        <span className="text-gray-400 text-sm font-medium italic">No production logs for this period</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  (showAllMonthly ? summary : summary.slice(0, 10)).map((r, idx) => (
                    <tr key={idx} className="hover:bg-emerald-50/50 transition-colors group cursor-default">
                      <td className="px-4 py-1">
                        {idx + 1}
                      </td>
                      <td className="px-8 py-1 whitespace-nowrap text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">{r.style}</td>
                      <td className="px-8 py-1 whitespace-nowrap">
                        <span className="px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-black uppercase text-gray-600 tracking-tight">
                          {r.process}
                        </span>
                      </td>
                      <td className="px-8 py-2.5 whitespace-nowrap text-sm text-right font-black text-slate-800">{r.Total_Qty.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {summary.length > 10 && !loadingSummary && (
            <div className="p-4 border-t border-gray-50 flex justify-center">
              <button
                onClick={() => setShowAllMonthly(!showAllMonthly)}
                className="px-6 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-black rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-2"
              >
                {showAllMonthly ? (
                  <>
                    SHOW LESS
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" />
                    </svg>
                  </>
                ) : (
                  <>
                    SHOW MORE ({summary.length - 10} MORE)
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}
        </div> */}

        {/* Analytics Card */}
        {/* <div className="flex flex-col gap-8">
          <div className="premium-card p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-slate-700">Style Metrics</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Performance Distribution</p>
              </div>
              <div className="bg-green-50 p-2.5 rounded-xl text-green-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>

            <div className="space-y-6">
              {loadingSummary ? (
                <div className="py-12 flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-2 border-emerald-50 border-t-emerald-500 rounded-full animate-spin"></div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Recalculating...</span>
                </div>
              ) : chartData.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">Awaiting Data</div>
              ) : (
                chartData.map((item, idx) => {
                  const total = chartData.reduce((s, it) => s + (it.value || 0), 0) || 1;
                  const pct = Math.round(((item.value || 0) / total) * 100);
                  const colors = ['bg-emerald-600', 'bg-blue-600', 'bg-violet-600', 'bg-purple-600', 'bg-sky-600', 'bg-cyan-600'];
                  return (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-black text-gray-500 uppercase tracking-widest">
                        <span className="truncate w-32">{item.label}</span>
                        <span className="text-slate-800 font-black">{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full  rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colors[idx % colors.length]} rounded-full transition-all duration-1000 ease-out`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button
              onClick={handleRefreshButtonClick}
              disabled={loadingSummary}
              className="mt-10 w-full py-4 bg-gray-900 text-white text-xs font-black rounded-2xl hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shadow-xl shadow-gray-200 uppercase tracking-widest"
            >
              Refresh Data
            </button>
          </div>

        </div> */}
      </div>

      {/* Last 12 Months Style-wise Production Summary */}
      <div className="premium-card overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-700">Last 12 Months Production</h3>
              <p className="text-xs text-gray-400 font-medium">Style-wise aggregated throughput</p>
            </div>
          </div>
          <div>
            <input onChange={(e) => handleStyleSearch(e.target.value)} type="text" placeholder="Search by Style Name" className="w-100 px-3 py-2 premium-card border border-gray-200 rounded-xl text-xs font-bold text-gray-600 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
          </div>
          <form onSubmit={handle12MonthsDataLoad} className="flex items-center gap-2">
            <select
              name="year"
              className="px-3 py-2 premium-card border border-gray-200 rounded-xl text-xs font-bold text-gray-600 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              defaultValue={new Date().getFullYear()}
            >
              {Array.from({ length: 6 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
            <button className="px-4 py-2 bg-emerald-600 text-white text-xs font-black rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95">
              FILTER
            </button>
          </form>
        </div>

        <div className="w-full overflow-x-auto max-w-full">
          <table className="w-full min-w-[1200px] divide-y divide-gray-100">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">#</th>
                <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Section</th>
                <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Style Name</th>
                <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Process</th>
                <th className="px-4 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Jan</th>
                <th className="px-4 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Feb</th>
                <th className="px-4 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Mar</th>
                <th className="px-4 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Apr</th>
                <th className="px-4 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">May</th>
                <th className="px-4 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Jun</th>
                <th className="px-4 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Jul</th>
                <th className="px-4 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Aug</th>
                <th className="px-4 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Sep</th>
                <th className="px-4 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Oct</th>
                <th className="px-4 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Nov</th>
                <th className="px-4 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Dec</th>
                <th className="px-6 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Qty</th>
              </tr>
            </thead>
            <tbody className="premium-card divide-y divide-gray-50">
              {loadingYearly ? (
                <tr>
                  <td colSpan={16} className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-[3px] border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                      <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Syncing Database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredYearlySummary.length === 0 ? (
                <tr>
                  <td colSpan={16} className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-3 rounded-2xl text-gray-300">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                      </div>
                      <span className="text-gray-400 text-sm font-medium italic">No production logs found for the last 12 months</span>
                    </div>
                  </td>
                </tr>
              ) : (
                (showAllYearly ? filteredYearlySummary : filteredYearlySummary.slice(0, 10)).map((r, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/30 transition-colors group cursor-default">
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-400">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-2.5 max-w-[120px] truncate whitespace-nowrap text-sm font-bold text-slate-600" title={r.section}>{r.section}</td>
                    <td className="px-6 py-2.5 max-w-[200px] truncate whitespace-nowrap text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors" title={r.style}>{r.style}</td>
                    <td className="px-6 py-2.5 max-w-[150px] truncate whitespace-nowrap">
                      <span className="px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-black uppercase text-gray-600 tracking-tight block truncate" title={r.process}>
                        {r.process}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-xs text-right text-gray-600 font-medium">{r.Jan?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-xs text-right text-gray-600 font-medium">{r.Feb?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-xs text-right text-gray-600 font-medium">{r.Mar?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-xs text-right text-gray-600 font-medium">{r.Apr?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-xs text-right text-gray-600 font-medium">{r.May?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-xs text-right text-gray-600 font-medium">{r.Jun?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-xs text-right text-gray-600 font-medium">{r.Jul?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-xs text-right text-gray-600 font-medium">{r.Aug?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-xs text-right text-gray-600 font-medium">{r.Sep?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-xs text-right text-gray-600 font-medium">{r.Oct?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-xs text-right text-gray-600 font-medium">{r.Nov?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-xs text-right text-gray-600 font-medium">{r.Dec?.toLocaleString() || 0}</td>
                    <td className="px-6 py-2.5 whitespace-nowrap text-sm text-right font-black text-slate-800">{r.Total_Qty.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredYearlySummary.length > 10 && !loadingYearly && (
          <div className="p-4 border-t border-gray-50 flex justify-center">
            <button
              onClick={() => setShowAllYearly(!showAllYearly)}
              className="px-6 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-black rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-2"
            >
              {showAllYearly ? (
                <>
                  SHOW LESS
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" />
                  </svg>
                </>
              ) : (
                <>
                  SHOW MORE ({filteredYearlySummary.length - 10} MORE)
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default DashboardHome;
