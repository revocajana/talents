import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import * as apiService from '../services/apiService';
import logo from '../assets/Logo1.png';
import './SportTeacherPage.css';
import '../styles/districtmanager.css';

const MENU_ITEMS = [
  { key: 'home', label: 'Home' },
  { key: 'results', label: 'School & District Results' },
  { key: 'announcements', label: 'Announcements' },
  { key: 'reports', label: 'Reports' },
];

export default function DistrictManagerPage() {
  const { logout } = useAuth();
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
  const [announcements, setAnnouncements] = useState([]);
  const [results, setResults] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [selectedSchoolStudents, setSelectedSchoolStudents] = useState([]);
  const [selectedResultStudents, setSelectedResultStudents] = useState([]);
  const [districtResultForm, setDistrictResultForm] = useState({ competition: '', student: '', score: '', status: 'finished' });
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', expires_at: '' });
  const [submitting, setSubmitting] = useState(false);
  const [selectedPromotionStudents, setSelectedPromotionStudents] = useState([]);
  const [activeMenu, setActiveMenu] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const districtName = allDistricts.find((district) => Number(district.id) === Number(selectedDistrict))?.name || 'Assigned District';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [userRes, districtsRes, schoolsRes, wardsRes, competitionsRes, studentsRes, talentsRes, announcementsRes, resultsRes, participationsRes, promotionsRes] = await Promise.all([
          apiService.getCurrentUser(),
          apiService.getDistricts(),
          apiService.getSchools(),
          apiService.getWards(),
          apiService.getCompetitions(),
          apiService.getStudents(),
          apiService.getStudentTalents(),
          apiService.getAnnouncements({ is_active: true }),
          apiService.getResults(),
          apiService.getParticipations(),
          apiService.getResultPromotions(),
        ]);

        const districtList = districtsRes.data.results || [];
        const schoolList = schoolsRes.data.results || [];
        const wardList = wardsRes.data.results || [];
        const competitionList = competitionsRes.data.results || [];
        const studentList = studentsRes.data.results || [];
        const talentList = talentsRes.data.results || [];
        const announcementList = announcementsRes.data.results || [];

        setCurrentUser(userRes.data);
        setAllDistricts(districtList);
        setSchools(schoolList);
        setWards(wardList);
        setCompetitions(competitionList);
        setStudents(studentList);
        setStudentTalents(talentList);
        setAnnouncements(announcementList);
        setResults(resultsRes.data.results || []);
        setParticipations(participationsRes.data.results || []);
        setPromotions(promotionsRes.data.results || []);

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

  const schoolCompetitions = useMemo(() => districtCompetitions.filter((competition) => competition.level === 'school'), [districtCompetitions]);
  const districtLevelCompetitions = useMemo(() => districtCompetitions.filter((competition) => competition.level === 'district'), [districtCompetitions]);
  const relevantAnnouncements = useMemo(() => announcements.filter((announcement) => {
    if (!announcement.is_active || (announcement.expires_at && new Date(announcement.expires_at) < new Date())) return false;
    if (announcement.scope === 'national') return true;
    if (announcement.scope === 'district') return Number(announcement.district) === visibleDistrictId;
    return Number(announcement.district) === visibleDistrictId || Number(announcement.region) === Number(allDistricts.find((district) => Number(district.id) === visibleDistrictId)?.region);
  }), [allDistricts, announcements, visibleDistrictId]);
  const pendingPromotionStudents = useMemo(() => {
    const schoolCompetitionIds = new Set(schoolCompetitions.map((competition) => Number(competition.id)));
    const studentMap = new Map(districtStudents.map((student) => [Number(student.id), student]));
    const schoolMap = new Map(districtSchools.map((school) => [Number(school.id), school]));
    const eligible = participations
      .filter((participation) => schoolCompetitionIds.has(Number(participation.competition)) && participation.status === 'finished' && Number(participation.score) >= 50)
      .map((participation) => {
        const student = studentMap.get(Number(participation.student));
        const schoolId = Number(student?.school?.id ?? student?.school);
        return { ...participation, studentRecord: student, schoolName: schoolMap.get(schoolId)?.name || 'School' };
      })
      .filter((participation) => participation.studentRecord);
    return Array.from(new Map(eligible.map((item) => [Number(item.student), item])).values());
  }, [districtSchools, districtStudents, districtCompetitions, participations, schoolCompetitions]);
  const promotedStudents = useMemo(() => {
    const resultParticipationIds = new Set(results.filter((result) => promotions.some((promotion) => Number(promotion.result) === Number(result.id) && promotion.to_level === 'district')).map((result) => Number(result.participation)));
    const promotedStudentIds = new Set(participations.filter((participation) => resultParticipationIds.has(Number(participation.id))).map((participation) => Number(participation.student)));
    return districtStudents.filter((student) => promotedStudentIds.has(Number(student.id)));
  }, [districtStudents, participations, promotions, results]);

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

  const navLinks = MENU_ITEMS.map((item) => ({
    ...item,
    active: activeMenu === item.key,
    onClick: () => setActiveMenu(item.key),
  }));

  const refreshData = () => window.location.reload();

  const handlePromoteStudents = async () => {
    if (!selectedPromotionStudents.length) return;
    const source = pendingPromotionStudents.find((item) => selectedPromotionStudents.includes(Number(item.student)));
    if (!source) return;
    setSubmitting(true);
    try {
      await apiService.promoteStudents({
        student_ids: selectedPromotionStudents,
        competition_id: source.competition,
        from_level: 'school',
        to_level: 'district',
      });
      setSelectedPromotionStudents([]);
      refreshData();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to promote students');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddDistrictResult = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const participationResponse = await apiService.createParticipation({
        competition: Number(districtResultForm.competition),
        student: Number(districtResultForm.student),
        score: districtResultForm.score ? Number(districtResultForm.score) : null,
        status: districtResultForm.status,
      });
      await apiService.createResult({
        participation: participationResponse.data.id,
        score: districtResultForm.score ? Number(districtResultForm.score) : null,
      });
      setDistrictResultForm({ competition: '', student: '', score: '', status: 'finished' });
      refreshData();
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Failed to record district result');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAnnouncement = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await apiService.createAnnouncement({
        title: announcementForm.title.trim(),
        content: announcementForm.content.trim(),
        scope: 'district',
        district: visibleDistrictId,
        expires_at: announcementForm.expires_at || null,
        is_active: true,
      });
      setAnnouncementForm({ title: '', content: '', expires_at: '' });
      refreshData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const renderHomeView = () => (
    <>
      {!loading && (
        <div className="district-toolbar" style={{ padding: '1rem 1.25rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', maxWidth: '100%', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: '700', color: '#0E1DB6' }}>District:</span>
            <span style={{ fontWeight: '600', color: '#374151' }}>
              {allDistricts.find((district) => Number(district.id) === Number(selectedDistrict))?.name || 'Assigned District'}
            </span>
          </div>
        </div>
      )}

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
      </div>
    </>
  );

  const renderResultsView = () => (
    <div className="cards-container">
      <section className="admin-section">
        <div className="section-header district-section-heading">
          <div><h2>School Competition Results</h2><p>Review finished school results and select students for district competition.</p></div>
          <button type="button" className="btn-primary" onClick={handlePromoteStudents} disabled={!selectedPromotionStudents.length || submitting}>
            {submitting ? 'Processing...' : `Promote selected (${selectedPromotionStudents.length})`}
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Select</th><th>Student</th><th>School</th><th>Competition</th><th>Score</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pendingPromotionStudents.map((item) => (
                <tr key={item.id}>
                  <td><input type="checkbox" checked={selectedPromotionStudents.includes(Number(item.student))} onChange={(event) => setSelectedPromotionStudents((current) => event.target.checked ? [...new Set([...current, Number(item.student)])] : current.filter((id) => id !== Number(item.student)))} /></td>
                  <td>{item.studentRecord.first_name} {item.studentRecord.last_name}</td><td>{item.schoolName}</td>
                  <td>{schoolCompetitions.find((competition) => Number(competition.id) === Number(item.competition))?.name || 'School competition'}</td>
                  <td>{item.score}%</td><td>{item.status}</td>
                </tr>
              ))}
              {!pendingPromotionStudents.length && <tr><td colSpan="6">No eligible school-level students are pending promotion.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      <section className="admin-section">
        <div className="section-header"><h2>District Competition Results</h2><p>Record results for students promoted to district competition.</p></div>
        <form className="district-form-grid" onSubmit={handleAddDistrictResult}>
          <label>Competition<select required value={districtResultForm.competition} onChange={(event) => setDistrictResultForm({ ...districtResultForm, competition: event.target.value })}><option value="">Select district competition</option>{districtLevelCompetitions.map((competition) => <option key={competition.id} value={competition.id}>{competition.name}</option>)}</select></label>
          <label>Student<select required value={districtResultForm.student} onChange={(event) => setDistrictResultForm({ ...districtResultForm, student: event.target.value })}><option value="">Select promoted student</option>{promotedStudents.map((student) => <option key={student.id} value={student.id}>{student.first_name} {student.last_name}</option>)}</select></label>
          <label>Score<input required type="number" min="0" max="100" value={districtResultForm.score} onChange={(event) => setDistrictResultForm({ ...districtResultForm, score: event.target.value })} /></label>
          <label>Status<select value={districtResultForm.status} onChange={(event) => setDistrictResultForm({ ...districtResultForm, status: event.target.value })}><option value="finished">Finished</option><option value="registered">Registered</option><option value="disqualified">Disqualified</option></select></label>
          <button type="submit" className="btn-primary" disabled={submitting}>Save district result</button>
        </form>
        <div className="table-container"><table className="data-table"><thead><tr><th>Student</th><th>Competition</th><th>Score</th><th>Grade</th><th>Approval</th></tr></thead><tbody>
          {results.filter((result) => participations.some((participation) => Number(participation.id) === Number(result.participation) && districtLevelCompetitions.some((competition) => Number(competition.id) === Number(participation.competition)))).map((result) => {
            const participation = participations.find((item) => Number(item.id) === Number(result.participation));
            const student = districtStudents.find((item) => Number(item.id) === Number(participation?.student));
            return <tr key={result.id}><td>{student ? `${student.first_name} ${student.last_name}` : 'Student'}</td><td>{districtLevelCompetitions.find((competition) => Number(competition.id) === Number(participation?.competition))?.name || 'District competition'}</td><td>{result.score ?? '—'}</td><td>{result.grade || '—'}</td><td>{result.approval_status}</td></tr>;
          })}
          {!results.some((result) => participations.some((participation) => Number(participation.id) === Number(result.participation) && districtLevelCompetitions.some((competition) => Number(competition.id) === Number(participation.competition)))) && <tr><td colSpan="5">No district results recorded yet.</td></tr>}
        </tbody></table></div>
      </section>
    </div>
  );

  const renderAnnouncementsView = () => (
    <div className="cards-container">
      <section className="admin-section">
        <div className="section-header">
          <h2>Announcements</h2>
          <p>District updates and notices</p>
        </div>

        <form className="district-announcement-form" onSubmit={handleCreateAnnouncement}>
          <input required placeholder="Announcement title" value={announcementForm.title} onChange={(event) => setAnnouncementForm({ ...announcementForm, title: event.target.value })} />
          <textarea required placeholder="Write the district announcement" value={announcementForm.content} onChange={(event) => setAnnouncementForm({ ...announcementForm, content: event.target.value })} rows="4" />
          <label>Expires on (optional)<input type="date" value={announcementForm.expires_at} onChange={(event) => setAnnouncementForm({ ...announcementForm, expires_at: event.target.value })} /></label>
          <button type="submit" className="btn-primary" disabled={submitting}>Publish announcement</button>
        </form>
        <div className="reports-grid">
          {relevantAnnouncements.length > 0 ? (
            relevantAnnouncements.map((announcement) => (
              <div className="report-card" key={announcement.id}>
                <h4>{announcement.title}</h4>
                <p>{announcement.content || 'No details available.'}</p>
                <ul className="stats-list">
                  <li><span>Scope:</span> {announcement.scope}</li>
                  <li><span>Status:</span> {announcement.is_active ? 'Active' : 'Inactive'}</li>
                </ul>
              </div>
            ))
          ) : (
            <div className="report-card">
              <h4>No announcements</h4>
              <p>There are no active announcements for this district yet.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );

  const renderReportsView = () => (
    <div className="cards-container">
      <section className="admin-section">
        <div className="section-header">
          <h2>District Reports</h2>
          <p>Key district performance and operational summary</p>
        </div>

        <div className="reports-grid">
          <div className="report-card">
            <h4>Schools</h4>
            <p>Number of schools linked to this district.</p>
            <ul className="stats-list">
              <li><span>Total:</span> {districtSchools.length}</li>
            </ul>
          </div>

          <div className="report-card">
            <h4>Students</h4>
            <p>Students recorded under district schools.</p>
            <ul className="stats-list">
              <li><span>Total:</span> {districtStudents.length}</li>
            </ul>
          </div>

          <div className="report-card">
            <h4>Wards</h4>
            <p>Ward coverage within the selected district.</p>
            <ul className="stats-list">
              <li><span>Total:</span> {districtWards.length}</li>
            </ul>
          </div>

          <div className="report-card">
            <h4>Competitions</h4>
            <p>Active competition records associated with this district.</p>
            <ul className="stats-list">
              <li><span>Total:</span> {districtCompetitions.length}</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );

  return (
    <div className="sport-teacher-page district-manager-page">
      <header className="sport-teacher-app-bar">
        <div className="sport-teacher-brand">
          <img src={logo} alt="Talanta logo" />
          <span>Talanta Management System</span>
        </div>
        <div className="sport-teacher-app-actions">
          <div className="sport-teacher-profile">
            <button type="button" className="sport-teacher-profile-button" onClick={() => setProfileMenuOpen((open) => !open)} aria-label="Open profile menu" aria-expanded={profileMenuOpen} title={currentUser?.username || 'Profile'}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20c.8-3.5 3.5-5.5 7.5-5.5s6.7 2 7.5 5.5" /></svg>
            </button>
            {profileMenuOpen && <div className="sport-teacher-profile-menu"><button type="button" onClick={() => setProfileMenuOpen(false)}>Profile</button><button type="button" onClick={() => setProfileMenuOpen(false)}>Change password</button></div>}
          </div>
          <button type="button" className="sport-teacher-navigation-toggle" onClick={() => setSidebarOpen((open) => !open)} aria-label="Open navigation menu" aria-expanded={sidebarOpen} title="Open navigation menu">
            <span /><span /><span />
          </button>
        </div>
      </header>

      <aside className={`sport-teacher-navigation ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="sport-teacher-navigation-heading">{districtName}</div>
        {navLinks.map((item) => (
          <button type="button" key={item.key} onClick={() => { item.onClick(); setSidebarOpen(false); }}>
            {item.label}
          </button>
        ))}
        <button type="button" className="sport-teacher-logout-button" onClick={logout}>Logout</button>
      </aside>

      <main className="sport-teacher-prototype-content district-manager-content">
        <div className="district-manager-heading">
          <div>
            <p className="sport-teacher-eyebrow">District Manager</p>
            <h1>{districtName}</h1>
            <p>Manage school results, district qualifiers, and communication.</p>
          </div>
          <span className="sport-teacher-date">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        </div>
        {error && <div className="district-manager-alert">{error}<button type="button" onClick={() => setError(null)} aria-label="Dismiss error">&times;</button></div>}
        {loading ? <p>Loading district workspace...</p> : (
          <>
            {activeMenu === 'home' && renderHomeView()}
            {activeMenu === 'results' && renderResultsView()}
            {activeMenu === 'announcements' && renderAnnouncementsView()}
            {activeMenu === 'reports' && renderReportsView()}
          </>
        )}
      </main>
    </div>
  );
}

