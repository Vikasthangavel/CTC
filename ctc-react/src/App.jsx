import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import UpdatePrompt from './components/UpdatePrompt';

import LoginPage from './pages/LoginPage';
import PublicReceiptPage from './pages/PublicReceiptPage';
import DashboardPage from './pages/DashboardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import StudentsPage from './pages/StudentsPage';
import EditStudentPage from './pages/EditStudentPage';
import AttendancePage from './pages/AttendancePage';
import ActivityReportPage from './pages/ActivityReportPage';
import FeesPage from './pages/FeesPage';
import StudentFeesPage from './pages/StudentFeesPage';
import AllReportsPage from './pages/AllReportsPage';
// Parent pages
import ParentHomePage from './pages/ParentHomePage';
import ParentActivityPage from './pages/ParentActivityPage';
import ParentFeesPage from './pages/ParentFeesPage';
import ParentReportPage from './pages/ParentReportPage';
import ParentActivityReportPage from './pages/ParentActivityReportPage';
import DeveloperPage from './pages/DeveloperPage';

function AdminRoute({ children }) {
  const { adminLoggedIn, subAdminLoggedIn } = useAuth();
  return (adminLoggedIn || subAdminLoggedIn) ? children : <Navigate to="/login" replace />;
}

function SuperAdminRoute({ children }) {
  const { adminLoggedIn } = useAuth();
  return adminLoggedIn ? children : <Navigate to="/dashboard" replace />;
}

function ParentRoute({ children }) {
  const { parentPhone } = useAuth();
  return parentPhone ? children : <Navigate to="/login" replace />;
}

function DeveloperRoute({ children }) {
  const { developerLoggedIn } = useAuth();
  return developerLoggedIn ? children : <Navigate to="/login" replace />;
}

function IndexRedirect() {
  const { adminLoggedIn, subAdminLoggedIn, parentPhone, developerLoggedIn } = useAuth();
  if (developerLoggedIn) return <Navigate to="/developer" replace />;
  if (adminLoggedIn || subAdminLoggedIn) return <Navigate to="/dashboard" replace />;
  if (parentPhone) return <Navigate to="/parent" replace />;
  return <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<IndexRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/receipt/:feeId" element={<PublicReceiptPage />} />

        {/* Admin Routes */}
        <Route path="/dashboard" element={<AdminRoute><DashboardPage /></AdminRoute>} />
        <Route path="/students" element={<AdminRoute><StudentsPage /></AdminRoute>} />
        <Route path="/students/:id/edit" element={<SuperAdminRoute><EditStudentPage /></SuperAdminRoute>} />
        <Route path="/students/:studentId/report" element={<AdminRoute><ActivityReportPage /></AdminRoute>} />
        <Route path="/attendance" element={<AdminRoute><AttendancePage /></AdminRoute>} />
        <Route path="/fees" element={<SuperAdminRoute><FeesPage /></SuperAdminRoute>} />
        <Route path="/fees/student/:studentId" element={<SuperAdminRoute><StudentFeesPage /></SuperAdminRoute>} />
        <Route path="/reports" element={<AdminRoute><AllReportsPage /></AdminRoute>} />
        <Route path="/analytics" element={<AdminRoute><AnalyticsPage /></AdminRoute>} />

        {/* Parent Routes */}
        <Route path="/parent" element={<ParentRoute><ParentHomePage /></ParentRoute>} />
        <Route path="/parent/activity" element={<ParentRoute><ParentActivityPage /></ParentRoute>} />
        <Route path="/parent/fees" element={<ParentRoute><ParentFeesPage /></ParentRoute>} />
        <Route path="/parent/report" element={<ParentRoute><ParentReportPage /></ParentRoute>} />
        {/* Keep old full-report deep link */}
        <Route path="/parent/activity/:studentId" element={<ParentRoute><ParentActivityReportPage /></ParentRoute>} />

        {/* Developer Routes */}
        <Route path="/developer" element={<DeveloperRoute><DeveloperPage /></DeveloperRoute>} />

        {/* 404 */}
        <Route path="*" element={
          <div className="card" style={{ textAlign: 'center', padding: '60px', marginTop: '40px' }}>
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
          <UpdatePrompt />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
