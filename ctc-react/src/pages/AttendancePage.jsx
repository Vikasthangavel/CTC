import { useState, useEffect } from 'react';
import {
  getStudents, getAttendanceByDate, saveBulkAttendance,
  getMonthlyAttendanceStats, getPunchesByDate, punchIn, punchOut, resetPunch, updatePunchTimes
} from '../services/firestore';
import Loader from '../components/Loader';
import Icon from '../components/Icon';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';

function to24Hour(time12h) {
  if (!time12h) return '';
  const match = String(time12h).match(/(\d+):(\d+)\s*(am|pm|AM|PM)?/);
  if (!match) return time12h;
  let [_, hours, minutes, modifier] = match;
  if (!modifier) return `${hours.padStart(2, '0')}:${minutes}`;
  modifier = modifier.toLowerCase();
  if (hours === '12') hours = '00';
  if (modifier === 'pm') hours = String(parseInt(hours, 10) + 12);
  return `${hours.padStart(2, '0')}:${minutes}`;
}

function to12Hour(time24h) {
  if (!time24h) return null;
  let [hours, minutes] = time24h.split(':');
  if (!hours || !minutes) return time24h;
  const h = parseInt(hours, 10);
  const modifier = h >= 12 ? 'pm' : 'am';
  let hours12 = h % 12;
  if (hours12 === 0) hours12 = 12;
  return `${String(hours12).padStart(2, '0')}:${minutes} ${modifier}`;
}

