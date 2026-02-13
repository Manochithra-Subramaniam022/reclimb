import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import { ArrowLeft, MapPin, Calendar, Lock, Send, Loader2, CheckCircle, Info, Phone, MessageSquare, User } from 'lucide-react';

const ItemDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [claimMessage, setClaimMessage] = useState('');
    const [claimImage, setClaimImage] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        try {
            const response = await api.get(`/item/${id}?json=true`);
            if (response.data.success) {
                setData(response.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch item details', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleClaimSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const formData = new FormData();
        formData.append('claim_message', claimMessage);
        if (claimImage) formData.append('image', claimImage);

        try {
            const response = await api.post(`/request/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (response.data.success) {
                fetchData();
            }
        } catch (err) {
            console.error('Failed to send claim', err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="animate-spin text-purple-500" size={48} />
        </div>
    );

    if (!data) return (
        <div className="pt-24 text-center text-slate-400">Item not found.</div>
    );

    const { item, request, show_full } = data;
    const isOwner = user?.user_id === item.owner_id;

    return (
        <div className="pt-24 pb-12 px-6 max-w-5xl mx-auto">
            <Link to="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors group w-fit">
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                <div className="md:col-span-3 space-y-6">
                    <GlassCard className="p-10 border-white/10 overflow-hidden relative" hover={false}>
                        <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-3xl font-black uppercase tracking-tighter text-xs ${item.status === 'Lost' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                            }`}>
                            {item.status} REPORT
                        </div>

                        <h1 className="text-4xl font-black text-white mb-8">{item.item_name}</h1>

                        <div className="space-y-6 mb-10">
                            <div className="flex items-center gap-4 text-slate-300">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                                    <MapPin size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Location</p>
                                    <p className="font-semibold">{item.location}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-slate-300">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Date Reported</p>
                                    <p className="font-semibold">{item.date}</p>
                                </div>
                            </div>
                        </div>

                        {!show_full && !isOwner && (
                            <div className="p-8 rounded-3xl bg-slate-900/50 border border-white/5 flex flex-col items-center text-center">
                                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 ring-8 ring-slate-900">
                                    <Lock className="text-slate-500" size={28} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-300 mb-2">Secure Information Restricted</h3>
                                <p className="text-sm text-slate-500 max-w-sm">Detailed description and images are hidden until the owner accepts your claim request.</p>
                            </div>
                        )}

                        {(show_full || isOwner) && (
                            <div className="space-y-8 animate-in fade-in duration-700">
                                <div className="h-px bg-white/5" />
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-purple-400 mb-2">
                                        <Info size={18} />
                                        <h3 className="font-black uppercase tracking-widest text-xs">Description from Reporter</h3>
                                    </div>
                                    <p className="text-slate-300 leading-relaxed bg-white/5 p-6 rounded-2xl border border-white/5 italic">
                                        "{item.description}"
                                    </p>
                                </div>

                                {item.image_path && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-blue-400 mb-2">
                                            <Info size={18} />
                                            <h3 className="font-black uppercase tracking-widest text-xs">Reference Image</h3>
                                        </div>
                                        <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                                            <img
                                                src={`http://localhost:5000/uploads/${item.image_path}`}
                                                alt={item.item_name}
                                                className="w-full h-auto object-cover"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </GlassCard>
                </div>

                <div className="md:col-span-2 space-y-6">
                    {isOwner ? (
                        <GlassCard className="p-8 border-purple-500/30 bg-purple-500/5" hover={false}>
                            <div className="flex items-center gap-3 text-purple-400 mb-6 font-black uppercase tracking-widest text-xs">
                                <User size={18} /> Owner Controls
                            </div>
                            <h3 className="text-xl font-bold text-white mb-4">You listed this item</h3>
                            <p className="text-sm text-slate-400 mb-8 leading-relaxed">Check your Inbox for claim requests from potential owners or finders.</p>

                            <Link to="/inbox" className="w-full px-6 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-3">
                                <MessageSquare size={18} /> Open Requests
                            </Link>
                        </GlassCard>
                    ) : request ? (
                        <GlassCard className="p-8 border-white/10" hover={false}>
                            <div className={`flex flex-col items-center text-center py-6 ${request.status === 'accepted' ? 'text-emerald-400' :
                                request.status === 'rejected' ? 'text-red-400' : 'text-amber-400'
                                }`}>
                                {request.status === 'accepted' ? <CheckCircle size={48} className="mb-4" /> : <Loader2 size={48} className="mb-4 animate-spin" />}
                                <h3 className="text-xl font-bold uppercase tracking-tight mb-2">Request {request.status}</h3>
                                <p className="text-slate-400 text-sm px-4">
                                    {request.status === 'pending' ? 'Waiting for the reporter to verify your claim.' :
                                        request.status === 'accepted' ? 'Success! Full details unlocked. Start a chat below.' :
                                            'Sorry, your claim was not accepted.'}
                                </p>

                                {request.status === 'accepted' && (
                                    <Link to={`/chat/${request.id}`} className="mt-8 w-full px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-3">
                                        <MessageSquare size={18} /> Open Chat
                                    </Link>
                                )}
                            </div>
                        </GlassCard>
                    ) : (
                        <GlassCard className="p-8 border-white/10" hover={false}>
                            <h3 className="text-2xl font-black text-white mb-6">Claim this Item</h3>
                            <p className="text-sm text-slate-500 mb-8 leading-relaxed">Provide specific details (stickers, scratches, last seen time) to help the owner verify you.</p>

                            <form onSubmit={handleClaimSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Proof Message</label>
                                    <textarea
                                        value={claimMessage}
                                        onChange={(e) => setClaimMessage(e.target.value)}
                                        placeholder="I lost this near the cafeteria on Tuesday..."
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/50 outline-none text-white text-sm transition-all resize-none h-32"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Add Image Proof (Optional)</label>
                                    <input
                                        type="file"
                                        onChange={(e) => setClaimImage(e.target.files[0])}
                                        className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-purple-500/20 transition-all flex items-center justify-center gap-3"
                                >
                                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <><Send size={18} /> Send Request</>}
                                </button>
                            </form>
                        </GlassCard>
                    )}

                    {show_full && (
                        <GlassCard className="p-8 border-blue-500/30 bg-blue-500/5" hover={false}>
                            <div className="flex items-center gap-3 text-blue-400 mb-4 font-black uppercase tracking-widest text-xs">
                                <Phone size={18} /> Contact Info
                            </div>
                            <p className="text-white font-mono text-lg bg-slate-900 border border-white/5 p-4 rounded-xl text-center shadow-inner">
                                {item.contact}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-3 text-center uppercase font-bold px-2 leading-relaxed">
                                Reach out directly to arrange the return of the item.
                            </p>
                        </GlassCard>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ItemDetails;
