import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getStudentByParentPhone, getStudentAttendanceStats,
  getStudentFees, getRecentActivities, getInstructionsForParent, submitParentReport
} from '../services/firestore';
import Loader from '../components/Loader';
import { useToast } from '../components/Toast';

export default function ParentDashboardPage() {
  const { parentPhone, logout } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [childrenData, setChildrenData] = useState([]);
  const [instructions, setInstructions] = useState([]);
  const [reportMessages, setReportMessages] = useState({});
  const [submitting, setSubmitting] = useState(null);

  useEffect(() => { fetchData(); }, [parentPhone]);

  async function fetchData() {
    setLoading(true);
    try {
      const students = await getStudentByParentPhone(parentPhone);

      const childData = await Promise.all(students.map(async s => {
        const [stats, fees, activities] = await Promise.all([
          getStudentAttendanceStats(s.id),
          getStudentFees(s.id),
          getRecentActivities(s.id, 2),
        ]);
        return { student: s, attendance_stats: stats, fees: fees.slice(0, 5), activities };
      }));

      const studentIds = students.map(s => s.id);
      const grades = students.map(s => s.grade);
      const inst = await getInstructionsForParent(studentIds, grades);

      setChildrenData(childData);
      setInstructions(inst);
    } finally { setLoading(false); }
  }

  async function handleSubmitReport(studentId, e) {
    e.preventDefault();
    const message = reportMessages[studentId] || '';
    if (!message.trim()) return;
    setSubmitting(studentId);
    try {
      await submitParentReport(studentId, message);
      showToast('Report sent to admin!', 'success');
      setReportMessages(prev => ({ ...prev, [studentId]: '' }));
    } catch {
      showToast('Failed to send report', 'danger');
    } finally { setSubmitting(null); }
  }

  function formatDate(val) {
    if (!val) return '';
    if (val?.toDate) return val.toDate().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    return String(val).slice(0, 16);
  }

  if (loading) return <Loader />;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Parent Dashboard</h2>
      </div>

      {/* Announcements */}
      {instructions.length > 0 && (
        <div className="card mb-4" style={{ borderLeft: '4px solid var(--cyan)', borderColor: 'rgba(0,243,255,0.4)' }}>
          <div className="card-header">📢 Tuition Announcements</div>
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

      {/* Children */}
      {childrenData.map(({ student, attendance_stats, fees, activities }) => (
        <div key={student.id} className="card mb-4">
          <div className="card-header" style={{ background: 'rgba(13,110,253,0.1)' }}>
            <h4 style={{ margin: 0, fontSize: '1.1rem' }}>
              👤 {student.name}
              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginLeft: '8px' }}>(Grade {student.grade})</span>
            </h4>
          </div>
          <div className="card-body">

            {/* Attendance */}
            <div className="section-title">📊 Attendance</div>
            <div className="row mb-4" style={{ gap: '10px' }}>
              {[
                { label: 'Total', value: attendance_stats.total, color: 'var(--text)' },
                { label: 'Present', value: attendance_stats.present, color: 'var(--success)' },
                { label: 'Rate', value: `${attendance_stats.percentage}%`, color: 'var(--info)' },
              ].map(({ label, value, color }) => (
                <div key={label} className="col stat-card" style={{ flex: 1 }}>
                  <div className="stat-card__number" style={{ color }}>{value}</div>
                  <div className="stat-card__label">{label}</div>
                </div>
              ))}
            </div>

            <div className="divider" />

            {/* Activities */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div className="section-title" style={{ flex: 1 }}>📔 Daily Activity</div>
              <Link to={`/parent/activity/${student.id}`} className="btn btn-info btn-sm" style={{ fontSize: '0.72rem' }}>Full Report →</Link>
            </div>
            {activities.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px', fontSize: '0.85rem' }}>
                📭 No recent activities.
              </div>
            ) : activities.map(act => (
              <div key={act.id} className="card mb-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="card-body" style={{ padding: '10px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <small className="text-info fw-bold">{act.activity_date}</small>
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{formatDate(act.created_at)}</small>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>{act.content}</p>
                </div>
              </div>
            ))}

            <div className="divider" />

            {/* Fees */}
            <div className="section-title">💰 Fees History</div>
            {fees.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px', fontSize: '0.85rem' }}>
                📭 No fee records found.
              </div>
            ) : (
              <div className="list-group">
                {fees.map(f => (
                  <div key={f.id} className="list-group-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div className="fw-bold" style={{ fontSize: '0.9rem' }}>{f.month_year}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Amount: <span style={{ color: 'var(--text)' }}>₹{f.amount}</span></div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge ${f.status === 'Paid' ? 'badge-success' : 'badge-danger'}`}>{f.status}</span>
                      {f.payment_date && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>✔✔ {f.payment_date}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="divider" />

            {/* Report to Admin */}
            <div className="section-title">💬 Report About Student</div>
            <form onSubmit={e => handleSubmitReport(student.id, e)}>
              <div className="form-group">
                <textarea
                  className="form-control"
                  rows="3"
                  value={reportMessages[student.id] || ''}
                  onChange={e => setReportMessages(prev => ({ ...prev, [student.id]: e.target.value }))}
                  placeholder={`Write your concern regarding ${student.name} here...`}
                  required
                />
              </div>
              <button type="submit" className="btn btn-warning btn-block btn-sm" disabled={submitting === student.id}>
                {submitting === student.id ? '⏳ Sending...' : '📨 Send to Admin'}
              </button>
            </form>
          </div>
        </div>
      ))}

      {childrenData.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          No student records found for your phone number.
        </div>
      )}
    </>
  );
}
