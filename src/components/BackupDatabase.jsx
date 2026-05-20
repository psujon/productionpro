import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../AuthContextProvider/AuthContextProvider';
import toast from 'react-hot-toast';

const BackupDatabase = () => {
  const { server_url } = useAuthContext();
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('BackupFinishDate');
  const [sortDirection, setSortDirection] = useState('desc');

  // Hardcoded or dynamically resolved server info
  const serverInfo = {
    server: '10.10.1.78',
    database: 'BWSL_DB',
    type: 'Microsoft SQL Server',
    status: 'Online'
  };

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${server_url}/backup/list`);
      if (!response.ok) {
        throw new Error('Failed to retrieve backup history');
      }
      const data = await response.json();
      setBackups(data);
    } catch (err) {
      console.error(err);
      toast.error('Could not load database backup history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    if (backingUp) return;

    setBackingUp(true);
    const toastId = toast.loading('Initializing database backup... This might take a few moments.');

    try {
      const response = await fetch(`${server_url}/backup/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Backup operation failed');
      }

      toast.success(
        <div>
          <span className="font-bold text-slate-800">Database Backup Successful!</span>
          <div className="text-xs text-gray-500 mt-1">Saved on database server.</div>
        </div>,
        { id: toastId, duration: 5000 }
      );

      // Refresh the backup log table
      fetchBackups();
      
      // Dispatch event to notify navbar and other listeners
      window.dispatchEvent(new Event('database_backup_completed'));
    } catch (err) {
      console.error(err);
      toast.error(`Database Backup Failed: ${err.message}`, { id: toastId, duration: 6000 });
    } finally {
      setBackingUp(false);
    }
  };

  // Helper to format byte size nicely
  const formatBytes = (bytes) => {
    if (!bytes || isNaN(bytes)) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Helper to format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Filter & Sort
  const filteredBackups = backups.filter(backup =>
    Object.values(backup).some(value =>
      value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const sortedBackups = [...filteredBackups].sort((a, b) => {
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

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="text-gray-400 opacity-60">↕</span>;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="p-2 mx-auto space-y-8 animate-in fade-in duration-500">

      {/* Page Title & Refresh */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between px-8 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800 flex items-center gap-3">
            <svg className="w-8 h-8 text-emerald-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
            Database Backup & Restore
          </h1>
        </div>

        <button
          onClick={fetchBackups}
          disabled={loading || backingUp}
          className="mt-4 md:mt-0 px-4 py-2 border border-gray-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition duration-200 flex items-center gap-2 text-sm shadow-sm"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 19m-4.21-4h5v5" />
          </svg>
          Refresh Log
        </button>
      </div>

      {/* Dashboard Stats / Config Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Connection Details Card */}
        <div className="premium-card p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden bg-white">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-10 opacity-60"></div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Database Engine</h2>
              <div className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between gap-8"><span className="text-gray-400">DBMS:</span><span className="font-semibold text-slate-700">{serverInfo.type}</span></div>
                <div className="flex justify-between gap-8"><span className="text-gray-400">Server Host:</span><span className="font-semibold text-slate-700">{serverInfo.server}</span></div>
                <div className="flex justify-between gap-8"><span className="text-gray-400">Database:</span><span className="font-mono bg-slate-50 px-2 py-0.5 rounded text-emerald-700 font-semibold">{serverInfo.database}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Server Status Card */}
        <div className="premium-card p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden bg-white">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-10 opacity-60"></div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Instance Security</h2>
              <div className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between gap-8"><span className="text-gray-400">Status:</span><span className="inline-flex items-center gap-1.5 font-bold text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>{serverInfo.status}</span></div>
                <div className="flex justify-between gap-8"><span className="text-gray-400">Retention:</span><span className="font-semibold text-slate-700">Permanent (MSDB Logs)</span></div>
                <div className="flex justify-between gap-8"><span className="text-gray-400">Access Mode:</span><span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Administrator</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Summary Card */}
        <div className="premium-card p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden bg-white">
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-50 rounded-bl-full -z-10 opacity-60"></div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-violet-50 text-violet-700 rounded-2xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Backup Metrics</h2>
              <div className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between gap-8"><span className="text-gray-400">Total Backups Taken:</span><span className="font-black text-slate-700">{backups.length}</span></div>
                <div className="flex justify-between gap-8"><span className="text-gray-400">Last Backup Run:</span><span className="font-semibold text-slate-700">{backups.length > 0 ? new Date(backups[0].BackupFinishDate).toLocaleDateString() : 'Never'}</span></div>
                <div className="flex justify-between gap-8"><span className="text-gray-400">Latest Size:</span><span className="font-semibold text-violet-600">{backups.length > 0 ? formatBytes(backups[0].BackupSize) : '0 MB'}</span></div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Main Action Banner */}
      <div className="premium-card p-8 rounded-3xl bg-slate-900 text-white relative overflow-hidden shadow-xl border border-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/20 via-slate-900 to-slate-900 -z-10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -z-10"></div>

        <div className="max-w-xl">
          <span className="inline-flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold px-3 py-1 rounded-full text-[10px] tracking-wider uppercase mb-3">
            System Maintenance
          </span>
          <h2 className="text-2xl md:text-3xl font-black">Full Database Backup</h2>
          <p className="text-slate-300 mt-2 text-sm leading-relaxed">
            Instantly execute a transaction-safe full backup of the **BWSL_DB** production schema. The backup file will be created in the SQL Server default path on host **10.10.1.78**.
          </p>
        </div>

        <div className="flex-shrink-0">
          <button
            onClick={handleCreateBackup}
            disabled={backingUp}
            className={`
              w-full md:w-auto px-8 py-4 bg-emerald-500 text-slate-950 font-black rounded-2xl hover:bg-emerald-400 
              focus:outline-none focus:ring-4 focus:ring-emerald-500/30 transition duration-300 shadow-lg hover:shadow-emerald-500/20 
              flex items-center justify-center gap-3 cursor-pointer select-none active:scale-[0.98]
              ${backingUp ? 'opacity-75 cursor-not-allowed bg-emerald-600' : ''}
            `}
          >
            {backingUp ? (
              <>
                <svg className="w-5 h-5 animate-spin text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing Backup...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                Backup Now
              </>
            )}
          </button>
        </div>
      </div>

      {/* History Log Table Section */}
      <div className="premium-card shadow-lg rounded-2xl border border-gray-100 overflow-hidden bg-white">

        {/* Table Search Header */}
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Backup Registry Logs</h2>
            <p className="text-gray-400 text-xs mt-0.5">List of all historical database backup sets stored on the server.</p>
          </div>

          <div className="relative max-w-sm w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg className="h-4.5 w-4.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search backups by file path or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-200 text-sm"
            />
          </div>
        </div>

        {/* Table itself */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 table-fixed">
            <colgroup>
              <col style={{ width: '15%' }} />
              <col style={{ width: '45%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '8%' }} />
            </colgroup>

            <thead className="bg-slate-50/50">
              <tr>
                {[
                  { key: 'BackupFinishDate', label: 'Finish Date' },
                  { key: 'BackupPath', label: 'Physical Device Path (Server)' },
                  { key: 'BackupSize', label: 'File Size' },
                  { key: 'DurationSeconds', label: 'Duration' },
                  { key: 'BackupUser', label: 'Authorized User' },
                  { key: 'status', label: 'Status' }
                ].map((column) => (
                  <th
                    key={column.key}
                    onClick={() => column.key !== 'status' && handleSort(column.key)}
                    className={`
                      px-6 py-4.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider transition duration-200
                      ${column.key !== 'status' ? 'cursor-pointer hover:bg-gray-100 hover:text-slate-800' : ''}
                    `}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.label}</span>
                      {column.key !== 'status' && <SortIcon field={column.key} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <svg className="w-8 h-8 animate-spin text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <p className="text-gray-500 font-semibold text-sm">Retrieving registry log...</p>
                    </div>
                  </td>
                </tr>
              ) : sortedBackups.length > 0 ? (
                sortedBackups.map((backup, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition duration-150">
                    <td className="px-6 py-4.5 whitespace-nowrap text-sm font-semibold text-slate-700">
                      {formatDate(backup.BackupFinishDate)}
                    </td>
                    <td className="px-6 py-4.5 text-sm text-gray-600 break-all select-all font-mono bg-slate-50/30">
                      {backup.BackupPath}
                    </td>
                    <td className="px-6 py-4.5 whitespace-nowrap text-sm text-slate-800 font-bold">
                      {formatBytes(backup.BackupSize)}
                    </td>
                    <td className="px-6 py-4.5 whitespace-nowrap text-sm text-gray-500">
                      {backup.DurationSeconds}s
                    </td>
                    <td className="px-6 py-4.5 whitespace-nowrap text-sm text-gray-600 font-mono">
                      {backup.BackupUser || 'SYSTEM'}
                    </td>
                    <td className="px-6 py-4.5 whitespace-nowrap text-sm font-medium">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 rounded-full border border-emerald-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Success
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <div className="text-gray-400">
                      <svg className="mx-auto h-16 w-16 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-lg font-black text-slate-700">No backup records discovered</p>
                      <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
                        There are no backups registered for database **{serverInfo.database}** on this server host. Click "Backup Now" above to capture the first.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        {sortedBackups.length > 0 && (
          <div className="p-4 bg-slate-50/50 border-t border-gray-100 text-right text-xs text-gray-400 font-semibold">
            Showing {sortedBackups.length} of {backups.length} database logs. Backups are administered under standard SQL retention schedules.
          </div>
        )}
      </div>
    </div>
  );
};

export default BackupDatabase;
