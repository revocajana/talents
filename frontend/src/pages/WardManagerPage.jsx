import { Header } from '../components/shared';
import '../styles/dashboard.css';

export default function WardManagerPage() {

  const schoolsData = [
    { name: 'Primary School A', type: 'Primary', students: 450, teachers: 12 },
    { name: 'Secondary School B', type: 'Secondary', students: 680, teachers: 18 },
    { name: 'Vocational Center', type: 'Vocational', students: 240, teachers: 8 },
  ];

  return (
    <div className="page-container">
      <Header title="Ward Manager Dashboard" />
      <main className="admin-content">
        <div className="cards-container">
          {/* Ward Overview Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>Ward Overview</h2>
              <p>Key statistics for your ward</p>
            </div>
            <div className="stats-overview">
              <div className="stat-card">
                <p className="stat-label">Schools</p>
                <h3 className="stat-value">8</h3>
              </div>
              <div className="stat-card">
                <p className="stat-label">Students</p>
                <h3 className="stat-value">2,340</h3>
              </div>
              <div className="stat-card">
                <p className="stat-label">Talents</p>
                <h3 className="stat-value">480</h3>
              </div>
              <div className="stat-card">
                <p className="stat-label">Ward Events</p>
                <h3 className="stat-value">6</h3>
              </div>
            </div>
          </section>

          {/* Ward Statistics Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>Ward Statistics</h2>
              <p>Statistical overview</p>
            </div>
            <div className="reports-grid">
              <div className="report-card">
                <h4>School Distribution</h4>
                <ul className="stats-list">
                  <li><span>Primary Schools:</span> 3</li>
                  <li><span>Secondary Schools:</span> 4</li>
                  <li><span>Vocational Centers:</span> 1</li>
                </ul>
              </div>
              <div className="report-card">
                <h4>Talent Categories</h4>
                <ul className="stats-list">
                  <li><span>Sports:</span> 240</li>
                  <li><span>Music:</span> 120</li>
                  <li><span>Arts:</span> 80</li>
                  <li><span>Technology:</span> 40</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Ward Schools Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>Ward Schools</h2>
              <p>Schools in your ward</p>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>School Name</th>
                    <th>Type</th>
                    <th>Students</th>
                    <th>Teachers</th>
                  </tr>
                </thead>
                <tbody>
                  {schoolsData.map((school, idx) => (
                    <tr key={idx}>
                      <td>{school.name}</td>
                      <td>{school.type}</td>
                      <td>{school.students}</td>
                      <td>{school.teachers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Student Management Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>Student Management</h2>
              <p>Manage student data</p>
            </div>
            <div className="reports-grid">
              <div className="report-card">
                <h4>Registration Summary</h4>
                <ul className="stats-list">
                  <li><span>Total Students:</span> 2,340</li>
                  <li><span>With Talents:</span> 480</li>
                  <li><span>In Competitions:</span> 240</li>
                  <li><span>Award Winners:</span> 45</li>
                </ul>
              </div>
              <div className="report-card">
                <h4>Student Actions</h4>
                <ul className="stats-list">
                  <li>🆕 Register New Student</li>
                  <li>📝 Update Student Info</li>
                  <li>🎯 Assign Talent</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Ward Events Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>Ward Events</h2>
              <p>Local events and activities</p>
            </div>
            <div className="reports-grid">
              <div className="report-card">
                <h4>Event Summary</h4>
                <ul className="stats-list">
                  <li><span>This Week:</span> 2</li>
                  <li><span>This Month:</span> 4</li>
                  <li><span>Completed:</span> 8</li>
                </ul>
              </div>
              <div className="report-card">
                <h4>Create New Event</h4>
                <ul className="stats-list">
                  <li>Event Name</li>
                  <li>Date & Time</li>
                  <li>Type: Sports/Music/Arts</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Ward Data Management Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>Data Management</h2>
              <p>Import, export, and manage ward data</p>
            </div>
            <div className="reports-grid">
              <div className="report-card">
                <h4>📥 Import Data</h4>
                <p>Import student or school data from CSV file.</p>
              </div>
              <div className="report-card">
                <h4>📤 Export Data</h4>
                <p>Export ward data for reporting.</p>
              </div>
              <div className="report-card">
                <h4>📋 Attendance Report</h4>
                <p>View student attendance records.</p>
              </div>
              <div className="report-card">
                <h4>📝 Submission Status</h4>
                <p>Track report submissions from schools.</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
