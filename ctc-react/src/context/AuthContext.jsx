import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const EXPIRATION_TIME = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

const checkAndClearStorage = () => {
  const loginTime = localStorage.getItem('ctc_login_time');
  if (loginTime) {
    if (new Date().getTime() - parseInt(loginTime, 10) > EXPIRATION_TIME) {
      localStorage.removeItem('ctc_admin');
      localStorage.removeItem('ctc_subadmin');
      localStorage.removeItem('ctc_developer');
      localStorage.removeItem('ctc_parent_phone');
      localStorage.removeItem('ctc_login_time');
      return true; // Cleared
    }
  }
  return false; // Not cleared
};

export function AuthProvider({ children }) {
  const [adminLoggedIn, setAdminLoggedIn] = useState(() => {
    checkAndClearStorage();
    return localStorage.getItem('ctc_admin') === 'true';
  });
  const [subAdminLoggedIn, setSubAdminLoggedIn] = useState(() => {
    return localStorage.getItem('ctc_subadmin') === 'true';
  });
  const [developerLoggedIn, setDeveloperLoggedIn] = useState(() => {
    return localStorage.getItem('ctc_developer') === 'true';
  });
  const [parentPhone, setParentPhone] = useState(() => {
    return localStorage.getItem('ctc_parent_phone') || null;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (checkAndClearStorage()) {
        setAdminLoggedIn(false);
        setSubAdminLoggedIn(false);
        setDeveloperLoggedIn(false);
        setParentPhone(null);
      }
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const loginAdmin = () => {
    localStorage.setItem('ctc_admin', 'true');
    localStorage.setItem('ctc_login_time', new Date().getTime().toString());
    setAdminLoggedIn(true);
  };

  const loginSubAdmin = () => {
    localStorage.setItem('ctc_subadmin', 'true');
    localStorage.setItem('ctc_login_time', new Date().getTime().toString());
    setSubAdminLoggedIn(true);
  };

  const loginDeveloper = () => {
    localStorage.setItem('ctc_developer', 'true');
    localStorage.setItem('ctc_login_time', new Date().getTime().toString());
    setDeveloperLoggedIn(true);
  };

  const loginParent = (phone) => {
    localStorage.setItem('ctc_parent_phone', phone);
    localStorage.setItem('ctc_login_time', new Date().getTime().toString());
    setParentPhone(phone);
  };

  const logout = () => {
    localStorage.removeItem('ctc_admin');
    localStorage.removeItem('ctc_subadmin');
    localStorage.removeItem('ctc_developer');
    localStorage.removeItem('ctc_parent_phone');
    localStorage.removeItem('ctc_login_time');
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
