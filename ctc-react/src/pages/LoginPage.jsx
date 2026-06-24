import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStudentByParentPhone } from '../services/firestore';
import Loader from '../components/Loader';
import Icon from '../components/Icon';

const ADMIN_PHONE = '9524439288';

function getAdminPass() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return dd + mm;
}

export default function LoginPage() {
  const { loginAdmin, loginParent } = useAuth();
  const navigate = useNavigate();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [adminMode, setAdminMode] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (phone === ADMIN_PHONE) {
        if (!adminMode) {
          setAdminMode(true);
        } else {
          if (password === getAdminPass()) {
            loginAdmin();
            navigate('/dashboard');
          } else {
            setError('Invalid Admin Password');
          }
        }
      } else {
        const students = await getStudentByParentPhone(phone);
        if (students.length > 0) {
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
            <div className="card-header" style={{ textAlign: 'center', padding: '24px', borderRadius: '12px 12px 0 0' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                <img src="/logo.png" alt="CTC Logo" style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'contain', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} />
              </div>
              <h4 style={{ margin: 0 }}>Welcome Back</h4>
              <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: '0.85rem' }}>
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
                    value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="Enter your mobile number"
                    required readOnly={adminMode}
                  />
                </div>

                {adminMode && (
                  <div className="form-group">
                    <label className="form-label">Admin Password</label>
                    <input
                      type="password" className="form-control form-control-lg"
                      value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Enter admin PIN"
                      required autoFocus
                    />
                  </div>
                )}

                <button type="submit" className="btn btn-primary btn-block btn-lg" style={{ marginTop: '8px', gap: '8px' }}>
                  {adminMode ? <><Icon name="check" size={16} /> Login as Admin</> : 'Continue'}
                </button>

                {adminMode && (
                  <div style={{ textAlign: 'center', marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={() => { setAdminMode(false); setPhone(''); setPassword(''); setError(''); }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.82rem' }}
                    >
                      ← Not Admin? Go back
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
