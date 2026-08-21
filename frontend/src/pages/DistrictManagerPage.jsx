import { useEffect, useMemo, useState } from 'react';
import { Header } from '../components/shared';
import * as apiService from '../services/apiService';
import '../styles/dashboard.css';

export default function DistrictManagerPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [allDistricts, setAllDistricts] = useState([]);
  const [schools, setSchools] = useState([]);
  const [wards, setWards] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentTalents, setStudentTalents] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [userRes, districtsRes, schoolsRes, wardsRes, competitionsRes, studentsRes, talentsRes] = await Promise.all([
          apiService.getCurrentUser(),
          apiService.getDistricts(),
          apiService.getSchools(),
          apiService.getWards(),
          apiService.getCompetitions(),
          apiService.getStudents(),
          apiService.getStudentTalents(),
        ]);

        const districtList = districtsRes.data.results || [];
        const schoolList = schoolsRes.data.results || [];
        const wardList = wardsRes.data.results || [];
        const competitionList = competitionsRes.data.results || [];
        const studentList = studentsRes.data.results || [];
        const talentList = talentsRes.data.results || [];

        setCurrentUser(userRes.data);
        setAllDistricts(districtList);
        setSchools(schoolList);
        setWards(wardList);
        setCompetitions(competitionList);
        setStudents(studentList);
        setStudentTalents(talentList);

        const defaultDistrict = userRes.data?.district || districtList[0]?.id || '';
        setSelectedDistrict(String(defaultDistrict));
      } catch (err) {
        console.error('Error fetching district dashboard:', err);
        setError(err.response?.data?.detail || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const visibleDistrictId = selectedDistrict ? Number(selectedDistrict) : null;

  const districtSchools = useMemo(() => {
    if (!visibleDistrictId) return schools;
    return schools.filter((school) => Number(school.district) === visibleDistrictId);
  }, [schools, visibleDistrictId]);

  const districtWards = useMemo(() => {
    if (!visibleDistrictId) return wards;
    return wards.filter((ward) => Number(ward.district) === visibleDistrictId);
  }, [wards, visibleDistrictId]);

  const districtStudents = useMemo(() => {
    if (!visibleDistrictId) return students;
    const schoolIds = new Set(districtSchools.map((school) => Number(school.id)));
    return students.filter((student) => schoolIds.has(Number(student.school?.id ?? student.school)));
  }, [districtSchools, students, visibleDistrictId]);

  const districtTalents = useMemo(() => {
    if (!visibleDistrictId) return studentTalents;
    const studentIds = new Set(districtStudents.map((student) => Number(student.id)));
    return studentTalents.filter((entry) => studentIds.has(Number(entry.student)));
  }, [districtStudents, studentTalents, visibleDistrictId]);

  const districtCompetitions = useMemo(() => {
    if (!visibleDistrictId) return competitions;
    return competitions.filter((competition) => {
      const locationId = competition.location ?? competition.district ?? competition.region ?? competition.zone ?? competition.country;
      return Number(locationId) === visibleDistrictId || competition.level === 'district';
    });
  }, [competitions, visibleDistrictId]);

  const statsData = [
    { label: 'Schools', value: String(districtSchools.length) },
    { label: 'Students', value: String(districtStudents.length) },
    { label: 'Talents Registered', value: String(districtTalents.length) },
    { label: 'Active Competitions', value: String(districtCompetitions.length) },
  ];

  const topSchools = useMemo(() => {
    const schoolScores = districtSchools.map((school) => {
      const studentCount = students.filter((student) => Number(student.school?.id ?? student.school) === Number(school.id)).length;
      const talentCount = studentTalents.filter((talent) => Number(talent.student) === Number(
        students.find((student) => Number(student.school?.id ?? student.school) === Number(school.id))?.id
      )).length;
      return {
        name: school.name,
        score: studentCount * 10 + talentCount * 20,
      };
    });

    return [...schoolScores].sort((a, b) => b.score - a.score).slice(0, 3);
  }, [districtSchools, studentTalents, students]);

  return (
    <div className="page-container">
      <Header title="District Manager Dashboard" />

      {error && (
        <div className="error-message" style={{ padding: '1rem', background: '#fee', color: '#c00', borderRadius: '4px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {!loading && (
        <div style={{ padding: '1.5rem 2rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', maxWidth: '100%' }}>
            <label htmlFor="district-select" style={{ fontWeight: '600', color: '#374151', whiteSpace: 'nowrap' }}>
              Select District:
            </label>
            <select
              id="district-select"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '0.95rem',
                backgroundColor: '#fff',
                cursor: 'pointer',
                minWidth: '220px',
              }}
            >
              <option value="">-- Select a District --</option>
              {allDistricts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
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
            <section className="admin-section">
              <div className="section-header">
                <h2>District Overview</h2>
                <p>
                  {allDistricts.find((district) => Number(district.id) === Number(selectedDistrict))?.name || 'District'} summary
                </p>
              </div>
              <div className="stats-overview">
                {statsData.map((stat, index) => (
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
                <p>School activation and participation snapshot</p>
              </div>
              <div className="reports-grid">
                <div className="report-card">
                  <h4>Top Schools</h4>
                  <ol className="stats-list">
                    {topSchools.length > 0 ? (
                      topSchools.map((school) => (
                        <li key={school.name}>
                          <span>{school.name}</span> {school.score} pts
                        </li>
                      ))
                    ) : (
                      <li><span>No schools</span></li>
                    )}
                  </ol>
                </div>
                <div className="report-card">
                  <h4>District Metrics</h4>
                  <ul className="stats-list">
                    <li><span>Total Wards:</span> {districtWards.length}</li>
                    <li><span>Schools Tracked:</span> {districtSchools.length}</li>
                    <li><span>Competitions:</span> {districtCompetitions.length}</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="admin-section">
              <div className="section-header">
                <h2>District Schools</h2>
                <p>Schools currently under this district</p>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>School Name</th>
                      <th>Ward</th>
                      <th>Students</th>
                      <th>Talents</th>
                    </tr>
                  </thead>
                  <tbody>
                    {districtSchools.length > 0 ? (
                      districtSchools.map((school) => {
                        const schoolStudentCount = students.filter(
                          (student) => Number(student.school?.id ?? student.school) === Number(school.id)
                        ).length;
                        const schoolTalentCount = studentTalents.filter((entry) =>
                          students.some(
                            (student) =>
                              Number(student.id) === Number(entry.student) &&
                              Number(student.school?.id ?? student.school) === Number(school.id)
                          )
                        ).length;

                        return (
                          <tr key={school.id}>
                            <td>{school.name}</td>
                            <td>{school.ward ? (wards.find((ward) => Number(ward.id) === Number(school.ward))?.name || 'N/A') : 'N/A'}</td>
                            <td>{schoolStudentCount}</td>
                            <td>{schoolTalentCount}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="4">No schools found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="admin-section">
              <div className="section-header">
                <h2>Wards</h2>
                <p>Ward-level focus points</p>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Ward</th>
                      <th>Schools</th>
                      <th>Students</th>
                      <th>Talents</th>
                    </tr>
                  </thead>
                  <tbody>
                    {districtWards.length > 0 ? (
                      districtWards.map((ward) => {
                        const wardSchools = districtSchools.filter((school) => Number(school.ward) === Number(ward.id));
                        const wardStudentCount = students.filter((student) =>
                          wardSchools.some((school) => Number(student.school?.id ?? student.school) === Number(school.id))
                        ).length;
                        const wardTalentCount = studentTalents.filter((entry) =>
                          students.some(
                            (student) =>
                              Number(student.id) === Number(entry.student) &&
                              wardSchools.some((school) => Number(student.school?.id ?? student.school) === Number(school.id))
                          )
                        ).length;

                        return (
                          <tr key={ward.id}>
                            <td>{ward.name}</td>
                            <td>{wardSchools.length}</td>
                            <td>{wardStudentCount}</td>
                            <td>{wardTalentCount}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="4">No wards found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="admin-section">
              <div className="section-header">
                <h2>District Competitions</h2>
                <p>Competition list for this district</p>
              </div>
              <div className="reports-grid">
                {districtCompetitions.length > 0 ? (
                  districtCompetitions.slice(0, 6).map((competition) => (
                    <div className="report-card" key={competition.id}>
                      <h4>{competition.name}</h4>
                      <p>{competition.description || 'No description provided'}</p>
                      <ul className="stats-list">
                        <li><span>Level:</span> {competition.level}</li>
                        <li><span>Status:</span> {competition.status}</li>
                      </ul>
                    </div>
                  ))
                ) : (
                  <div className="report-card">
                    <h4>No competitions</h4>
                    <p>No competition records found for this district.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      )}
    </div>
  );
}

