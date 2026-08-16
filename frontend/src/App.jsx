import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import TalentAdminPage from './pages/TalentAdminPage';
import RegionManagerPage from './pages/RegionManagerPage';
import ZoneManagerPage from './pages/ZoneManagerPage';
import DistrictManagerPage from './pages/DistrictManagerPage';
import WardManagerPage from './pages/WardManagerPage';
import HeadTeacherPage from './pages/HeadTeacherPage';
import SportTeacherPage from './pages/SportTeacherPage';
import './App.css';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { isAuthenticated, user, checkAuth } = useAuth();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route
        path="/dashboard/talent-admin"
        element={
          <ProtectedRoute requiredRole="talent_admin">
            <TalentAdminPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/dashboard/region-manager"
        element={
          <ProtectedRoute requiredRole="region_manager">
            <RegionManagerPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/dashboard/zone-manager"
        element={
          <ProtectedRoute requiredRole="zone_manager">
            <ZoneManagerPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/dashboard/district-manager"
        element={
          <ProtectedRoute requiredRole="district_manager">
            <DistrictManagerPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/dashboard/ward-manager"
        element={
          <ProtectedRoute requiredRole="ward_manager">
            <WardManagerPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/dashboard/head-teacher"
        element={
          <ProtectedRoute requiredRole="head_teacher">
            <HeadTeacherPage />
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
