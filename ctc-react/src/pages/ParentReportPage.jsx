import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getStudentByParentPhone, submitParentReport } from '../services/firestore';
import Loader from '../components/Loader';
import Icon from '../components/Icon';
import { useToast } from '../components/Toast';

export default function ParentReportPage() {
  const { parentPhone } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadStudents(); }, [parentPhone]);

  async function loadStudents() {
    setLoading(true);
    try {
      const s = await getStudentByParentPhone(parentPhone);
      setStudents(s);
      if (s.length > 0) setSelectedId(s[0].id);
    } finally { setLoading(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim() || !selectedId) return;
    setSubmitting(true);
    try {
      await submitParentReport(selectedId, message);
      showToast('Report sent to admin!', 'success');
      setMessage('');
    } catch {
      showToast('Failed to send report', 'danger');
    } finally { setSubmitting(false); }
  }

  const selectedStudent = students.find(s => s.id === selectedId);

  if (loading) return <Loader />;

  return (
    <>
      <div className="page-title">
        <div>
          <h2>Report</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>Send a message to the admin</p>
        </div>
      </div>

      {students.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          No student records found.
        </div>
      )}

      {students.length > 0 && (
        <div className="card">
          <div className="card-header">
            <Icon name="reports" size={16} /> Send Report to Admin
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              {/* Child selector */}
              {students.length > 1 && (
                <div className="form-group">
                  <label className="form-label">Regarding Child</label>
                  <select className="form-select" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name} (Grade {s.grade})</option>)}
                  </select>
                </div>
              )}

              {selectedStudent && students.length === 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <Icon name="user" size={16} style={{ color: 'var(--primary)' }} />
                  <span className="fw-bold">{selectedStudent.name}</span>
                  <span className="badge badge-secondary">Grade {selectedStudent.grade}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Your Message</label>
                <textarea
                  className="form-control"
                  rows="5"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={selectedStudent ? `Write your concern or feedback about ${selectedStudent.name}...` : 'Write your message...'}
                  required
                  style={{ minHeight: '120px' }}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={submitting} style={{ gap: '8px' }}>
                <Icon name="send" size={15} />
                {submitting ? 'Sending...' : 'Send to Admin'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Info note */}
      <div style={{ marginTop: '16px', padding: '12px 14px', background: 'var(--info-bg)', border: '1px solid var(--info-border)', borderRadius: 'var(--radius)', fontSize: '0.82rem', color: 'var(--info)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
        <Icon name="clock" size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
        <span>Your report will be reviewed by the admin. They will respond or take action accordingly.</span>
      </div>
    </>
  );
}
