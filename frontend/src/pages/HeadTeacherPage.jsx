import { useEffect, useMemo, useState } from 'react';
import { Header } from '../components/shared';
import DashboardSkeleton from '../components/DashboardSkeleton';
import * as apiService from '../services/apiService';
import '../styles/dashboard.css';

const list = (response) => response?.data?.results || (Array.isArray(response?.data) ? response.data : []);

export default function HeadTeacherPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [users, setUsers] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [studentTalents, setStudentTalents] = useState([]);

  useEffect(() => {
    const loadHeadTeacherDashboard = async () => {
      try {
        setLoading(true);
        setError('');

        const userResponse = await apiService.getCurrentUser();
        const user = userResponse.data;
        setCurrentUser(user);

        const schoolId = user.school || user.school_id;

        const [studentsRes, usersRes, competitionsRes, talentsRes] = await Promise.all([
          apiService.getStudents(),
          apiService.getUsers(),
          apiService.getCompetitions(),
          apiService.getStudentTalents(),
        ]);

        const studentList = list(studentsRes);
        const userList = list(usersRes);
        const competitionList = list(competitionsRes);
        const talentList = list(talentsRes);

        setStudents(studentList);
        setUsers(userList);
        setCompetitions(competitionList);
        setStudentTalents(talentList);
      } catch (err) {
        setError(err.response?.data?.detail || err.message || 'Failed to load head teacher dashboard.');
      } finally {
        setLoading(false);
      }
    };

    loadHeadTeacherDashboard();
  }, []);

  const schoolId = currentUser?.school || currentUser?.school_id;

  const schoolStudents = useMemo(() => {
    if (!schoolId) return students;
    return students.filter((student) => Number(student.school?.id ?? student.school ?? student.school_id) === Number(schoolId));
  }, [students, schoolId]);

  const schoolStaff = useMemo(() => {
    if (!schoolId) return users;
    return users.filter((user) => Number(user.school) === Number(schoolId));
  }, [users, schoolId]);

  const schoolTalents = useMemo(() => {
    if (!schoolId) return studentTalents;
    const studentIds = new Set(schoolStudents.map((student) => Number(student.id)));
    return studentTalents.filter((entry) => studentIds.has(Number(entry.student)));
  }, [studentTalents, schoolStudents, schoolId]);

  const schoolCompetitions = useMemo(() => {
    if (!schoolId) return competitions;
    return competitions.filter((competition) => {
      const ids = (competition.schools || []).map((id) => Number(id));
      return ids.includes(Number(schoolId)) || competition.level === 'school';
    });
  }, [competitions, schoolId]);

  const stats = [
    { label: 'Students', value: String(schoolStudents.length) },
    { label: 'Staff', value: String(schoolStaff.length) },
    { label: 'Talent Entries', value: String(schoolTalents.length) },
    { label: 'Competitions', value: String(schoolCompetitions.length) },
  ];

  return (
    <div className="page-container">
      <Header title="Head Teacher Dashboard" />
      <main className="admin-content">
        {error && <div className="error-message" style={{ padding: '1rem', background: '#fee', color: '#c00', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}
        {loading ? (
          <DashboardSkeleton label="Loading head teacher dashboard" />
        ) : (
          <div className="cards-container">
            <section className="admin-section">
              <div className="section-header">
                <h2>School Overview</h2>
                <p>{currentUser?.school_name || 'School'} summary</p>
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
                <h2>Students</h2>
                <p>Students enrolled in this school</p>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Gender</th>
                      <th>Student ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schoolStudents.length > 0 ? schoolStudents.slice(0, 10).map((student) => (
                      <tr key={student.id}>
                        <td>{student.first_name} {student.last_name}</td>
                        <td>{student.gender || '—'}</td>
                        <td>{student.student_id || '—'}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="3">No students found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="admin-section">
              <div className="section-header">
                <h2>School Staff</h2>
                <p>Users linked to this school</p>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schoolStaff.length > 0 ? schoolStaff.slice(0, 10).map((user) => (
                      <tr key={user.id}>
                        <td>{user.first_name} {user.last_name}</td>
                        <td>{user.role}</td>
                        <td>{user.email || '—'}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="3">No staff found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="admin-section">
              <div className="section-header">
                <h2>School Competitions</h2>
                <p>Competitions assigned to this school</p>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Level</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schoolCompetitions.length > 0 ? schoolCompetitions.slice(0, 10).map((competition) => (
                      <tr key={competition.id}>
                        <td>{competition.name}</td>
                        <td>{competition.level}</td>
                        <td>{competition.status}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="3">No school competitions found</td></tr>
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
