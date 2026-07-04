import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [adminLoggedIn, setAdminLoggedIn] = useState(() => {
    return sessionStorage.getItem('ctc_admin') === 'true';
  });
  const [subAdminLoggedIn, setSubAdminLoggedIn] = useState(() => {
    return sessionStorage.getItem('ctc_subadmin') === 'true';
  });
  const [developerLoggedIn, setDeveloperLoggedIn] = useState(() => {
    return sessionStorage.getItem('ctc_developer') === 'true';
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

  const loginDeveloper = () => {
    sessionStorage.setItem('ctc_developer', 'true');
    setDeveloperLoggedIn(true);
  };

  const loginParent = (phone) => {
    sessionStorage.setItem('ctc_parent_phone', phone);
    setParentPhone(phone);
  };

  const logout = () => {
    sessionStorage.removeItem('ctc_admin');
    sessionStorage.removeItem('ctc_subadmin');
    sessionStorage.removeItem('ctc_developer');
    sessionStorage.removeItem('ctc_parent_phone');
    setAdminLoggedIn(false);
    setSubAdminLoggedIn(false);
    setDeveloperLoggedIn(false);
    setParentPhone(null);
  };

  return (
    <AuthContext.Provider value={{ adminLoggedIn, subAdminLoggedIn, developerLoggedIn, parentPhone, loginAdmin, loginSubAdmin, loginDeveloper, loginParent, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
