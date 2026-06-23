import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
    { to: '/dashboard',  icon: '🏠', label: 'Home' },
    { to: '/students',   icon: '👥', label: 'Students' },
    { to: '/attendance', icon: '📅', label: 'Attendance' },
    { to: '/fees',       icon: '💰', label: 'Fees' },
    { to: '/reports',    icon: '💬', label: 'Reports' },
  ];

  return (
    <>
      {/* ===== DESKTOP SIDEBAR ===== */}
      {adminLoggedIn && (
        <nav className="sidebar-nav">
          <Link className="sidebar-nav__brand" to="/dashboard">
            ⚡ Challengers TC
          </Link>

          <div className="sidebar-nav__menu">
            <div className="sidebar-nav__label">Navigation</div>
            {adminLinks.map(({ to, icon, label }) => (
              <Link
                key={to}
                className={`sidebar-nav__item ${isActive(to) ? 'active' : ''}`}
                to={to}
              >
                <span className="icon">{icon}</span>
                {label}
              </Link>
            ))}
          </div>

          <div className="sidebar-nav__footer">
            <button className="sidebar-nav__item top-nav__logout" style={{ width: '100%' }} onClick={handleLogout}>
              <span className="icon">⎋</span>
              Logout
            </button>
          </div>
        </nav>
      )}

      {/* ===== TOP NAV ===== */}
      <nav className="top-nav">
        {/* Brand shown only on mobile (desktop shows in sidebar) */}
        <Link className="top-nav__brand" to={adminLoggedIn ? '/dashboard' : parentPhone ? '/parent' : '/login'}>
          ⚡ Challengers TC
        </Link>
        {(adminLoggedIn || parentPhone) && (
          <button className="top-nav__logout" onClick={handleLogout}>
            ⎋ Logout
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
                <span className="icon">{icon}</span>
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
