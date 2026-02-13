import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import GlassCard from '../components/GlassCard';
import { Search, Calendar, MapPin, Tag, Plus, Loader2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const [items, setItems] = useState([]);
    const [section, setSection] = useState('active');
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/dashboard?section=${section}&q=${query}&json=true`);
            if (response.data.success) {
                setItems(response.data.data.items);
            }
        } catch (err) {
            console.error('Failed to fetch items', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [section]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchItems();
    };

    return (
        <div className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-extrabold text-white mb-2">Campus Feed</h1>
                    <p className="text-slate-400">Track and recover lost items within the CIT community.</p>
                </div>

                <form onSubmit={handleSearch} className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search items..."
                            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/50 outline-none text-white transition-all"
                        />
                    </div>
                    <button type="submit" className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all">
                        Search
                    </button>
                </form>
            </div>

            <div className="flex items-center gap-1 p-1 bg-white/5 rounded-2xl w-fit mb-8 border border-white/5">
                <button
                    onClick={() => setSection('active')}
                    className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${section === 'active' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white'
                        }`}
                >
                    Active Items
                </button>
                <button
                    onClick={() => setSection('previous')}
                    className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${section === 'previous' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white'
                        }`}
                >
                    Recovered / Old
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-500">
                    <Loader2 className="animate-spin text-purple-500" size={48} />
                    <p className="font-medium">Syncing with CIT database...</p>
                </div>
            ) : items.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item) => (
                        <Link key={item.id} to={`/item/${item.id}`}>
                            <GlassCard className="h-full flex flex-col group">
                                <div className="flex items-center justify-between mb-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${item.status === 'Lost' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                        }`}>
                                        {item.status}
                                    </span>
                                    <div className="text-slate-600 group-hover:text-purple-400 transition-colors">
                                        <ArrowRight size={20} />
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-white mb-4 group-hover:text-purple-300 transition-colors">{item.item_name}</h3>

                                <div className="mt-auto space-y-3">
                                    <div className="flex items-center gap-3 text-sm text-slate-400 font-medium">
                                        <MapPin size={16} className="text-slate-600" />
                                        {item.location}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-400 font-medium">
                                        <Calendar size={16} className="text-slate-600" />
                                        {item.date}
                                    </div>
                                </div>
                            </GlassCard>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-24 glass rounded-3xl border-dashed border-2 border-white/5">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Tag className="text-slate-600" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No items found</h3>
                    <p className="text-slate-500 mb-8">Try adjusting your search filters or check back later.</p>
                    <Link to="/add/lost" className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-500/20">
                        <Plus size={20} /> Report Missing Item
                    </Link>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
