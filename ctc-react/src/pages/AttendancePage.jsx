import { useState, useEffect } from 'react';
import { getStudents, getAttendanceByDate, saveBulkAttendance, getMonthlyAttendanceStats } from '../services/firestore';
import Loader from '../components/Loader';
import Icon from '../components/Icon';
import { useToast } from '../components/Toast';

export default function AttendancePage() {
  const { showToast } = useToast();
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [students, setStudents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [attendance, setAttendance] = useState({});
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [view, setView] = useState('mark');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadStudents(); }, []);
  useEffect(() => { if (students.length > 0) loadAttendance(); }, [selectedDate, students]);
  useEffect(() => { if (students.length > 0) loadMonthlyStats(); }, [selectedMonth, students]);

  async function loadStudents() {
    const s = await getStudents(true);
    setStudents(s);
    setLoading(false);
  }

  async function loadAttendance() {
    const map = await getAttendanceByDate(selectedDate);
    const simplified = {};
    Object.entries(map).forEach(([sid, rec]) => { simplified[sid] = rec.status; });
    setAttendance(simplified);
  }

  async function loadMonthlyStats() {
    const stats = await getMonthlyAttendanceStats(selectedMonth, students);
    setMonthlyStats(stats);
  }

  function setStatus(studentId, status) {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveBulkAttendance(selectedDate, attendance);
      showToast('Attendance saved!', 'success');
      loadAttendance();
    } catch {
      showToast('Failed to save attendance', 'danger');
    } finally { setSaving(false); }
  }

  const dailyStats = {
    present: Object.values(attendance).filter(s => s === 'Present').length,
    absent:  Object.values(attendance).filter(s => s === 'Absent').length,
    notMarked: students.length - Object.keys(attendance).length,
  };

  if (loading) return <Loader />;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Attendance</h2>
        <button className="btn btn-info" onClick={() => setView(v => v === 'mark' ? 'monthly' : 'mark')}>
          <Icon name={view === 'mark' ? 'chart' : 'attend'} size={14} />
          {view === 'mark' ? 'Monthly Report' : 'Mark Attendance'}
        </button>
      </div>

      {/* Monthly Report View */}
      {view === 'monthly' && (
        <div className="card mb-4">
          <div className="card-header"><Icon name="chart" size={16} /> Monthly Statistics</div>
          <div className="card-body">
            <div className="form-group" style={{ maxWidth: '200px', marginBottom: '16px' }}>
              <label className="form-label">Select Month</label>
              <input type="month" className="form-control" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Grade</th>
                    <th>Present</th>
                    <th>Total</th>
                    <th>Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyStats.map((stat, i) => (
                    <tr key={i}>
                      <td>{stat.name}</td>
                      <td>{stat.grade}</td>
                      <td>{stat.present}</td>
                      <td>{stat.total}</td>
                      <td className={stat.percentage >= 75 ? 'text-success fw-bold' : stat.percentage >= 50 ? 'text-warning fw-bold' : 'text-danger fw-bold'}>
                        {stat.percentage}%
                      </td>
                    </tr>
                  ))}
                  {monthlyStats.length === 0 && (
                    <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>No attendance data for this month.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Mark Attendance View */}
      {view === 'mark' && (
        <>
          <div className="form-group" style={{ maxWidth: '200px', marginBottom: '20px' }}>
            <label className="form-label">Select Date</label>
            <input type="date" className="form-control" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
          </div>

          {/* Daily Stats */}
          <div className="row mb-4" style={{ gap: '10px' }}>
            {[
              { label: 'Present',    value: dailyStats.present,    color: 'var(--success)' },
              { label: 'Absent',     value: dailyStats.absent,     color: 'var(--danger)' },
              { label: 'Not Marked', value: dailyStats.notMarked,  color: 'var(--text-muted)' },
            ].map(({ label, value, color }) => (
              <div key={label} className="col stat-card" style={{ flex: '1' }}>
                <div className="stat-card__number" style={{ color }}>{value}</div>
                <div className="stat-card__label">{label}</div>
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', position: 'sticky', top: '64px', zIndex: 100, background: 'var(--bg)', padding: '8px 0' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Select status for all students</span>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ gap: '8px' }}>
              <Icon name="save" size={14} />
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>

          {/* Student Cards */}
          <div className="row" style={{ gap: '12px' }}>
            {students.map(s => {
              const status = attendance[s.id];
              return (
                <div key={s.id} className="card" style={{
                  flex: '0 0 calc(50% - 6px)',
                  borderColor: status === 'Present' ? 'rgba(22,163,74,0.4)' : status === 'Absent' ? 'rgba(220,38,38,0.4)' : 'var(--border)'
                }}>
                  <div className="card-body" style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{s.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Grade: {s.grade}</div>
                      </div>
                      <span className={`badge ${status === 'Present' ? 'badge-success' : status === 'Absent' ? 'badge-danger' : 'badge-secondary'}`}>
                        {status || 'Pending'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0' }}>
                      <button
                        className={`btn btn-sm ${status === 'Present' ? 'btn-success' : 'btn-secondary'}`}
                        style={{ flex: 1, borderRadius: '8px 0 0 8px', gap: '4px' }}
                        onClick={() => setStatus(s.id, 'Present')}
                      >
                        <Icon name="check" size={13} /> Present
                      </button>
                      <button
                        className={`btn btn-sm ${status === 'Absent' ? 'btn-danger' : 'btn-secondary'}`}
                        style={{ flex: 1, borderRadius: '0 8px 8px 0', gap: '4px' }}
                        onClick={() => setStatus(s.id, 'Absent')}
                      >
                        <Icon name="close" size={13} /> Absent
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {students.length === 0 && (
            <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No active students found.</div>
          )}
        </>
      )}
    </>
  );
}
