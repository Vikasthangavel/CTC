import { useState, useEffect } from 'react';
import { getAllParentReports, getStudents } from '../services/firestore';
import Loader from '../components/Loader';
import Icon from '../components/Icon';
import { useNavigate } from 'react-router-dom';

export default function AllReportsPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [students, setStudents] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    async function load() {
      const [res, studs] = await Promise.all([getAllParentReports(null, 10), getStudents(false)]);
      const smap = {};
      studs.forEach(s => { smap[s.id] = s; });
      setStudents(smap);
      setReports(res.reports.map(r => ({ ...r, student: smap[r.student_id] })));
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
      setLoading(false);
    }
    load();
  }, []);

  async function handleLoadMore() {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await getAllParentReports(lastDoc, 10);
      const newReports = res.reports.map(r => ({ ...r, student: students[r.student_id] }));
      setReports(prev => [...prev, ...newReports]);
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
    } catch (err) {
      console.error('Error loading more reports:', err);
    } finally {
      setLoadingMore(false);
    }
  }

  function formatDate(val) {
    if (!val) return '';
    if (val?.toDate) return val.toDate().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    return String(val).slice(0, 16);
  }

  if (loading) return <Loader />;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/dashboard')}>
          <Icon name="arrowLeft" size={14} /> Back
        </button>
        <h2 style={{ margin: 0 }}>All Parent Reports</h2>
      </div>

      <div className="card">
        <div className="list-group">
          {reports.length === 0 && (
            <div className="list-group-item text-center text-muted" style={{ padding: '40px' }}>
              <Icon name="inbox" size={40} style={{ opacity: 0.3, display: 'block', margin: '0 auto 8px' }} />
              No reports received yet.
            </div>
          )}
          {reports.map(r => (
            <div key={r.id} className="list-group-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div>
                  <span className="fw-bold text-warning">{r.student?.name || 'Unknown Student'}</span>
                  {r.student?.grade && <span className="badge badge-secondary" style={{ marginLeft: '8px' }}>Grade {r.student.grade}</span>}
                </div>
                <small style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{formatDate(r.report_date)}</small>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.75, whiteSpace: 'pre-wrap' }}>{r.message}</p>
            </div>
          ))}
        </div>
      </div>

      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            className="btn btn-secondary"
            onClick={handleLoadMore}
            disabled={loadingMore}
            style={{ minWidth: '150px' }}
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </>
  );
}
