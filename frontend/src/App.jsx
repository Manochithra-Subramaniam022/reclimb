import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AddItem from './pages/AddItem';
import ItemDetails from './pages/ItemDetails';
import Inbox from './pages/Inbox';
import Chat from './pages/Chat';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 text-slate-500 font-black uppercase tracking-widest text-xs">
      Syncing Campus Network...
    </div>
  );
  return user ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  return (
    <div className="min-h-screen bg-dark-900 selection:bg-purple-500/30">
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/inbox" element={<PrivateRoute><Inbox /></PrivateRoute>} />
        <Route path="/add/:status" element={<PrivateRoute><AddItem /></PrivateRoute>} />
        <Route path="/item/:id" element={<PrivateRoute><ItemDetails /></PrivateRoute>} />
        <Route path="/chat/:id" element={<PrivateRoute><Chat /></PrivateRoute>} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
