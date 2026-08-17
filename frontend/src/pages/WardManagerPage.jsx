import { useState, useEffect } from 'react';
import { Header } from '../components/shared';
import * as apiService from '../services/apiService';
import '../styles/dashboard.css';

export default function WardManagerPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const [allWards, setAllWards] = useState([]);
  const [schoolsData, setSchoolsData] = useState([]);
  const [studentTalentData, setStudentTalentData] = useState([]);
  const [statsData, setStatsData] = useState([
    { label: 'Schools', value: '0' },
    { label: 'Students', value: '0' },
    { label: 'Talents', value: '0' },
    { label: 'Ward Events', value: '0' },
  ]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const userRes = await apiService.getCurrentUser();
        setCurrentUser(userRes.data);
        const wardId = userRes.data.school?.ward;
        setSelectedWard(wardId);
        
        // Fetch all wards for the dropdown
        const wardsRes = await apiService.getWards();
        setAllWards(wardsRes.data.results || []);
        
        const [schoolsRes, studentTalentsRes, studentsRes] = await Promise.all([
          apiService.getSchools({ ward: wardId }),
          apiService.getStudentTalents(),
          apiService.getStudents(),
        ]);
        setSchoolsData((schoolsRes.data.results || []).slice(0, 10));
        setStudentTalentData((studentTalentsRes.data.results || []).slice(0, 10));
        const stats = [
          { label: 'Schools', value: (schoolsRes.data?.count || 0).toString() },
          { label: 'Students', value: (studentsRes.data?.count || 0).toString() },
          { label: 'Talents', value: (studentTalentsRes.data?.count || 0).toString() },
          { label: 'Ward Events', value: '0' },
        ];
        setStatsData(stats);
      } catch (err) {
        console.error('Error fetching ward dashboard:', err);
        setError(err.response?.data?.detail || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="page-container">
      <Header title="Ward Manager Dashboard" />
      {error && <div className="error-message" style={{ padding: '1rem', background: '#fee', color: '#c00', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}
      
      {/* Ward Selector */}
      {!loading && (
        <div style={{ padding: '1.5rem 2rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', maxWidth: '100%' }}>
            <label htmlFor="ward-select" style={{ fontWeight: '600', color: '#374151', whiteSpace: 'nowrap' }}>Select Ward:</label>
            <select
              id="ward-select"
              value={selectedWard || ''}
              onChange={(e) => setSelectedWard(parseInt(e.target.value))}
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
              <option value="">-- Select a Ward --</option>
              {allWards.map((ward) => (
                <option key={ward.id} value={ward.id}>
                  {ward.name}
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
          {/* Ward Overview Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>Ward Overview</h2>
              <p>Key statistics for your ward</p>
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
                  {schoolsData.length > 0 ? (
                    schoolsData.map((school) => (
                      <tr key={school.id}>
                        <td>{school.name}</td>
                        <td>{school.school_type || 'N/A'}</td>
                        <td>{school.students_count || '0'}</td>
                        <td>{school.teachers_count || '0'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4">No schools found</td></tr>
                  )}
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
      )}
    </div>
  );
}
