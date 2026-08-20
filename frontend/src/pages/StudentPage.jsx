import { useEffect, useState } from 'react';
import { Header } from '../components/shared';
import * as apiService from '../services/apiService';
import '../styles/dashboard.css';

const getResults = (response) => response.data.results || [];

export default function StudentPage() {
  const [student, setStudent] = useState(null);
  const [district, setDistrict] = useState(null);
  const [messages, setMessages] = useState([]);
  const [results, setResults] = useState([]);
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
          throw new Error('This student account is not linked to a student record.');
        }

        const studentResponse = await apiService.getStudentById(studentId);
        const studentRecord = studentResponse.data;
        setStudent(studentRecord);

        const [resultsResponse, announcementsResponse] = await Promise.all([
          apiService.getResults({ 'participation__student': studentId }),
          apiService.getAnnouncements({ is_active: true }),
        ]);

        const school = studentRecord.school;
        let districtRecord = null;
        if (school?.district) {
          const districtResponse = await apiService.getDistricts();
          districtRecord = getResults(districtResponse).find((item) => item.id === school.district) || null;
        }
        setDistrict(districtRecord);

        const announcementList = getResults(announcementsResponse);
        setMessages(announcementList.filter((message) => (
          message.scope === 'national'
          || (message.scope === 'district' && message.district === school?.district)
          || (message.scope === 'school' && message.school === school?.id)
        )));
        setResults(getResults(resultsResponse));
      } catch (err) {
        setError(err.response?.data?.detail || err.message || 'Failed to load student dashboard.');
      } finally {
        setLoading(false);
      }
    };

    loadStudentDashboard();
  }, []);

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
                <h2>My School</h2>
                <p>{student?.first_name} {student?.last_name}</p>
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
                  <p>Region ID: {district?.region || 'Not available'}</p>
                </div>
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
