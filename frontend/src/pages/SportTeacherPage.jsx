import { Header } from '../components/shared';
import '../styles/dashboard.css';

export default function SportTeacherPage() {

  const studentTalentData = [
    { name: 'John Doe', talent: 'Football', level: 'Advanced', trained: 'Yes' },
    { name: 'Jane Smith', talent: 'Volleyball', level: 'Intermediate', trained: 'Yes' },
    { name: 'Michael Kato', talent: 'Basketball', level: 'Beginner', trained: 'No' },
  ];

  const trainingData = [
    { program: 'Football Basics', schedule: 'Mon & Wed 4pm', students: 24, next: '2026-08-20' },
    { program: 'Volleyball Skills', schedule: 'Tue & Thu 4pm', students: 16, next: '2026-08-21' },
  ];

  return (
    <div className="page-container">
      <Header title="Sport Teacher Dashboard" />
      <main className="admin-content">
        <div className="cards-container">
          {/* Teaching Overview Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>Teaching Overview</h2>
              <p>Your teaching statistics</p>
            </div>
            <div className="stats-overview">
              <div className="stat-card">
                <p className="stat-label">Students Trained</p>
                <h3 className="stat-value">87</h3>
              </div>
              <div className="stat-card">
                <p className="stat-label">Training Programs</p>
                <h3 className="stat-value">6</h3>
              </div>
              <div className="stat-card">
                <p className="stat-label">Competitions</p>
                <h3 className="stat-value">8</h3>
              </div>
              <div className="stat-card">
                <p className="stat-label">Medals Won</p>
                <h3 className="stat-value">23</h3>
              </div>
            </div>
          </section>

          {/* Performance Summary Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>Performance Summary</h2>
              <p>Student performance overview</p>
            </div>
            <div className="reports-grid">
              <div className="report-card">
                <h4>Students by Talent</h4>
                <ul className="stats-list">
                  <li><span>Football:</span> 34</li>
                  <li><span>Volleyball:</span> 22</li>
                  <li><span>Basketball:</span> 18</li>
                  <li><span>Other Sports:</span> 13</li>
                </ul>
              </div>
              <div className="report-card">
                <h4>Achievement Stats</h4>
                <ul className="stats-list">
                  <li><span>Gold Medals:</span> 8</li>
                  <li><span>Silver Medals:</span> 9</li>
                  <li><span>Bronze Medals:</span> 6</li>
                  <li><span>Success Rate:</span> 78%</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Trained Students Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>My Trained Students</h2>
              <p>Students under your training</p>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Sport/Talent</th>
                    <th>Level</th>
                    <th>Trained</th>
                  </tr>
                </thead>
                <tbody>
                  {studentTalentData.map((student, idx) => (
                    <tr key={idx}>
                      <td>{student.name}</td>
                      <td>{student.talent}</td>
                      <td>{student.level}</td>
                      <td>{student.trained}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Talents & Skills Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>Talents & Skills Management</h2>
              <p>Register and update student talents</p>
            </div>
            <div className="reports-grid">
              <div className="report-card">
                <h4>Register New Talent</h4>
                <ul className="stats-list">
                  <li>Select Student</li>
                  <li>Choose Sport/Talent</li>
                  <li>Set Proficiency Level</li>
                </ul>
              </div>
              <div className="report-card">
                <h4>Update Progress</h4>
                <ul className="stats-list">
                  <li>Select Student</li>
                  <li>New Level</li>
                  <li>Progress Notes</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Training Programs Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>Training Programs</h2>
              <p>Active training programs</p>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Program</th>
                    <th>Schedule</th>
                    <th>Students</th>
                    <th>Next Session</th>
                  </tr>
                </thead>
                <tbody>
                  {trainingData.map((program, idx) => (
                    <tr key={idx}>
                      <td>{program.program}</td>
                      <td>{program.schedule}</td>
                      <td>{program.students}</td>
                      <td>{program.next}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Attendance Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>Attendance Records</h2>
              <p>Track student attendance</p>
            </div>
            <div className="reports-grid">
              <div className="report-card">
                <h4>Attendance Summary</h4>
                <ul className="stats-list">
                  <li><span>Total Sessions:</span> 48</li>
                  <li><span>Average Attendance:</span> 82%</li>
                  <li><span>This Month:</span> 12 sessions</li>
                </ul>
              </div>
              <div className="report-card">
                <h4>Mark Attendance</h4>
                <ul className="stats-list">
                  <li>Select Program</li>
                  <li>Choose Date</li>
                  <li>Record Session</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Progress Tracking Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>Progress Tracking</h2>
              <p>Student progress and achievements</p>
            </div>
            <div className="reports-grid">
              <div className="report-card">
                <h4>📈 Performance Report</h4>
                <p>View individual student performance metrics.</p>
              </div>
              <div className="report-card">
                <h4>🏆 Competition Prep</h4>
                <p>Check which students are competition-ready.</p>
              </div>
              <div className="report-card">
                <h4>📊 Progress Charts</h4>
                <p>Visual progress tracking for each student.</p>
              </div>
              <div className="report-card">
                <h4>🎯 Goal Tracking</h4>
                <p>Track student goals and achievements.</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
