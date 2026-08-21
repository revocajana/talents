import { useEffect, useMemo, useState } from 'react';
import { Header } from '../components/shared';
import * as apiService from '../services/apiService';
import '../styles/dashboard.css';

const list = (response) => response?.data?.results || (Array.isArray(response?.data) ? response.data : []);

export default function StudentPage() {
  const [student, setStudent] = useState(null);
  const [district, setDistrict] = useState(null);
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
        const studentId = userResponse.data.student;

        if (!studentId) {
          throw new Error('This account is not linked to a student record yet.');
        }

        const [studentResponse, resultsResponse, announcementsResponse, talentsResponse, membershipsResponse] = await Promise.all([
          apiService.getStudentById(studentId),
          apiService.getResults({ 'participation__student': studentId }),
          apiService.getAnnouncements({ is_active: true }),
          apiService.getStudentTalents({ student: studentId }),
          apiService.getClubMemberships({ student: studentId, is_active: true }),
        ]);

        const studentRecord = studentResponse.data;
        setStudent(studentRecord);
        setResults(list(resultsResponse));
        setTalents(list(talentsResponse));
        setMembership(list(membershipsResponse)[0] || null);

        const school = studentRecord.school;
        let districtRecord = null;
        if (school?.district) {
          const districtResponse = await apiService.getDistricts();
          districtRecord = list(districtResponse).find((item) => Number(item.id) === Number(school.district)) || null;
        }
        setDistrict(districtRecord);

        const announcementList = list(announcementsResponse);
        const visibleMessages = announcementList.filter((message) => {
          if (message.scope === 'national') return true;
          if (message.scope === 'district') return Number(message.district) === Number(school?.district);
          if (message.scope === 'school') return Number(message.school) === Number(school?.id);
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
    { label: 'Messages', value: String(messages.length) },
    { label: 'Club', value: membership?.club_name || membership?.club ? 'Active' : 'Not assigned' },
  ], [talents.length, results.length, messages.length, membership]);

  const totalPoints = results.reduce((sum, result) => sum + (Number(result.grade_points) || 0), 0);

  return (
    <div className="page-container">
      <Header title="Student Dashboard" />
      <main className="admin-content">
        {loading && <div style={{ textAlign: 'center', padding: '2rem' }}>Loading dashboard...</div>}
        {error && <div className="error-message" style={{ padding: '1rem', background: '#fee', color: '#c00', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}

        {!loading && !error && (
          <div className="cards-container">
            <section className="admin-section">
              <div className="section-header">
                <h2>Student Overview</h2>
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
                <h2>My Profile</h2>
                <p>School and district details</p>
              </div>
              <div className="reports-grid">
                <div className="report-card">
                  <h4>School</h4>
                  <p>{student?.school?.name || 'Not available'}</p>
                  <p>Registry number: {student?.school?.registry_number || 'Not available'}</p>
                </div>
                <div className="report-card">
                  <h4>District</h4>
                  <p>{district?.name || 'Not available'}</p>
                  <p>Region: {district?.region || 'Not available'}</p>
                </div>
                <div className="report-card">
                  <h4>My Club</h4>
                  <p>{membership?.club_name || 'Not assigned'}</p>
                  <p>Status: {membership ? 'Active' : 'No active membership'}</p>
                </div>
                <div className="report-card">
                  <h4>Performance</h4>
                  <p>Results recorded: {results.length}</p>
                  <p>Total points: {totalPoints}</p>
                </div>
              </div>
            </section>

            <section className="admin-section">
              <div className="section-header">
                <h2>My Talents</h2>
                <p>Talents registered to your profile</p>
              </div>
              <div className="reports-grid">
                {talents.length > 0 ? talents.map((talent) => (
                  <div className="report-card" key={talent.id}>
                    <h4>{talent.talent_name || 'Talent'}</h4>
                    <p>{talent.talent_category || 'Category not available'}</p>
                    <p>Proficiency level: {talent.proficiency_level || 'N/A'}</p>
                    {talent.notes ? <p>Notes: {talent.notes}</p> : null}
                  </div>
                )) : (
                  <div className="report-card"><p>No talents registered.</p></div>
                )}
              </div>
            </section>

            <section className="admin-section">
              <div className="section-header">
                <h2>My Results</h2>
                <p>Competition results recorded for you</p>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Competition</th>
                      <th>Date</th>
                      <th>Grade</th>
                      <th>Award</th>
                      <th>Rank</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.length > 0 ? results.map((result) => (
                      <tr key={result.id}>
                        <td>{result.participation_details || 'Competition'}</td>
                        <td>{result.competition_date || 'N/A'}</td>
                        <td>{result.grade || 'N/A'}</td>
                        <td>{result.award || 'none'}</td>
                        <td>{result.rank || 'N/A'}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="5">No results found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="admin-section">
              <div className="section-header">
                <h2>Messages</h2>
                <p>School, district, and national announcements</p>
              </div>
              <div className="reports-grid">
                {messages.length > 0 ? messages.map((message) => (
                  <div className="report-card" key={message.id}>
                    <h4>{message.title}</h4>
                    <p>{message.content}</p>
                    <small>{message.scope_display || message.scope}</small>
                  </div>
                )) : (
                  <div className="report-card"><p>No messages found.</p></div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
