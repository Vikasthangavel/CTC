import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStudent, getActivitiesByMonth } from '../services/firestore';
import Loader from '../components/Loader';
import Icon from '../components/Icon';

export default function ParentActivityReportPage() {
  const { studentId } = useParams();
  const { parentPhone } = useAuth();
  const navigate = useNavigate();
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [student, setStudent] = useState(null);
  const [activities, setActivities] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => { fetchData(); }, [studentId, selectedMonth]);

  async function fetchData() {
    setLoading(true);
    try {
      const s = await getStudent(studentId);
      // Normalize for comparison (strip spaces, country code)
      const norm = (p) => String(p || '').replace(/[\s\-\.]/g, '').replace(/^(\+91|0091)/, '').replace(/^0(\d{10})$/, '$1');
      if (!s || norm(s.parent_contact) !== norm(parentPhone)) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }
      const acts = await getActivitiesByMonth(studentId, selectedMonth);
      setStudent(s);
      setActivities(acts);
    } finally { setLoading(false); }
  }

  function formatDate(val) {
    if (!val) return '';
    if (val?.toDate) return val.toDate().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    return String(val).slice(0, 16);
  }

  if (loading) return <Loader />;

  if (accessDenied) return (
    <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
      <Icon name="close" size={36} style={{ color: 'var(--danger)', display: 'block', margin: '0 auto 12px', opacity: 0.6 }} />
      <h4>Access Denied</h4>
      <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>You don't have permission to view this report.</p>
      <button className="btn btn-secondary" onClick={() => navigate('/parent')} style={{ gap: '4px' }}><Icon name="arrowLeft" size={14} /> Go Back</button>
    </div>
  );

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/parent')} style={{ gap: '4px' }}><Icon name="arrowLeft" size={14} /> Back</button>
        <h2 style={{ margin: 0 }}>Activity Report: {student?.name}</h2>
      </div>

      <div className="form-group" style={{ maxWidth: '200px', marginBottom: '20px' }}>
        <label className="form-label">Select Month</label>
        <input type="month" className="form-control" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />
      </div>

      <div style={{ fontWeight: 600, marginBottom: '12px', color: 'var(--cyan)' }}>
        {new Date(selectedMonth + '-01').toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
      </div>

      {activities.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          <Icon name="book" size={36} style={{ opacity: 0.3, display: 'block', margin: '0 auto 8px' }} />
          No activities logged for this month.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {activities.map(act => (
            <div key={act.id} className="card">
              <div className="card-body" style={{ padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <span className="text-info fw-bold" style={{ fontSize: '0.85rem' }}>{act.activity_date}</span>
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{formatDate(act.created_at)}</small>
                </div>
                <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: '1.5' }}>{act.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
