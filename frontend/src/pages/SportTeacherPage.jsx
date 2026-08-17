import { useState, useEffect } from 'react';
import { Header } from '../components/shared';
import * as apiService from '../services/apiService';
import '../styles/dashboard.css';

export default function SportTeacherPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [studentTalentData, setStudentTalentData] = useState([]);
  const [trainingData, setTrainingData] = useState([]);
  const [competitionsData, setCompetitionsData] = useState([]);
  const [statsData, setStatsData] = useState([
    { label: 'Students Trained', value: '0' },
    { label: 'Training Programs', value: '0' },
    { label: 'Competitions', value: '0' },
    { label: 'Medals Won', value: '0' },
  ]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const userRes = await apiService.getCurrentUser();
        setCurrentUser(userRes.data);
        const schoolId = userRes.data.school?.id;
        const [talentsRes, competitionsRes, studentsRes] = await Promise.all([
          apiService.getStudentTalents({ student__school: schoolId }),
          apiService.getCompetitions(),
          apiService.getStudents({ school: schoolId }),
        ]);
        setStudentTalentData((talentsRes.data.results || []).slice(0, 10));
        setCompetitionsData((competitionsRes.data.results || []).slice(0, 10));
        setTrainingData((studentsRes.data.results || []).slice(0, 5));
        const stats = [
          { label: 'Students Trained', value: (talentsRes.data?.count || 0).toString() },
          { label: 'Training Programs', value: '0' },
          { label: 'Competitions', value: (competitionsRes.data?.count || 0).toString() },
          { label: 'Medals Won', value: '0' },
        ];
        setStatsData(stats);
      } catch (err) {
        console.error('Error fetching sport teacher dashboard data:', err);
        setError(err.response?.data?.detail || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="page-container">
      <Header title="Sport Teacher Dashboard" />
      {error && <div className="error-message" style={{ padding: '1rem', background: '#fee', color: '#c00', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading dashboard...</div>
      ) : (
      <main className="admin-content">
        <div className="cards-container">
          {/* Teaching Overview Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>Teaching Overview</h2>
              <p>Your teaching statistics</p>
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
                    <th>Student Name</th>
                    <th>Talent</th>
                    <th>Proficiency Level</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {studentTalentData.length > 0 ? (
                    studentTalentData.map((student) => (
                      <tr key={student.id}>
                        <td>{student.student_name || 'N/A'}</td>
                        <td>{student.talent_name || 'N/A'}</td>
                        <td>{student.proficiency_level || 'N/A'}</td>
                        <td><button className="btn-action">Update</button></td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4">No trained students yet</td></tr>
                  )}
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
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trainingData.length > 0 ? (
                    trainingData.map((program, idx) => (
                      <tr key={idx}>
                        <td>{program.first_name} {program.last_name}</td>
                        <td>Assigned</td>
                        <td>1</td>
                        <td><button className="btn-action">View</button></td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4">No training programs active</td></tr>
                  )}
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
      )}
    </div>
  );
}
