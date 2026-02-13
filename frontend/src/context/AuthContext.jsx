import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkAuth = async () => {
        try {
            const response = await api.get('/api/me');
            if (response.data.success) {
                setUser(response.data.data);
            }
        } catch (err) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = async (email, password) => {
        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);

        const response = await api.post('/login', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.status === 200 && response.data.success) {
            setUser(response.data.data);
            return true;
        }
        return false;
    };

    const logout = async () => {
        await api.get('/logout');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
