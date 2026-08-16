import { Header } from '../components/shared';
import '../styles/dashboard.css';

export default function RegionManagerPage() {

  const schoolsData = [
    { name: 'Dar Es Salaam Secondary', district: 'Ilala', students: 1245, talents: 89 },
    { name: 'Coast Region School', district: 'Kinondoni', students: 987, talents: 64 },
    { name: 'Regional Academy', district: 'Temeke', students: 856, talents: 52 },
  ];

  const competitionsData = [
    { name: 'Regional Sports', date: '2026-09-15', schools: 24, participants: 450 },
    { name: 'Music Festival', date: '2026-10-01', schools: 18, participants: 280 },
  ];

  const resultsSummary = [
    { school: 'Dar Es Salaam Secondary', awards: 12, medals: 45, rank: 1 },
    { school: 'Coast Region School', awards: 8, medals: 32, rank: 2 },
  ];

  return (
    <div className="page-container">
      <Header title="Region Manager Dashboard" />
      <main className="admin-content">
        <div className="cards-container">
          {/* Overview Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>Regional Overview</h2>
              <p>Key statistics for your region</p>
            </div>
            <div className="stats-overview">
              <div className="stat-card">
                <p className="stat-label">Schools in Region</p>
                <h3 className="stat-value">48</h3>
              </div>
              <div className="stat-card">
                <p className="stat-label">Students</p>
                <h3 className="stat-value">12,456</h3>
              </div>
              <div className="stat-card">
                <p className="stat-label">Active Talents</p>
                <h3 className="stat-value">3,240</h3>
              </div>
              <div className="stat-card">
                <p className="stat-label">Competitions</p>
                <h3 className="stat-value">18</h3>
              </div>
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
                  {schoolsData.map((school, idx) => (
                    <tr key={idx}>
                      <td>{school.name}</td>
                      <td>{school.district}</td>
                      <td>{school.students}</td>
                      <td>{school.talents}</td>
                    </tr>
                  ))}
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
                  {competitionsData.map((comp, idx) => (
                    <tr key={idx}>
                      <td>{comp.name}</td>
                      <td>{comp.date}</td>
                      <td>{comp.schools}</td>
                      <td>{comp.participants}</td>
                    </tr>
                  ))}
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
                  {resultsSummary.map((result, idx) => (
                    <tr key={idx}>
                      <td>{result.school}</td>
                      <td>{result.awards}</td>
                      <td>{result.medals}</td>
                      <td>#{result.rank}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
