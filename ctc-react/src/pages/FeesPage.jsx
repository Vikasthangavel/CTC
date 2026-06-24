import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStudents, getFeesByMonth, quickPay } from '../services/firestore';
import Loader from '../components/Loader';
import Icon from '../components/Icon';
import { useToast } from '../components/Toast';
import { printReceipt, shareReceiptOnWhatsApp } from '../services/receipt';

export default function FeesPage() {
  const { showToast } = useToast();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [studentFees, setStudentFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);

  useEffect(() => { fetchData(); }, [selectedMonth]);

  async function fetchData() {
    setLoading(true);
    try {
      const [students, feeMap] = await Promise.all([
        getStudents(true),
        getFeesByMonth(selectedMonth),
      ]);

      const list = students.map(s => {
        const fee = feeMap[s.id];
        return {
          student: s,
          status: fee ? fee.status : 'Unpaid',
          amount: fee ? fee.amount : s.monthly_fee,
          fee_id: fee ? fee.id : null,
          payment_date: fee ? fee.payment_date : null,
        };
      });
      setStudentFees(list);
    } finally { setLoading(false); }
  }

  async function handleQuickPay(item) {
    setPaying(item.student.id);
    try {
      await quickPay(item.student.id, selectedMonth, item.amount);
      showToast(`Marked ${item.student.name} as paid!`, 'success');
      fetchData();
    } catch {
      showToast('Failed to process payment', 'danger');
    } finally { setPaying(null); }
  }

  const stats = studentFees.reduce((acc, item) => {
    if (item.status === 'Paid') {
      acc.paidCount++; acc.totalCollected += Number(item.amount) || 0;
    } else {
      acc.unpaidCount++; acc.totalPending += Number(item.amount) || 0;
    }
    return acc;
  }, { paidCount: 0, unpaidCount: 0, totalCollected: 0, totalPending: 0 });

  if (loading) return <Loader />;

  return (
    <>
      <div style={{ marginBottom: '20px' }}>
        <h2>Fee Management</h2>
      </div>

      {/* Month Selector */}
      <div className="form-group" style={{ maxWidth: '200px', marginBottom: '20px' }}>
        <label className="form-label">Select Month</label>
        <input type="month" className="form-control" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />
      </div>

      {/* Stats */}
      <div className="row mb-4" style={{ gap: '12px' }}>
        <div className="col stat-card" style={{ background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' }}>
          <div className="stat-card__number text-success">{stats.paidCount}</div>
          <div className="stat-card__label">Paid</div>
          <div style={{ color: 'var(--success)', fontWeight: 600, marginTop: '4px', fontSize: '0.9rem' }}>₹{stats.totalCollected}</div>
        </div>
        <div className="col stat-card" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}>
          <div className="stat-card__number text-danger">{stats.unpaidCount}</div>
          <div className="stat-card__label">Unpaid</div>
          <div style={{ color: 'var(--danger)', fontWeight: 600, marginTop: '4px', fontSize: '0.9rem' }}>₹{stats.totalPending}</div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Grade</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {studentFees.map(item => (
                <tr key={item.student.id}>
                  <td>
                    <Link to={`/fees/student/${item.student.id}`} style={{ color: 'var(--cyan)', textDecoration: 'none', fontWeight: 600 }}>
                      {item.student.name}
                    </Link>
                  </td>
                  <td>{item.student.grade}</td>
                  <td>₹{item.amount}</td>
                  <td>
                    <span className={`badge ${item.status === 'Paid' ? 'badge-success' : 'badge-danger'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    {item.status === 'Unpaid' ? (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleQuickPay(item)}
                        disabled={paying === item.student.id}
                        style={{ gap: '4px' }}
                      >
                        <Icon name="check" size={13} />
                        {paying === item.student.id ? 'Processing...' : 'Mark Paid'}
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-info btn-sm"
                          style={{ gap: '4px', padding: '4px 8px', fontSize: '0.8rem' }}
                          onClick={() => printReceipt({
                            student: item.student,
                            month: selectedMonth,
                            amount: item.amount,
                            paymentDate: item.payment_date,
                            receiptId: item.fee_id
                          })}
                          title="Print Receipt"
                        >
                          <Icon name="download" size={13} /> Receipt
                        </button>
                        <button
                          className="btn btn-success btn-sm"
                          style={{ gap: '4px', padding: '4px 8px', fontSize: '0.8rem', background: '#25D366', borderColor: '#25D366' }}
                          onClick={() => shareReceiptOnWhatsApp({
                            student: item.student,
                            month: selectedMonth,
                            amount: item.amount,
                            paymentDate: item.payment_date,
                            feeId: item.fee_id
                          })}
                          title="Share on WhatsApp"
                        >
                          <Icon name="share" size={13} /> Share
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {studentFees.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>No students found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
