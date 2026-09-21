import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardSkeleton from '../components/DashboardSkeleton';
import { ProfileMenu } from '../components/shared.jsx';
import * as apiService from '../services/apiService';
import logo from '../assets/Logo1.png';
import './SportTeacherPage.css';
import '../styles/districtmanager.css';

const EyeIcon = ({ visible = false }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    {visible ? <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></> : <><path d="M3 3l18 18" /><path d="M10.6 6.2A10.8 10.8 0 0 1 12 6c6.5 0 10 6 10 6a18.5 18.5 0 0 1-3.1 3.7M6.2 6.8C3.5 8.4 2 12 2 12s3.5 6 10 6a10.7 10.7 0 0 0 4-.8" /></>}
  </svg>
);

const MENU_ITEMS = [
  { key: 'home', label: 'Home' },
  { key: 'school-results', label: 'School-level results' },
  { key: 'district-results', label: 'District-level results' },
  { key: 'announcements', label: 'Announcements' },
];

export default function DistrictManagerPage() {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [allDistricts, setAllDistricts] = useState([]);
  const [schools, setSchools] = useState([]);
  const [wards, setWards] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentTalents, setStudentTalents] = useState([]);
  const [clubMemberships, setClubMemberships] = useState([]);
  const [educationLevels, setEducationLevels] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [results, setResults] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [resultDetails, setResultDetails] = useState([]);
  const [selectedSchoolStudents, setSelectedSchoolStudents] = useState([]);
  const [selectedResultStudents, setSelectedResultStudents] = useState([]);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', expires_at: '' });
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [announcementDrawerOpen, setAnnouncementDrawerOpen] = useState(false);
  const [announcementSubmitting, setAnnouncementSubmitting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittingDistrictCompetitionId, setSubmittingDistrictCompetitionId] = useState(null);
  const [selectedPromotionStudents, setSelectedPromotionStudents] = useState([]);
  const [selectedDemotionDetails, setSelectedDemotionDetails] = useState([]);
  const [selectedDistrictCompetitionId, setSelectedDistrictCompetitionId] = useState('');
  const [activeMenu, setActiveMenu] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [schoolSubmissions, setSchoolSubmissions] = useState([]);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [competitionDrawerOpen, setCompetitionDrawerOpen] = useState(false);
  const [competitionDrawerWidth, setCompetitionDrawerWidth] = useState(420);
  const [isResizingCompetitionDrawer, setIsResizingCompetitionDrawer] = useState(false);
  const [competitionForm, setCompetitionForm] = useState({ name: '', description: '', start_date: '', end_date: '' });
  const [competitionSubmitting, setCompetitionSubmitting] = useState(false);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileMessage, setProfileMessage] = useState(null);
  const [passwordDrawerOpen, setPasswordDrawerOpen] = useState(false);
  const [profilePasswordForm, setProfilePasswordForm] = useState({ new_password: '', confirm_password: '' });
  const [showProfilePassword, setShowProfilePassword] = useState(false);
  const [showProfilePasswordConfirmation, setShowProfilePasswordConfirmation] = useState(false);
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const showSuccess = (message) => {
    setSuccess(message);
    window.setTimeout(() => setSuccess(null), 4000);
  };

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

        const [userRes, districtsRes, schoolsRes, wardsRes, competitionsRes, studentsRes, talentsRes, clubMembershipsRes, educationLevelsRes, announcementsRes, resultsRes, participationsRes, promotionsRes, resultDetailsRes, submissionsRes] = await Promise.all([
          apiService.getCurrentUser(),
          apiService.getDistricts(),
          apiService.getSchools(),
          apiService.getWards(),
          apiService.getAllCompetitions(),
          apiService.getAllStudents(),
          apiService.getStudentTalents(),
          apiService.getClubMemberships(),
          apiService.getEducationLevels({ is_active: true }),
          apiService.getAnnouncements({ is_active: true }),
          apiService.getAllResults(),
          apiService.getAllParticipations(),
          apiService.getAllResultPromotions(),
          apiService.getAllResultDetails(),
          apiService.getAllSchoolResultSubmissions(),
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
        setClubMemberships(clubMembershipsRes.data.results || []);
        setEducationLevels(educationLevelsRes.data.results || []);
        setAnnouncements(announcementList);
        setResults(resultsRes.data.results || []);
        setParticipations(participationsRes.data.results || []);
        setPromotions(promotionsRes.data.results || []);
        setResultDetails(resultDetailsRes.data.results || []);
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

  const currentZoneId = Number(currentUser?.zone || 0);
  const currentCountryId = Number(currentUser?.country || 0);

  const districtCompetitions = useMemo(() => {
    const districtMatches = competitions.filter((competition) => {
      if (competition.level !== 'district') return false;
      const locationId = competition.object_id ?? competition.district ?? competition.region ?? competition.zone ?? competition.country;
      const isDistrictLocation = Number(locationId) === visibleDistrictId;
      const belongsToDistrictSchool = Array.isArray(competition.schools)
        && competition.schools.some((schoolId) => districtSchools.some((school) => Number(school.id) === Number(schoolId)));
      return isDistrictLocation || belongsToDistrictSchool;
    });

    const zoneMatches = competitions.filter((competition) => {
      if (competition.level !== 'zone') return false;
      const locationId = competition.object_id ?? competition.zone ?? competition.zone_id ?? competition.district ?? competition.region ?? competition.country;
      return Number(locationId) === currentZoneId;
    });

    const countryMatches = competitions.filter((competition) => {
      if (competition.level !== 'country') return false;
      const locationId = competition.object_id ?? competition.country ?? competition.zone ?? competition.region ?? competition.district;
      return Number(locationId) === currentCountryId;
    });

    return [...districtMatches, ...zoneMatches, ...countryMatches].filter((competition, index, items) => {
      const key = Number(competition.id);
      return items.findIndex((item) => Number(item.id) === key) === index;
    });
  }, [competitions, currentCountryId, currentZoneId, districtSchools, visibleDistrictId]);

  const schoolCompetitions = useMemo(() => {
    if (!visibleDistrictId) return competitions.filter((competition) => competition.level === 'school');
    return competitions.filter((competition) => {
      if (competition.level !== 'school') return false;
      const locationId = competition.object_id ?? competition.district ?? competition.region ?? competition.zone ?? competition.country;
      const belongsToDistrictSchool = Array.isArray(competition.schools)
        && competition.schools.some((schoolId) => districtSchools.some((school) => Number(school.id) === Number(schoolId)));
      return Number(locationId) === visibleDistrictId || belongsToDistrictSchool;
    });
  }, [competitions, districtSchools, visibleDistrictId]);
  const districtLevelCompetitions = useMemo(() => districtCompetitions.filter((competition) => competition.level === 'district'), [districtCompetitions]);
  const calendarCompetitions = useMemo(() => districtCompetitions.filter((competition) => competition.status !== 'cancelled' && /^\d{4}-\d{2}-\d{2}$/.test(competition.start_date || '')), [districtCompetitions]);
  const relevantAnnouncements = useMemo(() => announcements.filter((announcement) => {
    if (!announcement.is_active || (announcement.expires_at && new Date(announcement.expires_at) < new Date())) return false;
    if (announcement.scope === 'national') return true;
    if (announcement.scope === 'zone') return Number(announcement.zone) === Number(currentUser?.zone);
    if (announcement.scope === 'district') return Number(announcement.district) === visibleDistrictId;
    return Number(announcement.district) === visibleDistrictId || Number(announcement.region) === Number(allDistricts.find((district) => Number(district.id) === visibleDistrictId)?.region);
  }), [allDistricts, announcements, currentUser?.zone, visibleDistrictId]);
  const higherLevelAnnouncements = useMemo(() => relevantAnnouncements.filter((announcement) => ['national', 'zone', 'region'].includes(announcement.scope)), [relevantAnnouncements]);
  const lowerLevelAnnouncements = useMemo(() => relevantAnnouncements.filter((announcement) => announcement.scope === 'district' && Number(announcement.district) === visibleDistrictId), [relevantAnnouncements, visibleDistrictId]);
  const homeAnnouncements = useMemo(() => relevantAnnouncements.filter((announcement) => ['national', 'zone', 'region', 'district'].includes(announcement.scope)), [relevantAnnouncements]);
  const promotedTalentIds = useMemo(() => {
    const promotedDetailIds = new Set(promotions
      .filter((promotion) => promotion.to_level === 'district' && promotion.result_detail)
      .map((promotion) => Number(promotion.result_detail)));
    return new Set(resultDetails
      .filter((detail) => promotedDetailIds.has(Number(detail.id)))
      .map((detail) => Number(detail.talent)));
  }, [promotions, resultDetails]);
  const promotedDistrictTalents = useMemo(() => districtTalents.filter((entry) => promotedTalentIds.has(Number(entry.id))), [districtTalents, promotedTalentIds]);
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
  const navLinks = MENU_ITEMS.map((item) => ({
    ...item,
    active: activeMenu === item.key,
    onClick: () => setActiveMenu(item.key),
  }));

  const refreshData = () => window.location.reload();

  const talentParticipation = useMemo(() => {
    const counts = new Map();
    promotedDistrictTalents.forEach((entry) => {
      const talentName = entry.talent_name || 'Other talent';
      counts.set(talentName, (counts.get(talentName) || 0) + 1);
    });
    const total = promotedDistrictTalents.length;
    return [...counts.entries()]
      .sort(([, firstCount], [, secondCount]) => secondCount - firstCount)
      .map(([name, count]) => ({ name, count, percentage: total ? Math.round((count / total) * 100) : 0 }));
  }, [promotedDistrictTalents]);

  const talentChartColors = [
    '#0e1db6', '#4682b4', '#38a169', '#d69e2e',
    '#c05621', '#805ad5', '#319795', '#b83280',
    '#0891b2', '#65a30d', '#dc2626', '#7c3aed',
    '#ea580c', '#0369a1', '#be123c', '#4d7c0f',
  ];
  const talentChartTotal = talentParticipation.reduce((total, item) => total + item.count, 0);
  let talentChartOffset = 0;
  const talentChartSegments = talentParticipation.map((item, index) => {
    const percentage = talentChartTotal ? (item.count / talentChartTotal) * 100 : 0;
    const segment = { ...item, percentage, color: talentChartColors[index % talentChartColors.length], start: talentChartOffset };
    talentChartOffset += percentage;
    return segment;
  });
  const talentChartGradient = talentChartSegments.length
    ? `conic-gradient(${talentChartSegments.map((segment) => `${segment.color} ${segment.start}% ${segment.start + segment.percentage}%`).join(', ')})`
    : '#e5e7eb';

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
    calendarCompetitions.forEach((competition) => {
      dates.add(competition.start_date);
    });
    return dates;
  }, [calendarCompetitions]);

  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { monthLabel: calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), firstDay, daysInMonth, year, month };
  }, [calendarDate]);

  const calendarEvents = useMemo(() => calendarCompetitions
    .filter((competition) => {
      const start = new Date(`${competition.start_date}T00:00:00`);
      const end = competition.end_date ? new Date(`${competition.end_date}T00:00:00`) : start;
      return start.getFullYear() <= calendarDays.year && end.getFullYear() >= calendarDays.year
        && start <= new Date(calendarDays.year, calendarDays.month + 1, 0)
        && end >= new Date(calendarDays.year, calendarDays.month, 1);
    })
    .sort((first, second) => first.start_date.localeCompare(second.start_date)), [calendarDays, calendarCompetitions]);

  const moveCalendarMonth = (offset) => {
    setCalendarDate((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  const goToCurrentMonth = () => setCalendarDate(new Date());

  const getCompetitionTooltip = (dateKey) => {
    const matches = calendarCompetitions.filter((competition) => {
      const start = competition.start_date;
      const end = competition.end_date || competition.start_date;
      return start === dateKey || end === dateKey;
    });

    if (!matches.length) return undefined;

    const [primaryMatch] = matches;
    return `${primaryMatch.name}\n${primaryMatch.level ? primaryMatch.level.charAt(0).toUpperCase() + primaryMatch.level.slice(1) : 'Competition'} level`;
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    const announcement = announcements.find((item) => Number(item.id) === Number(announcementId));
    if (announcement?.scope !== 'district') return;
    try {
      await apiService.deleteAnnouncement(announcementId);
      setAnnouncements((items) => items.filter((item) => item.id !== announcementId));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete announcement');
    }
  };

  const openProfileDrawer = () => {
    setProfileMenuOpen(false);
    setProfileEmail(currentUser?.email || '');
    setProfilePhone(currentUser?.phone || '');
    setProfileMessage(null);
    setProfileDrawerOpen(true);
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    const phone = profilePhone.trim();
    if (phone && !/^(?:0\d{9}|\+255\d{9})$/.test(phone)) {
      setProfileMessage({ type: 'error', text: 'Phone must be 10 digits starting with 0 or 13 characters starting with +255.' });
      return;
    }
    setProfileSubmitting(true);
    setProfileMessage(null);
    try {
      const response = await apiService.updateUserProfile(currentUser.id, { email: profileEmail.trim(), phone });
      setCurrentUser(response.data);
      setProfileDrawerOpen(false);
      setProfileMessage({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      const responseErrors = err.response?.data;
      setProfileMessage({ type: 'error', text: responseErrors?.email?.[0] || responseErrors?.detail || 'Failed to update profile' });
    } finally {
      setProfileSubmitting(false);
    }
  };

  const openChangePasswordDrawer = () => {
    setProfileMenuOpen(false);
    setProfilePasswordForm({ new_password: '', confirm_password: '' });
    setShowProfilePassword(false);
    setShowProfilePasswordConfirmation(false);
    setPasswordDrawerOpen(true);
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    if (profilePasswordForm.new_password !== profilePasswordForm.confirm_password) {
      setError('New passwords do not match.');
      return;
    }
    setProfileSubmitting(true);
    setError(null);
    try {
      await apiService.updateUserPassword(currentUser.id, profilePasswordForm.new_password);
      setProfilePasswordForm({ new_password: '', confirm_password: '' });
      setPasswordDrawerOpen(false);
    } catch (err) {
      const responseErrors = err.response?.data;
      setError(responseErrors?.detail || responseErrors?.password?.[0] || 'Failed to change password');
    } finally {
      setProfileSubmitting(false);
    }
  };

  const openCompetitionEditor = (competition = null) => {
    setSelectedCompetition(competition);
    setCompetitionForm({
      name: competition?.name || '',
      description: competition?.description || '',
      start_date: competition?.start_date || '',
      end_date: competition?.end_date || '',
    });
    setCompetitionDrawerOpen(true);
  };

  const closeCompetitionEditor = () => {
    setCompetitionDrawerOpen(false);
    setSelectedCompetition(null);
    setCompetitionForm({ name: '', description: '', start_date: '', end_date: '' });
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

  const handlePromoteStudents = async (sourceCompetitionId, detailIds = selectedPromotionStudents) => {
    const targetCompetition = districtLevelCompetitions.find((competition) => Number(competition.id) === Number(selectedDistrictCompetitionId));
    if (!detailIds.length || !sourceCompetitionId || !targetCompetition) {
      setError(targetCompetition ? 'Select at least one student to promote.' : 'Select a district competition before promoting students.');
      return;
    }
    setSubmitting(true);
    try {
      await apiService.promoteStudents({
        result_detail_ids: detailIds,
        competition_id: sourceCompetitionId,
        district_competition_id: targetCompetition.id,
        from_level: 'school',
        to_level: 'district',
      });
      setSelectedPromotionStudents([]);
      const [resultsRes, participationsRes, promotionsRes] = await Promise.all([apiService.getResults(), apiService.getParticipations(), apiService.getAllResultPromotions()]);
      setResults(resultsRes.data.results || []);
      setParticipations(participationsRes.data.results || []);
      setPromotions(promotionsRes.data.results || []);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to promote students');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitDistrictResults = async (sourceCompetitionId, detailIds = []) => {
    const targetCompetition = competitions.find((competition) => competition.level === 'zone' && Number(competition.zone) === Number(currentUser?.zone));
    if (!sourceCompetitionId) {
      setError('Select a district competition to submit.');
      return;
    }
    setSubmittingDistrictCompetitionId(Number(sourceCompetitionId));
    try {
      const payload = {
        result_detail_ids: detailIds,
        competition_id: sourceCompetitionId,
        from_level: 'district',
        to_level: 'zone',
      };
      if (targetCompetition) {
        payload.zone_competition_id = targetCompetition.id;
      }
      await apiService.promoteStudents(payload);
      setSelectedPromotionStudents([]);
      setSelectedDemotionDetails([]);
      const [resultsRes, participationsRes, promotionsRes] = await Promise.all([apiService.getResults(), apiService.getParticipations(), apiService.getResultPromotions()]);
      setResults(resultsRes.data.results || []);
      setParticipations(participationsRes.data.results || []);
      setPromotions(promotionsRes.data.results || []);
      showSuccess('District results submitted to zone successfully.');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to submit district results');
    } finally {
      setSubmittingDistrictCompetitionId(null);
    }
  };

  const handleSaveDistrictScore = async (resultId, detailId, score) => {
    const isLocked = detailId
      ? promotions.some((promotion) => ['district', 'zone', 'country'].includes(promotion.to_level) && Number(promotion.result_detail) === Number(detailId))
      : promotions.some((promotion) => ['district', 'zone', 'country'].includes(promotion.to_level) && Number(promotion.result) === Number(resultId));

    if (isLocked) return;

    try {
      if (detailId) {
        await apiService.updateResultDetail(detailId, {
          raw_score: score === '' ? 0 : Number(score),
          percentage_score: score === '' ? null : Number(score),
        });
      } else {
        await apiService.updateResult(resultId, { score: score === '' ? null : Number(score) });
      }
      const resultsRes = await apiService.getResults();
      setResults(resultsRes.data.results || []);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.score?.[0] || 'Failed to save district result');
    }
  };

  const handleDemoteTalents = async (detailIds = selectedDemotionDetails) => {
    if (!detailIds.length) {
      setError('Select at least one district result to de-promote.');
      return;
    }
    if (!window.confirm(`Remove ${detailIds.length} selected result${detailIds.length === 1 ? '' : 's'} from district level?`)) return;
    try {
      await apiService.demoteResultTalent({ result_detail_ids: detailIds });
      const [resultsRes, promotionsRes, resultDetailsRes] = await Promise.all([apiService.getResults(), apiService.getAllResultPromotions(), apiService.getAllResultDetails()]);
      setResults(resultsRes.data.results || []);
      setPromotions(promotionsRes.data.results || []);
      setResultDetails(resultDetailsRes.data.results || []);
      setSelectedDemotionDetails([]);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Failed to remove district promotion');
    }
  };

  const handleReopenSchoolSubmission = async (submissionId) => {
    try {
      const response = await apiService.reopenSchoolResultSubmission(submissionId);
      setSchoolSubmissions((items) => items.map((item) => item.id === submissionId ? response.data : item));
      const [resultsRes, participationsRes, promotionsRes, resultDetailsRes] = await Promise.all([
        apiService.getAllResults(),
        apiService.getAllParticipations(),
        apiService.getAllResultPromotions(),
        apiService.getAllResultDetails(),
      ]);
      setResults(resultsRes.data.results || []);
      setParticipations(participationsRes.data.results || []);
      setPromotions(promotionsRes.data.results || []);
      setResultDetails(resultDetailsRes.data.results || []);
      showSuccess(`School results returned to draft. ${response.data.demoted || 0} district promotion(s) were reversed.`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reopen school results');
    }
  };

  const getStudentClassName = (student) => {
    const educationLevelId = student?.education_level?.id ?? student?.education_level;
    return educationLevels.find((level) => Number(level.id) === Number(educationLevelId))?.name || '—';
  };

  const handleCreateAnnouncement = async (event) => {
    event.preventDefault();
    setAnnouncementSubmitting(true);
    try {
      const announcementData = {
        title: announcementForm.title.trim(),
        content: announcementForm.content.trim(),
        scope: 'district',
        district: visibleDistrictId,
        expires_at: announcementForm.expires_at || null,
        is_active: true,
      };
      if (selectedAnnouncement) {
        await apiService.updateAnnouncement(selectedAnnouncement.id, announcementData);
      } else {
        await apiService.createAnnouncement(announcementData);
      }
      setAnnouncementForm({ title: '', content: '', expires_at: '' });
      setSelectedAnnouncement(null);
      setAnnouncementDrawerOpen(false);
      const announcementsRes = await apiService.getAnnouncements({ is_active: true });
      setAnnouncements(announcementsRes.data.results || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create announcement');
    } finally {
      setAnnouncementSubmitting(false);
    }
  };

  const openAnnouncementEditor = (announcement = null) => {
    if (announcement && announcement.scope !== 'district') return;
    setSelectedAnnouncement(announcement);
    setAnnouncementForm({
      title: announcement?.title || '',
      content: announcement?.content || '',
      expires_at: announcement?.expires_at ? announcement.expires_at.slice(0, 10) : '',
    });
    setAnnouncementDrawerOpen(true);
  };

  const handleDeleteDistrictAnnouncement = async () => {
    if (!selectedAnnouncement || selectedAnnouncement.scope !== 'district' || !window.confirm('Delete this announcement?')) return;
    setAnnouncementSubmitting(true);
    try {
      await apiService.deleteAnnouncement(selectedAnnouncement.id);
      setAnnouncements((items) => items.filter((item) => item.id !== selectedAnnouncement.id));
      setSelectedAnnouncement(null);
      setAnnouncementDrawerOpen(false);
      setAnnouncementForm({ title: '', content: '', expires_at: '' });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete announcement');
    } finally {
      setAnnouncementSubmitting(false);
    }
  };

  const renderHomeView = () => (
    <>
      <div className="district-home-grid">
        <section className="district-home-card talent-card">
          <div className="district-card-heading"><div><h2>Talent participation</h2><p>Talents promoted to district level</p></div><span className="district-card-kicker">{promotedDistrictTalents.length} promoted</span></div>
          {talentChartSegments.length ? (
            <div className="sport-teacher-talent-donut-layout">
              <div className="sport-teacher-talent-donut" style={{ background: talentChartGradient }} aria-label="District talent participation donut chart">
                <div><strong>{talentChartTotal}</strong><span>promoted</span></div>
              </div>
              <div className="sport-teacher-talent-donut-legend">
                {talentChartSegments.map((segment) => (
                  <div className="sport-teacher-talent-legend-item" key={segment.name}>
                    <span className="sport-teacher-talent-legend-name"><i style={{ background: segment.color }} />{segment.name}</span>
                    <strong>{segment.count}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="district-empty-state">No promoted talents yet.</p>}
        </section>

        <section className="district-home-card">
          <div className="district-card-heading"><div><h2>Recent announcements</h2><p>Publish or remove district updates</p></div><button type="button" className="district-text-button" onClick={() => setActiveMenu('announcements')}>View all</button></div>
          <div className="recent-announcements">{homeAnnouncements.slice(0, 3).map((announcement) => <div className="recent-announcement-row" key={announcement.id}><div><strong>{announcement.title}</strong><small>{announcement.content || 'No details available.'}</small></div></div>)}{!homeAnnouncements.length && <p className="district-empty-state">No active announcements yet.</p>}</div>
        </section>

        <section className="district-home-card">
          <div className="district-card-heading"><div><h2>Competition management</h2><p>Create and manage Sengerema district events</p></div><button type="button" className="district-primary-button district-card-action" onClick={() => openCompetitionEditor()}>Add competition</button></div>
          <div className="district-competition-list">
            {districtLevelCompetitions.map((competition) => (
              <button type="button" className="district-competition-row is-editable" key={competition.id} onClick={() => openCompetitionEditor(competition)} aria-label={`Edit ${competition.name}`}>
                <strong className="district-competition-title">{competition.name}</strong>
                <span>{competition.start_date || 'Date not set'}{competition.end_date ? ` - ${competition.end_date}` : ''}</span>
              </button>
            ))}
            {!districtLevelCompetitions.length && <p className="district-empty-state">No district competitions created yet.</p>}
          </div>
        </section>

        <section className="district-home-card">
          <div className="district-card-heading"><div><h2>School performance</h2><p>Ranked by average recorded score</p></div><span className="district-card-kicker">Top 5</span></div>
          <div className="school-ranking">{schoolRanking.length ? schoolRanking.map((school, index) => <div className="school-ranking-row" key={school.name}><span className="school-rank">{index + 1}</span><div className="school-ranking-name"><strong>{school.name}</strong><small>{school.students} students · {school.participation} entries</small></div><b>{school.averageScore}%</b></div>) : <p className="district-empty-state">No school performance data yet.</p>}</div>
        </section>

        <section className="district-home-card district-calendar-card">
          <div className="district-card-heading"><div><h2>Competition calendar</h2><p>Blue circles mark competition days</p></div><div className="calendar-controls"><button type="button" onClick={() => moveCalendarMonth(-1)} aria-label="Previous month" title="Previous month">‹</button><span>{calendarDays.monthLabel}</span><button type="button" onClick={() => moveCalendarMonth(1)} aria-label="Next month" title="Next month">›</button><button type="button" className="calendar-today-button" onClick={goToCurrentMonth}>Today</button></div></div>
          <div className="calendar-weekdays">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day}>{day}</span>)}</div>
          <div className="calendar-grid">{Array.from({ length: calendarDays.firstDay }).map((_, index) => <span className="calendar-day is-empty" key={`empty-${index}`} />)}{Array.from({ length: calendarDays.daysInMonth }, (_, index) => { const day = index + 1; const dateKey = `${calendarDays.year}-${String(calendarDays.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; const isToday = new Date().toISOString().slice(0, 10) === dateKey; const tooltip = getCompetitionTooltip(dateKey); return <span className={`calendar-day ${competitionDates.has(dateKey) ? 'has-competition' : ''} ${isToday ? 'is-today' : ''}`} key={dateKey} title={tooltip || undefined}>{day}</span>; })}</div>
          <div className="calendar-events">{calendarEvents.length ? calendarEvents.map((competition) => <div key={competition.id}><span className="calendar-event-dot" /> <strong>{competition.name}</strong><small>{competition.start_date}{competition.end_date ? ` - ${competition.end_date}` : ''}</small></div>) : <p className="district-empty-state">No competitions this month.</p>}</div>
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
          .flatMap((participation) => {
            const result = results.find((item) => Number(item.participation) === Number(participation.id));
            const student = districtStudents.find((item) => Number(item.id) === Number(participation.student));
            const school = districtSchools.find((item) => Number(item.id) === Number(student?.school?.id ?? student?.school));
            const details = result?.details || [];
            const promotedDetailIds = new Set(promotions.filter((promotion) => promotion.to_level === 'district' && promotion.result_detail).map((promotion) => Number(promotion.result_detail)));
            return details
              .filter((detail) => detail.percentage_score !== null && detail.percentage_score !== undefined && Number(detail.percentage_score) >= 50)
              .map((detail) => ({ participation, result, detail, student, school, isPromoted: promotedDetailIds.has(Number(detail.id)), isEligibleForPromotion: !promotedDetailIds.has(Number(detail.id)) && Number(detail.percentage_score) >= 50 }));
          });
        return { ...competition, entries };
      });

    const visibleSchoolCompetitions = submittedSchoolCompetitions;

    if (activeMenu === 'school-results') {
      return (
        <div className="district-results-stack">
          <div className="district-results-heading">
            <div><h2>School-level results</h2><p>Submitted results from schools in your district. Select students to promote them to a district competition.</p></div>
          </div>
          {visibleSchoolCompetitions.map((competition) => (
            <section className="district-result-card" key={competition.id}>
              <div className="district-result-card-header">
                <div><h3>{competition.name}</h3><p>Submitted school-level results. Only scores of 50% or higher are shown.</p></div>
                <div className="district-result-header-actions"><label className="district-promotion-competition-field">Promote to<select value={selectedDistrictCompetitionId} onChange={(event) => setSelectedDistrictCompetitionId(event.target.value)} disabled={submitting} style={{ width: '140px', height: '36px', boxSizing: 'border-box', padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white', color: '#111827', fontSize: '14px' }}><option value="">Select district competition</option>{districtLevelCompetitions.map((districtCompetition) => <option key={districtCompetition.id} value={districtCompetition.id}>{districtCompetition.name}</option>)}</select></label><button type="button" className="btn-primary" onClick={() => handlePromoteStudents(competition.id, selectedPromotionStudents.filter((detailId) => competition.entries.some((entry) => Number(entry.detail?.id) === Number(detailId))))} disabled={submitting || !selectedPromotionStudents.length || !selectedDistrictCompetitionId} style={{ width: '140px', height: '36px', boxSizing: 'border-box', padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#0E1DB6', color: 'white', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}>{submitting ? 'Processing...' : 'Promote'}</button>{schoolSubmissions.find((submission) => Number(submission.competition) === Number(competition.id))?.status === 'submitted' && <button type="button" className="district-text-button" onClick={() => handleReopenSchoolSubmission(schoolSubmissions.find((submission) => Number(submission.competition) === Number(competition.id)).id)} style={{ width: '140px', height: '36px', boxSizing: 'border-box', padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#d1d5db', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}>Set draft</button>}</div>
              </div>
              <div className="district-result-table-wrap">
                <table className="data-table"><thead><tr><th>Select</th><th>Student</th><th>Talent</th><th>Class</th><th>School</th><th>Club</th><th>Score</th><th>Grade</th></tr></thead><tbody>
                  {competition.entries.map(({ participation, detail, student, school, isPromoted, isEligibleForPromotion }) => (
                    <tr key={`${participation.id}-${detail.id}`}><td>{isPromoted ? <span className="district-promoted-label">Promoted</span> : <input type="checkbox" checked={isEligibleForPromotion && selectedPromotionStudents.includes(Number(detail.id))} disabled={!isEligibleForPromotion} onChange={(event) => setSelectedPromotionStudents((current) => event.target.checked ? [...new Set([...current, Number(detail.id)])] : current.filter((id) => id !== Number(detail.id)))} aria-label={`Select ${student?.first_name || 'student'} ${detail.talent_name || 'talent'} for promotion`} />}</td><td>{student ? `${student.first_name} ${student.last_name}` : 'Student'}</td><td>{detail.talent_name}</td><td>{getStudentClassName(student)}</td><td>{school?.name || 'School'}</td><td>{clubMemberships.find((membership) => Number(membership.student) === Number(student?.id) && membership.is_active)?.club_name || '—'}</td><td>{detail.percentage_score}</td><td>{detail.percentage_score >= 90 ? 'A+' : detail.percentage_score >= 75 ? 'A' : detail.percentage_score >= 60 ? 'B+' : detail.percentage_score >= 50 ? 'B' : detail.percentage_score >= 40 ? 'C' : detail.percentage_score >= 30 ? 'D' : detail.percentage_score >= 20 ? 'E' : 'F'}</td></tr>
                  ))}
                  {!competition.entries.length && <tr><td colSpan="8" className="district-result-empty">No submitted results available yet.</td></tr>}
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
      }).flatMap((result) => {
        const participation = participations.find((item) => Number(item.id) === Number(result.participation));
        const student = districtStudents.find((item) => Number(item.id) === Number(participation?.student));
        const details = result.details || [];
        return details.length ? details.map((detail) => ({ ...result, detail, student })) : [{ ...result, detail: null, student }];
      });
      return { ...competition, entries };
    });

    return (
      <div className="district-results-stack">
        <div className="district-results-heading">
          <div><h2>District-level results</h2><p>Promoted students are shown talent by talent. Edit and save each district score here.</p></div>
        </div>

        {districtResultsByCompetition.map((competition) => (
          (() => {
            const zonePromotedDetailIds = new Set(
              promotions
                .filter((promotion) => promotion.to_level === 'zone' && promotion.result_detail)
                .map((promotion) => Number(promotion.result_detail)),
            );
            const qualifyingEntries = competition.entries.filter((result) => result.detail && Number(result.detail.percentage_score) >= 50);
            const isSubmittedToZone = competition.entries.some((result) => result.detail && zonePromotedDetailIds.has(Number(result.detail.id)))
              || qualifyingEntries.some((result) => zonePromotedDetailIds.has(Number(result.detail.id)));
            const isLockedForDistrictEdit = (result) => Boolean(
              isSubmittedToZone || (result.detail && (
                ['district', 'zone', 'country'].includes(result.detail.promoted_to) || zonePromotedDetailIds.has(Number(result.detail.id))
              ))
            );

            return (
          <section className="district-result-card" key={`district-${competition.id}`}>
            <div className="district-result-card-header">
              <div><h3>{competition.name}</h3><p>District-level results for promoted students.</p></div>
              <div className="district-result-header-actions">
                {!isSubmittedToZone && <button type="button" className="district-demote-button" onClick={() => handleDemoteTalents(selectedDemotionDetails.filter((detailId) => competition.entries.some((entry) => Number(entry.detail?.id) === Number(detailId))))} disabled={submitting || !selectedDemotionDetails.some((detailId) => competition.entries.some((entry) => Number(entry.detail?.id) === Number(detailId)))}>De-promote selected</button>}
                {!isSubmittedToZone && <button
                  type="button"
                  className="district-submit-zone-button"
                  onClick={() => handleSubmitDistrictResults(competition.id)}
                  disabled={submittingDistrictCompetitionId !== null || !competition.entries.length}
                  title="Submit all qualifying district results to the zone level"
                  style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#0E1DB6', color: 'white', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  {submittingDistrictCompetitionId === Number(competition.id) ? 'Submitting...' : 'Submit to zone'}
                </button>}
              </div>
            </div>
            <div className="district-result-table-wrap">
                <table className="data-table"><thead><tr>{!isSubmittedToZone && <th>Select</th>}<th>Student</th><th>Talent</th><th>Class</th><th>School</th><th>Club</th><th>Score</th><th>Grade</th></tr></thead><tbody>
                {competition.entries.map((result) => (
                  <tr key={`${result.id}-${result.detail?.id || 'overall'}`}>{!isSubmittedToZone && <td>{result.detail ? <input type="checkbox" checked={selectedDemotionDetails.includes(Number(result.detail.id))} onChange={(event) => setSelectedDemotionDetails((current) => event.target.checked ? [...new Set([...current, Number(result.detail.id)])] : current.filter((id) => id !== Number(result.detail.id)))} aria-label={`Select ${result.student?.first_name || 'student'} ${result.detail?.talent_name || 'result'} for de-promotion`} disabled={isLockedForDistrictEdit(result)} /> : null}</td>}<td>{result.student ? `${result.student.first_name} ${result.student.last_name}` : 'Student'}</td><td>{result.detail?.talent_name || 'Overall result'}</td><td>{getStudentClassName(result.student)}</td><td>{districtSchools.find((school) => Number(school.id) === Number(result.student?.school?.id ?? result.student?.school))?.name || 'School'}</td><td>{clubMemberships.find((membership) => Number(membership.student) === Number(result.student?.id) && membership.is_active)?.club_name || '—'}</td><td><input className="district-score-input" type="number" min="0" max="100" defaultValue={result.detail ? (result.detail.percentage_score ?? '') : (result.score ?? '')} disabled={isLockedForDistrictEdit(result)} onBlur={(event) => handleSaveDistrictScore(result.id, result.detail?.id, event.target.value)} aria-label={`Score for ${result.student_name || 'student'} ${result.detail?.talent_name || 'result'}`} /></td><td>{result.detail ? (result.detail.percentage_score === null || result.detail.percentage_score === undefined ? 'Not recorded' : result.detail.percentage_score >= 90 ? 'A+' : result.detail.percentage_score >= 75 ? 'A' : result.detail.percentage_score >= 60 ? 'B+' : result.detail.percentage_score >= 50 ? 'B' : result.detail.percentage_score >= 40 ? 'C' : result.detail.percentage_score >= 30 ? 'D' : result.detail.percentage_score >= 20 ? 'E' : 'F') : result.grade || 'Not recorded'}</td></tr>
                ))}
                {!competition.entries.length && <tr><td colSpan={isSubmittedToZone ? 7 : 8} className="district-result-empty">No district results recorded yet.</td></tr>}
              </tbody></table>
            </div>
          </section>
            );
          })()
        ))}

      </div>
    );
  };

  const renderAnnouncementsView = () => (
    <div className="district-announcements-page">
      <section className="district-announcements-card">
        <div className="district-announcements-header">
          <div><h2>Higher-level announcements ({higherLevelAnnouncements.length})</h2><p>Read-only announcements from national, zone, and region leadership.</p></div>
        </div>
        <div className="district-announcements-list">
          {higherLevelAnnouncements.map((announcement) => (
            <article key={announcement.id} className="district-announcement-item">
              <div className="district-announcement-item-heading"><strong className="district-announcement-readonly-title">{announcement.title}</strong><span>Read only · {announcement.scope} · {announcement.published_at || announcement.created_at ? new Date(announcement.published_at || announcement.created_at).toLocaleDateString('en-GB') : 'Date unavailable'}</span></div>
              <p>{announcement.content || 'No details available.'}</p>
            </article>
          ))}
          {!higherLevelAnnouncements.length && <p className="district-empty-state">No higher-level announcements available.</p>}
        </div>
      </section>

      <section className="district-announcements-card">
        <div className="district-announcements-header">
          <div><h2>District announcements ({lowerLevelAnnouncements.length})</h2><p>Announcements published by {districtName} for the district audience.</p></div>
          <button type="button" className="district-primary-button district-card-action" onClick={() => openAnnouncementEditor()}>Add announcement</button>
        </div>
        <div className="district-announcements-list">
          {lowerLevelAnnouncements.map((announcement) => (
            <article key={announcement.id} className="district-announcement-item">
              <div className="district-announcement-item-heading"><button type="button" className="district-announcement-title" onClick={() => openAnnouncementEditor(announcement)}>{announcement.title}</button><span>District · {announcement.published_at || announcement.created_at ? new Date(announcement.published_at || announcement.created_at).toLocaleDateString('en-GB') : 'Date unavailable'}</span></div>
              <p>{announcement.content || 'No details available.'}</p>
            </article>
          ))}
          {!lowerLevelAnnouncements.length && <p className="district-empty-state">No district announcements yet.</p>}
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
          <ProfileMenu
            isOpen={profileMenuOpen}
            onToggle={() => setProfileMenuOpen((open) => !open)}
            onProfile={openProfileDrawer}
            onChangePassword={openChangePasswordDrawer}
            onLogout={() => { setProfileMenuOpen(false); logout(); }}
            username={currentUser?.username}
          />
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
        {success && <div className="district-manager-alert" style={{ background: '#ecfdf5', color: '#166534', borderColor: '#a7f3d0' }}>{success}<button type="button" onClick={() => setSuccess(null)} aria-label="Dismiss success">&times;</button></div>}
        {loading ? <DashboardSkeleton label="Loading district manager dashboard" /> : (
          <>
            {activeMenu === 'home' && renderHomeView()}
            {(activeMenu === 'school-results' || activeMenu === 'district-results') && renderResultsView()}
            {activeMenu === 'announcements' && renderAnnouncementsView()}
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
              <label>Competition name *<input type="text" value={competitionForm.name} placeholder="e.g. District Athletics Cup" onChange={(event) => setCompetitionForm({ ...competitionForm, name: event.target.value })} maxLength="150" required /></label>
              <label>Description<textarea value={competitionForm.description} placeholder="Optional competition summary..." onChange={(event) => setCompetitionForm({ ...competitionForm, description: event.target.value })} rows="5" /></label>
              <div className="district-competition-date-grid"><label>Start date *<input type="date" value={competitionForm.start_date} onChange={(event) => setCompetitionForm({ ...competitionForm, start_date: event.target.value })} required /></label><label>End date<input type="date" value={competitionForm.end_date} onChange={(event) => setCompetitionForm({ ...competitionForm, end_date: event.target.value })} min={competitionForm.start_date || undefined} /></label></div>
              <div className="district-competition-form-actions">{selectedCompetition && <button type="button" className="district-competition-delete" onClick={handleDeleteCompetition} disabled={competitionSubmitting}>Delete</button>}<button type="submit" className="district-primary-button" disabled={competitionSubmitting}>{competitionSubmitting ? 'Saving...' : selectedCompetition ? 'Save changes' : 'Create competition'}</button></div>
            </form>
          </aside>
        </>
      )}
      {announcementDrawerOpen && (
        <>
          <button type="button" className="sport-teacher-drawer-backdrop sport-teacher-registration-backdrop" aria-label="Close announcement form" onClick={() => setAnnouncementDrawerOpen(false)} />
          <aside className="sport-teacher-search-drawer sport-teacher-registration-drawer district-competition-drawer" style={{ '--drawer-width': `${competitionDrawerWidth}px` }} aria-label="District announcement form">
            <div className="sport-teacher-drawer-resize-edge" onPointerDown={(event) => { event.preventDefault(); setIsResizingCompetitionDrawer(true); }} role="separator" aria-label="Resize announcement panel" />
            <div className="sport-teacher-search-drawer-header"><h2>{selectedAnnouncement ? 'Edit announcement' : 'New announcement'}</h2><button type="button" onClick={() => setAnnouncementDrawerOpen(false)} aria-label="Close announcement form">&times;</button></div>
            <form onSubmit={handleCreateAnnouncement}>
              <div className="sport-teacher-announcement-form district-announcement-drawer-form">
                <label>Title *<input type="text" value={announcementForm.title} placeholder="e.g. School sports meeting" onChange={(event) => setAnnouncementForm({ ...announcementForm, title: event.target.value })} maxLength="200" required /></label>
                <label>Message *<textarea value={announcementForm.content} placeholder="Type the announcement details here..." onChange={(event) => setAnnouncementForm({ ...announcementForm, content: event.target.value })} rows="7" required /></label>
                <div className="sport-teacher-announcement-form-actions">
                  <label>Expires on (optional)<input type="date" value={announcementForm.expires_at} onChange={(event) => setAnnouncementForm({ ...announcementForm, expires_at: event.target.value })} /></label>
                  {selectedAnnouncement && <button type="button" className="sport-teacher-announcement-delete" onClick={handleDeleteDistrictAnnouncement} disabled={announcementSubmitting}>Delete</button>}
                  <button type="submit" disabled={announcementSubmitting}>{announcementSubmitting ? 'Publishing...' : selectedAnnouncement ? 'Save changes' : 'Publish'}</button>
                </div>
              </div>
            </form>
          </aside>
        </>
      )}
      {profileDrawerOpen && (
        <>
          <button type="button" className="sport-teacher-drawer-backdrop sport-teacher-registration-backdrop" aria-label="Close profile" onClick={() => setProfileDrawerOpen(false)} />
          <aside className="sport-teacher-search-drawer sport-teacher-registration-drawer district-competition-drawer" style={{ '--drawer-width': `${competitionDrawerWidth}px` }} aria-label="Profile details">
            <div className="sport-teacher-drawer-resize-edge" onPointerDown={(event) => { event.preventDefault(); setIsResizingCompetitionDrawer(true); }} role="separator" aria-label="Resize profile panel" />
            <div className="sport-teacher-search-drawer-header"><h2>Profile</h2><button type="button" onClick={() => setProfileDrawerOpen(false)} aria-label="Close profile">&times;</button></div>
            <form onSubmit={handleSaveProfile} className="sport-teacher-profile-form"><div className="sport-teacher-profile-details"><div><span>Username:</span><strong>{currentUser?.username || '-'}</strong></div><div><span>Firstname:</span><strong>{currentUser?.first_name || '-'}</strong></div><div><span>Lastname:</span><strong>{currentUser?.last_name || '-'}</strong></div><div><span>Role:</span><strong>{currentUser?.role || '-'}</strong></div><div><span>District:</span><strong>{districtName}</strong></div></div><label>Email<input type="email" value={profileEmail} onChange={(event) => setProfileEmail(event.target.value)} /></label><label>Phone number<input type="tel" value={profilePhone} onChange={(event) => setProfilePhone(event.target.value)} pattern="(?:0\d{9}|\+255\d{9})" placeholder="0712345678 or +255712345678" title="Use 10 digits starting with 0 or 13 characters starting with +255" /></label>{profileMessage && <div className={`district-profile-message is-${profileMessage.type}`} role="status">{profileMessage.text}</div>}<button type="submit" className="sport-teacher-profile-submit" disabled={profileSubmitting}>{profileSubmitting ? 'Saving...' : 'Save profile'}</button></form>
          </aside>
        </>
      )}
      {passwordDrawerOpen && (
        <>
          <button type="button" className="sport-teacher-drawer-backdrop sport-teacher-registration-backdrop" aria-label="Close change password" onClick={() => setPasswordDrawerOpen(false)} />
          <aside className="sport-teacher-search-drawer sport-teacher-registration-drawer district-competition-drawer" style={{ '--drawer-width': `${competitionDrawerWidth}px` }} aria-label="Change password">
            <div className="sport-teacher-drawer-resize-edge" onPointerDown={(event) => { event.preventDefault(); setIsResizingCompetitionDrawer(true); }} role="separator" aria-label="Resize password panel" />
            <div className="sport-teacher-search-drawer-header"><h2>Change password</h2><button type="button" onClick={() => setPasswordDrawerOpen(false)} aria-label="Close change password">&times;</button></div>
            <form onSubmit={handleChangePassword} className="sport-teacher-profile-form"><label>New password<span className="sport-teacher-password-control"><input type={showProfilePassword ? 'text' : 'password'} value={profilePasswordForm.new_password} onChange={(event) => setProfilePasswordForm({ ...profilePasswordForm, new_password: event.target.value })} minLength="8" required /><button type="button" onClick={() => setShowProfilePassword((visible) => !visible)} aria-label={showProfilePassword ? 'Hide new password' : 'Show new password'}><EyeIcon visible={showProfilePassword} /></button></span></label><label>Confirm password<span className="sport-teacher-password-control"><input type={showProfilePasswordConfirmation ? 'text' : 'password'} value={profilePasswordForm.confirm_password} onChange={(event) => setProfilePasswordForm({ ...profilePasswordForm, confirm_password: event.target.value })} minLength="8" required /><button type="button" onClick={() => setShowProfilePasswordConfirmation((visible) => !visible)} aria-label={showProfilePasswordConfirmation ? 'Hide password confirmation' : 'Show password confirmation'}><EyeIcon visible={showProfilePasswordConfirmation} /></button></span></label><button type="submit" className="sport-teacher-profile-submit" disabled={profileSubmitting}>{profileSubmitting ? 'Saving...' : 'Save password'}</button></form>
          </aside>
        </>
      )}
    </div>
  );
}

