import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuthContext } from '../AuthContextProvider/AuthContextProvider';
import toast from 'react-hot-toast';

const Community = () => {
    const { server_url, user, fetchUnreadCount, fetchRecentMessages } = useAuthContext();
    const [userList, setUserList] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isBroadcast, setIsBroadcast] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (!server_url || !user) return;
        FetchUsers();
    }, [server_url, user]);

    useEffect(() => {
        if (selectedUser) {
            FetchMessages();
            const interval = setInterval(FetchMessages, 5000); // Poll every 5 seconds
            return () => clearInterval(interval);
        }
    }, [selectedUser]);

    useEffect(scrollToBottom, [messages]);

    const FetchUsers = async () => {
        try {
            const response = await axios.post(`${server_url}/users/list`, user);
            // Filter out self from the list
            setUserList(response.data.filter(u => u.username !== user.username));
        } catch (err) {
            console.error('Failed to fetch users:', err);
        }
    };

    const FetchMessages = async () => {
        if (!selectedUser) return;
        try {
            const response = await axios.post(`${server_url}/community/list`, {
                username: user.username,
                other_username: selectedUser.username,
                is_broadcast: isBroadcast
            });
            setMessages(response.data);
            // Mark as read if there are unread messages
            if (response.data.some(m => m.receiver_username === user.username && m.is_read === 0)) {
                await axios.post(`${server_url}/community/mark-read`, {
                    username: user.username,
                    sender_username: selectedUser.username
                });
                // Update global notification badge
                fetchUnreadCount(user.username);
                fetchRecentMessages(user.username);
            }
        } catch (err) {
            console.error('Failed to fetch messages:', err);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || (!selectedUser && !isBroadcast)) return;

        setLoading(true);
        try {
            await axios.post(`${server_url}/community/send`, {
                sender_username: user.username,
                receiver_username: isBroadcast ? null : selectedUser.username,
                message_text: newMessage,
                is_broadcast: isBroadcast
            });
            setNewMessage('');
            setIsBroadcast(false);
            FetchMessages();
        } catch (err) {
            console.error('Failed to send message:', err);
            toast.error('Failed to send message');
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = userList.filter(u =>
        u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="p-2 h-[calc(100vh-120px)] flex flex-col lg:flex-row gap-4">
            {/* User Sidebar */}
            <div className="lg:w-80 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-3">Community</h2>
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    <button
                        onClick={() => { setSelectedUser({ username: 'Broadcast', full_name: 'All Users' }); setIsBroadcast(true); }}
                        className={`w-full text-left p-3 rounded-xl transition-all ${
                            isBroadcast ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'hover:bg-slate-50 text-slate-600'
                        }`}
                    >
                        <div className="font-bold text-xs uppercase tracking-wider">📢 Public Broadcasts</div>
                        <div className={`text-[10px] ${isBroadcast ? 'text-emerald-100' : 'text-slate-400'}`}>Official Announcements</div>
                    </button>
                    {filteredUsers.map(u => (
                        <button
                            key={u.id}
                            onClick={() => { setSelectedUser(u); setIsBroadcast(false); }}
                            className={`w-full text-left p-3 rounded-xl transition-all ${
                                selectedUser?.username === u.username && !isBroadcast
                                    ? 'bg-slate-800 text-white shadow-lg'
                                    : 'hover:bg-slate-50 text-slate-600 border border-transparent hover:border-slate-100'
                            }`}
                        >
                            <div className="font-bold text-xs uppercase tracking-wider">{u.full_name}</div>
                            <div className={`text-[10px] ${selectedUser?.username === u.username ? 'text-slate-400' : 'text-slate-400'}`}>@{u.username} • {u.user_role}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {selectedUser ? (
                    <>
                        {/* Chat Header */}
                        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-xs">
                                    {selectedUser.full_name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{selectedUser.full_name}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {isBroadcast ? 'Public Broadcast' : `@${selectedUser.username}`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed opacity-95">
                            {messages.map((msg, idx) => (
                                <div key={msg.id || idx} className={`flex ${msg.sender_username === user.username ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] p-4 rounded-2xl shadow-sm ${
                                        msg.sender_username === user.username
                                            ? 'bg-emerald-600 text-white rounded-tr-none'
                                            : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                                    }`}>
                                        <p className="text-sm leading-relaxed">{msg.message_text}</p>
                                        <div className={`text-[9px] mt-2 flex items-center gap-1 font-bold uppercase tracking-widest ${
                                            msg.sender_username === user.username ? 'text-emerald-100' : 'text-slate-400'
                                        }`}>
                                            {formatTime(msg.created_at)}
                                            {msg.sender_username === user.username && (
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={msg.is_read ? "M5 13l4 4L19 7M5 13l4 4L19 7" : "M5 13l4 4L19 7"} />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-slate-50/50 border-t border-slate-100">
                            {(isBroadcast && user.role !== 'Admin') ? (
                                <div className="text-center py-3 text-slate-400 text-xs font-bold uppercase tracking-widest bg-white rounded-xl border border-dashed border-slate-200">
                                    🔒 Only Admins can send messages to Public Broadcasts
                                </div>
                            ) : (
                                <form onSubmit={handleSendMessage} className="flex gap-3">
                                    <input
                                        type="text"
                                        placeholder={isBroadcast ? "Broadcast to everyone..." : `Message @${selectedUser.username}...`}
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        className="flex-1 px-6 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading || !newMessage.trim()}
                                        className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-100 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {loading ? '...' : 'Send'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/30">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6 border border-slate-100">
                            <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">Internal Messenger</h3>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest max-w-xs mx-auto leading-relaxed">
                            Select a colleague from the directory to start a conversation or view message history.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Community;
