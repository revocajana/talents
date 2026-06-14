import { useEffect, useState } from 'react';
import AppBar from '../components/AppBar';
import './admin.css';

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
        const auth = JSON.parse(localStorage.getItem('talents_auth') || '{}');
        const res = await fetch('/api/users/stats/', {
          headers: {
            Authorization: `Bearer ${auth.accessToken}`,
          },
        });
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
          <p className="admin-card-label">Management Tasks</p>
          <ul className="admin-actions">
            <li>Review talent submissions</li>
            <li>Manage competition schedules</li>
            <li>Oversee regional managers</li>
            <li>Monitor result submissions</li>
          </ul>
        </section>

        <section className="admin-card">
          <p className="admin-card-label">System alerts</p>
          <ul className="admin-activity">
            <li>High talent registration spike in Dar region</li>
            <li>Competition deadline approaching in 2 days</li>
            <li>Results pending approval from 3 districts</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
