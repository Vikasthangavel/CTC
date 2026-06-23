import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getStudentByParentPhone, getActivitiesByMonth } from '../services/firestore';
import Loader from '../components/Loader';
import Icon from '../components/Icon';

export default function ParentActivityPage() {
  const { parentPhone } = useAuth();
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [activities, setActivities] = useState([]);
  const [actLoading, setActLoading] = useState(false);

  useEffect(() => { loadStudents(); }, [parentPhone]);
  useEffect(() => { if (selectedId) loadActivities(); }, [selectedId, selectedMonth]);

  async function loadStudents() {
    setLoading(true);
    try {
      const s = await getStudentByParentPhone(parentPhone);
      setStudents(s);
      if (s.length > 0) setSelectedId(s[0].id);
    } finally { setLoading(false); }
  }

  async function loadActivities() {
    setActLoading(true);
    try {
      const acts = await getActivitiesByMonth(selectedId, selectedMonth);
      setActivities(acts);
    } finally { setActLoading(false); }
  }

  const selectedStudent = students.find(s => s.id === selectedId);

  if (loading) return <Loader />;

  return (
    <>
      <div className="page-title">
        <div>
          <h2>Activity</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>Daily activity &amp; homework</p>
        </div>
      </div>

      {students.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          No student records found.
        </div>
      )}

      {students.length > 0 && (
        <>
          {/* Selectors */}
          <div className="row mb-4" style={{ gap: '12px' }}>
            {students.length > 1 && (
              <div className="col">
                <label className="form-label">Child</label>
                <select className="form-select" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} (Grade {s.grade})</option>)}
                </select>
              </div>
            )}
            <div className="col">
              <label className="form-label">Month</label>
              <input type="month" className="form-control" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />
            </div>
          </div>

          {/* Student badge */}
          {selectedStudent && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span className="fw-bold">{selectedStudent.name}</span>
              <span className="badge badge-secondary">Grade {selectedStudent.grade}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                — {new Date(selectedMonth + '-01').toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          )}

          {/* Activity list */}
          {actLoading ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Loading...</div>
          ) : activities.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <Icon name="book" size={36} style={{ opacity: 0.3, display: 'block', margin: '0 auto 8px' }} />
              No activities logged for this month.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activities.map(act => (
                <div key={act.id} className="card">
                  <div className="card-body" style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
                      <span className="text-primary fw-bold" style={{ fontSize: '0.85rem' }}>{act.activity_date}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.6' }}>{act.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
