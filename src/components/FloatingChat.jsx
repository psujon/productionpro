import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuthContext } from '../AuthContextProvider/AuthContextProvider';

const FloatingChat = () => {
    const { server_url, user, activeChatUser, setActiveChatUser, fetchUnreadCount, fetchRecentMessages } = useAuthContext();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (activeChatUser) {
            FetchMessages();
            const interval = setInterval(FetchMessages, 5000);
            return () => clearInterval(interval);
        }
    }, [activeChatUser]);

    useEffect(scrollToBottom, [messages]);

    const FetchMessages = async () => {
        if (!activeChatUser) return;
        try {
            const response = await axios.post(`${server_url}/community/list`, {
                username: user.username,
                other_username: activeChatUser.username,
                is_broadcast: false
            });
            setMessages(response.data);
            
            // Mark as read and update global counts
            if (response.data.some(m => m.receiver_username === user.username && m.is_read === 0)) {
                await axios.post(`${server_url}/community/mark-read`, {
                    username: user.username,
                    sender_username: activeChatUser.username
                });
                fetchUnreadCount(user.username);
                fetchRecentMessages(user.username);
            }
        } catch (err) {
            console.error('Failed to fetch floating messages:', err);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChatUser) return;

        setLoading(true);
        try {
            await axios.post(`${server_url}/community/send`, {
                sender_username: user.username,
                receiver_username: activeChatUser.username,
                message_text: newMessage,
                is_broadcast: false
            });
            setNewMessage('');
            FetchMessages();
        } catch (err) {
            console.error('Failed to send floating message:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!activeChatUser) return null;

    return (
        <div className="fixed bottom-6 right-6 w-80 h-96 bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col z-[100] animate-in slide-in-from-bottom-8 duration-500 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-black uppercase">
                        {activeChatUser.username.substring(0, 2)}
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest truncate w-32">@{activeChatUser.username}</h4>
                        <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[8px] font-bold uppercase tracking-tighter text-emerald-400">Active Now</span>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={() => setActiveChatUser(null)}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-slate-50/30">
                {messages.map((msg, idx) => (
                    <div key={msg.id || idx} className={`flex ${msg.sender_username === user.username ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm ${
                            msg.sender_username === user.username
                                ? 'bg-emerald-600 text-white rounded-tr-none'
                                : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                        }`}>
                            <p className="text-[11px] leading-relaxed font-medium">{msg.message_text}</p>
                            <span className={`text-[8px] mt-1 block font-bold uppercase tracking-tighter ${
                                msg.sender_username === user.username ? 'text-emerald-100' : 'text-slate-400'
                            }`}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-slate-100 bg-white">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Type message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-xs"
                    />
                    <button
                        type="submit"
                        disabled={loading || !newMessage.trim()}
                        className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100 hover:bg-emerald-700 active:scale-90 transition-all disabled:opacity-50"
                    >
                        <svg className="w-4 h-4 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default FloatingChat;
