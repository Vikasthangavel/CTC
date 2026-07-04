import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import Loader from '../components/Loader';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { clearLoginLogs, clearDeveloperErrors } from '../services/firestore';

export default function DeveloperPage() {
  const { logout } = useAuth();
  const [logs, setLogs] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [activeTab, setActiveTab] = useState('auth'); // 'auth' | 'exceptions'

  async function fetchData() {
    setLoading(true);
    try {
      const logsQuery = query(collection(db, 'login_logs'), orderBy('login_time', 'desc'), limit(50));
      const logsSnap = await getDocs(logsQuery);
      setLogs(logsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const errorsQuery = query(collection(db, 'developer_errors'), orderBy('created_at', 'desc'), limit(50));
      const errorsSnap = await getDocs(errorsQuery);
      setErrors(errorsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Failed to fetch developer data", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleClearLogins = async () => {
    if (!window.confirm("Are you sure you want to clear all login logs?")) return;
    setClearing(true);
    await clearLoginLogs();
    await fetchData();
    setClearing(false);
  };

  const handleClearErrors = async () => {
    if (!window.confirm("Are you sure you want to clear all error logs?")) return;
    setClearing(true);
    await clearDeveloperErrors();
    await fetchData();
    setClearing(false);
  };

  if (loading && !clearing) return <Loader />;

  return (
    <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', padding: '24px', color: '#f1f5f9', fontFamily: '"Inter", sans-serif' }}>
      {(loading || clearing) && <Loader />}
      
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #1e293b', paddingBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.75rem', fontWeight: '700', color: '#38bdf8' }}>
              <Icon name="terminal" size={32} /> System Console
            </h2>
            <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>Real-time telemetry and error monitoring</p>
          </div>
          <button 
            onClick={logout} 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              background: 'transparent', border: '1px solid #334155', color: '#cbd5e1', 
              padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
              transition: 'all 0.2s', fontWeight: '500'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.color = '#fff'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; }}
          >
            <Icon name="log-out" size={16} /> Logout Session
          </button>
        </header>

        {/* TABS NAVIGATION */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid #1e293b', paddingBottom: '12px' }}>
          <button 
            onClick={() => setActiveTab('auth')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: activeTab === 'auth' ? '#1e293b' : 'transparent',
              border: activeTab === 'auth' ? '1px solid #334155' : '1px solid transparent',
              color: activeTab === 'auth' ? '#38bdf8' : '#94a3b8',
              padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
              fontWeight: '600', transition: 'all 0.2s'
            }}
          >
            <Icon name="users" size={18} /> Authentication Logs
          </button>
          <button 
            onClick={() => setActiveTab('exceptions')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: activeTab === 'exceptions' ? '#1e293b' : 'transparent',
              border: activeTab === 'exceptions' ? '1px solid #334155' : '1px solid transparent',
              color: activeTab === 'exceptions' ? '#fca5a5' : '#94a3b8',
              padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
              fontWeight: '600', transition: 'all 0.2s'
            }}
          >
            <Icon name="alert-triangle" size={18} /> Exception Tracker
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
          
          {/* LOGIN LOGS SECTION */}
          {activeTab === 'auth' && (
            <section style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)', animation: 'fadeIn 0.3s ease-in-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #334155', background: '#0f172a' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', color: '#f8fafc' }}>
                  <Icon name="users" size={20} color="#10b981" /> Authentication Logs
                </h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={fetchData} 
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                  >
                    <Icon name="refresh-cw" size={14} /> Refresh
                  </button>
                  <button 
                    onClick={handleClearLogins} 
                    style={{ background: '#ef444420', border: '1px solid #ef444450', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '4px 10px', borderRadius: '4px', transition: 'all 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#ef444440'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#ef444420'}
                  >
                    <Icon name="trash-2" size={14} /> Clear Logs
                  </button>
                </div>
              </div>
              
              <div style={{ padding: '0', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#1e293b', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <th style={{ padding: '12px 24px', borderBottom: '1px solid #334155' }}>Timestamp</th>
                      <th style={{ padding: '12px 24px', borderBottom: '1px solid #334155' }}>Role</th>
                      <th style={{ padding: '12px 24px', borderBottom: '1px solid #334155' }}>Identifier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>No authentication events recorded.</td>
                      </tr>
                    ) : (
                      logs.map(log => (
                        <tr key={log.id} style={{ borderBottom: '1px solid #334155', transition: 'background 0.2s' }}>
                          <td style={{ padding: '14px 24px', color: '#cbd5e1' }}>
                            {log.login_time?.toDate ? log.login_time.toDate().toLocaleString() : 'N/A'}
                          </td>
                          <td style={{ padding: '14px 24px' }}>
                            <span style={{ 
                              display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600',
                              background: log.user_type === 'Developer' ? '#8b5cf620' : '#10b98120',
                              color: log.user_type === 'Developer' ? '#a78bfa' : '#34d399'
                            }}>
                              {log.user_type}
                            </span>
                          </td>
                          <td style={{ padding: '14px 24px', fontFamily: '"Fira Code", monospace', color: '#f8fafc' }}>
                            {log.identifier}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ERROR LOGS SECTION */}
          {activeTab === 'exceptions' && (
            <section style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)', animation: 'fadeIn 0.3s ease-in-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #334155', background: '#450a0a20' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', color: '#fca5a5' }}>
                  <Icon name="alert-triangle" size={20} /> Exception Tracker
                </h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={fetchData} 
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                  >
                    <Icon name="refresh-cw" size={14} /> Refresh
                  </button>
                  <button 
                    onClick={handleClearErrors} 
                    style={{ background: '#ef444420', border: '1px solid #ef444450', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '4px 10px', borderRadius: '4px', transition: 'all 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#ef444440'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#ef444420'}
                  >
                    <Icon name="trash-2" size={14} /> Clear Exceptions
                  </button>
                </div>
              </div>
              
              <div style={{ padding: '0', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#1e293b', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <th style={{ padding: '12px 24px', borderBottom: '1px solid #334155', width: '20%' }}>Time</th>
                      <th style={{ padding: '12px 24px', borderBottom: '1px solid #334155', width: '20%' }}>Function</th>
                      <th style={{ padding: '12px 24px', borderBottom: '1px solid #334155', width: '40%' }}>Message</th>
                      <th style={{ padding: '12px 24px', borderBottom: '1px solid #334155', width: '20%' }}>Payload</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errors.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>All systems operational. No exceptions found.</td>
                      </tr>
                    ) : (
                      errors.map(err => (
                        <tr key={err.id} style={{ borderBottom: '1px solid #334155', transition: 'background 0.2s' }}>
                          <td style={{ padding: '14px 24px', color: '#cbd5e1' }}>
                            {err.created_at?.toDate ? err.created_at.toDate().toLocaleString() : 'N/A'}
                          </td>
                          <td style={{ padding: '14px 24px', fontWeight: '600', color: '#38bdf8' }}>
                            {err.function_name}
                          </td>
                          <td style={{ padding: '14px 24px', color: '#fca5a5', maxWidth: '300px', wordWrap: 'break-word', lineHeight: '1.4' }}>
                            {err.error_message}
                          </td>
                          <td style={{ padding: '14px 24px' }}>
                            <div style={{ 
                              background: '#0f172a', padding: '8px', borderRadius: '6px', 
                              fontSize: '0.8rem', fontFamily: '"Fira Code", monospace', color: '#94a3b8',
                              maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                            }} title={err.arguments}>
                              {err.arguments}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
