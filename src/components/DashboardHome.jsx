import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthContext } from '../AuthContextProvider/AuthContextProvider';

const DashboardHome = () => {
  const { server_url, user } = useAuthContext();
  const [summary, setSummary] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(false);


  const fetchInitialData = async () => {
    try {
      setLoadingSummary(true);
      const res = await axios.post(`${server_url}/production/style/monthlySummary`, { ...user, year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
      setSummary(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load dashboard summary', err);
    }
    finally {
      setLoadingSummary(false);
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

    await axios.post(`${server_url}/production/style/monthlySummary`, data)
      .then((res) => {
        // setSummary(Array.isArray(res.data) ? res.data : []);
        setSummary(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error('Failed to load dashboard summary', err);
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
        {/* Production Summary Table */}
        <div className="lg:col-span-2 premium-card overflow-hidden">
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
                  summary.map((r, idx) => (
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
                      <td className="px-8 py-2 whitespace-nowrap text-sm text-right font-black text-slate-800">{r.Total_Qty.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Analytics Card */}
        <div className="flex flex-col gap-8">
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

          <div className="bg-gradient-to-br from-emerald-700 to-blue-800 rounded-3xl p-8 text-white shadow-2xl shadow-emerald-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm0 3.45l8.15 14.1H3.85L12 5.45zM11 11v4h2v-4h-2zm0 6v2h2v-2h-2z" /></svg>
            </div>
            <h4 className="text-emerald-200 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Priority Focus</h4>
            <p className="text-xl font-black leading-tight mb-6">Optimize stitching efficiency for Style-A batch.</p>
            <div className="flex items-center gap-2 text-[10px] font-black text-white premium-card/10 w-fit px-4 py-2 rounded-xl backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
              TARGET: +12% INCREASE
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
