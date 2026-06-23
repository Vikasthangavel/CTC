import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getStudents, getInstructions, getAllParentReports,
  addInstruction, deleteInstruction
} from '../services/firestore';
import Loader from '../components/Loader';
import { useToast } from '../components/Toast';

export default function DashboardPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [reports, setReports] = useState([]);
  const [instructions, setInstructions] = useState([]);
  const [grades, setGrades] = useState([]);
  const [recipient, setRecipient] = useState('all');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [s, inst, rep] = await Promise.all([
        getStudents(true),
        getInstructions(5),
        getAllParentReports(),
      ]);
      setStudents(s);
      setInstructions(inst);
      setReports(rep.slice(0, 5));
      const gs = [...new Set(s.map(x => x.grade))].sort((a, b) => Number(a) - Number(b));
      setGrades(gs);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendInstruction(e) {
    e.preventDefault();
    setSending(true);
    try {
      let targetType = 'all', targetValue = null;
      if (recipient.startsWith('grade_')) { targetType = 'grade'; targetValue = recipient.split('_')[1]; }
      else if (recipient.startsWith('student_')) { targetType = 'student'; targetValue = recipient.split('_')[1]; }
      await addInstruction(message, targetType, targetValue);
      showToast('Instruction sent!', 'success');
      setMessage('');
      setRecipient('all');
      fetchData();
    } catch {
      showToast('Failed to send instruction', 'danger');
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this instruction?')) return;
    await deleteInstruction(id);
    showToast('Instruction deleted', 'success');
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
      {/* Page Title */}
      <div className="page-title">
        <div>
          <h2>Dashboard</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>
            Welcome back! Here's an overview.
          </p>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="row mb-4">
        <div className="col stat-card">
          <div className="stat-card__icon success">👥</div>
          <div className="stat-card__number text-success">{students.length}</div>
          <div className="stat-card__label">Total Students</div>
          <Link to="/students" className="btn btn-success btn-sm" style={{ marginTop: '4px' }}>Manage →</Link>
        </div>
        <div className="col stat-card">
          <div className="stat-card__icon info">📅</div>
          <div className="stat-card__number text-info">—</div>
          <div className="stat-card__label">Attendance</div>
          <Link to="/attendance" className="btn btn-info btn-sm" style={{ marginTop: '4px' }}>Mark Today →</Link>
        </div>
        <div className="col stat-card">
          <div className="stat-card__icon warning">💰</div>
          <div className="stat-card__number text-warning">—</div>
          <div className="stat-card__label">Fees</div>
          <Link to="/fees" className="btn btn-warning btn-sm" style={{ marginTop: '4px' }}>Manage →</Link>
        </div>
      </div>

      {/* ── Instructions Row ── */}
      <div className="row mb-4">
        {/* Send Instruction */}
        <div className="col">
          <div className="card">
            <div className="card-header">📢 Send Instruction</div>
            <div className="card-body">
              <form onSubmit={handleSendInstruction}>
                <div className="form-group">
                  <label className="form-label">To:</label>
                  <select className="form-select" value={recipient} onChange={e => setRecipient(e.target.value)}>
                    <option value="all">All Parents</option>
                    <optgroup label="Entire Grades">
                      {grades.map(g => <option key={g} value={`grade_${g}`}>Grade {g}</option>)}
                    </optgroup>
                    <optgroup label="Specific Students">
                      {students.map(s => <option key={s.id} value={`student_${s.id}`}>{s.name} (Grade {s.grade})</option>)}
                    </optgroup>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Message:</label>
                  <textarea
                    className="form-control"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Enter message..."
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-block" disabled={sending}>
                  {sending ? '⏳ Sending...' : '📤 Send'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Recent Instructions */}
        <div className="col">
          <div className="card">
            <div className="card-header">🕐 Recent Instructions</div>
            <div className="list-group">
              {instructions.length === 0 && (
                <div className="list-group-item text-center text-muted" style={{ padding: '32px' }}>
                  <div style={{ fontSize: '1.8rem', opacity: 0.3, marginBottom: '8px' }}>📭</div>
                  No instructions sent yet.
                </div>
              )}
              {instructions.map(inst => (
                <div key={inst.id} className="list-group-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span>{formatDate(inst.created_at)}</span>
                      {inst.target_type === 'grade' && <span className="badge badge-secondary">Grade {inst.target_value}</span>}
                      {inst.target_type === 'student' && <span className="badge badge-info">Student</span>}
                      {(!inst.target_type || inst.target_type === 'all') && <span className="badge badge-success">All</span>}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.88rem', opacity: 0.85 }}>{inst.message}</p>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(inst.id)}>🗑</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Parent Reports ── */}
      <div className="card mb-4">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>💬 Recent Parent Reports</span>
          <Link to="/reports" className="btn btn-info btn-sm">View All</Link>
        </div>
        <div className="list-group">
          {reports.length === 0 && (
            <div className="list-group-item text-center text-muted" style={{ padding: '40px' }}>
              <div style={{ fontSize: '2rem', opacity: 0.3, marginBottom: '8px' }}>📥</div>
              No reports received yet.
            </div>
          )}
          {reports.map(r => (
            <div key={r.id} className="list-group-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                <div>
                  <span className="fw-bold text-warning">{r.student_name || 'Student'}</span>
                  {r.grade && <span className="badge badge-secondary" style={{ marginLeft: '8px' }}>{r.grade}</span>}
                </div>
                <small style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{formatDate(r.report_date)}</small>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.75 }}>{r.message}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
