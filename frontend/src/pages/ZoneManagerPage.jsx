import { useState, useEffect } from 'react';
import { Header } from '../components/shared';
import * as apiService from '../services/apiService';
import '../styles/dashboard.css';

export default function ZoneManagerPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [allZones, setAllZones] = useState([]);
  const [regionsData, setRegionsData] = useState([]);
  const [competitionsData, setCompetitionsData] = useState([]);
  const [statsData, setStatsData] = useState([
    { label: 'Regions in Zone', value: '0' },
    { label: 'Total Schools', value: '0' },
    { label: 'Total Students', value: '0' },
    { label: 'Zone Competitions', value: '0' },
  ]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const userRes = await apiService.getCurrentUser();
        setCurrentUser(userRes.data);
        const zoneId = userRes.data.school?.zone;
        setSelectedZone(zoneId);
        
        // Fetch all zones for the dropdown
        const zonesRes = await apiService.getZones();
        setAllZones(zonesRes.data.results || []);
        
        const [regionsRes, competitionsRes, schoolsRes, studentsRes] = await Promise.all([
          apiService.getRegions({ zone: zoneId }),
          apiService.getCompetitions({ level: 'zone' }),
          apiService.getSchools({ zone: zoneId }),
          apiService.getStudents(),
        ]);
        setRegionsData((regionsRes.data.results || []).slice(0, 10));
        setCompetitionsData((competitionsRes.data.results || []).slice(0, 10));
        const stats = [
          { label: 'Regions in Zone', value: (regionsRes.data?.count || 0).toString() },
          { label: 'Total Schools', value: (schoolsRes.data?.count || 0).toString() },
          { label: 'Total Students', value: (studentsRes.data?.count || 0).toString() },
          { label: 'Zone Competitions', value: (competitionsRes.data?.count || 0).toString() },
        ];
        setStatsData(stats);
      } catch (err) {
        console.error('Error fetching zone dashboard:', err);
        setError(err.response?.data?.detail || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="page-container">
      <Header title="Zone Manager Dashboard" />
      {error && <div className="error-message" style={{ padding: '1rem', background: '#fee', color: '#c00', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}
      
      {/* Zone Selector */}
      {!loading && (
        <div style={{ padding: '1.5rem 2rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', maxWidth: '100%' }}>
            <label htmlFor="zone-select" style={{ fontWeight: '600', color: '#374151', whiteSpace: 'nowrap' }}>Select Zone:</label>
            <select
              id="zone-select"
              value={selectedZone || ''}
              onChange={(e) => setSelectedZone(parseInt(e.target.value))}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '0.95rem',
                backgroundColor: '#fff',
                cursor: 'pointer',
                minWidth: '200px',
              }}
            >
              <option value="">-- Select a Zone --</option>
              {allZones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading dashboard...</div>
      ) : (
      <main className="admin-content">
        <div className="cards-container">
          {/* Zone Overview Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>Zone Overview</h2>
              <p>Key statistics for your zone</p>
            </div>
            <div className="stats-overview">
              {statsData.map((stat, idx) => (
                <div key={idx} className="stat-card">
                  <p className="stat-label">{stat.label}</p>
                  <h3 className="stat-value">{stat.value}</h3>
                </div>
              ))}
            </div>
          </section>

          {/* Zone Rankings Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>Zone Rankings</h2>
              <p>Performance across regions</p>
            </div>
            <div className="reports-grid">
              <div className="report-card">
                <h4>Top Regions</h4>
                <ol className="stats-list">
                  <li><span>Coastal Region</span> 2,456 pts</li>
                  <li><span>Lake Region</span> 1,890 pts</li>
                  <li><span>Mountain Region</span> 1,234 pts</li>
                </ol>
              </div>
              <div className="report-card">
                <h4>Zone Statistics</h4>
                <ul className="stats-list">
                  <li><span>Active Competitions:</span> 42</li>
                  <li><span>Completed Events:</span> 28</li>
                  <li><span>Total Participants:</span> 8,940</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Regions Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>Regions in Zone</h2>
              <p>Regions under your zone</p>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Region</th>
                    <th>Schools</th>
                    <th>Students</th>
                    <th>Talents</th>
                  </tr>
                </thead>
                <tbody>
                  {regionsData.length > 0 ? (
                    regionsData.map((region) => (
                      <tr key={region.id}>
                        <td>{region.name}</td>
                        <td>{region.schools_count || '0'}</td>
                        <td>{region.students_count || '0'}</td>
                        <td>{region.talents_count || '0'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4">No regions found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Student Management Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>Student Management</h2>
              <p>Zone-wide student data</p>
            </div>
            <div className="reports-grid">
              <div className="report-card">
                <h4>Export Options</h4>
                <ul className="stats-list">
                  <li>📥 Export All Students</li>
                  <li>📥 Export by Talent</li>
                  <li>📥 Export by Region</li>
                </ul>
              </div>
              <div className="report-card">
                <h4>Student Summary</h4>
                <ul className="stats-list">
                  <li><span>Total Students:</span> 31,200</li>
                  <li><span>With Registered Talents:</span> 9,650</li>
                  <li><span>Competition Participants:</span> 5,890</li>
                  <li><span>Award Winners:</span> 1,240</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Competitions Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>Zone Competitions</h2>
              <p>Competitions at zone level</p>
            </div>
            <div className="stats-overview">
              <div className="stat-card">
                <p className="stat-label">Active</p>
                <h3 className="stat-value">8</h3>
              </div>
              <div className="stat-card">
                <p className="stat-label">Upcoming</p>
                <h3 className="stat-value">12</h3>
              </div>
              <div className="stat-card">
                <p className="stat-label">Completed</p>
                <h3 className="stat-value">22</h3>
              </div>
            </div>
          </section>

          {/* Analytics Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>Zone Analytics</h2>
              <p>Reports and insights</p>
            </div>
            <div className="reports-grid">
              <div className="report-card">
                <h4>📊 Performance Report</h4>
                <p>View zone-wide performance across all regions.</p>
              </div>
              <div className="report-card">
                <h4>🏆 Competition Analysis</h4>
                <p>Analyze competition results and trends.</p>
              </div>
              <div className="report-card">
                <h4>🎯 Talent Distribution</h4>
                <p>Talent spread across regions and schools.</p>
              </div>
            </div>
          </section>
        </div>
      </main>
      )}
    </div>
  );
}
