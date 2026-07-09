import { useState, useEffect } from 'react';
import {
  getStudents, getAttendanceByDateAndSession, saveBulkAttendance,
  getMonthlyAttendanceStats, getPunchesByDateAndSession, punchIn, punchOut, resetPunch, updatePunchTimes
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
  const [selectedSession, setSelectedSession] = useState('Evening');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [attendance, setAttendance] = useState({});
  const [punches, setPunches] = useState({});
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [view, setView] = useState('mark');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [punchingId, setPunchingId] = useState(null);
  const [editingPunchId, setEditingPunchId] = useState(null);
  const [editPunchIn, setEditPunchIn] = useState('');
  const [editPunchOut, setEditPunchOut] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => { loadStudents(); }, []);
  useEffect(() => { if (students.length > 0) { loadAttendance(); loadPunches(); } }, [selectedDate, selectedSession, students]);
  useEffect(() => { if (students.length > 0) loadMonthlyStats(); }, [selectedMonth, students]);

  async function loadStudents() {
    const s = await getStudents(true);
    setStudents(s);
    setLoading(false);
  }

  async function loadAttendance() {
    const map = await getAttendanceByDateAndSession(selectedDate, selectedSession);
    const simplified = {};
    Object.entries(map).forEach(([sid, rec]) => { simplified[sid] = rec.status; });
    setAttendance(simplified);
  }

  async function loadPunches() {
    const map = await getPunchesByDateAndSession(selectedDate, selectedSession);
    setPunches(map);
  }

  async function loadMonthlyStats() {
    const stats = await getMonthlyAttendanceStats(selectedMonth, students);
    setMonthlyStats(stats);
  }

  async function setStatus(studentId, status) {
    let nextAttendance;
    if (attendance[studentId] === status) {
      nextAttendance = { ...attendance };
      delete nextAttendance[studentId];
    } else {
      nextAttendance = { ...attendance, [studentId]: status };
    }
    setAttendance(nextAttendance);
    try {
      await saveBulkAttendance(selectedDate, selectedSession, nextAttendance);
    } catch {
      showToast('Failed to save attendance', 'danger');
    }
  }

  async function handleMarkAll(status) {
    if (!confirm(`Mark ALL ${filteredStudents.length} visible students as ${status}?`)) return;
    setBulkSaving(true);
    try {
      const nextAttendance = { ...attendance };
      filteredStudents.forEach(s => { nextAttendance[s.id] = status; });
      setAttendance(nextAttendance);
      await saveBulkAttendance(selectedDate, selectedSession, nextAttendance);
      showToast(`All marked ${status}!`, status === 'Present' ? 'success' : 'danger');
    } catch {
      showToast('Failed to bulk mark', 'danger');
    } finally { setBulkSaving(false); }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveBulkAttendance(selectedDate, selectedSession, attendance);
      showToast('Attendance saved!', 'success');
      loadAttendance();
    } catch {
      showToast('Failed to save attendance', 'danger');
    } finally { setSaving(false); }
  }

  async function handlePunchIn(studentId) {
    setPunchingId(studentId);
    try {
      await punchIn(studentId, selectedDate, selectedSession);
      showToast('Punched In!', 'success');
      const nextAttendance = { ...attendance };
      nextAttendance[studentId] = 'Present';
      setAttendance(nextAttendance);
      await saveBulkAttendance(selectedDate, selectedSession, nextAttendance);
      await loadPunches();
    } catch {
      showToast('Failed to punch in', 'danger');
    } finally { setPunchingId(null); }
  }

  async function handlePunchOut(studentId) {
    setPunchingId(studentId);
    try {
      await punchOut(studentId, selectedDate, selectedSession);
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
      await resetPunch(studentId, selectedDate, selectedSession);
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
      await updatePunchTimes(studentId, selectedDate, selectedSession, pIn, pOut);
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
    present: Object.values(attendance).filter(s => s === 'Present').length,
    absent: Object.values(attendance).filter(s => s === 'Absent').length,
    notMarked: students.length - Object.keys(attendance).length,
    needPunchOut: Object.values(punches).filter(p => p.punch_in && !p.punch_out).length,
  };

  const studentsWithSno = students.map((s, i) => ({ ...s, sno: i + 1 }));
  const filteredStudents = studentsWithSno.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(s.sno) === searchQuery;
    let matchesStatus = true;
    if (statusFilter === 'Present') matchesStatus = attendance[s.id] === 'Present';
    else if (statusFilter === 'Absent') matchesStatus = attendance[s.id] === 'Absent';
    else if (statusFilter === 'Not Marked') matchesStatus = !attendance[s.id];
    else if (statusFilter === 'Need Punch Out') {
      const punch = punches[s.id] || {};
      matchesStatus = !!punch.punch_in && !punch.punch_out;
    }
    return matchesSearch && matchesStatus;
  });

  const monthlyStatsWithSno = monthlyStats.map((stat, i) => ({ ...stat, sno: i + 1 }));
  const filteredMonthlyStats = monthlyStatsWithSno.filter(stat =>
    stat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(stat.sno) === searchQuery
  );

  const isToday = selectedDate === today;

  if (loading) return <Loader />;

  return (
    <>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Attendance</h2>
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
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: '1', minWidth: '150px', maxWidth: '200px' }}>
                <label className="form-label">Select Month</label>
                <input type="month" className="form-control" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />
              </div>
              <div className="form-group" style={{ flex: '1', minWidth: '200px', maxWidth: '300px' }}>
                <label className="form-label">Search Student</label>
                <input type="text" className="form-control" placeholder="Search by name or S.No..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>S.No</th><th>Student</th><th>Grade</th><th>Present</th><th>Total</th><th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMonthlyStats.map((stat, i) => (
                    <tr key={i}>
                      <td>{stat.sno}</td>
                      <td>{stat.name}</td>
                      <td>{stat.grade}</td>
                      <td>{stat.present}</td>
                      <td>{stat.total}</td>
                      <td className={stat.percentage >= 75 ? 'text-success fw-bold' : stat.percentage >= 50 ? 'text-warning fw-bold' : 'text-danger fw-bold'}>
                        {stat.percentage}%
                      </td>
                    </tr>
                  ))}
                  {filteredMonthlyStats.length === 0 && (
                    <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>No data found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Mark Attendance ── */}
      {view === 'mark' && (
        <>
          {/* Sticky control bar */}
          <div style={{
            position: 'sticky', top: '60px', zIndex: 200,
            background: 'var(--bg)', padding: '12px 0 8px',
            borderBottom: '1px solid var(--border)', marginBottom: '16px'
          }}>
            {/* Date / Session / Search row */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '10px' }}>
              <div className="form-group" style={{ margin: 0, flex: '1', minWidth: '140px', maxWidth: '180px' }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Date</label>
                <input type="date" className="form-control" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
              </div>
              <div className="form-group" style={{ margin: 0, flex: '1', minWidth: '130px', maxWidth: '160px' }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Session</label>
                <select className="form-select form-control" value={selectedSession} onChange={e => setSelectedSession(e.target.value)}>
                  <option value="Morning">Morning</option>
                  <option value="Evening">Evening</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0, flex: '2', minWidth: '180px' }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Search</label>
                <input type="text" className="form-control" placeholder="Name or S.No..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
                style={{ whiteSpace: 'nowrap', alignSelf: 'flex-end' }}
              >
                <Icon name="save" size={13} />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>

            {/* Bulk action buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginRight: '4px' }}>Bulk:</span>
              <button
                className="btn btn-success btn-sm"
                onClick={() => handleMarkAll('Present')}
                disabled={bulkSaving || filteredStudents.length === 0}
                style={{ gap: '5px' }}
              >
                <Icon name="check" size={12} /> All Present
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleMarkAll('Absent')}
                disabled={bulkSaving || filteredStudents.length === 0}
                style={{ gap: '5px' }}
              >
                <Icon name="close" size={12} /> All Absent
              </button>
              {bulkSaving && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Saving...</span>}
              <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
                {statusFilter !== 'All' ? ` (${statusFilter})` : ''}
              </span>
            </div>
          </div>

          {/* Daily Stats filter cards */}
          <div className="row mb-4" style={{ gap: '10px' }}>
            {[
              { label: 'Present', value: dailyStats.present, color: 'var(--success)' },
              { label: 'Absent', value: dailyStats.absent, color: 'var(--danger)' },
              { label: 'Not Marked', value: dailyStats.notMarked, color: 'var(--text-muted)' },
              { label: 'Need Punch Out', value: dailyStats.needPunchOut, color: 'var(--warning)' },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="col stat-card"
                style={{
                  flex: '1',
                  cursor: 'pointer',
                  outline: statusFilter === label ? `2px solid ${color}` : 'none',
                  outlineOffset: '2px',
                  transition: 'outline 0.15s',
                }}
                onClick={() => setStatusFilter(prev => prev === label ? 'All' : label)}
                title={`Filter by ${label}`}
              >
                <div className="stat-card__number" style={{ color }}>{value}</div>
                <div className="stat-card__label">{label}</div>
              </div>
            ))}
          </div>

          {/* Student List */}
          <div className="card" style={{ overflow: 'hidden' }}>
            {filteredStudents.map((s, idx) => {
              const status = attendance[s.id];
              const punch = punches[s.id] || {};
              const hasPunchIn = !!punch.punch_in;
              const hasPunchOut = !!punch.punch_out;
              const isPunching = punchingId === s.id;
              const isEditing = editingPunchId === s.id;

              return (
                <div
                  key={s.id}
                  style={{
                    borderBottom: idx < filteredStudents.length - 1 ? '1px solid var(--border)' : 'none',
                    borderLeft: `5px solid ${status === 'Present' ? 'var(--success)' : status === 'Absent' ? 'var(--danger)' : 'var(--border)'}`,
                    padding: '12px 14px',
                    transition: 'border-color 0.2s, background 0.15s',
                    background: status === 'Present'
                      ? 'rgba(34,197,94,0.04)'
                      : status === 'Absent'
                        ? 'rgba(239,68,68,0.04)'
                        : 'transparent',
                  }}
                >
                  {/* Top row: name + big P/A buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    {/* S.No + Name */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.97rem' }}>{s.sno}. {s.name}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginLeft: '8px' }}>Gr. {s.grade}</span>
                    </div>

                    {/* Status badge */}
                    <span className={`badge ${status === 'Present' ? 'badge-success' : status === 'Absent' ? 'badge-danger' : 'badge-secondary'}`}
                      style={{ fontSize: '0.72rem' }}>
                      {status || 'Pending'}
                    </span>

                    {/* Big Present / Absent buttons */}
                    <div style={{ display: 'flex', gap: '0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                      <button
                        className={`btn ${status === 'Present' ? 'btn-success' : 'btn-secondary'}`}
                        style={{
                          borderRadius: '8px 0 0 8px', padding: '8px 20px',
                          fontWeight: 700, fontSize: '0.9rem', gap: '6px',
                          minWidth: '72px',
                        }}
                        onClick={() => setStatus(s.id, 'Present')}
                      >
                        <Icon name="check" size={14} /> P
                      </button>
                      <button
                        className={`btn ${status === 'Absent' ? 'btn-danger' : 'btn-secondary'}`}
                        style={{
                          borderRadius: '0 8px 8px 0', padding: '8px 20px',
                          fontWeight: 700, fontSize: '0.9rem', gap: '6px',
                          minWidth: '72px',
                        }}
                        onClick={() => setStatus(s.id, 'Absent')}
                      >
                        <Icon name="close" size={14} /> A
                      </button>
                    </div>
                  </div>

                  {/* Punch row */}
                  <div style={{ marginTop: '10px', paddingLeft: '2px' }}>
                    {isEditing ? (
                      <div style={{
                        display: 'flex', alignItems: 'flex-end', gap: '8px', flexWrap: 'wrap',
                        background: 'var(--bg-light)', padding: '10px', borderRadius: '8px'
                      }}>
                        <div style={{ flex: 1, minWidth: '140px' }}>
                          <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Punch In</label>
                          <input type="time" className="form-control" value={editPunchIn} onChange={e => setEditPunchIn(e.target.value)} style={{ padding: '5px', fontSize: '0.85rem' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: '140px' }}>
                          <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Punch Out</label>
                          <input type="time" className="form-control" value={editPunchOut} onChange={e => setEditPunchOut(e.target.value)} style={{ padding: '5px', fontSize: '0.85rem' }} />
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={() => handleSavePunchEdit(s.id)} disabled={isPunching}>
                          {isPunching ? 'Saving...' : 'Save'}
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditingPunchId(null)}>Cancel</button>
                      </div>
                    ) : !hasPunchIn ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-info btn-sm"
                          style={{ gap: '5px', flex: 1 }}
                          onClick={() => handlePunchIn(s.id)}
                          disabled={isPunching}
                        >
                          <Icon name="arrowRight" size={12} />
                          {isPunching ? 'Punching...' : 'Punch In'}
                        </button>
                        {!subAdminLoggedIn && (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 12px' }}
                            onClick={() => handleEditPunchClick(s.id)}
                            title="Edit punch times"
                          >
                            <Icon name="edit" size={12} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {/* Punch times display */}
                        <div style={{ flex: 1, display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '0.82rem' }}>
                          <span style={{ color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Icon name="arrowRight" size={12} /> {punch.punch_in}
                          </span>
                          {hasPunchOut ? (
                            <span style={{ color: 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Icon name="arrowLeft" size={12} /> {punch.punch_out}
                            </span>
                          ) : (
                            <span style={{
                              color: 'var(--warning)', fontSize: '0.75rem', fontWeight: 600,
                              background: 'rgba(234,179,8,0.1)', padding: '2px 8px', borderRadius: '20px'
                            }}>
                              ⚠ Not punched out
                            </span>
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
                              {isPunching ? '...' : 'Punch Out'}
                            </button>
                          )}
                          {!subAdminLoggedIn && (
                            <>
                              <button
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                                onClick={() => handleEditPunchClick(s.id)}
                                disabled={isPunching}
                              >Edit</button>
                              <button
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                                onClick={() => handleResetPunch(s.id)}
                                disabled={isPunching}
                              >Reset</button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredStudents.length === 0 && (
            <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              {statusFilter !== 'All'
                ? `No students match the "${statusFilter}" filter.`
                : 'No active students found.'}
            </div>
          )}
        </>
      )}
    </>
  );
}
