import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStudent, getStudentFees, addFeeRecord } from '../services/firestore';
import Loader from '../components/Loader';
import Icon from '../components/Icon';
import { useToast } from '../components/Toast';
import { printReceipt, shareReceiptOnWhatsApp } from '../services/receipt';

export default function StudentFeesPage() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [student, setStudent] = useState(null);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ month_year: '', amount: '', status: 'Paid', payment_date: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); }, [studentId]);

  async function fetchData() {
    setLoading(true);
    try {
      const [s, f] = await Promise.all([getStudent(studentId), getStudentFees(studentId)]);
      setStudent(s);
      setFees(f);
      if (s) setForm(prev => ({ ...prev, amount: s.monthly_fee || '' }));
    } finally { setLoading(false); }
  }

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await addFeeRecord({ student_id: studentId, ...form, amount: Number(form.amount) });
      showToast('Fee record added!', 'success');
      setForm(f => ({ ...f, month_year: '', payment_date: '' }));
      fetchData();
    } catch {
      showToast('Failed to add record', 'danger');
    } finally { setSaving(false); }
  }

  if (loading) return <Loader />;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/fees')} style={{ gap: '4px' }}><Icon name="arrowLeft" size={14} /> Back</button>
        <h2 style={{ margin: 0 }}>Fees: {student?.name}</h2>
      </div>

      {/* Add Record Form */}
      <div className="card mb-4">
        <div className="card-header"><Icon name="plus" size={15} style={{ marginRight: '4px' }} /> Add Fee Record</div>
        <div className="card-body">
          <form onSubmit={handleAdd}>
            <div className="row">
              <div className="col">
                <div className="form-group"><label className="form-label">Month</label><input name="month_year" type="month" className="form-control" value={form.month_year} onChange={handle} required /></div>
              </div>
              <div className="col">
                <div className="form-group"><label className="form-label">Amount (₹)</label><input name="amount" type="number" className="form-control" value={form.amount} onChange={handle} required /></div>
              </div>
            </div>
            <div className="row">
              <div className="col">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select name="status" className="form-select" value={form.status} onChange={handle}>
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                </div>
              </div>
              <div className="col">
                <div className="form-group"><label className="form-label">Payment Date</label><input name="payment_date" type="date" className="form-control" value={form.payment_date} onChange={handle} /></div>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ gap: '6px' }}>
              <Icon name="save" size={14} /> {saving ? 'Saving...' : 'Add Record'}
            </button>
          </form>
        </div>
      </div>

      {/* Fee History */}
      <div className="card">
        <div className="card-header"><Icon name="wallet" size={15} style={{ marginRight: '4px' }} /> Fee History</div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Month</th><th>Amount</th><th>Status</th><th>Payment Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {fees.map(f => (
                <tr key={f.id}>
                  <td>{f.month_year}</td>
                  <td>₹{f.amount}</td>
                  <td><span className={`badge ${f.status === 'Paid' ? 'badge-success' : 'badge-danger'}`}>{f.status}</span></td>
                  <td style={{ color: 'var(--text-muted)' }}>{f.payment_date || '—'}</td>
                  <td>
                    {f.status === 'Paid' && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-info btn-sm"
                          style={{ gap: '4px', padding: '3px 6px', fontSize: '0.75rem' }}
                          onClick={() => printReceipt({
                            student,
                            month: f.month_year,
                            amount: f.amount,
                            paymentDate: f.payment_date,
                            receiptId: f.id
                          })}
                          title="Print Receipt"
                        >
                          <Icon name="download" size={11} /> Print
                        </button>
                        <button
                          className="btn btn-success btn-sm"
                          style={{ gap: '4px', padding: '3px 6px', fontSize: '0.75rem', background: '#25D366', borderColor: '#25D366' }}
                          onClick={() => shareReceiptOnWhatsApp({
                            student,
                            month: f.month_year,
                            amount: f.amount,
                            paymentDate: f.payment_date
                          })}
                          title="Share on WhatsApp"
                        >
                          <Icon name="share" size={11} /> Share
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {fees.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>No fee records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
