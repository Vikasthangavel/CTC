import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getStudentByParentPhone, getStudentFees } from '../services/firestore';
import Loader from '../components/Loader';
import Icon from '../components/Icon';

export default function ParentFeesPage() {
  const { parentPhone } = useAuth();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [fees, setFees] = useState([]);
  const [feesLoading, setFeesLoading] = useState(false);

  useEffect(() => { loadStudents(); }, [parentPhone]);
  useEffect(() => { if (selectedId) loadFees(); }, [selectedId]);

  async function loadStudents() {
    setLoading(true);
    try {
      const s = await getStudentByParentPhone(parentPhone);
      setStudents(s);
      if (s.length > 0) setSelectedId(s[0].id);
    } finally { setLoading(false); }
  }

  async function loadFees() {
    setFeesLoading(true);
    try {
      const f = await getStudentFees(selectedId);
      setFees(f);
    } finally { setFeesLoading(false); }
  }

  const selectedStudent = students.find(s => s.id === selectedId);

  const summary = fees.reduce((acc, f) => {
    if (f.status === 'Paid') { acc.paid++; acc.paidAmt += Number(f.amount) || 0; }
    else { acc.unpaid++; acc.unpaidAmt += Number(f.amount) || 0; }
    return acc;
  }, { paid: 0, unpaid: 0, paidAmt: 0, unpaidAmt: 0 });

  if (loading) return <Loader />;

  return (
    <>
      <div className="page-title">
        <div>
          <h2>Fees</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>Fee payment history</p>
        </div>
      </div>

      {students.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          No student records found.
        </div>
      )}

      {students.length > 0 && (
        <>
          {/* Child selector */}
          {students.length > 1 && (
            <div className="form-group mb-4">
              <label className="form-label">Select Child</label>
              <select className="form-select" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
                {students.map(s => <option key={s.id} value={s.id}>{s.name} (Grade {s.grade})</option>)}
              </select>
            </div>
          )}

          {/* Student badge */}
          {selectedStudent && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Icon name="user" size={15} style={{ color: 'var(--text-muted)' }} />
              <span className="fw-bold">{selectedStudent.name}</span>
              <span className="badge badge-secondary">Grade {selectedStudent.grade}</span>
            </div>
          )}

          {feesLoading ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Loading...</div>
          ) : (
            <>
              {/* Summary stats */}
              {fees.length > 0 && (
                <div className="row mb-4" style={{ gap: '10px' }}>
                  <div className="col stat-card" style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)' }}>
                    <div className="stat-card__number text-success">{summary.paid}</div>
                    <div className="stat-card__label">Paid</div>
                    <div style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.88rem', marginTop: '4px' }}>₹{summary.paidAmt}</div>
                  </div>
                  <div className="col stat-card" style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)' }}>
                    <div className="stat-card__number text-danger">{summary.unpaid}</div>
                    <div className="stat-card__label">Pending</div>
                    <div style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '0.88rem', marginTop: '4px' }}>₹{summary.unpaidAmt}</div>
                  </div>
                </div>
              )}

              {/* Fee records */}
              {fees.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <Icon name="wallet" size={36} style={{ opacity: 0.3, display: 'block', margin: '0 auto 8px' }} />
                  No fee records found.
                </div>
              ) : (
                <div className="card">
                  <div className="list-group">
                    {fees.map(f => (
                      <div key={f.id} className="list-group-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div className="fw-bold" style={{ fontSize: '0.95rem' }}>{f.month_year}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Amount: <span style={{ color: 'var(--text)', fontWeight: 600 }}>₹{f.amount}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className={`badge ${f.status === 'Paid' ? 'badge-success' : 'badge-danger'}`}>{f.status}</span>
                          {f.payment_date && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'flex-end' }}>
                              <Icon name="check" size={10} /> {f.payment_date}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}
