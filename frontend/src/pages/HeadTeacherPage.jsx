import { useState, useEffect } from 'react';
import { Header } from '../components/shared';
import * as apiService from '../services/apiService';
import '../styles/dashboard.css';

export default function HeadTeacherPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [studentData, setStudentData] = useState([]);
  const [staffData, setStaffData] = useState([]);
  const [competitionData, setCompetitionData] = useState([]);
  const [talentsData, setTalentsData] = useState([]);
  const [statsData, setStatsData] = useState([
    { label: 'Total Students', value: '0' },
    { label: 'Staff Members', value: '0' },
    { label: 'Talented Students', value: '0' },
    { label: 'Active Competitions', value: '0' },
  ]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const userRes = await apiService.getCurrentUser();
        setCurrentUser(userRes.data);
        const schoolId = userRes.data.school?.id;
        const [studentsRes, usersRes, competitionsRes, talentsRes] = await Promise.all([
          apiService.getStudents({ school: schoolId }),
          apiService.getUsers({ school: schoolId }),
          apiService.getCompetitions(),
          apiService.getStudentTalents(),
        ]);
        setStudentData((studentsRes.data.results || []).slice(0, 10));
        setStaffData((usersRes.data.results || []).filter(u => u.role === 'sport_teacher').slice(0, 5));
        setCompetitionData((competitionsRes.data.results || []).slice(0, 5));
        setTalentsData(talentsRes.data.results || []);
        const stats = [
          { label: 'Total Students', value: (studentsRes.data?.count || 0).toString() },
          { label: 'Staff Members', value: (usersRes.data?.count || 0).toString() },
          { label: 'Talented Students', value: (talentsRes.data?.count || 0).toString() },
          { label: 'Active Competitions', value: (competitionsRes.data?.count || 0).toString() },
        ];
        setStatsData(stats);
      } catch (err) {
        console.error('Error fetching school dashboard data:', err);
        setError(err.response?.data?.detail || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="page-container">
      <Header title="Head Teacher Dashboard" />
      {error && <div className="error-message" style={{ padding: '1rem', background: '#fee', color: '#c00', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading dashboard...</div>
      ) : (
      <main className="admin-content">
        <div className="cards-container">
          {/* School Overview Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>School Overview</h2>
              <p>Key statistics for your school</p>
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
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Student ID</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {studentData.length > 0 ? (
                    studentData.map((student) => (
                      <tr key={student.id}>
                        <td>{student.first_name || 'N/A'}</td>
                        <td>{student.last_name || 'N/A'}</td>
                        <td>{student.student_id || 'N/A'}</td>
                        <td><button className="btn-action">View</button></td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4">No students found</td></tr>
                  )}
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
                    <th>Email</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staffData.length > 0 ? (
                    staffData.map((staff) => (
                      <tr key={staff.id}>
                        <td>{staff.first_name} {staff.last_name}</td>
                        <td>{staff.role}</td>
                        <td>{staff.email}</td>
                        <td><button className="btn-action">View</button></td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4">No staff found</td></tr>
                  )}
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
                    <th>Level</th>
                    <th>Start Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {competitionData.length > 0 ? (
                    competitionData.map((comp) => (
                      <tr key={comp.id}>
                        <td>{comp.name}</td>
                        <td><span className="badge">{comp.get_level_display || comp.level}</span></td>
                        <td>{comp.start_date ? new Date(comp.start_date).toLocaleDateString() : 'N/A'}</td>
                        <td><button className="btn-action">View</button></td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4">No competitions found</td></tr>
                  )}
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
      )}
    </div>
  );
}
