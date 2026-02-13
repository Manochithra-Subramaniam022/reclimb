import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Send, ArrowLeft, Loader2, Info, CheckCircle2, ShieldCheck, Clock, Lock } from 'lucide-react';

const Chat = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const scrollRef = useRef(null);
    const [error, setError] = useState(null);

    const fetchChat = async () => {
        try {
            const response = await api.get(`/chat/${id}?json=true`);
            if (response.data.success) {
                setData(response.data.data);
                setError(null);
            } else {
                setError(response.data.message || 'Failed to load chat');
            }
        } catch (err) {
            console.error('Failed to fetch chat', err);
            setError(err.response?.data?.message || 'Unauthorized access or connection error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChat();
        const interval = setInterval(fetchChat, 5000); // Polling for "real-time" feel
        return () => clearInterval(interval);
    }, [id]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [data?.messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim() || sending) return;

        setSending(true);
        try {
            // Sending as JSON instead of FormData for better reliability with @apply/Accept headers
            const response = await api.post(`/send_message/${id}?json=true`, {
                message: message
            });

            if (response.data.success) {
                setMessage('');
                fetchChat();
            } else {
                alert(response.data.message || 'Failed to send message');
            }
        } catch (err) {
            console.error('Failed to send message', err);
            alert(err.response?.data?.message || 'Connection error. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const handleMarkReturned = async () => {
        if (!confirm('Are you sure you want to mark this item as returned? This will close the chat.')) return;
        try {
            const response = await api.post(`/mark_returned/${data.item_id}`);
            if (response.data.success) {
                fetchChat();
            }
        } catch (err) {
            console.error('Failed to mark returned', err);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="animate-spin text-purple-500" size={48} />
        </div>
    );

    if (!data) return (
        <div className="pt-24 text-center px-6">
            <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">{error || 'You do not have permission to view this chat or the request was not found.'}</p>
            <Link to="/inbox" className="px-6 py-3 bg-purple-600 rounded-xl text-white font-bold transition-all shadow-lg shadow-purple-500/20">
                Back to Inbox
            </Link>
        </div>
    );

    return (
        <div className="pt-20 h-screen flex flex-col bg-dark-900">
            {/* Chat Header */}
            <div className="px-6 py-4 glass border-b border-white/5 flex items-center justify-between z-10 shadow-2xl">
                <div className="flex items-center gap-4">
                    <Link to="/inbox" className="p-2 rounded-xl hover:bg-white/5 text-slate-400 transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-white tracking-tight">Claim Chat</h2>
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest">
                                <ShieldCheck size={10} /> Verified Connection
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-2">
                            <Link to={`/item/${data.item_id}`} className="hover:text-purple-400 underline decoration-purple-500/30 transition-colors underline-offset-2">View Item Details</Link>
                        </p>
                    </div>
                </div>

                {user.user_id === data.owner_id && data.is_returned === 0 && (
                    <button
                        onClick={handleMarkReturned}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20"
                    >
                        Mark as Returned
                    </button>
                )}

                {data.is_returned === 1 && (
                    <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <CheckCircle2 size={14} /> Item Returned
                    </div>
                )}
            </div>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth"
            >
                <div className="text-center py-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 text-slate-500 text-[10px] font-bold uppercase tracking-widest border border-white/5">
                        <Lock size={12} /> Privacy Protected Messaging
                    </div>
                </div>

                {data.messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-600 animate-in fade-in duration-1000">
                        <div className="w-16 h-16 rounded-full bg-slate-800/50 border border-white/5 flex items-center justify-center mb-4">
                            <Clock size={24} />
                        </div>
                        <p className="font-medium tracking-tight">No messages yet. Start the coordination.</p>
                    </div>
                )}

                {data.messages.map((m, idx) => {
                    const isMe = m.name === user.user_name;
                    return (
                        <div
                            key={idx}
                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}
                        >
                            <div className={`max-w-[75%] px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-xl ${isMe
                                ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-tr-none border border-white/10 shadow-purple-900/10'
                                : 'bg-slate-800/80 text-slate-100 rounded-tl-none border border-white/5 shadow-black/20 backdrop-blur-sm'
                                }`}>
                                {m.message}
                            </div>
                            <div className="flex items-center gap-2 mt-1 px-1">
                                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{m.name}</span>
                                <span className="text-[10px] text-slate-700 font-medium">•</span>
                                <span className="text-[10px] text-slate-700 font-medium tracking-tighter">{m.timestamp}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Input Area */}
            <div className="p-6 glass border-t border-white/5 shadow-[0_-20px_40px_rgba(0,0,0,0.4)]">
                {data.is_returned === 0 ? (
                    <form onSubmit={handleSendMessage} className="flex gap-4 max-w-4xl mx-auto items-center">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type a message to coordinate..."
                                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-purple-500/50 outline-none text-white transition-all pr-12 placeholder:text-slate-600 shadow-inner"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={sending || !message.trim()}
                            className="p-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl shadow-xl shadow-purple-500/20 transition-all active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:grayscale"
                        >
                            {sending ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
                        </button>
                    </form>
                ) : (
                    <div className="max-w-4xl mx-auto flex items-center justify-center gap-3 py-2 text-slate-500 bg-white/5 rounded-2xl border border-dashed border-white/10 italic text-sm">
                        <Info size={18} />
                        Chat is now read-only as the item has been returned.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;
