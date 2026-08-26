import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStudentByParentPhone, logUserLogin } from '../services/firestore';
import Loader from '../components/Loader';
import Icon from '../components/Icon';

const ADMIN_PHONE = '9524439288';
const SUBADMIN_PHONE = '9688888378';

function getAdminPass() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return dd + mm;
}

function getSubAdminPass() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);
  return mm + yy;
}

export default function LoginPage() {
  const { loginAdmin, loginSubAdmin, loginParent, loginDeveloper } = useAuth();
  const navigate = useNavigate();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [adminMode, setAdminMode] = useState(null); // 'admin' | 'subadmin' | 'developer' | null
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (phone.length !== 10) {
      setError('Phone number must be exactly 10 digits.');
      return;
    }

    setLoading(true);

    try {
      if (phone === '6381459911') {
        if (!adminMode) {
          setAdminMode('developer');
        } else {
          if (password === '5599') {
            await logUserLogin('Developer', phone);
            loginDeveloper();
            navigate('/developer');
          } else {
            setError('Invalid Developer Password');
          }
        }
      } else if (phone === ADMIN_PHONE) {
        if (!adminMode) {
          setAdminMode('admin');
        } else {
          if (password === getAdminPass()) {
            await logUserLogin('Admin', phone);
            loginAdmin();
            navigate('/dashboard');
          } else {
            setError('Invalid Admin Password');
          }
        }
      } else if (phone === SUBADMIN_PHONE) {
        if (!adminMode) {
          setAdminMode('subadmin');
        } else {
          if (password === getSubAdminPass()) {
            await logUserLogin('SubAdmin', phone);
            loginSubAdmin();
            navigate('/dashboard');
          } else {
            setError('Invalid Sub Admin Password');
          }
        }
      } else {
        const students = await getStudentByParentPhone(phone);
        if (students.length > 0) {
          await logUserLogin('Parent', phone);
          loginParent(phone);
          navigate('/parent');
        } else {
          setError('Phone number not registered with any student.');
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <Loader />}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div className="card">
            <div className="card-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '32px 24px 24px', borderRadius: '12px 12px 0 0', gap: '8px' }}>
              <img src="/logo.png" alt="CTC Logo" style={{ width: '80px', height: '80px', borderRadius: '16px', objectFit: 'contain', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', marginBottom: '4px' }} />
              <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>Welcome Back</h4>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>
                Please enter your registered details
              </p>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger">{error}</div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel" className="form-control form-control-lg"
                    value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Enter your mobile number"
                    maxLength={10}
                    pattern="[0-9]{10}"
                    title="Phone number must be exactly 10 digits"
                    required readOnly={adminMode}
                  />
                </div>

                {adminMode && (
                  <div className="form-group">
                    <label className="form-label">{adminMode === 'admin' ? 'Admin Password' : 'Sub Admin Password'}</label>
                    <input
                      type="password" className="form-control form-control-lg"
                      value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Enter PIN"
                      required autoFocus
                    />
                  </div>
                )}

                <button type="submit" className="btn btn-primary btn-block btn-lg" style={{ marginTop: '8px', gap: '8px' }}>
                  {adminMode ? <><Icon name="check" size={16} /> Login as {adminMode === 'admin' ? 'Admin' : 'Sub Admin'}</> : 'Continue'}
                </button>

                {adminMode && (
                  <div style={{ textAlign: 'center', marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={() => { setAdminMode(null); setPhone(''); setPassword(''); setError(''); }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.82rem' }}
                    >
                      ← Not {adminMode === 'admin' ? 'Admin' : 'Sub Admin'}? Go back
                    </button>
                  </div>
                )}
              </form>

              <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color, #e5e7eb)', textAlign: 'center' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: 'var(--text-muted, #64748b)', fontWeight: '500' }}>
                  Download this app to order on Challengers Stationery
                </p>
                <a
                  href="https://play.google.com/store/apps/details?id=com.time2order.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    backgroundColor: '#01875f',
                    color: '#ffffff',
                    fontWeight: '600',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    boxShadow: '0 2px 6px rgba(1, 135, 95, 0.25)',
                    transition: 'opacity 0.2s'
                  }}
                >
                  <Icon name="playstore" size={20} />
                  Get it on Google Play
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
