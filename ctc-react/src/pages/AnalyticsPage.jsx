import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAnalyticsData } from '../services/firestore';
import Loader from '../components/Loader';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { subAdminLoggedIn } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await getAnalyticsData();
        setData(res);
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <Loader />;
  if (!data) return <div className="card text-center" style={{ padding: '40px' }}>Failed to load analytics data.</div>;

  const feeChartData = {
    labels: data.fees.months.map(m => {
      const [year, month] = m.split('-');
      const date = new Date(year, month - 1);
      return date.toLocaleString('default', { month: 'short', year: '2-digit' });
    }),
    datasets: [
      {
        label: 'Monthly Fees Collected (₹)',
        data: data.fees.values,
        backgroundColor: 'rgba(37, 99, 235, 0.75)',
        borderColor: '#2563eb',
        borderWidth: 1.5,
        borderRadius: 6,
      }
    ]
  };

  const attendanceChartData = {
    labels: data.attendance.months.map(m => {
      const [year, month] = m.split('-');
      const date = new Date(year, month - 1);
      return date.toLocaleString('default', { month: 'short', year: '2-digit' });
    }),
    datasets: [
      {
        label: 'Average Attendance Rate (%)',
        data: data.attendance.values,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#10b981',
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2
      }
    ]
  };

  const feeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        padding: 10,
        cornerRadius: 6,
        callbacks: {
          label: (context) => ` Collection: ₹${context.raw.toLocaleString('en-IN')}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: {
          callback: (value) => `₹${value.toLocaleString('en-IN')}`,
          color: 'var(--text-muted)'
        }
      },
      x: {
        grid: { display: false },
        ticks: { color: 'var(--text-muted)' }
      }
    }
  };

  const attendanceOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        padding: 10,
        cornerRadius: 6,
        callbacks: {
          label: (context) => ` Attendance Rate: ${context.raw}%`
        }
      }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: {
          callback: (value) => `${value}%`,
          color: 'var(--text-muted)'
        }
      },
      x: {
        grid: { display: false },
        ticks: { color: 'var(--text-muted)' }
      }
    }
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>

        <h2 style={{ margin: 0 }}>Interactive Analytics</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        {/* Fees Collection Chart */}
        {!subAdminLoggedIn && (
          <div className="card">
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Monthly Fee Collections</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Historical payment collection volumes matching all marked fees.</p>
            </div>
            <div style={{ height: '320px', position: 'relative' }}>
              {data.fees.months.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>No fee data available</div>
              ) : (
                <Bar data={feeChartData} options={feeOptions} />
              )}
            </div>
          </div>
        )}

        {/* Attendance Rate Chart */}
        <div className="card">
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Monthly Attendance Rate Trends</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Roll-up attendance rates across all students for the last 6 months.</p>
          </div>
          <div style={{ height: '320px', position: 'relative' }}>
            {data.attendance.months.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>No attendance data available</div>
            ) : (
              <Line data={attendanceChartData} options={attendanceOptions} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
