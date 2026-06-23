import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getStudentByParentPhone, getStudentAttendanceStats,
  getStudentFees, getRecentActivities, getInstructionsForParent,
  submitParentReport, getPunchRecord
} from '../services/firestore';
import Loader from '../components/Loader';
import Icon from '../components/Icon';
import { useToast } from '../components/Toast';

export default function ParentDashboardPage() {
  const { parentPhone } = useAuth();
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
      const todayDate = new Date().toISOString().split('T')[0];

      const childData = await Promise.all(students.map(async s => {
        const [stats, fees, activities, todayPunch] = await Promise.all([
          getStudentAttendanceStats(s.id),
          getStudentFees(s.id),
          getRecentActivities(s.id, 2),
          getPunchRecord(s.id, todayDate),
        ]);
        return { student: s, attendance_stats: stats, fees: fees.slice(0, 5), activities, todayPunch };
      }));

      const studentIds = students.map(s => s.id);
      const grades = students.map(s => s.grade);
      const inst = await getInstructionsForParent(studentIds, grades);

      setChildrenData(childData);
      setInstructions(inst);
    } catch (err) {
      console.error('Error loading parent data:', err);
      showToast('Error loading data. Please try again.', 'danger');
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
      <div className="page-title">
        <div>
          <h2>Parent Dashboard</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>
            Viewing your child's information
          </p>
        </div>
      </div>

      {/* Announcements */}
      {instructions.length > 0 && (
        <div className="card mb-4" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="card-header">
            <Icon name="announce" size={16} /> Tuition Announcements
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

      {/* No students found */}
      {childrenData.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Icon name="user" size={40} style={{ color: 'var(--text-light)', display: 'block', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>
            No student records found for your phone number.
          </p>
          <p style={{ color: 'var(--text-light)', fontSize: '0.82rem' }}>
            Registered number: <strong>{parentPhone}</strong>
          </p>
          <p style={{ color: 'var(--text-light)', fontSize: '0.82rem', marginTop: '4px' }}>
            Please contact your tuition admin if you believe this is an error.
          </p>
        </div>
      )}

      {/* Children */}
      {childrenData.map(({ student, attendance_stats, fees, activities, todayPunch }) => (
        <div key={student.id} className="card mb-4">
          <div className="card-header" style={{ background: 'var(--primary-light)', borderBottom: '1px solid var(--border)' }}>
            <h4 style={{ margin: 0, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="user" size={18} />
              {student.name}
              <span className="badge badge-secondary" style={{ fontWeight: 500 }}>Grade {student.grade}</span>
            </h4>
          </div>
          <div className="card-body">

            {/* Today's Punch Timing */}
            <div className="section-title" style={{ marginBottom: '10px' }}>
              <Icon name="attend" size={13} style={{ marginRight: '4px' }} /> Today's Timing
            </div>
            {todayPunch && todayPunch.punch_in ? (
              <div style={{
                display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px',
                background: 'var(--surface-2)', borderRadius: 'var(--radius)', padding: '12px 14px',
                border: '1px solid var(--border)'
              }}>
                <div style={{ flex: 1, minWidth: '100px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>Punch In</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Icon name="arrowRight" size={16} /> {todayPunch.punch_in}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: '100px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>Punch Out</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: todayPunch.punch_out ? 'var(--danger)' : 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Icon name="arrowLeft" size={16} /> {todayPunch.punch_out || 'Not yet'}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px', padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                No punch record for today.
              </div>
            )}

            {/* Attendance Stats */}
            <div className="section-title">
              <Icon name="chart" size={13} style={{ marginRight: '4px' }} /> Attendance
            </div>
            <div className="row mb-4" style={{ gap: '10px' }}>
              {[
                { label: 'Total',   value: attendance_stats.total,      color: 'var(--text)' },
                { label: 'Present', value: attendance_stats.present,    color: 'var(--success)' },
                { label: 'Rate',    value: `${attendance_stats.percentage}%`, color: 'var(--info)' },
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
              <div className="section-title" style={{ flex: 1, marginBottom: 0 }}>
                <Icon name="book" size={13} style={{ marginRight: '4px' }} /> Daily Activity
              </div>
              <Link to={`/parent/activity/${student.id}`} className="btn btn-info btn-sm" style={{ fontSize: '0.72rem', marginLeft: '12px' }}>
                Full Report
              </Link>
            </div>
            {activities.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px', fontSize: '0.85rem' }}>
                <Icon name="inbox" size={24} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.4 }} />
                No recent activities.
              </div>
            ) : activities.map(act => (
              <div key={act.id} className="card mb-2">
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
            <div className="section-title">
              <Icon name="wallet" size={13} style={{ marginRight: '4px' }} /> Fees History
            </div>
            {fees.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px', fontSize: '0.85rem' }}>
                <Icon name="inbox" size={24} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.4 }} />
                No fee records found.
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
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'flex-end' }}>
                          <Icon name="check" size={10} /> {f.payment_date}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="divider" />

            {/* Report to Admin */}
            <div className="section-title">
              <Icon name="reports" size={13} style={{ marginRight: '4px' }} /> Report About Student
            </div>
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
              <button type="submit" className="btn btn-warning btn-block btn-sm" disabled={submitting === student.id} style={{ gap: '8px' }}>
                <Icon name="send" size={14} />
                {submitting === student.id ? 'Sending...' : 'Send to Admin'}
              </button>
            </form>
          </div>
        </div>
      ))}
    </>
  );
}
