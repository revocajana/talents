import { Header } from '../components/shared';
import '../styles/dashboard.css';

export default function HeadTeacherPage() {

  const studentData = [
    { name: 'John Doe', class: 'Form 4', talents: 2, competitions: 1 },
    { name: 'Jane Smith', class: 'Form 3', talents: 1, competitions: 2 },
    { name: 'Michael Kato', class: 'Form 4', talents: 3, competitions: 2 },
  ];

  const staffData = [
    { name: 'Mr. Mwambi', role: 'Sport Teacher', tenure: '5 years' },
    { name: 'Ms. Amina', role: 'Music Teacher', tenure: '3 years' },
    { name: 'Mr. Khan', role: 'Tech Teacher', tenure: '2 years' },
  ];

  const competitionData = [
    { name: 'District Sports', date: '2026-09-15', participants: 45, results: 'Pending' },
    { name: 'Regional Music', date: '2026-10-01', participants: 12, results: '2nd Place' },
  ];

  return (
    <div className="page-container">
      <Header title="Head Teacher Dashboard" />
      <main className="admin-content">
        <div className="cards-container">
          {/* School Overview Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>School Overview</h2>
              <p>Key statistics for your school</p>
            </div>
            <div className="stats-overview">
              <div className="stat-card">
                <p className="stat-label">Total Students</p>
                <h3 className="stat-value">680</h3>
              </div>
              <div className="stat-card">
                <p className="stat-label">Staff Members</p>
                <h3 className="stat-value">24</h3>
              </div>
              <div className="stat-card">
                <p className="stat-label">Talented Students</p>
                <h3 className="stat-value">145</h3>
              </div>
              <div className="stat-card">
                <p className="stat-label">Active Competitions</p>
                <h3 className="stat-value">5</h3>
              </div>
            </div>
          </section>

          {/* Quick Stats Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>Quick Stats</h2>
              <p>Talent distribution and performance</p>
            </div>
            <div className="reports-grid">
              <div className="report-card">
                <h4>Talent Distribution</h4>
                <ul className="stats-list">
                  <li><span>Sports:</span> 78</li>
                  <li><span>Music:</span> 34</li>
                  <li><span>Arts:</span> 22</li>
                  <li><span>Technology:</span> 11</li>
                </ul>
              </div>
              <div className="report-card">
                <h4>Performance</h4>
                <ul className="stats-list">
                  <li><span>Awards Won:</span> 12</li>
                  <li><span>Competitions Participated:</span> 18</li>
                  <li><span>Success Rate:</span> 66.7%</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Student Management Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>Student Management</h2>
              <p>Manage school students</p>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Class</th>
                    <th>Talents</th>
                    <th>Competitions</th>
                  </tr>
                </thead>
                <tbody>
                  {studentData.map((student, idx) => (
                    <tr key={idx}>
                      <td>{student.name}</td>
                      <td>{student.class}</td>
                      <td>{student.talents}</td>
                      <td>{student.competitions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* School Staff Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>School Staff</h2>
              <p>Staff roster</p>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Tenure</th>
                  </tr>
                </thead>
                <tbody>
                  {staffData.map((staff, idx) => (
                    <tr key={idx}>
                      <td>{staff.name}</td>
                      <td>{staff.role}</td>
                      <td>{staff.tenure}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Talents Management Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>Talent Management</h2>
              <p>Register and manage student talents</p>
            </div>
            <div className="reports-grid">
              <div className="report-card">
                <h4>Talent Summary</h4>
                <ul className="stats-list">
                  <li><span>Registered Talents:</span> 145</li>
                  <li><span>Beginner:</span> 42</li>
                  <li><span>Intermediate:</span> 56</li>
                  <li><span>Advanced:</span> 32</li>
                  <li><span>Expert:</span> 15</li>
                </ul>
              </div>
              <div className="report-card">
                <h4>Register New Talent</h4>
                <ul className="stats-list">
                  <li>Select Student</li>
                  <li>Choose Talent/Skill</li>
                  <li>Set Proficiency Level</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Competitions Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>School Competitions</h2>
              <p>Competitions and results</p>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Competition</th>
                    <th>Date</th>
                    <th>Participants</th>
                    <th>Results</th>
                  </tr>
                </thead>
                <tbody>
                  {competitionData.map((comp, idx) => (
                    <tr key={idx}>
                      <td>{comp.name}</td>
                      <td>{comp.date}</td>
                      <td>{comp.participants}</td>
                      <td>{comp.results}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Performance Results Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>Performance Results</h2>
              <p>Awards and achievements</p>
            </div>
            <div className="reports-grid">
              <div className="report-card">
                <h4>🏆 Award Summary</h4>
                <ul className="stats-list">
                  <li><span>Gold Medals:</span> 5</li>
                  <li><span>Silver Medals:</span> 4</li>
                  <li><span>Bronze Medals:</span> 3</li>
                </ul>
              </div>
              <div className="report-card">
                <h4>📊 Export Options</h4>
                <ul className="stats-list">
                  <li>📥 Export All Data</li>
                  <li>📥 Export Students</li>
                  <li>📥 Export Results</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
