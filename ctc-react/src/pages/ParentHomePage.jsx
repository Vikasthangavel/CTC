import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getStudentByParentPhone, getStudentAttendanceStats,
  getInstructionsForParent, getPunchRecord
} from '../services/firestore';
import Loader from '../components/Loader';
import Icon from '../components/Icon';

export default function ParentHomePage() {
  const { parentPhone } = useAuth();
  const [loading, setLoading] = useState(true);
  const [childrenData, setChildrenData] = useState([]);
  const [instructions, setInstructions] = useState([]);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => { fetchData(); }, [parentPhone]);

  async function fetchData() {
    setLoading(true);
    try {
      const students = await getStudentByParentPhone(parentPhone);
      const data = await Promise.all(students.map(async s => {
        const [stats, punch] = await Promise.all([
          getStudentAttendanceStats(s.id),
          getPunchRecord(s.id, today),
        ]);
        return { student: s, stats, punch };
      }));
      const ids = students.map(s => s.id);
      const grades = students.map(s => s.grade);
      const inst = await getInstructionsForParent(ids, grades);
      setChildrenData(data);
      setInstructions(inst);
    } finally { setLoading(false); }
  }

  function formatDate(val) {
    if (!val) return '';
    if (val?.toDate) return val.toDate().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    return String(val).slice(0, 16);
  }

  if (loading) return <Loader />;

  return (
    <>
      <div className="page-title">
        <div>
          <h2>Home</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* Announcements */}
      {instructions.length > 0 && (
        <div className="card mb-4" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="card-header">
            <Icon name="announce" size={16} /> Announcements
          </div>
          <div className="list-group">
            {instructions.map(inst => (
              <div key={inst.id} className="list-group-item">
                <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{formatDate(inst.created_at)}</small>
                <span style={{ fontSize: '0.9rem' }}>{inst.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No students */}
      {childrenData.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Icon name="user" size={40} style={{ color: 'var(--text-light)', display: 'block', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>No student records found.</p>
          <p style={{ color: 'var(--text-light)', fontSize: '0.82rem' }}>Registered: <strong>{parentPhone}</strong></p>
        </div>
      )}

      {/* Each Child */}
      {childrenData.map(({ student, stats, punch }) => (
        <div key={student.id} className="card mb-4">
          {/* Child Header */}
          <div className="card-header" style={{ background: 'var(--primary-light)' }}>
            <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
              <Icon name="user" size={17} />
              {student.name}
              <span className="badge badge-secondary">Grade {student.grade}</span>
            </h4>
          </div>
          <div className="card-body">

            {/* Today's Punch */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Today's Timing
              </div>
              {punch && punch.punch_in ? (
                <div style={{ display: 'flex', gap: '0', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <div style={{ flex: 1, padding: '12px 14px', background: 'var(--success-bg)', borderRight: '1px solid var(--success-border)' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--success)', fontWeight: 600, marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Icon name="arrowRight" size={11} /> PUNCH IN
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)' }}>{punch.punch_in}</div>
                  </div>
                  <div style={{ flex: 1, padding: '12px 14px', background: punch.punch_out ? 'var(--danger-bg)' : 'var(--surface-2)' }}>
                    <div style={{ fontSize: '0.68rem', color: punch.punch_out ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 600, marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Icon name="arrowLeft" size={11} /> PUNCH OUT
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: punch.punch_out ? 'var(--danger)' : 'var(--text-light)' }}>
                      {punch.punch_out || '—'}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No punch record for today
                </div>
              )}
            </div>

            {/* Attendance Summary */}
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Attendance (Overall)
            </div>
            <div className="row" style={{ gap: '8px' }}>
              {[
                { label: 'Total',   value: stats.total,       color: 'var(--text)' },
                { label: 'Present', value: stats.present,     color: 'var(--success)' },
                { label: 'Rate',    value: `${stats.percentage}%`, color: 'var(--info)' },
              ].map(({ label, value, color }) => (
                <div key={label} className="col stat-card" style={{ flex: 1, padding: '12px 8px' }}>
                  <div className="stat-card__number" style={{ color, fontSize: '1.4rem' }}>{value}</div>
                  <div className="stat-card__label">{label}</div>
                </div>
              ))}
            </div>

          </div>
        </div>
      ))}
    </>
  );
}
