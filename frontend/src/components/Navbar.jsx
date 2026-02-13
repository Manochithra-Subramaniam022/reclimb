import { useAuth } from '../context/AuthContext';
import { LogOut, User, LayoutDashboard, Inbox, PlusCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();

    if (!user) return null;

    const navLinks = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { name: 'Inbox', icon: Inbox, path: '/inbox' },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 h-16 glass z-50 px-6 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-8">
                <Link to="/dashboard" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
                    Reclaim
                </Link>
                <div className="hidden md:flex items-center gap-6">
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-purple-400 ${location.pathname === link.path ? 'text-purple-400' : 'text-slate-400'
                                }`}
                        >
                            <link.icon size={18} />
                            {link.name}
                        </Link>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Link to="/add/lost" className="px-4 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-xs font-semibold border border-white/5 transition-all">
                        Report Lost
                    </Link>
                    <Link to="/add/found" className="px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-xs font-semibold shadow-lg shadow-purple-500/20 transition-all">
                        Report Found
                    </Link>
                </div>

                <div className="h-8 w-px bg-white/10 mx-2" />

                <div className="relative group">
                    <button className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/5 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-xs font-bold ring-2 ring-white/10">
                            {user.user_name?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-slate-300 hidden sm:block">{user.user_name}</span>
                    </button>

                    <div className="absolute right-0 top-full mt-2 w-48 glass rounded-2xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-2xl scale-95 group-hover:scale-100 origin-top-right">
                        <button
                            onClick={logout}
                            className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-red-500/10 text-red-400 text-sm transition-colors"
                        >
                            <LogOut size={16} />
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
