import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);
const VALID_ROLES = ['user', 'staff', 'admin'];
const hasValidRole = (candidate) => candidate && VALID_ROLES.includes(candidate.role);
const clearStoredAuth = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { const parsed = JSON.parse(localStorage.getItem('user')); return hasValidRole(parsed) ? parsed : null; } catch { clearStoredAuth(); return null; }
  });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return setLoading(false);
    api.get('/auth/me').then((res) => { setUser(res.data.user); localStorage.setItem('user', JSON.stringify(res.data.user)); }).catch(() => { clearStoredAuth(); setUser(null); }).finally(() => setLoading(false));
  }, []);
  const beginLogin = async (email, password, expectedRole) => {
    const res = await api.post('/auth/login', { email, password });
    if (expectedRole && res.data.challenge.role !== expectedRole) throw new Error(`Please use the ${expectedRole === 'user' ? 'student' : expectedRole} login page for this account.`);
    sessionStorage.setItem('otpEmail', res.data.challenge.email);
    return res.data.challenge;
  };
  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    sessionStorage.setItem('otpEmail', res.data.challenge.email);
    return res.data.challenge;
  };
  const verifyOtp = async (email, otp) => {
    const res = await api.post('/auth/otp/verify', { email, otp });
    localStorage.setItem('token', res.data.token); localStorage.setItem('user', JSON.stringify(res.data.user)); sessionStorage.removeItem('otpEmail'); setUser(res.data.user);
    return res.data.user;
  };
  const logout = () => { clearStoredAuth(); sessionStorage.removeItem('otpEmail'); setUser(null); };
  return <AuthContext.Provider value={{ user, setUser, beginLogin, register, verifyOtp, logout, loading }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
