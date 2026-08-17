import { useState, useEffect } from 'react';
import { Header } from '../components/shared';
import * as apiService from '../services/apiService';
import '../styles/dashboard.css';

export default function RegionManagerPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [allRegions, setAllRegions] = useState([]);
  const [schoolsData, setSchoolsData] = useState([]);
  const [competitionsData, setCompetitionsData] = useState([]);
  const [resultsSummary, setResultsSummary] = useState([]);
  const [statsData, setStatsData] = useState([
    { label: 'Schools in Region', value: '0' },
    { label: 'Students', value: '0' },
    { label: 'Active Talents', value: '0' },
    { label: 'Competitions', value: '0' },
  ]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const userRes = await apiService.getCurrentUser();
        setCurrentUser(userRes.data);
        const regionId = userRes.data.school?.region;
        setSelectedRegion(regionId);
        
        // Fetch all regions for the dropdown
        const regionsRes = await apiService.getRegions();
        setAllRegions(regionsRes.data.results || []);
        
        const [schoolsRes, competitionsRes, studentsRes] = await Promise.all([
          apiService.getSchools({ region: regionId }),
          apiService.getCompetitions({ level: 'region' }),
          apiService.getStudents(),
        ]);
        setSchoolsData((schoolsRes.data.results || []).slice(0, 10));
        setCompetitionsData((competitionsRes.data.results || []).slice(0, 5));
        setResultsSummary((schoolsRes.data.results || []).slice(0, 5));
        const stats = [
          { label: 'Schools in Region', value: (schoolsRes.data?.count || 0).toString() },
          { label: 'Students', value: (studentsRes.data?.count || 0).toString() },
          { label: 'Active Talents', value: '0' },
          { label: 'Competitions', value: (competitionsRes.data?.count || 0).toString() },
        ];
        setStatsData(stats);
      } catch (err) {
        console.error('Error fetching region dashboard:', err);
        setError(err.response?.data?.detail || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="page-container">
      <Header title="Region Manager Dashboard" />
      {error && <div className="error-message" style={{ padding: '1rem', background: '#fee', color: '#c00', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}
      
      {/* Region Selector */}
      {!loading && (
        <div style={{ padding: '1.5rem 2rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', maxWidth: '100%' }}>
            <label htmlFor="region-select" style={{ fontWeight: '600', color: '#374151', whiteSpace: 'nowrap' }}>Select Region:</label>
            <select
              id="region-select"
              value={selectedRegion || ''}
              onChange={(e) => setSelectedRegion(parseInt(e.target.value))}
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
              <option value="">-- Select a Region --</option>
              {allRegions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
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
          {/* Overview Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>Regional Overview</h2>
              <p>Key statistics for your region</p>
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

          {/* Performance Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>Performance Metrics</h2>
              <p>Regional performance overview</p>
            </div>
            <div className="reports-grid">
              <div className="report-card">
                <h4>Top Performing Schools</h4>
                <ol className="stats-list">
                  <li><span>Dar Es Salaam Secondary</span> 256 points</li>
                  <li><span>Coast Region School</span> 198 points</li>
                  <li><span>Regional Academy</span> 176 points</li>
                </ol>
              </div>
              <div className="report-card">
                <h4>Talent Distribution</h4>
                <ul className="stats-list">
                  <li><span>Sports:</span> 1,240</li>
                  <li><span>Music:</span> 856</li>
                  <li><span>Technology:</span> 620</li>
                  <li><span>Arts:</span> 524</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Schools Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>Region Schools</h2>
              <p>All schools in your region</p>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>School Name</th>
                    <th>District</th>
                    <th>Students</th>
                    <th>Talents</th>
                  </tr>
                </thead>
                <tbody>
                  {schoolsData.length > 0 ? (
                    schoolsData.map((school) => (
                      <tr key={school.id}>
                        <td>{school.name}</td>
                        <td>{school.district_name || 'N/A'}</td>
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

          {/* Competitions Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>Regional Competitions</h2>
              <p>Competitions across the region</p>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Competition</th>
                    <th>Date</th>
                    <th>Schools</th>
                    <th>Participants</th>
                  </tr>
                </thead>
                <tbody>
                  {competitionsData.length > 0 ? (
                    competitionsData.map((comp) => (
                      <tr key={comp.id}>
                        <td>{comp.name}</td>
                        <td>{comp.start_date ? new Date(comp.start_date).toLocaleDateString() : 'N/A'}</td>
                        <td>{comp.schools_count || '0'}</td>
                        <td>{comp.participants_count || '0'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4">No competitions found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Results Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>Competition Results</h2>
              <p>Results and rankings</p>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>School</th>
                    <th>Awards Won</th>
                    <th>Medals</th>
                    <th>Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {resultsSummary.length > 0 ? (
                    resultsSummary.map((result, idx) => (
                      <tr key={idx}>
                        <td>{result.name}</td>
                        <td>{'0'}</td>
                        <td>{'0'}</td>
                        <td>#{idx + 1}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4">No results found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
      )}
    </div>
  );
}
