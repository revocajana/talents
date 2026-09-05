import { useEffect, useMemo, useState } from 'react';
import { Header } from '../components/shared';
import DashboardSkeleton from '../components/DashboardSkeleton';
import * as apiService from '../services/apiService';
import '../styles/dashboard.css';

const list = (response) => response?.data?.results || (Array.isArray(response?.data) ? response.data : []);

export default function ZoneManagerPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [zones, setZones] = useState([]);
  const [regions, setRegions] = useState([]);
  const [schools, setSchools] = useState([]);
  const [students, setStudents] = useState([]);
  const [competitions, setCompetitions] = useState([]);

  useEffect(() => {
    const loadZoneDashboard = async () => {
      try {
        setLoading(true);
        setError('');

        const userResponse = await apiService.getCurrentUser();
        const user = userResponse.data;
        setCurrentUser(user);

        const [zonesRes, regionsRes, schoolsRes, studentsRes, competitionsRes] = await Promise.all([
          apiService.getZones(),
          apiService.getRegions(),
          apiService.getSchools(),
          apiService.getStudents(),
          apiService.getCompetitions(),
        ]);

        setZones(list(zonesRes));
        setRegions(list(regionsRes));
        setSchools(list(schoolsRes));
        setStudents(list(studentsRes));
        setCompetitions(list(competitionsRes));
      } catch (err) {
        setError(err.response?.data?.detail || err.message || 'Failed to load zone dashboard.');
      } finally {
        setLoading(false);
      }
    };

    loadZoneDashboard();
  }, []);

  const zoneId = currentUser?.zone || currentUser?.zone_id;

  const zoneRegions = useMemo(() => {
    if (!zoneId) return regions;
    return regions.filter((region) => Number(region.zone) === Number(zoneId));
  }, [regions, zoneId]);

  const zoneSchools = useMemo(() => {
    if (!zoneId) return schools;
    return schools.filter((school) => Number(school.zone) === Number(zoneId));
  }, [schools, zoneId]);

  const zoneStudents = useMemo(() => {
    if (!zoneId) return students;
    const schoolIds = new Set(zoneSchools.map((school) => Number(school.id)));
    return students.filter((student) => schoolIds.has(Number(student.school?.id ?? student.school)));
  }, [students, zoneSchools, zoneId]);

  const zoneCompetitions = useMemo(() => {
    if (!zoneId) return competitions;
    return competitions.filter((competition) => {
      const locationId = competition.location ?? competition.zone ?? competition.zone_id;
      return Number(locationId) === Number(zoneId) || competition.level === 'zone';
    });
  }, [competitions, zoneId]);

  const stats = [
    { label: 'Regions', value: String(zoneRegions.length) },
    { label: 'Schools', value: String(zoneSchools.length) },
    { label: 'Students', value: String(zoneStudents.length) },
    { label: 'Competitions', value: String(zoneCompetitions.length) },
  ];

  return (
    <div className="page-container">
      <Header title="Zone Manager Dashboard" />
      <main className="admin-content">
        {error && <div className="error-message" style={{ padding: '1rem', background: '#fee', color: '#c00', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}
        {loading ? (
          <DashboardSkeleton label="Loading zone dashboard" />
        ) : (
          <div className="cards-container">
            <section className="admin-section">
              <div className="section-header">
                <h2>Zone Overview</h2>
                <p>{currentUser?.zone_name || currentUser?.zone || 'Zone'} summary</p>
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
                <h2>Regions in This Zone</h2>
                <p>Territory breakdown</p>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Region</th>
                      <th>Schools</th>
                      <th>Students</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zoneRegions.length > 0 ? zoneRegions.map((region) => {
                      const regionSchoolIds = new Set(zoneSchools.filter((school) => Number(school.region) === Number(region.id)).map((school) => Number(school.id)));
                      const regionStudentCount = zoneStudents.filter((student) => regionSchoolIds.has(Number(student.school?.id ?? student.school))).length;
                      return (
                        <tr key={region.id}>
                          <td>{region.name}</td>
                          <td>{regionSchoolIds.size}</td>
                          <td>{regionStudentCount}</td>
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan="3">No regions found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="admin-section">
              <div className="section-header">
                <h2>Zone-wide Schools</h2>
                <p>School list for this zone</p>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>School</th>
                      <th>Region</th>
                      <th>Students</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zoneSchools.length > 0 ? zoneSchools.slice(0, 15).map((school) => {
                      const studentCount = zoneStudents.filter((student) => Number(student.school?.id ?? student.school) === Number(school.id)).length;
                      return (
                        <tr key={school.id}>
                          <td>{school.name}</td>
                          <td>{school.region_name || school.region || '—'}</td>
                          <td>{studentCount}</td>
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan="3">No schools found</td></tr>
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
