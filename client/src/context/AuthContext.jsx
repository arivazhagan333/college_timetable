import { API_BASE } from '../utils/api';
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async (savedToken, savedUser) => {
      try {
        const res = await fetch(`${API_BASE}/api/faculty`, {
          headers: { 'Authorization': `Bearer ${savedToken}` }
        });
        if (res.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        } else {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch (err) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } finally {
        setLoading(false);
      }
    };

    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      verifyToken(savedToken, savedUser);
    } else {
      setLoading(false);
    }
  }, []);

  const loginAdmin = async (email, password) => {
    const res = await fetch(`${API_BASE}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed.');
    
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const sendOTP = async (phone) => {
    const res = await fetch(`${API_BASE}/api/auth/staff/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error sending OTP.');
    return data; // Returns { message, otp, phone }
  };

  const verifyOTP = async (phone, otp) => {
    const res = await fetch(`${API_BASE}/api/auth/staff/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'OTP verification failed.');

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const promoteStaff = async (facultyId) => {
    const res = await fetch(`${API_BASE}/api/faculty/${facultyId}/promote`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Promotion failed.');
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, loginAdmin, sendOTP, verifyOTP, logout, promoteStaff }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
