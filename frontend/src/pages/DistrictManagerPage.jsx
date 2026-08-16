import { Header } from '../components/shared';
import '../styles/dashboard.css';

export default function DistrictManagerPage() {

  const schoolsData = [
    { name: 'Central Secondary', ward: 'Ward A', students: 680, talents: 145 },
    { name: 'District Academy', ward: 'Ward B', students: 520, talents: 98 },
    { name: 'Tech School', ward: 'Ward C', students: 450, talents: 76 },
  ];

  const wardData = [
    { ward: 'Ward A', schools: 8, students: 2340, managers: 2 },
    { ward: 'Ward B', schools: 6, students: 1890, managers: 1 },
    { ward: 'Ward C', schools: 5, students: 1560, managers: 1 },
  ];

  return (
    <div className="page-container">
      <Header title="District Manager Dashboard" />
      <main className="admin-content">
        <div className="cards-container">
          {/* District Overview Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>District Overview</h2>
              <p>Key statistics for your district</p>
            </div>
            <div className="stats-overview">
              <div className="stat-card">
                <p className="stat-label">Schools</p>
                <h3 className="stat-value">19</h3>
              </div>
              <div className="stat-card">
                <p className="stat-label">Students</p>
                <h3 className="stat-value">5,790</h3>
              </div>
              <div className="stat-card">
                <p className="stat-label">Talents Registered</p>
                <h3 className="stat-value">1,240</h3>
              </div>
              <div className="stat-card">
                <p className="stat-label">Active Competitions</p>
                <h3 className="stat-value">12</h3>
              </div>
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
                  {schoolsData.map((school, idx) => (
                    <tr key={idx}>
                      <td>{school.name}</td>
                      <td>{school.ward}</td>
                      <td>{school.students}</td>
                      <td>{school.talents}</td>
                    </tr>
                  ))}
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
                  {wardData.map((ward, idx) => (
                    <tr key={idx}>
                      <td>{ward.ward}</td>
                      <td>{ward.schools}</td>
                      <td>{ward.students}</td>
                      <td>{ward.managers}</td>
                    </tr>
                  ))}
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
    </div>
  );
}
