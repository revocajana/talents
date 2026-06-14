import { useEffect, useState } from 'react';
import AppBar from '../components/AppBar';
import './admin.css';

async function fetchWithAuth(url, options = {}) {
  let auth = JSON.parse(localStorage.getItem('talents_auth') || '{}');
  if (!options.headers) {
    options.headers = {};
  }
  options.headers['Authorization'] = `Bearer ${auth.accessToken}`;

  let res = await fetch(url, options);

  if (res.status === 401 && auth.refreshToken) {
    try {
      const refreshRes = await fetch('/api/token/refresh/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: auth.refreshToken }),
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        auth.accessToken = refreshData.access;
        localStorage.setItem('talents_auth', JSON.stringify(auth));

        options.headers['Authorization'] = `Bearer ${auth.accessToken}`;
        res = await fetch(url, options);
      }
    } catch (err) {
      console.error('Failed to refresh token:', err);
    }
  }

  return res;
}

export default function TalentAdminPage({ onLogout }) {
  const [stats, setStats] = useState({
    schools: 0,
    sport_teachers: 0,
    district_managers: 0,
    head_teachers: 0,
    ward_managers: 0,
    admins: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetchWithAuth('/api/users/stats/');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };

    fetchStats();
  }, []);

  const [usersExpanded, setUsersExpanded] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState('');

  const handleToggleUsers = async () => {
    const nextState = !usersExpanded;
    setUsersExpanded(nextState);
    if (nextState && users.length === 0) {
      setLoadingUsers(true);
      setUsersError('');
      try {
        const res = await fetchWithAuth('/api/users/');
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        } else {
          const errData = await res.json().catch(() => null);
          const detail = errData?.detail || errData?.message || `HTTP ${res.status}`;
          setUsersError(`Failed to load users: ${detail}`);
        }
      } catch (err) {
        setUsersError(`Error connecting to server: ${err.message || err}`);
      } finally {
        setLoadingUsers(false);
      }
    }
  };

  return (
    <div className="admin-shell">
      <AppBar
        userName="Talent Admin"
        onLogout={onLogout}
        onProfile={() => {
          window.alert('Profile action not implemented yet.');
        }}
        onChangePassword={() => {
          window.alert('Change password action not implemented yet.');
        }}
      />

      <div className="admin-grid">
        <section className="admin-card admin-card-large">
          <h2>Overview</h2>
          <div className="admin-metrics">
            <div className="admin-metric">
              <span className="admin-metric-value">{stats.schools}</span>
              <span className="admin-metric-label">Schools</span>
            </div>
            <div className="admin-metric">
              <span className="admin-metric-value">{stats.sport_teachers}</span>
              <span className="admin-metric-label">Sport Teachers</span>
            </div>
            <div className="admin-metric">
              <span className="admin-metric-value">{stats.district_managers}</span>
              <span className="admin-metric-label">District Managers</span>
            </div>
            <div className="admin-metric">
              <span className="admin-metric-value">{stats.head_teachers}</span>
              <span className="admin-metric-label">Head Teachers</span>
            </div>
            <div className="admin-metric">
              <span className="admin-metric-value">{stats.ward_managers}</span>
              <span className="admin-metric-label">Ward Managers</span>
            </div>
            <div className="admin-metric">
              <span className="admin-metric-value">{stats.admins}</span>
              <span className="admin-metric-label">Admins</span>
            </div>
          </div>
        </section>

        <section className="admin-card">
          <p className="admin-card-label">System alerts</p>
          <ul className="admin-activity">
            <li>High talent registration spike in Dar region</li>
            <li>Competition deadline approaching in 2 days</li>
            <li>Results pending approval from 3 districts</li>
          </ul>
        </section>

        <section className="admin-card">
          <p className="admin-card-label">Management desk</p>
          <ul className="admin-actions">
            <li
              onClick={handleToggleUsers}
              style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>Users</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>{usersExpanded ? '▲' : '▼'}</span>
            </li>
            <li>Manage competition schedules</li>
            <li>Oversee regional managers</li>
            <li>Monitor result submissions</li>
          </ul>
        </section>

        {usersExpanded && (
          <section className="admin-card admin-card-large">
            <p className="admin-card-label">User Details</p>
            <div
              className="users-expand-container"
              style={{
                marginTop: '16px',
                background: '#ffffff',
                padding: '0px',
              }}
            >
              {loadingUsers ? (
                <div style={{ color: 'var(--color-text-light)' }}>Loading users...</div>
              ) : usersError ? (
                <div style={{ color: 'red' }}>{usersError}</div>
              ) : users.length === 0 ? (
                <div style={{ color: 'var(--color-text-light)' }}>No users found.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                        <th style={{ padding: '12px 8px' }}>Username</th>
                        <th style={{ padding: '12px 8px' }}>Full Name</th>
                        <th style={{ padding: '12px 8px' }}>Email</th>
                        <th style={{ padding: '12px 8px' }}>Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '12px 8px', fontWeight: '600' }}>{u.username}</td>
                          <td style={{ padding: '12px 8px' }}>{`${u.first_name || ''} ${u.last_name || ''}`.trim() || 'N/A'}</td>
                          <td style={{ padding: '12px 8px' }}>{u.email || 'N/A'}</td>
                          <td style={{ padding: '12px 8px' }}>
                            <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '4px 12px', borderRadius: '999px', fontSize: '0.8rem', textTransform: 'capitalize' }}>
                              {(u.role || '').replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
