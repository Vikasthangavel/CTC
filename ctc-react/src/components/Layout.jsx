import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from './Icon';

export default function Layout({ children }) {
  const { adminLoggedIn, parentPhone, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const adminLinks = [
    { to: '/dashboard',  icon: 'home',     label: 'Home' },
    { to: '/students',   icon: 'students', label: 'Students' },
    { to: '/attendance', icon: 'attend',   label: 'Attendance' },
    { to: '/fees',       icon: 'fees',     label: 'Fees' },
    { to: '/reports',    icon: 'reports',  label: 'Reports' },
  ];

  return (
    <>
      {/* ===== DESKTOP SIDEBAR ===== */}
      {adminLoggedIn && (
        <nav className="sidebar-nav">
          <Link className="sidebar-nav__brand" to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/logo.png" alt="CTC Logo" style={{ width: '22px', height: '22px', borderRadius: '4px', objectFit: 'contain' }} />
            Challengers TC
          </Link>

          <div className="sidebar-nav__menu">
            <div className="sidebar-nav__label">Navigation</div>
            {adminLinks.map(({ to, icon, label }) => (
              <Link
                key={to}
                className={`sidebar-nav__item ${isActive(to) ? 'active' : ''}`}
                to={to}
              >
                <Icon name={icon} size={17} className="icon" />
                {label}
              </Link>
            ))}
          </div>

          <div className="sidebar-nav__footer">
            <button className="sidebar-nav__item" style={{ width: '100%', color: 'var(--danger)' }} onClick={handleLogout}>
              <Icon name="logout" size={17} className="icon" />
              Logout
            </button>
          </div>
        </nav>
      )}

      {/* ===== TOP NAV ===== */}
      <nav className="top-nav">
        <Link className="top-nav__brand" to={adminLoggedIn ? '/dashboard' : parentPhone ? '/parent' : '/login'} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/logo.png" alt="CTC Logo" style={{ width: '20px', height: '20px', borderRadius: '4px', objectFit: 'contain' }} />
          Challengers TC
        </Link>
        {(adminLoggedIn || parentPhone) && (
          <button className="top-nav__logout" onClick={handleLogout}>
            <Icon name="logout" size={14} />
            Logout
          </button>
        )}
      </nav>

      {/* ===== MOBILE BOTTOM NAV (admin only) ===== */}
      {adminLoggedIn && (
        <nav className="bottom-nav">
          <div className="bottom-nav__inner">
            {adminLinks.map(({ to, icon, label }) => (
              <Link
                key={to}
                className={`bottom-nav__item ${isActive(to) ? 'active' : ''}`}
                to={to}
              >
                <Icon name={icon} size={20} className="icon" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </nav>
      )}

      {/* ===== PARENT BOTTOM NAV ===== */}
      {parentPhone && (
        <nav className="bottom-nav">
          <div className="bottom-nav__inner">
            {[
              { to: '/parent',          icon: 'home',     label: 'Home',     exact: true },
              { to: '/parent/activity', icon: 'book',     label: 'Activity' },
              { to: '/parent/fees',     icon: 'wallet',   label: 'Fees' },
              { to: '/parent/report',   icon: 'reports',  label: 'Report' },
            ].map(({ to, icon, label, exact }) => (
              <Link
                key={to}
                className={`bottom-nav__item ${exact ? location.pathname === to : location.pathname.startsWith(to) ? 'active' : ''}`}
                to={to}
              >
                <Icon name={icon} size={20} className="icon" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </nav>
      )}

      <div className="page-wrapper">
        <div className="container">
          {children}
        </div>

        <footer className="footer">
          <div style={{ fontSize: '0.72rem', color: 'rgba(37,99,235,0.3)', fontFamily: 'monospace', letterSpacing: '3px', marginBottom: '4px' }}>
            // SYSTEM.CREDITS
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Powered by{' '}
            <a href="https://www.time2orders.com" style={{ color: 'var(--primary)' }}>time2innovate</a>
            {' '}&nbsp;|&nbsp;{' '}
            Engineered by{' '}
            <a href="https://vikast.me" style={{ background: 'linear-gradient(90deg, #2563eb, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Vikas</a>
          </div>
          <div className="footer__bar" />
        </footer>
      </div>
    </>
  );
}
