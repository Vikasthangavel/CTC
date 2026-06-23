import { useState, useEffect } from 'react';
import { getAllParentReports, getStudents } from '../services/firestore';
import Loader from '../components/Loader';
import { useNavigate } from 'react-router-dom';

export default function AllReportsPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [students, setStudents] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [reps, studs] = await Promise.all([getAllParentReports(), getStudents(false)]);
      const smap = {};
      studs.forEach(s => { smap[s.id] = s; });
      setStudents(smap);
      // Attach student info to reports
      setReports(reps.map(r => ({ ...r, student: smap[r.student_id] })));
      setLoading(false);
    }
    load();
  }, []);

  function formatDate(val) {
    if (!val) return '';
    if (val?.toDate) return val.toDate().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    return String(val).slice(0, 16);
  }

  if (loading) return <Loader />;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/dashboard')}>← Back</button>
        <h2 style={{ margin: 0 }}>All Parent Reports</h2>
      </div>

      <div className="card">
        <div className="list-group">
          {reports.length === 0 && (
            <div className="list-group-item text-center text-muted" style={{ padding: '40px' }}>
              <div style={{ fontSize: '2.5rem', opacity: 0.3, marginBottom: '8px' }}>📥</div>
              No reports received yet.
            </div>
          )}
          {reports.map(r => (
            <div key={r.id} className="list-group-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div>
                  <span className="fw-bold text-warning">{r.student?.name || 'Unknown Student'}</span>
                  {r.student?.grade && <span className="badge badge-secondary" style={{ marginLeft: '8px' }}>Grade {r.student.grade}</span>}
                </div>
                <small style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{formatDate(r.report_date)}</small>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.75, whiteSpace: 'pre-wrap' }}>{r.message}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
