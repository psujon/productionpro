import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthContext } from '../AuthContextProvider/AuthContextProvider';
import toast from 'react-hot-toast';

const Tickets = () => {
    const { server_url, user } = useAuthContext();
    const [tickets, setTickets] = useState([]);
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);

    useEffect(() => {
        if (server_url && user) {
            FetchTickets();
        }
    }, [server_url, user]);

    const FetchTickets = async () => {
        try {
            const response = await axios.post(`${server_url}/tickets/list`, {
                username: user.username,
                isAdmin: user.role === 'Admin'
            });
            setTickets(response.data);
        } catch (err) {
            console.error('Failed to fetch tickets:', err);
            toast.error('Failed to load tickets');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!subject.trim() || !description.trim()) return;

        setLoading(true);
        try {
            await axios.post(`${server_url}/tickets/create`, {
                username: user.username,
                subject,
                description
            });
            toast.success('Ticket submitted successfully');
            setSubject('');
            setDescription('');
            setIsFormOpen(false);
            FetchTickets();
        } catch (err) {
            console.error('Failed to submit ticket:', err);
            toast.error('Failed to submit ticket');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (ticketId, newStatus) => {
        try {
            await axios.post(`${server_url}/tickets/update-status`, {
                id: ticketId,
                status: newStatus
            });
            toast.success(`Ticket marked as ${newStatus}`);
            FetchTickets();
        } catch (err) {
            console.error('Failed to update status:', err);
            toast.error('Failed to update status');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString([], {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="p-6 min-h-screen bg-slate-50/50">
            <div className="max-w-5xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Support Tickets</h2>
                        <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">
                            {user.role === 'Admin' ? 'Manage and resolve user support requests' : 'Submit and track your support requests'}
                        </p>
                    </div>
                    {user.role !== 'Admin' && (
                        <button
                            onClick={() => setIsFormOpen(!isFormOpen)}
                            className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-100 active:scale-95 transition-all"
                        >
                            {isFormOpen ? 'Close Form' : 'Create New Ticket'}
                        </button>
                    )}
                </div>

                {/* Submission Form */}
                {isFormOpen && user.role !== 'Admin' && (
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl animate-in slide-in-from-top-4 duration-300">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Subject</label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Brief summary of your issue"
                                    className="w-full px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-bold"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Explain your issue in detail..."
                                    rows="4"
                                    className="w-full px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-bold resize-none"
                                    required
                                ></textarea>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-10 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 shadow-xl shadow-slate-200 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Submitting...' : 'Submit Ticket'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Tickets List */}
                <div className="space-y-4">
                    {tickets.length > 0 ? (
                        tickets.map((ticket) => (
                            <div key={ticket.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                                                ticket.status === 'Resolved' 
                                                    ? 'bg-emerald-100 text-emerald-700' 
                                                    : 'bg-amber-100 text-amber-700 animate-pulse'
                                            }`}>
                                                {ticket.status}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                                ID: #{ticket.id} • {formatDate(ticket.created_at)}
                                            </span>
                                        </div>
                                        <h3 className="text-base font-black text-slate-800 uppercase tracking-tight mb-2 group-hover:text-emerald-600 transition-colors">
                                            {ticket.subject}
                                        </h3>
                                        <p className="text-sm text-slate-500 leading-relaxed max-w-3xl">
                                            {ticket.description}
                                        </p>
                                        {user.role === 'Admin' && (
                                            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-500 uppercase">
                                                    {ticket.username.substring(0, 2)}
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Submitted by @{ticket.username}</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {user.role === 'Admin' && ticket.status !== 'Resolved' && (
                                        <div className="flex items-center shrink-0">
                                            <button
                                                onClick={() => handleUpdateStatus(ticket.id, 'Resolved')}
                                                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg active:scale-95"
                                            >
                                                Mark Resolved
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                            </div>
                            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">No tickets found</h4>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Tickets;
