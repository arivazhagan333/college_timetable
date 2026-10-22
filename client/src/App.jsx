import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import FacultyManagement from './pages/FacultyManagement';
import SubjectManagement from './pages/SubjectManagement';
import ClassManagement from './pages/ClassManagement';
import AllocationManagement from './pages/AllocationManagement';
import TimetableEditor from './pages/TimetableEditor';
import MasterTimetable from './pages/MasterTimetable';
import ConflictDashboard from './pages/ConflictDashboard';
import AuditLogs from './pages/AuditLogs';
import SettingsPage from './pages/Settings';

// Route guards
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '100px', textAlign: 'center', color: '#ffffff' }}>Loading Portal...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect staff to staff-dashboard, admins to admin-dashboard
    const redirectPath = user.role === 'Staff' ? '/staff-dashboard' : '/admin-dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

// Main layout wrapper
const Layout = ({ children }) => {
  const { user } = useAuth();
  return (
    <div className="app-container">
      {user && <Sidebar />}
      {children}
    </div>
  );
};

const AppContent = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to={user.role === 'Staff' ? '/staff-dashboard' : '/admin-dashboard'} replace /> : <Login />} 
      />

      {/* Admin Protected Routes */}
      <Route path="/admin-dashboard" element={
        <ProtectedRoute allowedRoles={['Admin', 'Super Admin']}>
          <Layout><AdminDashboard /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/faculty" element={
        <ProtectedRoute allowedRoles={['Admin', 'Super Admin']}>
          <Layout><FacultyManagement /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/subjects" element={
        <ProtectedRoute allowedRoles={['Admin', 'Super Admin']}>
          <Layout><SubjectManagement /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/classes" element={
        <ProtectedRoute allowedRoles={['Admin', 'Super Admin']}>
          <Layout><ClassManagement /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/allocations" element={
        <ProtectedRoute allowedRoles={['Admin', 'Super Admin']}>
          <Layout><AllocationManagement /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/timetable-editor" element={
        <ProtectedRoute allowedRoles={['Admin', 'Super Admin']}>
          <Layout><TimetableEditor /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/master-timetable" element={
        <ProtectedRoute allowedRoles={['Admin', 'Super Admin']}>
          <Layout><MasterTimetable /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/conflicts" element={
        <ProtectedRoute allowedRoles={['Admin', 'Super Admin']}>
          <Layout><ConflictDashboard /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/audit-logs" element={
        <ProtectedRoute allowedRoles={['Admin', 'Super Admin']}>
          <Layout><AuditLogs /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRoute allowedRoles={['Admin', 'Super Admin']}>
          <Layout><SettingsPage /></Layout>
        </ProtectedRoute>
      } />

      {/* Staff Protected Routes */}
      <Route path="/staff-dashboard" element={
        <ProtectedRoute allowedRoles={['Staff', 'Admin', 'Super Admin']}>
          <Layout><StaffDashboard /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/my-timetable" element={
        <ProtectedRoute allowedRoles={['Staff', 'Admin', 'Super Admin']}>
          <Layout><StaffDashboard /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/my-subjects" element={
        <ProtectedRoute allowedRoles={['Staff', 'Admin', 'Super Admin']}>
          <Layout><StaffDashboard /></Layout>
        </ProtectedRoute>
      } />

      {/* Default Route */}
      <Route 
        path="*" 
        element={<Navigate to={user ? (user.role === 'Staff' ? '/staff-dashboard' : '/admin-dashboard') : '/login'} replace />} 
      />
    </Routes>
  );
};

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
