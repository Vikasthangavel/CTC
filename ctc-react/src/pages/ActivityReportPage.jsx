import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStudent, getActivitiesByMonth, deleteActivity } from '../services/firestore';
import Loader from '../components/Loader';
import { useToast } from '../components/Toast';

export default function ActivityReportPage() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [student, setStudent] = useState(null);
  const [activities, setActivities] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [studentId, selectedMonth]);

  async function fetchData() {
    setLoading(true);
    try {
      const [s, acts] = await Promise.all([
        getStudent(studentId),
        getActivitiesByMonth(studentId, selectedMonth)
      ]);
      setStudent(s);
      setActivities(acts);
    } finally { setLoading(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this activity?')) return;
    await deleteActivity(id);
    showToast('Activity deleted', 'success');
    fetchData();
  }

  function formatDate(val) {
    if (!val) return '';
    if (val?.toDate) return val.toDate().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    return String(val).slice(0, 16);
  }

  if (loading) return <Loader />;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/students')}>← Back</button>
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
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📔</div>
          No activities logged for this month.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {activities.map(act => (
            <div key={act.id} className="card">
              <div className="card-body" style={{ padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <div>
                    <span className="text-info fw-bold" style={{ fontSize: '0.85rem' }}>{act.activity_date}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '10px' }}>{formatDate(act.created_at)}</span>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(act.id)}>🗑</button>
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
