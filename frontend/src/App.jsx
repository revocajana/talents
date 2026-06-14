import { useEffect, useState } from 'react';
import AuthPage from './pages/auth';
import AdminPage from './pages/admin';
import TalentAdminPage from './pages/TalentAdminPage';
import RegionManagerPage from './pages/RegionManagerPage';
import ZoneManagerPage from './pages/ZoneManagerPage';
import DistrictManagerPage from './pages/DistrictManagerPage';
import WardManagerPage from './pages/WardManagerPage';
import HeadTeacherPage from './pages/HeadTeacherPage';
import SportTeacherPage from './pages/SportTeacherPage';
import StudentPage from './pages/StudentPage';
import ParentPage from './pages/ParentPage';

const AUTH_STORAGE_KEY = 'talents_auth';

const loadStoredAuth = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveStoredAuth = (auth) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
};

const clearStoredAuth = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

function App() {
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedAuth = loadStoredAuth();
    if (!storedAuth?.accessToken) {
      setLoading(false);
      return;
    }

    const validate = async () => {
      try {
        const userRes = await fetch('/api/users/current/', {
          headers: {
            Authorization: `Bearer ${storedAuth.accessToken}`,
          },
        });

        if (userRes.ok) {
          const userData = await userRes.json();
          const refreshedAuth = {
            ...storedAuth,
            role: userData.role,
            username: userData.username,
          };
          setAuth(refreshedAuth);
          saveStoredAuth(refreshedAuth);
          return;
        }

        if (userRes.status === 401 && storedAuth.refreshToken) {
          const refreshRes = await fetch('/api/token/refresh/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh: storedAuth.refreshToken }),
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            const retryAuth = {
              ...storedAuth,
              accessToken: refreshData.access,
            };
            saveStoredAuth(retryAuth);
            const retryUserRes = await fetch('/api/users/current/', {
              headers: {
                Authorization: `Bearer ${retryAuth.accessToken}`,
              },
            });
            if (retryUserRes.ok) {
              const userData = await retryUserRes.json();
              const finalAuth = {
                ...retryAuth,
                role: userData.role,
                username: userData.username,
              };
              setAuth(finalAuth);
              saveStoredAuth(finalAuth);
              return;
            }
          }
        }
      } catch {
        // ignore and fall back to login
      } finally {
        setLoading(false);
      }

      clearStoredAuth();
      setAuth(null);
      setLoading(false);
    };

    validate();
  }, []);

  const handleLogin = ({ role, accessToken, refreshToken, username }) => {
    const nextAuth = { role, accessToken, refreshToken, username };
    setAuth(nextAuth);
    saveStoredAuth(nextAuth);
  };

  const handleLogout = () => {
    clearStoredAuth();
    setAuth(null);
  };

  if (loading) {
    return <div style={{ padding: '32px', textAlign: 'center' }}>Loading session...</div>;
  }

  if (!auth) {
    return <AuthPage onLogin={handleLogin} />;
  }

  switch (auth.role) {
    case 'admin':
      return <AdminPage onLogout={handleLogout} />;
    case 'talent_admin':
      return <TalentAdminPage onLogout={handleLogout} username={auth.username} />;
    case 'region_manager':
      return <RegionManagerPage onLogout={handleLogout} />;
    case 'zone_manager':
      return <ZoneManagerPage onLogout={handleLogout} />;
    case 'district_manager':
      return <DistrictManagerPage onLogout={handleLogout} />;
    case 'ward_manager':
      return <WardManagerPage onLogout={handleLogout} />;
    case 'head_teacher':
      return <HeadTeacherPage onLogout={handleLogout} />;
    case 'sport_teacher':
      return <SportTeacherPage onLogout={handleLogout} />;
    case 'student':
      return <StudentPage onLogout={handleLogout} />;
    case 'parent':
      return <ParentPage onLogout={handleLogout} />;
    default:
      return <AuthPage onLogin={handleLogin} />;
  }
}

export default App;
