import { useEffect, useMemo, useState } from 'react';
import { Header, Sidebar } from '../components/shared';
import { useAuth } from '../context/AuthContext';
import * as apiService from '../services/apiService';
import '../styles/dashboard.css';

const MENU_ITEMS = [
  { key: 'home', label: 'Home', icon: '🏠' },
  { key: 'results', label: 'Results', icon: '📊' },
  { key: 'announcements', label: 'Announcements', icon: '📢' },
  { key: 'reports', label: 'Reports', icon: '📈' },
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
  const [activeMenu, setActiveMenu] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [userRes, districtsRes, schoolsRes, wardsRes, competitionsRes, studentsRes, talentsRes, announcementsRes] = await Promise.all([
          apiService.getCurrentUser(),
          apiService.getDistricts(),
          apiService.getSchools(),
          apiService.getWards(),
          apiService.getCompetitions(),
          apiService.getStudents(),
          apiService.getStudentTalents(),
          apiService.getAnnouncements({ is_active: true }),
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

  const navLinks = MENU_ITEMS.map((item) => ({
    ...item,
    active: activeMenu === item.key,
    onClick: () => setActiveMenu(item.key),
  }));

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
        <div className="section-header">
          <h2>District Results</h2>
          <p>School and student performance across the district</p>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>School</th>
                <th>Students</th>
                <th>Talents</th>
                <th>Competitions</th>
              </tr>
            </thead>
            <tbody>
              {districtSchools.length > 0 ? (
                districtSchools.map((school) => {
                  const studentCount = students.filter((student) => Number(student.school?.id ?? student.school) === Number(school.id)).length;
                  const talentCount = studentTalents.filter((entry) =>
                    students.some(
                      (student) => Number(student.id) === Number(entry.student) && Number(student.school?.id ?? student.school) === Number(school.id)
                    )
                  ).length;
                  const competitionCount = competitions.filter((competition) => String(competition.level) === 'district').length;

                  return (
                    <tr key={school.id}>
                      <td>{school.name}</td>
                      <td>{studentCount}</td>
                      <td>{talentCount}</td>
                      <td>{competitionCount}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4">No result data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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

        <div className="reports-grid">
          {announcements.length > 0 ? (
            announcements.map((announcement) => (
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
    <div className="page-container">
      <Header title="District Manager Dashboard" onMenuToggle={() => setSidebarOpen(true)} />

      <div className="main-layout">
        <Sidebar
          isOpen={sidebarOpen}
          links={navLinks}
          onClose={() => setSidebarOpen(false)}
          footerContent={
            <button className="sidebar-logout" type="button" onClick={logout}>
              Logout
            </button>
          }
        />

        <main className="main-content">
          {error && (
            <div className="error-message" style={{ padding: '1rem', background: '#fee', color: '#c00', borderRadius: '4px', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading dashboard...</div>
          ) : (
            <>
              {activeMenu === 'home' && renderHomeView()}
              {activeMenu === 'results' && renderResultsView()}
              {activeMenu === 'announcements' && renderAnnouncementsView()}
              {activeMenu === 'reports' && renderReportsView()}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

