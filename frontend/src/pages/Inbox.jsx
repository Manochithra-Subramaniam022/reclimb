import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import { Inbox as InboxIcon, MessageSquare, ArrowRight, User, Check, X, Tag, Loader2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const Inbox = () => {
    const [inbox, setInbox] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('received');

    const fetchInbox = async () => {
        setLoading(true);
        try {
            const response = await api.get('/requests?json=true');
            if (response.data.success) {
                setInbox(response.data.data.inbox);
            }
        } catch (err) {
            console.error('Failed to fetch inbox', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInbox();
    }, []);

    const handleAction = async (id, action) => {
        try {
            const response = await api.post(`/request_action/${id}/${action}`, null, {
                headers: { 'Accept': 'application/json' }
            });
            if (response.data.success) {
                fetchInbox();
            }
        } catch (err) {
            console.error(`Failed to ${action} request`, err);
        }
    };

    const filteredInbox = inbox.filter(item => item.role === activeTab);

    return (
        <div className="pt-24 pb-12 px-6 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-extrabold text-white flex items-center gap-4">
                        <InboxIcon className="text-purple-500" size={36} /> Inbox
                    </h1>
                    <p className="text-slate-400 mt-2">Manage your received requests and sent claims.</p>
                </div>

                <div className="flex items-center gap-1 p-1 bg-white/5 rounded-2xl w-fit border border-white/5">
                    <button
                        onClick={() => setActiveTab('received')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'received' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Received
                    </button>
                    <button
                        onClick={() => setActiveTab('sent')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'sent' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Sent
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-500">
                    <Loader2 className="animate-spin text-purple-500" size={48} />
                    <p className="font-medium tracking-tight">Accessing messages...</p>
                </div>
            ) : filteredInbox.length > 0 ? (
                <div className="space-y-4">
                    {filteredInbox.map((req) => (
                        <GlassCard key={req.id} className="p-6 border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-start gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border border-white/5 shadow-inner">
                                    <User className="text-slate-500" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                                        {req.item_name}
                                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${req.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-400' :
                                                req.status === 'rejected' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                                            }`}>
                                            {req.status}
                                        </span>
                                    </h3>
                                    <p className="text-slate-400 text-sm mb-2 italic">"{req.claim_message}"</p>
                                    <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                                        <span className="flex items-center gap-1"><Clock size={12} /> Recent</span>
                                        {req.is_returned === 1 && <span className="text-blue-400">Archived</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {activeTab === 'received' && req.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => handleAction(req.id, 'accept')}
                                            className="p-3 rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all shadow-lg shadow-emerald-500/5"
                                            title="Accept Claim"
                                        >
                                            <Check size={20} />
                                        </button>
                                        <button
                                            onClick={() => handleAction(req.id, 'reject')}
                                            className="p-3 rounded-xl bg-red-600/10 border border-red-500/20 text-red-400 hover:bg-red-600 hover:text-white transition-all shadow-lg shadow-red-500/5"
                                            title="Reject Claim"
                                        >
                                            <X size={20} />
                                        </button>
                                    </>
                                )}

                                {req.status === 'accepted' && (
                                    <Link
                                        to={`/chat/${req.id}`}
                                        className="flex items-center gap-2 px-6 py-3 bg-purple-600/10 border border-purple-500/20 text-purple-400 hover:bg-purple-600 hover:text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all"
                                    >
                                        <MessageSquare size={16} /> Open Chat
                                    </Link>
                                )}

                                <Link to={`/item/${req.item_id}`} className="p-3 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                                    <ArrowRight size={20} />
                                </Link>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            ) : (
                <div className="text-center py-24 glass rounded-3xl border-dashed border-2 border-white/5">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                        <Tag size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No {activeTab} requests</h3>
                    <p className="text-slate-500">When you interact with items, they will appear here.</p>
                </div>
            )}
        </div>
    );
};

export default Inbox;
