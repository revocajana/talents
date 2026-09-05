import { useEffect, useMemo, useState } from 'react';
import { Header } from '../components/shared';
import DashboardSkeleton from '../components/DashboardSkeleton';
import * as apiService from '../services/apiService';
import '../styles/dashboard.css';

const list = (response) => response?.data?.results || (Array.isArray(response?.data) ? response.data : []);

export default function WardManagerPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [schools, setSchools] = useState([]);
  const [students, setStudents] = useState([]);
  const [competitions, setCompetitions] = useState([]);

  useEffect(() => {
    const loadWardDashboard = async () => {
      try {
        setLoading(true);
        setError('');

        const userResponse = await apiService.getCurrentUser();
        const user = userResponse.data;
        setCurrentUser(user);

        const [schoolsRes, studentsRes, competitionsRes] = await Promise.all([
          apiService.getSchools(),
          apiService.getStudents(),
          apiService.getCompetitions(),
        ]);

        setSchools(list(schoolsRes));
        setStudents(list(studentsRes));
        setCompetitions(list(competitionsRes));
      } catch (err) {
        setError(err.response?.data?.detail || err.message || 'Failed to load ward dashboard.');
      } finally {
        setLoading(false);
      }
    };

    loadWardDashboard();
  }, []);

  const wardId = currentUser?.ward || currentUser?.ward_id;

  const wardSchools = useMemo(() => {
    if (!wardId) return schools;
    return schools.filter((school) => Number(school.ward) === Number(wardId));
  }, [schools, wardId]);

  const wardStudents = useMemo(() => {
    if (!wardId) return students;
    const schoolIds = new Set(wardSchools.map((school) => Number(school.id)));
    return students.filter((student) => schoolIds.has(Number(student.school?.id ?? student.school)));
  }, [students, wardSchools, wardId]);

  const wardCompetitions = useMemo(() => {
    if (!wardId) return competitions;
    return competitions.filter((competition) => {
      const locationId = competition.location ?? competition.ward ?? competition.ward_id;
      return Number(locationId) === Number(wardId) || competition.level === 'ward';
    });
  }, [competitions, wardId]);

  const stats = [
    { label: 'Schools', value: String(wardSchools.length) },
    { label: 'Students', value: String(wardStudents.length) },
    { label: 'Competitions', value: String(wardCompetitions.length) },
  ];

  return (
    <div className="page-container">
      <Header title="Ward Manager Dashboard" />
      <main className="admin-content">
        {error && <div className="error-message" style={{ padding: '1rem', background: '#fee', color: '#c00', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}
        {loading ? (
          <DashboardSkeleton label="Loading ward dashboard" />
        ) : (
          <div className="cards-container">
            <section className="admin-section">
              <div className="section-header">
                <h2>Ward Overview</h2>
                <p>{currentUser?.ward_name || currentUser?.ward || 'Ward'} summary</p>
              </div>
              <div className="stats-overview">
                {stats.map((stat, index) => (
                  <div key={index} className="stat-card">
                    <p className="stat-label">{stat.label}</p>
                    <h3 className="stat-value">{stat.value}</h3>
                  </div>
                ))}
              </div>
            </section>

            <section className="admin-section">
              <div className="section-header">
                <h2>Ward Schools</h2>
                <p>Schools in this ward</p>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>School</th>
                      <th>Students</th>
                      <th>Registry</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wardSchools.length > 0 ? wardSchools.map((school) => {
                      const studentCount = wardStudents.filter((student) => Number(student.school?.id ?? student.school) === Number(school.id)).length;
                      return (
                        <tr key={school.id}>
                          <td>{school.name}</td>
                          <td>{studentCount}</td>
                          <td>{school.registry_number || '—'}</td>
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan="3">No schools found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="admin-section">
              <div className="section-header">
                <h2>Students in Ward</h2>
                <p>Student list for the schools under this ward</p>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>School</th>
                      <th>Gender</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wardStudents.length > 0 ? wardStudents.slice(0, 10).map((student) => (
                      <tr key={student.id}>
                        <td>{student.first_name} {student.last_name}</td>
                        <td>{student.school?.name || 'School not linked'}</td>
                        <td>{student.gender || '—'}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="3">No students found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
