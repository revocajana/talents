import { useEffect, useMemo, useState } from 'react';
import { Header } from '../components/shared';
import * as apiService from '../services/apiService';
import '../styles/dashboard.css';

const list = (response) => response?.data?.results || (Array.isArray(response?.data) ? response.data : []);

export default function RegionManagerPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [schools, setSchools] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [students, setStudents] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const loadRegionDashboard = async () => {
      try {
        setLoading(true);
        setError('');

        const userResponse = await apiService.getCurrentUser();
        const user = userResponse.data;
        setCurrentUser(user);

        const [schoolsRes, districtsRes, studentsRes, competitionsRes, usersRes] = await Promise.all([
          apiService.getSchools(),
          apiService.getDistricts(),
          apiService.getStudents(),
          apiService.getCompetitions(),
          apiService.getUsers(),
        ]);

        const schoolList = list(schoolsRes);
        const districtList = list(districtsRes);
        const studentList = list(studentsRes);
        const competitionList = list(competitionsRes);
        const userList = list(usersRes);

        setSchools(schoolList);
        setDistricts(districtList);
        setStudents(studentList);
        setCompetitions(competitionList);
        setUsers(userList);
      } catch (err) {
        setError(err.response?.data?.detail || err.message || 'Failed to load region dashboard.');
      } finally {
        setLoading(false);
      }
    };

    loadRegionDashboard();
  }, []);

  const regionId = currentUser?.region || currentUser?.region_id;

  const regionSchools = useMemo(() => {
    if (!regionId) return schools;
    return schools.filter((school) => Number(school.region) === Number(regionId));
  }, [schools, regionId]);

  const regionDistricts = useMemo(() => {
    if (!regionId) return districts;
    return districts.filter((district) => Number(district.region) === Number(regionId));
  }, [districts, regionId]);

  const regionStudents = useMemo(() => {
    if (!regionId) return students;
    const schoolIds = new Set(regionSchools.map((school) => Number(school.id)));
    return students.filter((student) => schoolIds.has(Number(student.school?.id ?? student.school)));
  }, [students, regionSchools, regionId]);

  const regionUsers = useMemo(() => {
    if (!regionId) return users;
    return users.filter((user) => Number(user.region) === Number(regionId) || Number(user.region_id) === Number(regionId));
  }, [users, regionId]);

  const regionCompetitions = useMemo(() => {
    if (!regionId) return competitions;
    return competitions.filter((competition) => {
      const locationId = competition.location ?? competition.region ?? competition.region_id;
      return Number(locationId) === Number(regionId) || competition.level === 'region';
    });
  }, [competitions, regionId]);

  const districtBreakdown = useMemo(() => {
    return regionDistricts.map((district) => {
      const districtSchoolIds = new Set(
        regionSchools.filter((school) => Number(school.district) === Number(district.id)).map((school) => Number(school.id))
      );
      const studentCount = regionStudents.filter((student) => districtSchoolIds.has(Number(student.school?.id ?? student.school))).length;
      return {
        id: district.id,
        name: district.name,
        schools: regionSchools.filter((school) => Number(school.district) === Number(district.id)).length,
        students: studentCount,
      };
    });
  }, [regionDistricts, regionSchools, regionStudents]);

  const stats = [
    { label: 'Schools', value: String(regionSchools.length) },
    { label: 'Districts', value: String(regionDistricts.length) },
    { label: 'Students', value: String(regionStudents.length) },
    { label: 'Competitions', value: String(regionCompetitions.length) },
  ];

  return (
    <div className="page-container">
      <Header title="Region Manager Dashboard" />
      <main className="admin-content">
        {error && <div className="error-message" style={{ padding: '1rem', background: '#fee', color: '#c00', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading dashboard...</div>
        ) : (
          <div className="cards-container">
            <section className="admin-section">
              <div className="section-header">
                <h2>Region Overview</h2>
                <p>{currentUser?.region_name || currentUser?.region || 'Region'} summary</p>
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
                <h2>District Performance</h2>
                <p>Districts under this region</p>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>District</th>
                      <th>Schools</th>
                      <th>Students</th>
                    </tr>
                  </thead>
                  <tbody>
                    {districtBreakdown.length > 0 ? districtBreakdown.map((district) => (
                      <tr key={district.id}>
                        <td>{district.name}</td>
                        <td>{district.schools}</td>
                        <td>{district.students}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="3">No district data found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="admin-section">
              <div className="section-header">
                <h2>Active Staff</h2>
                <p>Users assigned to this region</p>
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
                    {regionUsers.length > 0 ? regionUsers.slice(0, 10).map((user) => (
                      <tr key={user.id}>
                        <td>{user.first_name} {user.last_name}</td>
                        <td>{user.role}</td>
                        <td>{user.email || '—'}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="3">No users found for this region</td></tr>
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
