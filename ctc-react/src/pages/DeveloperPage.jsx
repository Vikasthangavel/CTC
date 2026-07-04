import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import Loader from '../components/Loader';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';

export default function DeveloperPage() {
  const { logout } = useAuth();
  const [logs, setLogs] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
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
    fetchData();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon name="terminal" size={28} /> Developer Dashboard
        </h2>
        <button className="btn btn-secondary" onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon name="log-out" size={16} /> Logout
        </button>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="users" size={20} /> Recent Logins
          </h3>
        </div>
        <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Time</th>
                <th>User Type</th>
                <th>Identifier (Phone)</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '24px' }}>No login logs found</td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id}>
                    <td>{log.login_time?.toDate ? log.login_time.toDate().toLocaleString() : 'N/A'}</td>
                    <td>
                      <span className={`badge ${log.user_type === 'Developer' ? 'badge-primary' : 'badge-success'}`}>
                        {log.user_type}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace' }}>{log.identifier}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ background: 'var(--danger-color)', color: 'white', borderRadius: '12px 12px 0 0' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="alert-triangle" size={20} /> Error Logs (Caught by Try/Catch)
          </h3>
        </div>
        <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Time</th>
                <th>Function</th>
                <th>Message</th>
                <th>Arguments</th>
              </tr>
            </thead>
            <tbody>
              {errors.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '24px' }}>No errors logged</td>
                </tr>
              ) : (
                errors.map(err => (
                  <tr key={err.id}>
                    <td>{err.created_at?.toDate ? err.created_at.toDate().toLocaleString() : 'N/A'}</td>
                    <td style={{ fontWeight: 'bold' }}>{err.function_name}</td>
                    <td style={{ color: 'var(--danger-color)', maxWidth: '300px', wordWrap: 'break-word' }}>
                      {err.error_message}
                    </td>
                    <td style={{ fontSize: '0.85rem', fontFamily: 'monospace', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={err.arguments}>
                      {err.arguments}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
