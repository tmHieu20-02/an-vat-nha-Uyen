import { createContext, useContext, useState, useCallback } from 'react';
import { login as apiLogin, register as apiRegister, updateProfile as apiUpdateProfile } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('user')) || null; }
        catch { return null; }
    });
    const [token, setToken] = useState(() => localStorage.getItem('token') || null);

    const login = useCallback(async ({ email, password }) => {
        const res = await apiLogin({ email, password });
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);
        return res.user;
    }, []);

    const register = useCallback(async ({ email, password, full_name, phone }) => {
        const res = await apiRegister({ email, password, full_name, phone });
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);
        return res.user;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    }, []);

    const updateProfile = useCallback(async (data) => {
        await apiUpdateProfile(data);
        const updated = { ...user, ...data };
        localStorage.setItem('user', JSON.stringify(updated));
        setUser(updated);
    }, [user]);

    const isStaff = user?.role === 'staff' || user?.role === 'admin';
    const isAdmin = user?.role === 'admin';
    const isLogged = !!user;

    return (
        <AuthContext.Provider value={{ user, token, isLogged, isStaff, isAdmin, login, register, logout, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
