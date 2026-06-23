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

  return (
    <>
      {/* Top Nav */}
      <nav className="top-nav">
        <Link className="top-nav__brand" to={adminLoggedIn ? '/dashboard' : parentPhone ? '/parent' : '/login'}>
          ⚡ Challengers TC
        </Link>
        {(adminLoggedIn || parentPhone) && (
          <button className="top-nav__logout" onClick={handleLogout}>
            ⎋ Logout
          </button>
        )}
      </nav>

      {/* Bottom Nav — Admin only */}
      {adminLoggedIn && (
        <nav className="bottom-nav">
          <div className="bottom-nav__inner">
            <Link className={`bottom-nav__item ${isActive('/dashboard') ? 'active' : ''}`} to="/dashboard">
              <span className="icon">🏠</span>
              <span>Home</span>
            </Link>
            <Link className={`bottom-nav__item ${isActive('/students') ? 'active' : ''}`} to="/students">
              <span className="icon">👥</span>
              <span>Students</span>
            </Link>
            <Link className={`bottom-nav__item ${isActive('/attendance') ? 'active' : ''}`} to="/attendance">
              <span className="icon">📅</span>
              <span>Attend</span>
            </Link>
            <Link className={`bottom-nav__item ${isActive('/fees') ? 'active' : ''}`} to="/fees">
              <span className="icon">💰</span>
              <span>Fees</span>
            </Link>
          </div>
        </nav>
      )}

      <div className="page-wrapper">
        <div className="container">
          {children}
        </div>

        <footer className="footer">
          <div style={{ fontSize: '0.72rem', color: 'rgba(0,243,255,0.4)', fontFamily: 'monospace', letterSpacing: '3px', marginBottom: '4px' }}>
            // SYSTEM.CREDITS
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Powered by{' '}
            <a href="https://www.time2orders.com" style={{ color: 'var(--cyan)' }}>time2innovate</a>
            {' '}&nbsp;|&nbsp;{' '}
            Engineered by{' '}
            <a href="https://vikast.me" style={{ background: 'linear-gradient(90deg, #00f3ff, #ff6b00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Vikas</a>
          </div>
          <div className="footer__bar" />
        </footer>
      </div>
    </>
  );
}
