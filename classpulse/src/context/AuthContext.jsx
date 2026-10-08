import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────
//  AuthContext
//  Stores the JWT token and user info.
//  All screens use useAuth() to access auth state.
// ─────────────────────────────────────────

const AuthContext = createContext(null);

const STORAGE_KEYS = {
  TOKEN:    'cp_token',
  USER:     'cp_user',
  TYPE:     'cp_user_type',   // 'tuition_admin' | 'parent'
};

export function AuthProvider({ children }) {
  const [token,    setToken]    = useState(null);
  const [user,     setUser]     = useState(null);   // tuition object or null
  const [userType, setUserType] = useState(null);   // 'tuition_admin' | 'parent'
  const [loading,  setLoading]  = useState(true);   // reading from storage

  // Load saved session on app start
  useEffect(() => {
    loadSession();
  }, []);

  async function loadSession() {
    try {
      const [savedToken, savedUser, savedType] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem(STORAGE_KEYS.TYPE),
      ]);
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        setUserType(savedType);
      }
    } catch (e) {
      console.log('Session load error:', e);
    } finally {
      setLoading(false);
    }
  }

  // Called after successful tuition admin login / signup
  async function loginTuitionAdmin(tokenValue, tuitionData) {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.TOKEN, tokenValue),
      AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(tuitionData)),
      AsyncStorage.setItem(STORAGE_KEYS.TYPE, 'tuition_admin'),
    ]);
    setToken(tokenValue);
    setUser(tuitionData);
    setUserType('tuition_admin');
  }

  // Called after successful parent login
  async function loginParent(tokenValue, parentData) {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.TOKEN, tokenValue),
      AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(parentData)),
      AsyncStorage.setItem(STORAGE_KEYS.TYPE, 'parent'),
    ]);
    setToken(tokenValue);
    setUser(parentData);
    setUserType('parent');
  }

  // Logout — clear everything
  async function logout() {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.USER),
      AsyncStorage.removeItem(STORAGE_KEYS.TYPE),
    ]);
    setToken(null);
    setUser(null);
    setUserType(null);
  }

  return (
    <AuthContext.Provider value={{
      token,
      user,
      userType,
      loading,
      isLoggedIn:      !!token,
      isTuitionAdmin:  userType === 'tuition_admin',
      isParent:        userType === 'parent',
      loginTuitionAdmin,
      loginParent,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
