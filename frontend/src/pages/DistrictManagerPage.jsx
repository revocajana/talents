import { useState, useEffect } from 'react';
import { Header } from '../components/shared';
import * as apiService from '../services/apiService';
import '../styles/dashboard.css';

export default function DistrictManagerPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [allDistricts, setAllDistricts] = useState([]);
  const [schoolsData, setSchoolsData] = useState([]);
  const [wardData, setWardData] = useState([]);
  const [competitionsData, setCompetitionsData] = useState([]);
  const [statsData, setStatsData] = useState([
    { label: 'Schools', value: '0' },
    { label: 'Students', value: '0' },
    { label: 'Talents Registered', value: '0' },
    { label: 'Active Competitions', value: '0' },
  ]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const userRes = await apiService.getCurrentUser();
        setCurrentUser(userRes.data);
        const districtId = userRes.data.school?.district;
        setSelectedDistrict(districtId);
        
        // Fetch all districts for the dropdown
        const districtsRes = await apiService.getDistricts();
        setAllDistricts(districtsRes.data.results || []);
        
        const [schoolsRes, wardsRes, competitionsRes, talentsRes] = await Promise.all([
          apiService.getSchools({ district: districtId }),
          apiService.getWards({ district: districtId }),
          apiService.getCompetitions({ level: 'district' }),
          apiService.getStudentTalents(),
        ]);
        setSchoolsData((schoolsRes.data.results || []).slice(0, 10));
        setWardData((wardsRes.data.results || []).slice(0, 10));
        setCompetitionsData((competitionsRes.data.results || []).slice(0, 10));
        const stats = [
          { label: 'Schools', value: (schoolsRes.data?.count || 0).toString() },
          { label: 'Students', value: '0' },
          { label: 'Talents Registered', value: (talentsRes.data?.count || 0).toString() },
          { label: 'Active Competitions', value: (competitionsRes.data?.count || 0).toString() },
        ];
        setStatsData(stats);
      } catch (err) {
        console.error('Error fetching district dashboard:', err);
        setError(err.response?.data?.detail || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="page-container">
      <Header title="District Manager Dashboard" />
      {error && <div className="error-message" style={{ padding: '1rem', background: '#fee', color: '#c00', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}
      
      {/* District Selector */}
      {!loading && (
        <div style={{ padding: '1.5rem 2rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', maxWidth: '100%' }}>
            <label htmlFor="district-select" style={{ fontWeight: '600', color: '#374151', whiteSpace: 'nowrap' }}>Select District:</label>
            <select
              id="district-select"
              value={selectedDistrict || ''}
              onChange={(e) => setSelectedDistrict(parseInt(e.target.value))}
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
              <option value="">-- Select a District --</option>
              {allDistricts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
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
          {/* District Overview Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>District Overview</h2>
              <p>Key statistics for your district</p>
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

          {/* District Performance Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>District Performance</h2>
              <p>Performance metrics overview</p>
            </div>
            <div className="reports-grid">
              <div className="report-card">
                <h4>Top Schools This Year</h4>
                <ol className="stats-list">
                  <li><span>Central Secondary</span> 580 pts</li>
                  <li><span>District Academy</span> 420 pts</li>
                  <li><span>Tech School</span> 340 pts</li>
                </ol>
              </div>
              <div className="report-card">
                <h4>District Metrics</h4>
                <ul className="stats-list">
                  <li><span>Total Wards:</span> 3</li>
                  <li><span>Teachers Trained:</span> 24</li>
                  <li><span>Competition Participants:</span> 2,340</li>
                </ul>
              </div>
            </div>
          </section>

          {/* District Schools Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>District Schools</h2>
              <p>Schools in your district</p>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>School Name</th>
                    <th>Ward</th>
                    <th>Students</th>
                    <th>Talents</th>
                  </tr>
                </thead>
                <tbody>
                  {schoolsData.length > 0 ? (
                    schoolsData.map((school) => (
                      <tr key={school.id}>
                        <td>{school.name}</td>
                        <td>{school.ward_name || 'N/A'}</td>
                        <td>{school.students_count || '0'}</td>
                        <td>{school.talents_count || '0'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4">No schools found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Ward Managers Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>Ward Managers</h2>
              <p>Manage wards and managers</p>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ward</th>
                    <th>Schools</th>
                    <th>Students</th>
                    <th>Managers</th>
                  </tr>
                </thead>
                <tbody>
                  {wardData.length > 0 ? (
                    wardData.map((ward) => (
                      <tr key={ward.id}>
                        <td>{ward.name}</td>
                        <td>{ward.schools_count || '0'}</td>
                        <td>{ward.students_count || '0'}</td>
                        <td>{'0'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4">No wards found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Competitions Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>District Competitions</h2>
              <p>Manage competitions</p>
            </div>
            <div className="stats-overview">
              <div className="stat-card">
                <p className="stat-label">Planned</p>
                <h3 className="stat-value">5</h3>
              </div>
              <div className="stat-card">
                <p className="stat-label">In Progress</p>
                <h3 className="stat-value">3</h3>
              </div>
              <div className="stat-card">
                <p className="stat-label">Completed</p>
                <h3 className="stat-value">4</h3>
              </div>
            </div>
          </section>

          {/* Reports Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>District Reports</h2>
              <p>Generate and view reports</p>
            </div>
            <div className="reports-grid">
              <div className="report-card">
                <h4>📊 Performance Report</h4>
                <p>School and student performance metrics.</p>
              </div>
              <div className="report-card">
                <h4>🏆 Competition Results</h4>
                <p>Competition results and rankings.</p>
              </div>
              <div className="report-card">
                <h4>📈 Talent Analysis</h4>
                <p>Talent distribution and performance.</p>
              </div>
              <div className="report-card">
                <h4>📅 Annual Summary</h4>
                <p>Year-end comprehensive summary.</p>
              </div>
            </div>
          </section>
        </div>
      </main>
      )}
    </div>
  );
}
