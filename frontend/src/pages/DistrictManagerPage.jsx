import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardSkeleton from '../components/DashboardSkeleton';
import * as apiService from '../services/apiService';
import logo from '../assets/Logo1.png';
import './SportTeacherPage.css';
import '../styles/districtmanager.css';

const MENU_ITEMS = [
  { key: 'home', label: 'Home' },
  { key: 'school-results', label: 'School results' },
  { key: 'district-results', label: 'District results' },
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
  const [schoolSubmissions, setSchoolSubmissions] = useState([]);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [competitionDrawerOpen, setCompetitionDrawerOpen] = useState(false);
  const [competitionDrawerWidth, setCompetitionDrawerWidth] = useState(420);
  const [isResizingCompetitionDrawer, setIsResizingCompetitionDrawer] = useState(false);
  const [competitionForm, setCompetitionForm] = useState({ name: '', description: '', start_date: '', end_date: '', status: 'draft' });
  const [competitionSubmitting, setCompetitionSubmitting] = useState(false);
  const districtName = currentUser?.district_name
    || allDistricts.find((district) => Number(district.id) === Number(selectedDistrict))?.name
    || 'Assigned District';

  useEffect(() => {
    if (!isResizingCompetitionDrawer) return undefined;
    const handlePointerMove = (event) => {
      const nextWidth = window.innerWidth - event.clientX;
      setCompetitionDrawerWidth(Math.max(320, Math.min(nextWidth, Math.min(760, window.innerWidth - 24))));
    };
    const stopResizing = () => setIsResizingCompetitionDrawer(false);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopResizing);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopResizing);
    };
  }, [isResizingCompetitionDrawer]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [userRes, districtsRes, schoolsRes, wardsRes, competitionsRes, studentsRes, talentsRes, announcementsRes, resultsRes, participationsRes, promotionsRes, submissionsRes] = await Promise.all([
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
          apiService.getSchoolResultSubmissions(),
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
        setSchoolSubmissions(submissionsRes.data.results || []);

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
      const isDistrictLocation = competition.level === 'district' && Number(locationId) === visibleDistrictId;
      const belongsToDistrictSchool = Array.isArray(competition.schools)
        && competition.schools.some((schoolId) => districtSchools.some((school) => Number(school.id) === Number(schoolId)));
      return Number(locationId) === visibleDistrictId || isDistrictLocation || belongsToDistrictSchool;
    });
  }, [competitions, districtSchools, visibleDistrictId]);

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
  }, [districtSchools, districtStudents, participations, schoolCompetitions]);
  const promotedStudents = useMemo(() => {
    const resultParticipationIds = new Set(results.filter((result) => promotions.some((promotion) => Number(promotion.result) === Number(result.id) && promotion.to_level === 'district')).map((result) => Number(result.participation)));
    const promotedStudentIds = new Set(participations.filter((participation) => resultParticipationIds.has(Number(participation.id))).map((participation) => Number(participation.student)));
    return districtStudents.filter((student) => promotedStudentIds.has(Number(student.id)));
  }, [districtStudents, participations, promotions, results]);

  const navLinks = MENU_ITEMS.map((item) => ({
    ...item,
    active: activeMenu === item.key,
    onClick: () => setActiveMenu(item.key),
  }));

  const refreshData = () => window.location.reload();

  const talentParticipation = useMemo(() => {
    const counts = new Map();
    districtTalents.forEach((entry) => {
      const talentName = entry.talent_name || 'Other talent';
      counts.set(talentName, (counts.get(talentName) || 0) + 1);
    });
    const total = districtTalents.length;
    return [...counts.entries()]
      .sort(([, firstCount], [, secondCount]) => secondCount - firstCount)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count, percentage: total ? Math.round((count / total) * 100) : 0 }));
  }, [districtTalents]);

  const schoolRanking = useMemo(() => districtSchools.map((school) => {
    const schoolStudents = districtStudents.filter((student) => Number(student.school?.id ?? student.school) === Number(school.id));
    const schoolStudentIds = new Set(schoolStudents.map((student) => Number(student.id)));
    const schoolParticipations = participations.filter((participation) => schoolStudentIds.has(Number(participation.student)));
    const scored = schoolParticipations.filter((participation) => participation.score !== null && participation.score !== undefined);
    const averageScore = scored.length ? Math.round(scored.reduce((sum, item) => sum + Number(item.score), 0) / scored.length) : 0;
    return { name: school.name, students: schoolStudents.length, participation: schoolParticipations.length, averageScore };
  }).sort((first, second) => second.averageScore - first.averageScore || second.participation - first.participation).slice(0, 5), [districtSchools, districtStudents, participations]);

  const competitionDates = useMemo(() => {
    const dates = new Set();
    districtCompetitions.forEach((competition) => {
      if (!competition.start_date) return;
      const date = new Date(`${competition.start_date}T00:00:00`);
      const end = competition.end_date ? new Date(`${competition.end_date}T00:00:00`) : date;
      while (date <= end) {
        dates.add(date.toISOString().slice(0, 10));
        date.setDate(date.getDate() + 1);
      }
    });
    return dates;
  }, [districtCompetitions]);

  const calendarDays = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { monthLabel: today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), firstDay, daysInMonth, year, month };
  }, []);

  const handleDeleteAnnouncement = async (announcementId) => {
    try {
      await apiService.deleteAnnouncement(announcementId);
      setAnnouncements((items) => items.filter((item) => item.id !== announcementId));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete announcement');
    }
  };

  const openCompetitionEditor = (competition = null) => {
    setSelectedCompetition(competition);
    setCompetitionForm({
      name: competition?.name || '',
      description: competition?.description || '',
      start_date: competition?.start_date || '',
      end_date: competition?.end_date || '',
      status: competition?.status || 'draft',
    });
    setCompetitionDrawerOpen(true);
  };

  const closeCompetitionEditor = () => {
    setCompetitionDrawerOpen(false);
    setSelectedCompetition(null);
    setCompetitionForm({ name: '', description: '', start_date: '', end_date: '', status: 'draft' });
  };

  const handleSaveCompetition = async (event) => {
    event.preventDefault();
    setCompetitionSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: competitionForm.name.trim(),
        description: competitionForm.description.trim(),
        start_date: competitionForm.start_date,
        end_date: competitionForm.end_date || null,
        level: 'district',
        status: competitionForm.status,
      };
      if (selectedCompetition) {
        await apiService.patchCompetition(selectedCompetition.id, payload);
      } else {
        await apiService.createCompetition({ ...payload, schools: [] });
      }
      closeCompetitionEditor();
      const competitionsRes = await apiService.getCompetitions();
      setCompetitions(competitionsRes.data.results || []);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Failed to save competition');
    } finally {
      setCompetitionSubmitting(false);
    }
  };

  const handleDeleteCompetition = async () => {
    if (!selectedCompetition || !window.confirm('Delete this competition?')) return;
    setCompetitionSubmitting(true);
    setError(null);
    try {
      await apiService.deleteCompetition(selectedCompetition.id);
      closeCompetitionEditor();
      setCompetitions((items) => items.filter((item) => item.id !== selectedCompetition.id));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete competition');
    } finally {
      setCompetitionSubmitting(false);
    }
  };

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
      <div className="district-home-grid">
        <section className="district-home-card talent-card">
          <div className="district-card-heading"><div><h2>Talent participation</h2><p>Share of registered talent records</p></div><span className="district-card-kicker">{districtTalents.length} records</span></div>
          <div className="talent-chart-layout">
            <div className="talent-donut" style={{ background: `conic-gradient(${talentParticipation.map((item, index) => `${['#0e1db6', '#16a085', '#f59e0b', '#e05252', '#7c3aed'][index]} ${talentParticipation.slice(0, index).reduce((sum, entry) => sum + entry.percentage, 0)}% ${talentParticipation.slice(0, index + 1).reduce((sum, entry) => sum + entry.percentage, 0)}%`).join(', ') || '#e5e7eb 0 100%'}` }}><div /></div>
            <div className="talent-legend">{talentParticipation.length ? talentParticipation.map((item, index) => <div className="talent-legend-row" key={item.name}><span className="legend-dot" style={{ background: ['#0e1db6', '#16a085', '#f59e0b', '#e05252', '#7c3aed'][index] }} /> <span>{item.name}</span><strong>{item.percentage}%</strong></div>) : <p>No talent records yet.</p>}</div>
          </div>
        </section>

        <section className="district-home-card">
          <div className="district-card-heading"><div><h2>School performance</h2><p>Ranked by average recorded score</p></div><span className="district-card-kicker">Top 5</span></div>
          <div className="school-ranking">{schoolRanking.length ? schoolRanking.map((school, index) => <div className="school-ranking-row" key={school.name}><span className="school-rank">{index + 1}</span><div className="school-ranking-name"><strong>{school.name}</strong><small>{school.students} students · {school.participation} entries</small></div><b>{school.averageScore}%</b></div>) : <p className="district-empty-state">No school performance data yet.</p>}</div>
        </section>

        <section className="district-home-card">
          <div className="district-card-heading"><div><h2>Competition management</h2><p>Create and manage Sengerema district events</p></div><button type="button" className="district-primary-button district-card-action" onClick={() => openCompetitionEditor()}>Add competition</button></div>
          <div className="district-competition-list">
            {districtLevelCompetitions.map((competition) => (
              <button type="button" className="district-competition-row is-editable" key={competition.id} onClick={() => openCompetitionEditor(competition)} aria-label={`Edit ${competition.name}`}>
                <strong className="district-competition-title">{competition.name}</strong>
                <span className={`district-competition-status is-${competition.status || 'draft'}`}>{competition.status || 'draft'}</span>
                <small>{competition.start_date || 'Date not set'}{competition.end_date ? ` - ${competition.end_date}` : ''}</small>
              </button>
            ))}
            {!districtLevelCompetitions.length && <p className="district-empty-state">No district competitions created yet.</p>}
          </div>
          <div className="district-competition-footer"><span>{districtLevelCompetitions.length} district events · {schoolSubmissions.filter((item) => item.status === 'submitted').length} submissions</span><button type="button" className="district-text-button" onClick={() => setActiveMenu('district-results')}>Open results</button></div>
        </section>

        <section className="district-home-card">
          <div className="district-card-heading"><div><h2>Recent announcements</h2><p>Publish or remove district updates</p></div><button type="button" className="district-text-button" onClick={() => setActiveMenu('announcements')}>View all</button></div>
          <div className="recent-announcements">{relevantAnnouncements.slice(0, 3).map((announcement) => <div className="recent-announcement-row" key={announcement.id}><div><strong>{announcement.title}</strong><small>{announcement.content || 'No details available.'}</small></div><button type="button" className="district-icon-button" onClick={() => handleDeleteAnnouncement(announcement.id)} title="Delete announcement" aria-label={`Delete ${announcement.title}`}>×</button></div>)}{!relevantAnnouncements.length && <p className="district-empty-state">No active announcements yet.</p>}</div>
          <button type="button" className="district-primary-button" onClick={() => setActiveMenu('announcements')}>Publish announcement</button>
        </section>

        <section className="district-home-card district-calendar-card">
          <div className="district-card-heading"><div><h2>Competition calendar</h2><p>Blue circles mark competition days</p></div><span className="district-card-kicker">{calendarDays.monthLabel}</span></div>
          <div className="calendar-weekdays">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day}>{day}</span>)}</div>
          <div className="calendar-grid">{Array.from({ length: calendarDays.firstDay }).map((_, index) => <span className="calendar-day is-empty" key={`empty-${index}`} />)}{Array.from({ length: calendarDays.daysInMonth }, (_, index) => { const day = index + 1; const dateKey = `${calendarDays.year}-${String(calendarDays.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; return <span className={`calendar-day ${competitionDates.has(dateKey) ? 'has-competition' : ''}`} key={dateKey}>{day}</span>; })}</div>
          <div className="calendar-events">{districtCompetitions.filter((competition) => competition.start_date).slice(0, 5).map((competition) => <div key={competition.id}><span className="calendar-event-dot" /> <strong>{competition.name}</strong><small>{competition.start_date}{competition.end_date ? ` - ${competition.end_date}` : ''}</small></div>)}</div>
        </section>
      </div>
    </>
  );

  const renderResultsView = () => {
    const submittedSchoolCompetitions = schoolCompetitions
      .filter((competition) => schoolSubmissions.some((submission) => Number(submission.competition) === Number(competition.id) && submission.status === 'submitted'))
      .map((competition) => {
        const entries = participations
          .filter((participation) => Number(participation.competition) === Number(competition.id) && districtStudents.some((student) => Number(student.id) === Number(participation.student)))
          .map((participation) => {
            const result = results.find((item) => Number(item.participation) === Number(participation.id));
            const student = districtStudents.find((item) => Number(item.id) === Number(participation.student));
            const school = districtSchools.find((item) => Number(item.id) === Number(student?.school?.id ?? student?.school));
            return { participation, result, student, school };
          });
        return { ...competition, entries };
      });

    if (activeMenu === 'school-results') {
      return (
        <div className="district-results-stack">
          <div className="district-results-heading">
            <div><h2>School results</h2><p>Submitted results from schools in your district. These results are read-only.</p></div>
          </div>
          {submittedSchoolCompetitions.map((competition) => (
            <section className="district-result-card" key={competition.id}>
              <div className="district-result-card-header">
                <div><h3>{competition.name}</h3><p>Submitted school-level results.</p></div>
                <span className="district-result-level">Read only</span>
              </div>
              <div className="district-result-table-wrap">
                <table className="data-table"><thead><tr><th>Student</th><th>School</th><th>Score</th><th>Grade</th><th>Approval</th></tr></thead><tbody>
                  {competition.entries.map(({ participation, result, student, school }) => (
                    <tr key={participation.id}><td>{student ? `${student.first_name} ${student.last_name}` : 'Student'}</td><td>{school?.name || 'School'}</td><td>{result?.score ?? participation.score ?? '—'}</td><td>{result?.grade || '—'}</td><td>{result?.approval_status || participation.status}</td></tr>
                  ))}
                  {!competition.entries.length && <tr><td colSpan="5" className="district-result-empty">No submitted results available yet.</td></tr>}
                </tbody></table>
              </div>
            </section>
          ))}
          {!submittedSchoolCompetitions.length && <section className="district-result-card"><p className="district-result-empty">No school competition results have been submitted yet.</p></section>}
        </div>
      );
    }
    const districtResultsByCompetition = districtLevelCompetitions.map((competition) => {
      const entries = results.filter((result) => {
        const participation = participations.find((item) => Number(item.id) === Number(result.participation));
        return Number(participation?.competition) === Number(competition.id);
      }).map((result) => {
        const participation = participations.find((item) => Number(item.id) === Number(result.participation));
        const student = districtStudents.find((item) => Number(item.id) === Number(participation?.student));
        return { ...result, student };
      });
      return { ...competition, entries };
    });

    return (
      <div className="district-results-stack">
        <div className="district-results-heading">
          <div><h2>District results</h2><p>Results grouped by district competition.</p></div>
          <button type="button" className="btn-primary" onClick={handlePromoteStudents} disabled={!selectedPromotionStudents.length || submitting}>
            {submitting ? 'Processing...' : `Promote selected (${selectedPromotionStudents.length})`}
          </button>
        </div>

        {districtResultsByCompetition.map((competition) => (
          <section className="district-result-card" key={`district-${competition.id}`}>
            <div className="district-result-card-header">
              <div><h3>{competition.name}</h3><p>District-level results for promoted students.</p></div>
              <span className="district-result-level">District level</span>
            </div>
            <div className="district-result-table-wrap">
              <table className="data-table"><thead><tr><th>Student</th><th>Score</th><th>Grade</th><th>Approval</th></tr></thead><tbody>
                {competition.entries.map((result) => (
                  <tr key={result.id}><td>{result.student ? `${result.student.first_name} ${result.student.last_name}` : 'Student'}</td><td>{result.score ?? '—'}</td><td>{result.grade || '—'}</td><td>{result.approval_status}</td></tr>
                ))}
                {!competition.entries.length && <tr><td colSpan="4" className="district-result-empty">No district results recorded yet.</td></tr>}
              </tbody></table>
            </div>
          </section>
        ))}

        <section className="district-result-card">
          <div className="district-result-card-header"><div><h3>Record district result</h3><p>Add a result for a promoted student.</p></div></div>
          <form className="district-form-grid" onSubmit={handleAddDistrictResult}>
            <label>Competition<select required value={districtResultForm.competition} onChange={(event) => setDistrictResultForm({ ...districtResultForm, competition: event.target.value })}><option value="">Select district competition</option>{districtLevelCompetitions.map((competition) => <option key={competition.id} value={competition.id}>{competition.name}</option>)}</select></label>
            <label>Student<select required value={districtResultForm.student} onChange={(event) => setDistrictResultForm({ ...districtResultForm, student: event.target.value })}><option value="">Select promoted student</option>{promotedStudents.map((student) => <option key={student.id} value={student.id}>{student.first_name} {student.last_name}</option>)}</select></label>
            <label>Score<input required type="number" min="0" max="100" value={districtResultForm.score} onChange={(event) => setDistrictResultForm({ ...districtResultForm, score: event.target.value })} /></label>
            <label>Status<select value={districtResultForm.status} onChange={(event) => setDistrictResultForm({ ...districtResultForm, status: event.target.value })}><option value="finished">Finished</option><option value="registered">Registered</option><option value="disqualified">Disqualified</option></select></label>
            <button type="submit" className="btn-primary" disabled={submitting}>Save district result</button>
          </form>
        </section>
      </div>
    );
  };

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
            {profileMenuOpen && <div className="sport-teacher-profile-menu"><button type="button" onClick={() => setProfileMenuOpen(false)}>Profile</button><button type="button" onClick={() => setProfileMenuOpen(false)}>Change password</button><button type="button" onClick={logout}>Logout</button></div>}
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
      </aside>

      <main className="sport-teacher-prototype-content district-manager-content">
        {error && <div className="district-manager-alert">{error}<button type="button" onClick={() => setError(null)} aria-label="Dismiss error">&times;</button></div>}
        {loading ? <DashboardSkeleton label="Loading district manager dashboard" /> : (
          <>
            {activeMenu === 'home' && renderHomeView()}
            {(activeMenu === 'school-results' || activeMenu === 'district-results') && renderResultsView()}
            {activeMenu === 'announcements' && renderAnnouncementsView()}
            {activeMenu === 'reports' && renderReportsView()}
          </>
        )}
      </main>
      {competitionDrawerOpen && (
        <>
          <button type="button" className="sport-teacher-drawer-backdrop" aria-label="Close competition form" onClick={closeCompetitionEditor} />
          <aside className="sport-teacher-search-drawer sport-teacher-registration-drawer district-competition-drawer" style={{ '--drawer-width': `${competitionDrawerWidth}px` }} aria-label="District competition form">
            <div className="sport-teacher-drawer-resize-edge" onPointerDown={(event) => { event.preventDefault(); setIsResizingCompetitionDrawer(true); }} role="separator" aria-label="Resize competition panel" />
            <div className="sport-teacher-search-drawer-header"><h2>{selectedCompetition ? 'Edit competition' : 'Add competition'}</h2><button type="button" onClick={closeCompetitionEditor} aria-label="Close competition form">&times;</button></div>
            <form onSubmit={handleSaveCompetition} className="sport-teacher-profile-form">
              <p className="district-drawer-note">This event will be visible to schools in {districtName}.</p>
              <label>Competition name *<input type="text" value={competitionForm.name} onChange={(event) => setCompetitionForm({ ...competitionForm, name: event.target.value })} maxLength="150" required /></label>
              <label>Description<textarea value={competitionForm.description} onChange={(event) => setCompetitionForm({ ...competitionForm, description: event.target.value })} rows="5" /></label>
              <div className="district-competition-date-grid"><label>Start date *<input type="date" value={competitionForm.start_date} onChange={(event) => setCompetitionForm({ ...competitionForm, start_date: event.target.value })} required /></label><label>End date<input type="date" value={competitionForm.end_date} onChange={(event) => setCompetitionForm({ ...competitionForm, end_date: event.target.value })} min={competitionForm.start_date || undefined} /></label></div>
              <div className="district-competition-form-actions"><label>Status<select value={competitionForm.status} onChange={(event) => setCompetitionForm({ ...competitionForm, status: event.target.value })}><option value="draft">Draft</option><option value="pending_approval">Pending approval</option><option value="approved">Approved</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label>{selectedCompetition && <button type="button" className="district-competition-delete" onClick={handleDeleteCompetition} disabled={competitionSubmitting}>Delete</button>}<button type="submit" className="district-primary-button" disabled={competitionSubmitting}>{competitionSubmitting ? 'Saving...' : selectedCompetition ? 'Save changes' : 'Create competition'}</button></div>
            </form>
          </aside>
        </>
      )}
    </div>
  );
}

