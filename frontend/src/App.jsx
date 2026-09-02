import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import CommonDashboardPage from './pages/CommonDashboardPage';
import SportTeacherPage from './pages/SportTeacherPage';
import SchoolRegistrationPage from './pages/SchoolRegistrationPage';
import './App.css';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, authReady, user } = useAuth();

  if (!authReady) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Checking session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { isAuthenticated, authReady, user } = useAuth();

  if (!authReady) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Checking session...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register-school" element={<SchoolRegistrationPage />} />
      
      <Route
        path="/dashboard/talent-admin"
        element={
          <ProtectedRoute requiredRole="talent_admin">
            <CommonDashboardPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/dashboard/region-manager"
        element={
          <ProtectedRoute requiredRole="region_manager">
            <CommonDashboardPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/dashboard/zone-manager"
        element={
          <ProtectedRoute requiredRole="zone_manager">
            <CommonDashboardPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/dashboard/district-manager"
        element={
          <ProtectedRoute requiredRole="district_manager">
            <CommonDashboardPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/dashboard/ward-manager"
        element={
          <ProtectedRoute requiredRole="ward_manager">
            <CommonDashboardPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/dashboard/head-teacher"
        element={
          <ProtectedRoute requiredRole="head_teacher">
            <CommonDashboardPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/dashboard/sport-teacher"
        element={
          <ProtectedRoute requiredRole="sport_teacher">
            <SportTeacherPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/student"
        element={
          <ProtectedRoute requiredRole="student">
            <CommonDashboardPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate
              to={`/dashboard/${user?.role.replace('_', '-')}`}
              replace
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
