import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [adminLoggedIn, setAdminLoggedIn] = useState(() => {
    return sessionStorage.getItem('ctc_admin') === 'true';
  });
  const [subAdminLoggedIn, setSubAdminLoggedIn] = useState(() => {
    return sessionStorage.getItem('ctc_subadmin') === 'true';
  });
  const [parentPhone, setParentPhone] = useState(() => {
    return sessionStorage.getItem('ctc_parent_phone') || null;
  });

  const loginAdmin = () => {
    sessionStorage.setItem('ctc_admin', 'true');
    setAdminLoggedIn(true);
  };

  const loginSubAdmin = () => {
    sessionStorage.setItem('ctc_subadmin', 'true');
    setSubAdminLoggedIn(true);
  };

  const loginParent = (phone) => {
    sessionStorage.setItem('ctc_parent_phone', phone);
    setParentPhone(phone);
  };

  const logout = () => {
    sessionStorage.removeItem('ctc_admin');
    sessionStorage.removeItem('ctc_subadmin');
    sessionStorage.removeItem('ctc_parent_phone');
    setAdminLoggedIn(false);
    setSubAdminLoggedIn(false);
    setParentPhone(null);
  };

  return (
    <AuthContext.Provider value={{ adminLoggedIn, subAdminLoggedIn, parentPhone, loginAdmin, loginSubAdmin, loginParent, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
