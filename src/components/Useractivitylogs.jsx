import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios'
import { useAuthContext } from '../AuthContextProvider/AuthContextProvider';

const Useractivitylogs = () => {
    const { server_url, user } = useAuthContext();
    const [activityLogs, setActivityLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState('activity_time');
    const [sortDirection, setSortDirection] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 100;

    useEffect(() => {
        if (!server_url || !user) return;
        fetchLogs();
    }, [server_url, user]);

    const fetchLogs = async () => {
        try {
            const res = await axios.post(`${server_url}/users/activity-logs`, { limit: 1000 });
            setActivityLogs(res.data);
            setCurrentPage(1);
        } catch (err) {
            console.error('Failed to fetch activity logs:', err);
        }
    };

    const filteredItems = activityLogs.filter(log =>
        Object.values(log).some(value =>
            value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const sortedItems = [...filteredItems].sort((a, b) => {
        if (!sortField) return 0;
        const aValue = a[sortField];
        const bValue = b[sortField];
        if (sortDirection === 'asc') return aValue > bValue ? 1 : -1;
        return aValue < bValue ? 1 : -1;
    });

    const handleSort = (field) => {
        if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDirection('asc'); }
    };

    const goToPage = (page) => {
        const totalPages = Math.ceil(sortedItems.length / pageSize);
        setCurrentPage(Math.min(Math.max(1, page), totalPages));
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        // Using UTC methods to get the raw date components as stored in the database
        // to avoid local timezone shifts (e.g. +6 hours in Bangladesh)
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const year = date.getUTCFullYear();
        let hours = date.getUTCHours();
        let seconds = String(date.getUTCSeconds()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'

        return `${day}-${month}-${year} ${hours}:${minutes}:${seconds} ${ampm}`;
    };

    const SortIcon = ({ field }) => {
        if (sortField !== field) return <span className="text-gray-400 opacity-20">↕</span>;
        return sortDirection === 'asc' ? '↑' : '↓';
    };

    const columns = [
        { key: 'id', label: 'Log ID', width: '100px' },
        { key: 'username', label: 'User', width: '200px' },
        { key: 'activity_type', label: 'Activity', width: '150px' },
        { key: 'activity_time', label: 'Timestamp', width: '250px' }
    ];

    const [colWidths, setColWidths] = useState({
        id: '100px',
        username: '200px',
        activity_type: '150px',
        activity_time: '250px'
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
            const newWidth = Math.max(60, startWidth + dx);
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

    return (
        <div className="p-2 min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-2 gap-4">
                <div>
                    <h1 className="text-3xl px-8 font-black text-slate-800 tracking-tight">User Activity Logs</h1>
                    <p className="px-8 text-gray-500 text-sm font-medium">Audit trail of system access events.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pr-8">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search logs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm"
                        />
                    </div>
                    <button
                        onClick={fetchLogs}
                        className="p-2.5 bg-white border border-gray-100 rounded-2xl text-emerald-600 hover:bg-emerald-50 transition-all shadow-sm active:scale-95"
                        title="Refresh Logs"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-4 px-8">
                {[
                    { label: 'Total Events', value: activityLogs.length, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'blue' },
                    { label: 'Logins Today', value: activityLogs.filter(l => l.activity_type === 'Login' && new Date(l.activity_time).toDateString() === new Date().toDateString()).length, icon: 'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1', color: 'emerald' },
                    { label: 'Unique Users', value: new Set(activityLogs.map(l => l.username)).size, icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', color: 'indigo' },
                ].map((stat, i) => (
                    <div key={i} className="premium-card p-4 rounded-3xl border border-gray-100/50 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 bg-${stat.color}-50 rounded-2xl text-${stat.color}-600`}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                                </svg>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                                <p className="text-xl font-black text-slate-800">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Table */}
            <div className="mx-8 premium-card rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
                <div className="px-8 py-4 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Activity History</h3>
                    <span className="text-[10px] font-black text-gray-400 tracking-tighter uppercase">{sortedItems.length} RECORDS FOUND</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100 table-fixed">
                        <colgroup>
                            {columns.map(col => (
                                <col key={col.key} style={{ width: colWidths[col.key] }} />
                            ))}
                        </colgroup>
                        <thead>
                            <tr className="bg-gray-50/50">
                                {columns.map((col) => (
                                    <th
                                        key={col.key}
                                        className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] cursor-pointer hover:text-emerald-600 transition-colors relative group/resize"
                                        onClick={() => handleSort(col.key)}
                                    >
                                        <div className="flex items-center gap-2">
                                            {col.label}
                                            <SortIcon field={col.key} />
                                        </div>
                                        <div
                                            onMouseDown={(e) => startResize(e, col.key)}
                                            className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-emerald-400 group-hover/resize:bg-gray-200 transition-colors"
                                        />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {sortedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((log, idx) => (
                                <tr key={log.id || idx} className="hover:bg-emerald-50/20 transition-colors group">
                                    <td className="px-8 py-4 text-xs font-black text-gray-400 tabular-nums">#{log.id}</td>
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                                                {log.username.substring(0, 2)}
                                            </div>
                                            <span className="text-sm font-bold text-slate-800 tracking-tight">@{log.username}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4">
                                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg shadow-sm border ${log.activity_type === 'Login'
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                : 'bg-slate-50 text-slate-600 border-slate-100'
                                            }`}>
                                            {log.activity_type}
                                        </span>
                                    </td>
                                    <td className="px-8 py-4 text-sm text-gray-500 font-bold tracking-tight tabular-nums">
                                        {formatDate(log.activity_time)}
                                    </td>
                                </tr>
                            ))}
                            {sortedItems.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-8 py-12 text-center text-gray-400 font-black uppercase tracking-widest text-xs">
                                        No activity logs found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="px-8 py-6 bg-gray-50/30 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Page {currentPage} of {Math.ceil(sortedItems.length / pageSize)}</span>
                    <div className="flex gap-4">
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border border-gray-100 text-gray-400 hover:text-emerald-600 hover:border-emerald-200 disabled:opacity-30 transition-all shadow-sm active:scale-90"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === Math.ceil(sortedItems.length / pageSize)}
                            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border border-gray-100 text-gray-400 hover:text-emerald-600 hover:border-emerald-200 disabled:opacity-30 transition-all shadow-sm active:scale-90"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Useractivitylogs;
