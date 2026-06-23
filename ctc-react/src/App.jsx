import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import EditStudentPage from './pages/EditStudentPage';
import AttendancePage from './pages/AttendancePage';
import ActivityReportPage from './pages/ActivityReportPage';
import FeesPage from './pages/FeesPage';
import StudentFeesPage from './pages/StudentFeesPage';
import AllReportsPage from './pages/AllReportsPage';
import ParentDashboardPage from './pages/ParentDashboardPage';
import ParentActivityReportPage from './pages/ParentActivityReportPage';

function AdminRoute({ children }) {
  const { adminLoggedIn } = useAuth();
  return adminLoggedIn ? children : <Navigate to="/login" replace />;
}

function ParentRoute({ children }) {
  const { parentPhone } = useAuth();
  return parentPhone ? children : <Navigate to="/login" replace />;
}

function IndexRedirect() {
  const { adminLoggedIn, parentPhone } = useAuth();
  if (adminLoggedIn) return <Navigate to="/dashboard" replace />;
  if (parentPhone) return <Navigate to="/parent" replace />;
  return <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<IndexRedirect />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Admin Routes */}
        <Route path="/dashboard" element={<AdminRoute><DashboardPage /></AdminRoute>} />
        <Route path="/students" element={<AdminRoute><StudentsPage /></AdminRoute>} />
        <Route path="/students/:id/edit" element={<AdminRoute><EditStudentPage /></AdminRoute>} />
        <Route path="/students/:studentId/report" element={<AdminRoute><ActivityReportPage /></AdminRoute>} />
        <Route path="/attendance" element={<AdminRoute><AttendancePage /></AdminRoute>} />
        <Route path="/fees" element={<AdminRoute><FeesPage /></AdminRoute>} />
        <Route path="/fees/student/:studentId" element={<AdminRoute><StudentFeesPage /></AdminRoute>} />
        <Route path="/reports" element={<AdminRoute><AllReportsPage /></AdminRoute>} />

        {/* Parent Routes */}
        <Route path="/parent" element={<ParentRoute><ParentDashboardPage /></ParentRoute>} />
        <Route path="/parent/activity/:studentId" element={<ParentRoute><ParentActivityReportPage /></ParentRoute>} />

        {/* 404 */}
        <Route path="*" element={
          <div className="card" style={{ textAlign: 'center', padding: '60px', marginTop: '40px' }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🚫</div>
            <h2>404 — Page Not Found</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>The page you're looking for doesn't exist.</p>
          </div>
        } />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
