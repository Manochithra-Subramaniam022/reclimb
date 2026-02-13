import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import GlassCard from '../components/GlassCard';
import { Package, MapPin, Calendar, FileText, Phone, Upload, ArrowLeft, Loader2 } from 'lucide-react';

const AddItem = () => {
    const { status } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        item_name: '',
        location: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        contact: '',
    });
    const [image, setImage] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        setImage(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        if (image) data.append('image', image);

        try {
            const response = await api.post(`/add/${status}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (response.data.success) {
                navigate('/dashboard');
            }
        } catch (err) {
            console.error('Failed to post item', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pt-24 pb-12 px-6 max-w-3xl mx-auto">
            <Link to="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors group w-fit">
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
            </Link>

            <div className="mb-10 text-center">
                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4 inline-block ${status === 'lost' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                    Reporting {status} Item
                </span>
                <h1 className="text-4xl font-extrabold text-white">Item Details</h1>
                <p className="text-slate-400 mt-2">Provide accurate details to help with the recovery process.</p>
            </div>

            <GlassCard className="p-10 border-white/10" hover={false}>
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                <Package size={16} className="text-purple-400" /> Item Name
                            </label>
                            <input
                                type="text"
                                name="item_name"
                                value={formData.item_name}
                                onChange={handleChange}
                                placeholder="e.g. Blue Dell Laptop Charger"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/50 outline-none text-white placeholder:text-slate-600 transition-all"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                <MapPin size={16} className="text-purple-400" /> Location
                            </label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="e.g. Block 3 Canteen"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/50 outline-none text-white placeholder:text-slate-600 transition-all"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                <Calendar size={16} className="text-purple-400" /> Date
                            </label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/50 outline-none text-white transition-all"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                <Phone size={16} className="text-purple-400" /> Contact Info
                            </label>
                            <input
                                type="text"
                                name="contact"
                                value={formData.contact}
                                onChange={handleChange}
                                placeholder="Email or Phone number"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/50 outline-none text-white placeholder:text-slate-600 transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                            <FileText size={16} className="text-purple-400" /> Detailed Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="4"
                            placeholder="Mention specific marks, stickers, or unique features..."
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/50 outline-none text-white placeholder:text-slate-600 transition-all resize-none"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300 block mb-2">
                            Item Image {status === 'found' ? <span className="text-red-400 text-xs ml-2">(Required for proof)</span> : <span className="text-slate-500 text-xs ml-2">(Optional)</span>}
                        </label>
                        <div className="relative group cursor-pointer">
                            <div className="w-full h-40 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center bg-white/5 group-hover:bg-white/10 group-hover:border-purple-500/50 transition-all overflow-hidden relative">
                                {image ? (
                                    <div className="text-center p-4">
                                        <Upload className="text-purple-400 mx-auto mb-2" />
                                        <p className="text-white font-medium text-sm truncate max-w-[200px]">{image.name}</p>
                                        <p className="text-slate-500 text-xs italic">Click to replace</p>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="text-slate-500 mb-2" size={32} />
                                        <p className="text-slate-400 text-sm font-medium">Click to upload or drag image here</p>
                                    </>
                                )}
                                <input
                                    type="file"
                                    onChange={handleImageChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    required={status === 'found'}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-purple-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Post Report'}
                    </button>
                </form>
            </GlassCard>
        </div>
    );
};

export default AddItem;
