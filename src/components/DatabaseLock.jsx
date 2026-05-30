import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthContext } from '../AuthContextProvider/AuthContextProvider';
import toast from 'react-hot-toast';

const DatabaseLock = () => {
  const { server_url, user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lockout_date, setLockoutDate] = useState(null);

  const [formData, setFormData] = useState({
    lock_date: lockout_date ? lockout_date.slice(0, 10) : new Date().toISOString().slice(0, 10)
  });

  const fetchLocks = async () => {
    if (!server_url) return;
    setLoading(true);
    try {
      const res = await axios.get(`${server_url}/databaseLock/getLockoutDate`);
      const { lockout_date } = res.data;
      setLockoutDate(lockout_date);
      setFormData({
        lock_date: lockout_date ? lockout_date.slice(0, 10) : new Date().toISOString().slice(0, 10)
      })
    } catch (err) {
      console.error('Failed to load database lock rules:', err);
      toast.error('Failed to retrieve lock configurations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocks();
  }, [server_url]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.lock_date) {
      toast.error('Please specify a lock date');
      return;
    }
    setSaving(true);
    const toastId = toast.loading('Updating Database Lockout...');
    try {
      const payload = {
        ...formData,
        login_user: user
      };
      const res = await axios.post(`${server_url}/databaseLock/save`, payload);
      if (res.data.success) {
        toast.success(res.data.message, { id: toastId });
        fetchLocks();
      } else {
        toast.error('Failed to Update Database Lock', { id: toastId });
      }
    } catch (err) {
      console.error('Failed to Update Database Lock:', err);
      toast.error(`Error: ${err.response?.data?.error || err.message}`, { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const [year, month, day] = dateStr.split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-2 mx-auto space-y-8 animate-in fade-in duration-500">

      {/* Header section */}
      <div className="flex flex-col mt-4 md:flex-row md:items-center md:justify-between px-8 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800 flex items-center gap-3">
            <svg className="w-8 h-8 text-rose-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Database Lock Control
          </h1>
          <p className="text-black-400 text-xs mt-1">Configure locking bounds to restrict database actions on/after targeted lockout dates.</p>
        </div>
        <button
          onClick={fetchLocks}
          disabled={loading || saving}
          className="mt-4 md:mt-0 px-4 py-2 border border-gray-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition duration-200 flex items-center gap-2 text-sm shadow-sm active:scale-95"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin text-rose-600' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 19m-4.21-4h5v5" />
          </svg>
          Refresh Rules
        </button>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="lg:col-span-2 premium-card rounded-2xl shadow-xl border border-gray-100 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">
              Set Database Lock
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Maximum Lockout Date</label>
                <input
                  type="date"
                  name="lock_date"
                  value={formData.lock_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:bg-white outline-none font-medium transition-all"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">Operations on or after this date will be locked.</span>
              </div>

            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-50">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {saving && (
                  <svg className="w-4 h-4 animate-spin text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                Enforce Lockout
              </button>
            </div>
          </form>
        </div>

        {/* Dynamic Restriction Banner */}
        <div className="premium-card p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden bg-slate-900 text-white flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-bl-full -z-10 blur-xl"></div>
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-rose-300 bg-rose-950/55 rounded-full border border-rose-900/50 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
              Live Restriction Guard
            </span>
            <h3 className="text-xl font-bold tracking-tight">Active Lockout Bound</h3>

            {locks.filter(l => l.is_locked).length > 0 ? (
              <div className="mt-4 space-y-4">
                {locks.filter(l => l.is_locked).slice(0, 1).map((activeLock) => (
                  <div key={activeLock.id} className="space-y-2">
                    <div className="text-3xl font-black text-rose-400">
                      {formatDate(activeLock.lock_date)}
                    </div>
                    <p className="text-slate-300 text-sm italic">
                      " {activeLock.reason || 'No description provided.'} "
                    </p>
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">
                      Enforced by @{activeLock.created_by}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 text-slate-400 text-sm">
                No active locking rule configured currently. Production database handles standard inputs seamlessly.
              </div>
            )}
          </div>
          <div className="pt-6 border-t border-slate-800 text-slate-400 text-[11px]">
            System security applies these configurations programmatically to all operators and supervisors across departments.
          </div>
        </div>

      </div>
    </div>
  );
};

export default DatabaseLock;
