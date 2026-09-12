import { useEffect, useMemo, useState } from 'react';
import { Header } from '../components/shared';
import DashboardSkeleton from '../components/DashboardSkeleton';
import * as apiService from '../services/apiService';
import '../styles/dashboard.css';

const list = (response) => response?.data?.results || (Array.isArray(response?.data) ? response.data : []);

const resolveStudentByUser = async (user) => {
  if (!user || !user.first_name || !user.last_name) {
    return null;
  }

  const studentsResponse = await apiService.getStudents({
    first_name: user.first_name,
    last_name: user.last_name,
    school: user.school,
  });

  const students = Array.isArray(studentsResponse?.data?.results)
    ? studentsResponse.data.results
    : Array.isArray(studentsResponse?.data)
      ? studentsResponse.data
      : [];

  return students.find((student) => {
    const sameFirstName = String(student.first_name || '').toLowerCase() === String(user.first_name || '').toLowerCase();
    const sameLastName = String(student.last_name || '').toLowerCase() === String(user.last_name || '').toLowerCase();
    const sameSchool = !user.school || Number(student.school) === Number(user.school);
    return sameFirstName && sameLastName && sameSchool;
  }) || null;
};

export default function StudentPage() {
  const [student, setStudent] = useState(null);
  const [school, setSchool] = useState(null);
  const [district, setDistrict] = useState(null);
  const [zone, setZone] = useState(null);
  const [region, setRegion] = useState(null);
  const [messages, setMessages] = useState([]);
  const [results, setResults] = useState([]);
  const [talents, setTalents] = useState([]);
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStudentDashboard = async () => {
      try {
        setLoading(true);
        setError('');

        const userResponse = await apiService.getCurrentUser();
        const user = userResponse.data || {};
        let studentId = user.student;

        if (!studentId) {
          const fallbackStudent = await resolveStudentByUser(user);
          if (!fallbackStudent) {
            throw new Error('This account is not linked to a student record yet.');
          }
          studentId = fallbackStudent.id;
        }

        const [studentResponse, resultsResponse, announcementsResponse, talentsResponse, membershipsResponse] = await Promise.all([
          apiService.getStudentById(studentId),
          apiService.getResults({ 'participation__student': studentId }),
          apiService.getAnnouncements({ is_active: true }),
          apiService.getStudentTalents({ student: studentId }),
          apiService.getClubMemberships({ student: studentId, is_active: true }),
        ]);

        const studentRecord = studentResponse.data;
        const studentSchool = studentRecord.school;
        setStudent(studentRecord);
        setSchool(studentSchool || null);
        setResults(list(resultsResponse));
        setTalents(list(talentsResponse));
        setMembership(list(membershipsResponse)[0] || null);

        const [districtResponse, zoneResponse, regionResponse] = await Promise.all([
          studentSchool?.district ? apiService.getDistricts() : Promise.resolve({ data: { results: [] } }),
          studentSchool?.zone ? apiService.getZones() : Promise.resolve({ data: { results: [] } }),
          studentSchool?.region ? apiService.getRegions() : Promise.resolve({ data: { results: [] } }),
        ]);

        setDistrict(list(districtResponse).find((item) => Number(item.id) === Number(studentSchool?.district)) || null);
        setZone(list(zoneResponse).find((item) => Number(item.id) === Number(studentSchool?.zone)) || null);
        setRegion(list(regionResponse).find((item) => Number(item.id) === Number(studentSchool?.region)) || null);

        const announcementList = list(announcementsResponse);
        const visibleMessages = announcementList.filter((message) => {
          if (message.scope === 'national') return true;
          if (message.scope === 'zone' && studentSchool?.zone) return Number(message.zone) === Number(studentSchool.zone);
          if (message.scope === 'region' && studentSchool?.region) return Number(message.region) === Number(studentSchool.region);
          if (message.scope === 'district' && studentSchool?.district) return Number(message.district) === Number(studentSchool.district);
          if (message.scope === 'school' && studentSchool?.id) return Number(message.school) === Number(studentSchool.id);
          return false;
        });
        setMessages(visibleMessages);
      } catch (err) {
        setError(err.response?.data?.detail || err.message || 'Failed to load student dashboard.');
      } finally {
        setLoading(false);
      }
    };

    loadStudentDashboard();
  }, []);

  const summaryStats = useMemo(() => [
    { label: 'Talents', value: String(talents.length) },
    { label: 'Results', value: String(results.length) },
    { label: 'Announcements', value: String(messages.length) },
    { label: 'Club', value: membership ? 'Active' : 'Not assigned' },
  ], [talents.length, results.length, messages.length, membership]);

  const totalPoints = results.reduce((sum, result) => sum + (Number(result.grade_points) || 0), 0);

  const passedCount = results.filter((result) => {
    const score = Number(result.score ?? 0);
    return score >= 50;
  }).length;

  const failedCount = results.length - passedCount;

  return (
    <div className="page-container">
      <Header title="Student Dashboard" />
      <main className="admin-content">
        {loading && <DashboardSkeleton label="Loading student dashboard" />}
        {error && <div className="error-message" style={{ padding: '1rem', background: '#fee', color: '#c00', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}

        {!loading && !error && (
          <div className="cards-container">
            <section className="admin-section">
              <div className="section-header">
                <h2>Student overview</h2>
                <p>{student?.first_name} {student?.last_name}</p>
              </div>
              <div className="stats-overview">
                {summaryStats.map((stat, index) => (
                  <div key={index} className="stat-card">
                    <p className="stat-label">{stat.label}</p>
                    <h3 className="stat-value">{stat.value}</h3>
                  </div>
                ))}
              </div>
            </section>

            <section className="admin-section">
              <div className="section-header">
                <h2>My profile</h2>
                <p>School, zone and competition path</p>
              </div>
              <div className="reports-grid">
                <div className="report-card">
                  <h4>School</h4>
                  <p>{school?.name || 'Not available'}</p>
                  <p>Registry: {school?.registry_number || 'Not available'}</p>
                </div>
                <div className="report-card">
                  <h4>Ward</h4>
                  <p>{school?.ward_name || school?.ward || 'Not available'}</p>
                  <p>District: {district?.name || 'Not available'}</p>
                </div>
                <div className="report-card">
                  <h4>Zone / Region</h4>
                  <p>{zone?.name || 'Not available'}</p>
                  <p>Region: {region?.name || 'Not available'}</p>
                </div>
                <div className="report-card">
                  <h4>Performance</h4>
                  <p>Passed: {passedCount}</p>
                  <p>Failed: {failedCount}</p>
                  <p>Total points: {totalPoints}</p>
                </div>
              </div>
            </section>

            <section className="admin-section">
              <div className="section-header">
                <h2>My talents</h2>
                <p>Talents registered on your record</p>
              </div>
              <div className="reports-grid">
                {talents.length > 0 ? talents.map((talent) => (
                  <div className="report-card" key={talent.id}>
                    <h4>{talent.talent_name || 'Talent'}</h4>
                    <p>{talent.talent_category || 'Category not available'}</p>
                    <p>Proficiency: {talent.proficiency_level || 'N/A'}</p>
                    {talent.notes ? <p>Notes: {talent.notes}</p> : null}
                  </div>
                )) : (
                  <div className="report-card"><p>No talents registered yet.</p></div>
                )}
              </div>
            </section>

            <section className="admin-section">
              <div className="section-header">
                <h2>My results</h2>
                <p>Pass/fail status and all levels reached</p>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Level</th>
                      <th>Competition</th>
                      <th>Score</th>
                      <th>Grade</th>
                      <th>Status</th>
                      <th>Award</th>
                      <th>Rank</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.length > 0 ? results.map((result) => {
                      const score = Number(result.score ?? 0);
                      const overallStatus = score >= 50 ? 'Pass' : 'Fail';

                      return (
                        <tr key={result.id}>
                          <td>{result.competition_level || 'N/A'}</td>
                          <td>{result.competition_name || result.participation_details || 'Competition'}</td>
                          <td>{result.score ?? 'N/A'}</td>
                          <td>{result.grade || 'N/A'}</td>
                          <td>
                            <span style={{
                              display: 'inline-block',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '999px',
                              fontWeight: 600,
                              background: overallStatus === 'Pass' ? '#dcfce7' : '#fee2e2',
                              color: overallStatus === 'Pass' ? '#166534' : '#991b1b',
                            }}>
                              {overallStatus}
                            </span>
                          </td>
                          <td>{result.award || 'none'}</td>
                          <td>{result.rank || 'N/A'}</td>
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan="7">No results found yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {results.length > 0 && (
                <div className="reports-grid" style={{ marginTop: '1.25rem' }}>
                  {results.map((result) => {
                    const score = Number(result.score ?? 0);
                    const details = Array.isArray(result.details) ? result.details : [];

                    return (
                      <div className="report-card" key={`detail-${result.id}`}>
                        <h4>{result.competition_name || 'Competition'}</h4>
                        <p><strong>Level:</strong> {result.competition_level || 'N/A'}</p>
                        <p><strong>Overall result:</strong> {score >= 50 ? 'Pass' : 'Fail'} ({score ?? 'N/A'}%)</p>
                        {details.length ? (
                          <ul style={{ marginTop: '0.75rem', paddingLeft: '1.1rem' }}>
                            {details.map((detail) => (
                              <li key={detail.id}>
                                {detail.talent_name || 'Talent'}: {detail.percentage_score ?? detail.raw_score ?? 'N/A'}% — {detail.passed ? 'Pass' : 'Fail'}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>No talent detail breakdown available.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="admin-section">
              <div className="section-header">
                <h2>Announcements</h2>
                <p>Messages relevant to your school, district, zone and national level</p>
              </div>
              <div className="reports-grid">
                {messages.length > 0 ? messages.map((message) => (
                  <div className="report-card" key={message.id}>
                    <h4>{message.title}</h4>
                    <p>{message.content}</p>
                    <small>{message.scope_display || message.scope}</small>
                  </div>
                )) : (
                  <div className="report-card"><p>No announcements are available for your current school scope.</p></div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