export default function AttendancePage() {
  const { subAdminLoggedIn } = useAuth();
  const { showToast } = useToast();
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [students, setStudents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [attendance, setAttendance] = useState({});
  const [punches, setPunches] = useState({});   // { studentId: { punch_in, punch_out } }
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [view, setView] = useState('mark');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [punchingId, setPunchingId] = useState(null); // which student is being punched
  const [editingPunchId, setEditingPunchId] = useState(null);
  const [editPunchIn, setEditPunchIn] = useState('');
  const [editPunchOut, setEditPunchOut] = useState('');

  useEffect(() => { loadStudents(); }, []);
  useEffect(() => { if (students.length > 0) { loadAttendance(); loadPunches(); } }, [selectedDate, students]);
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

  async function loadPunches() {
    const map = await getPunchesByDate(selectedDate);
    setPunches(map);
  }

  async function loadMonthlyStats() {
    const stats = await getMonthlyAttendanceStats(selectedMonth, students);
    setMonthlyStats(stats);
  }

  function setStatus(studentId, status) {
    setAttendance(prev => {
      if (prev[studentId] === status) {
        const next = { ...prev };
        delete next[studentId];
        return next;
      }
      return { ...prev, [studentId]: status };
    });
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

  async function handlePunchIn(studentId) {
    setPunchingId(studentId);
    try {
      await punchIn(studentId, selectedDate);
      showToast('Punched In!', 'success');
      
      // Auto-mark present when punching in
      const nextAttendance = { ...attendance };
      nextAttendance[studentId] = 'Present';
      
      setAttendance(nextAttendance);
      await saveBulkAttendance(selectedDate, nextAttendance);
      await loadPunches();
    } catch {
      showToast('Failed to punch in', 'danger');
    } finally { setPunchingId(null); }
  }

  async function handlePunchOut(studentId) {
    setPunchingId(studentId);
    try {
      await punchOut(studentId, selectedDate);
      showToast('Punched Out!', 'success');
      await loadPunches();
    } catch {
      showToast('Failed to punch out', 'danger');
    } finally { setPunchingId(null); }
  }

  async function handleResetPunch(studentId) {
    if (!confirm('Reset punch record for this student?')) return;
    setPunchingId(studentId);
    try {
      await resetPunch(studentId, selectedDate);
      showToast('Punch reset', 'success');
      await loadPunches();
    } catch {
      showToast('Failed to reset', 'danger');
    } finally { setPunchingId(null); }
  }

  function handleEditPunchClick(studentId) {
    const punch = punches[studentId] || {};
    setEditPunchIn(to24Hour(punch.punch_in));
    setEditPunchOut(to24Hour(punch.punch_out));
    setEditingPunchId(studentId);
  }

  async function handleSavePunchEdit(studentId) {
    setPunchingId(studentId);
    try {
      const pIn = editPunchIn ? to12Hour(editPunchIn) : null;
      const pOut = editPunchOut ? to12Hour(editPunchOut) : null;
      await updatePunchTimes(studentId, selectedDate, pIn, pOut);
      showToast('Punch times updated', 'success');
      setEditingPunchId(null);
      await loadPunches();
    } catch {
      showToast('Failed to update punch times', 'danger');
    } finally {
      setPunchingId(null);
    }
  }

  const dailyStats = {
    present:   Object.values(attendance).filter(s => s === 'Present').length,
    absent:    Object.values(attendance).filter(s => s === 'Absent').length,
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

      {/* ── Monthly Report ── */}
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
                    <th>Student</th><th>Grade</th><th>Present</th><th>Total</th><th>%</th>
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
                    <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>No data for this month.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Mark Attendance + Punch ── */}
      {view === 'mark' && (
        <>
          <div className="form-group" style={{ maxWidth: '200px', marginBottom: '20px' }}>
            <label className="form-label">Select Date</label>
            <input type="date" className="form-control" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
          </div>

          {/* Daily Stats */}
          <div className="row mb-4" style={{ gap: '10px' }}>
            {[
              { label: 'Present',    value: dailyStats.present,   color: 'var(--success)' },
              { label: 'Absent',     value: dailyStats.absent,    color: 'var(--danger)' },
              { label: 'Not Marked', value: dailyStats.notMarked, color: 'var(--text-muted)' },
            ].map(({ label, value, color }) => (
              <div key={label} className="col stat-card" style={{ flex: '1' }}>
                <div className="stat-card__number" style={{ color }}>{value}</div>
                <div className="stat-card__label">{label}</div>
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', position: 'sticky', top: '64px', zIndex: 100, background: 'var(--bg)', padding: '8px 0' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Mark attendance &amp; punch times</span>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ gap: '8px' }}>
              <Icon name="save" size={14} />
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>

          {/* Student List */}
          <div className="card" style={{ overflow: 'hidden' }}>
            {students.map((s, idx) => {
              const status = attendance[s.id];
              const punch = punches[s.id] || {};
              const hasPunchIn = !!punch.punch_in;
              const hasPunchOut = !!punch.punch_out;
              const isPunching = punchingId === s.id;

              return (
                <div key={s.id} style={{
                  borderBottom: idx < students.length - 1 ? '1px solid var(--border)' : 'none',
                  borderLeft: `4px solid ${status === 'Present' ? 'var(--success)' : status === 'Absent' ? 'var(--danger)' : 'transparent'}`,
                  padding: '14px 14px 14px 12px',
                  transition: 'border-color 0.2s',
                }}>

                  {/* Row 1: Name + badge + present/absent */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{s.name}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginLeft: '8px' }}>Gr. {s.grade}</span>
                    </div>
                    <span className={`badge ${status === 'Present' ? 'badge-success' : status === 'Absent' ? 'badge-danger' : 'badge-secondary'}`}>
                      {status || 'Pending'}
                    </span>
                    {/* Inline Present/Absent toggle */}
                    <div style={{ display: 'flex', gap: '0' }}>
                      <button
                        className={`btn btn-sm ${status === 'Present' ? 'btn-success' : 'btn-secondary'}`}
                        style={{ borderRadius: '8px 0 0 8px', padding: '4px 12px', gap: '4px', fontSize: '0.8rem' }}
                        onClick={() => setStatus(s.id, 'Present')}
                      ><Icon name="check" size={12} /> P</button>
                      <button
                        className={`btn btn-sm ${status === 'Absent' ? 'btn-danger' : 'btn-secondary'}`}
                        style={{ borderRadius: '0 8px 8px 0', padding: '4px 12px', gap: '4px', fontSize: '0.8rem' }}
                        onClick={() => setStatus(s.id, 'Absent')}
                      ><Icon name="close" size={12} /> A</button>
                    </div>
                  </div>

                  {/* Row 2: Punch section */}
                  {editingPunchId === s.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', background: 'var(--bg-light)', padding: '8px', borderRadius: '8px', marginTop: '8px' }}>
                      <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Punch In</label>
                        <input type="time" className="form-control" value={editPunchIn} onChange={e => setEditPunchIn(e.target.value)} style={{ padding: '4px', fontSize: '0.85rem' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Punch Out</label>
                        <input type="time" className="form-control" value={editPunchOut} onChange={e => setEditPunchOut(e.target.value)} style={{ padding: '4px', fontSize: '0.85rem' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '6px', width: '100%', marginTop: '4px' }}>
                        <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => handleSavePunchEdit(s.id)} disabled={isPunching}>
                          {isPunching ? 'Saving...' : 'Save'}
                        </button>
                        <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => setEditingPunchId(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : !hasPunchIn ? (
                    <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                      <button
                        className="btn btn-info btn-sm"
                        style={{ gap: '6px', flex: 1 }}
                        onClick={() => handlePunchIn(s.id)}
                        disabled={isPunching}
                      >
                        <Icon name="arrowRight" size={13} />
                        {isPunching ? 'Punching...' : 'Punch In'}
                      </button>
                      {!subAdminLoggedIn && (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 12px' }}
                          onClick={() => handleEditPunchClick(s.id)}
                          disabled={isPunching}
                        >
                          <Icon name="edit" size={13} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {/* Times */}
                      <div style={{ flex: 1, display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '0.82rem' }}>
                        <span style={{ color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Icon name="arrowRight" size={12} /> {punch.punch_in}
                        </span>
                        {hasPunchOut && (
                          <span style={{ color: 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Icon name="arrowLeft" size={12} /> {punch.punch_out}
                          </span>
                        )}
                        {!hasPunchOut && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Not punched out</span>
                        )}
                      </div>
                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {!hasPunchOut && (
                          <button
                            className="btn btn-danger btn-sm"
                            style={{ gap: '4px' }}
                            onClick={() => handlePunchOut(s.id)}
                            disabled={isPunching}
                          >
                            <Icon name="arrowLeft" size={12} />
                            {isPunching ? '...' : 'Out'}
                          </button>
                        )}
                        {!subAdminLoggedIn && (
                          <>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                              onClick={() => handleResetPunch(s.id)}
                              disabled={isPunching}
                            >Reset</button>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                              onClick={() => handleEditPunchClick(s.id)}
                              disabled={isPunching}
                            >Edit</button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>

          {students.length === 0 && (
            <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No active students found.
            </div>
          )}
        </>
      )}
    </>
  );
}
