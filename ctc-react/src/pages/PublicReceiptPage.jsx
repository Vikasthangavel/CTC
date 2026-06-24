import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFee, getStudent } from '../services/firestore';
import Loader from '../components/Loader';
import Icon from '../components/Icon';

export default function PublicReceiptPage() {
  const { feeId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [fee, setFee] = useState(null);
  const [student, setStudent] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const feeData = await getFee(feeId);
        if (feeData) {
          setFee(feeData);
          const studentData = await getStudent(feeData.student_id);
          setStudent(studentData);
        }
      } catch (error) {
        console.error('Error fetching receipt data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [feeId]);

  if (loading) return <Loader />;

  if (!fee || !student) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '20px' }}>
        <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '40px' }}>
          <Icon name="close" size={48} style={{ color: 'var(--danger)', marginBottom: '16px', opacity: 0.8 }} />
          <h3>Receipt Not Found</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px', marginBottom: '24px' }}>
            The receipt link is invalid or the record no longer exists.
          </p>
          <button className="btn btn-secondary" onClick={() => navigate('/login')} style={{ width: '100%' }}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const generatedId = fee.id || `REC-${fee.month_year.replace('-', '')}-${student.id.slice(0, 4).toUpperCase()}`;

  return (
    <div className="receipt-view" style={{ maxWidth: '600px', margin: '30px auto', padding: '10px' }}>
      
      {/* Action Buttons (Hidden when printing) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '10px' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => window.close()} style={{ gap: '4px' }}>
          <Icon name="close" size={13} /> Close Window
        </button>
        <button className="btn btn-primary" onClick={() => window.print()} style={{ gap: '6px' }}>
          <Icon name="download" size={15} /> Print / Save PDF
        </button>
      </div>

      {/* Invoice Card */}
      <div className="card" style={{ padding: '30px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--primary)', paddingBottom: '16px', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/logo.png" alt="CTC Logo" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'contain' }} onerror="this.style.display='none';" />
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, background: 'linear-gradient(90deg, var(--primary), var(--cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Challengers TC
            </h2>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text)' }}>FEE RECEIPT</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>ID: {generatedId}</span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="row" style={{ gap: '16px', marginBottom: '24px' }}>
          
          {/* Student Details */}
          <div className="col" style={{ minWidth: '220px' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 700 }}>
              Student Details
            </div>
            <div style={{ background: 'var(--surface-2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.88rem' }}>
              <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Name:</span>
                <span className="fw-bold">{student.name}</span>
              </div>
              <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Grade:</span>
                <span className="fw-bold">Grade {student.grade}</span>
              </div>
              {student.blood_group && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Blood Group:</span>
                  <span className="fw-bold">{student.blood_group}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Details */}
          <div className="col" style={{ minWidth: '220px' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 700 }}>
              Payment Details
            </div>
            <div style={{ background: 'var(--surface-2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.88rem' }}>
              <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Parent:</span>
                <span className="fw-bold">{student.parent_name}</span>
              </div>
              <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Contact:</span>
                <span className="fw-bold">{student.parent_contact}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Paid Date:</span>
                <span className="fw-bold">{fee.payment_date || 'N/A'}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Invoice Item Table */}
        <div className="table-wrapper" style={{ marginBottom: '24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Description</th>
                <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Month</th>
                <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ textAlign: 'right', padding: '10px 8px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 8px', fontSize: '0.9rem', fontWeight: 600 }}>Monthly Tuition Fee</td>
                <td style={{ padding: '12px 8px', fontSize: '0.9rem' }}>{fee.month_year}</td>
                <td style={{ padding: '12px 8px' }}><span className="badge badge-success">PAID</span></td>
                <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>₹{fee.amount}</td>
              </tr>
              <tr>
                <td colSpan="3" style={{ textAlign: 'right', padding: '16px 8px 8px', fontWeight: 600, fontSize: '0.9rem' }}>Total Paid:</td>
                <td style={{ textAlign: 'right', padding: '16px 8px 8px', fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>₹{fee.amount}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Notice Info Box */}
        <div style={{ border: '1px dashed var(--primary-border)', backgroundColor: 'var(--primary-bg)', padding: '12px 16px', borderRadius: '8px', fontSize: '0.82rem', color: 'var(--primary)', textAlign: 'center', fontWeight: 500, marginBottom: '24px' }}>
          Thank you for the payment! This is an electronically generated receipt. No signature required.
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          Powered by <a href="https://www.time2orders.com" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>time2innovate</a> | Engineered by Vikas
        </div>

      </div>

      {/* Style overrides for printing to hide navigation/buttons */}
      <style>{`
        @media print {
          .no-print, nav, footer, .sidebar-nav, .top-nav, .bottom-nav {
            display: none !important;
          }
          body {
            background-color: white !important;
            color: black !important;
            padding: 0 !important;
          }
          .receipt-view {
            margin: 0 !important;
            max-width: 100% !important;
            padding: 0 !important;
          }
          .card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            background: transparent !important;
          }
        }
      `}</style>
    </div>
  );
}
