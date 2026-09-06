import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import * as apiService from '../services/apiService';
import './SportTeacherPage.css';
import logo from '../assets/Logo1.png';

const EyeIcon = ({ visible = false }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    {visible ? (
      <>
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ) : (
      <>
        <path d="M3 3l18 18" />
        <path d="M10.6 6.2A10.8 10.8 0 0 1 12 6c6.5 0 10 6 10 6a18.5 18.5 0 0 1-3.1 3.7M6.2 6.8C3.5 8.4 2 12 2 12s3.5 6 10 6a10.7 10.7 0 0 0 4-.8" />
      </>
    )}
  </svg>
);

const SportTeacherPage = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Data states
  const [students, setStudents] = useState([]);
  const [studentTalents, setStudentTalents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [countryClubs, setCountryClubs] = useState([]);
  const [clubMemberships, setClubMemberships] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [results, setResults] = useState([]);
  const [schoolSubmission, setSchoolSubmission] = useState(null);
  const [resultDetails, setResultDetails] = useState([]);
  const [talents, setTalents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [educationLevels, setEducationLevels] = useState([]);
  
  // Modal states
  const [modals, setModals] = useState({
    registerStudent: false,
    assignTalent: false,
    createClub: false,
    recordResult: false,
    uploadExcel: false,
    assignStudentClub: false,
    registerClubs: false,
    createAnnouncement: false,
    profile: false,
    changePassword: false,
  });
  
  // Form states
  const [studentForm, setStudentForm] = useState({
    first_name: '', last_name: '', gender: 'M', date_of_birth: '', education_level: '', password: '', confirm_password: '', club: '', talents: []
  });
  const [clubMembershipForm, setClubMembershipForm] = useState({ student: '', club: '' });
  const [talentForm, setTalentForm] = useState({ student: '', talent: '', proficiency_level: 1, notes: '' });
  const [clubForm, setClubForm] = useState({ name: '', focus: '', description: '' });
  const [selectedClubIds, setSelectedClubIds] = useState([]);
  const [resultForm, setResultForm] = useState({ student: '', competition: '', score: '', status: 'finished' });
  const [uploadFile, setUploadFile] = useState(null);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', expires_at: '' });
  const [announcementSubmitting, setAnnouncementSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [resultScores, setResultScores] = useState({});
  const [studentEditForm, setStudentEditForm] = useState({
    first_name: '',
    last_name: '',
    gender: 'M',
    date_of_birth: '',
    education_level: '',
    club: '',
    talents: [],
    new_password: '',
    confirm_password: '',
  });
  const [showRegistrationPassword, setShowRegistrationPassword] = useState(false);
  const [showRegistrationConfirmation, setShowRegistrationConfirmation] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showEditConfirmation, setShowEditConfirmation] = useState(false);
  const [profilePasswordForm, setProfilePasswordForm] = useState({ new_password: '', confirm_password: '' });
  const [showProfilePassword, setShowProfilePassword] = useState(false);
  const [showProfilePasswordConfirmation, setShowProfilePasswordConfirmation] = useState(false);
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  
  // Sidebar state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const [selectedTalentCategory, setSelectedTalentCategory] = useState(null);
  const [drawerWidth, setDrawerWidth] = useState(380);
  const [isResizingDrawer, setIsResizingDrawer] = useState(false);
  const [selectedTalent, setSelectedTalent] = useState(null);
  const [talentSearchQuery, setTalentSearchQuery] = useState('');
  const [talentSortBy, setTalentSortBy] = useState('name');
  const [schoolRecord, setSchoolRecord] = useState(null);

  const schoolId = Number(user?.school?.id || user?.school_id || user?.school) || null;
  const schoolName = schoolRecord?.name || user?.school_name || user?.school?.name || 'Your School';

  useEffect(() => {
    if (!isResizingDrawer) return undefined;

    const handlePointerMove = (event) => {
      const nextWidth = window.innerWidth - event.clientX;
      setDrawerWidth(Math.max(280, Math.min(nextWidth, Math.min(760, window.innerWidth - 24))));
    };
    const stopResizing = () => setIsResizingDrawer(false);

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopResizing);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopResizing);
    };
  }, [isResizingDrawer]);

  // Load data
  const loadData = useCallback(async () => {
    if (!schoolId) {
      setLoading(false);
      setError('No school is assigned to this account.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const [
        studentsRes,
        educationLevelsRes,
        talentsRes,
        studentTalentsRes,
        clubsRes,
        membershipsRes,
        competitionsRes,
        participationsRes,
        resultsRes,
        resultDetailsRes,
        announcementsRes,
        eligibleRes,
        schoolRes,
        countryClubsRes,
        submissionsRes,
      ] = await Promise.all([
        apiService.getStudents({ school: schoolId }),
        apiService.getEducationLevels({
          country: user?.country_id || user?.country?.id || user?.country,
          is_active: true,
        }),
        apiService.getTalents(),
        apiService.getAllStudentTalents({ school: schoolId }),
        apiService.getClubs({ school: schoolId }),
        apiService.getClubMemberships({ school: schoolId }),
        apiService.getCompetitions({ school: schoolId }),
        apiService.getParticipations({ school: schoolId }),
        apiService.getAllResults({ school: schoolId }),
        apiService.getAllResultDetails({ school: schoolId }),
        apiService.getAnnouncements({ is_active: true }),
        apiService.getEligibleForPromotion().catch(() => ({ data: [] })),
        apiService.getSchoolById(schoolId),
        apiService.getCountryClubs({ country: user?.country_id || user?.country?.id || user?.country }),
        apiService.getSchoolResultSubmissions({ school: schoolId }),
      ]);
      
      const schoolStudents = (studentsRes.data.results || []).filter((student) => {
        const studentSchoolId = student.school?.id ?? student.school_id ?? student.school;
        return Number(studentSchoolId) === schoolId;
      });
      setStudents(schoolStudents);
      const schoolCountryId = schoolRes.data.country?.id ?? schoolRes.data.country_id ?? schoolRes.data.country;
      setEducationLevels((educationLevelsRes.data.results || []).filter((level) => Number(level.country) === Number(schoolCountryId)));
      setTalents(talentsRes.data.results || []);
      setStudentTalents(studentTalentsRes.data.results || []);
      setClubs(clubsRes.data.results || []);
      setClubMemberships(membershipsRes.data.results || []);
      setCompetitions(competitionsRes.data.results || []);
      setParticipations(participationsRes.data.results || []);
      setResults(resultsRes.data.results || []);
      setResultDetails(resultDetailsRes.data.results || []);
      setAnnouncements(announcementsRes.data.results || []);
      setEligibleStudents(eligibleRes.data || []);
      setSchoolRecord(schoolRes.data);
      setCountryClubs(countryClubsRes.data.results || []);
      setSchoolSubmission((submissionsRes.data.results || []).find((submission) => submission.competition === schoolCompetition?.id) || submissionsRes.data.results?.[0] || null);
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (!schoolId) {
      setLoading(false);
      setError('No school is assigned to this account.');
      return;
    }

    loadData();
  }, [user, schoolId, loadData]);

  // Modal handlers
  const openModal = (name) => setModals(prev => ({ ...prev, [name]: true }));
  const closeModal = (name) => setModals(prev => ({ ...prev, [name]: false }));
  const openProfileDrawer = () => {
    setProfileMenuOpen(false);
    openModal('profile');
  };
  const openChangePasswordDrawer = () => {
    setProfileMenuOpen(false);
    setProfilePasswordForm({ new_password: '', confirm_password: '' });
    setShowProfilePassword(false);
    setShowProfilePasswordConfirmation(false);
    openModal('changePassword');
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    if (profilePasswordForm.new_password !== profilePasswordForm.confirm_password) {
      setError('New password and confirmation do not match.');
      return;
    }
    setProfileSubmitting(true);
    setError(null);
    try {
      await apiService.updateUserPassword(user.id, profilePasswordForm.new_password);
      setProfilePasswordForm({ new_password: '', confirm_password: '' });
      closeModal('changePassword');
      showSuccess('Password changed successfully');
    } catch (err) {
      const responseErrors = err.response?.data;
      setError(responseErrors?.detail || responseErrors?.password?.[0] || 'Failed to change password');
    } finally {
      setProfileSubmitting(false);
    }
  };
  const openStudentEditor = (student) => {
    setError(null);
    setSelectedStudent(student);
    setStudentEditForm({
      first_name: student.first_name || '',
      last_name: student.last_name || '',
      gender: student.gender || 'M',
      date_of_birth: student.date_of_birth || '',
      education_level: student.education_level || '',
      club: String(clubMemberships.find((membership) => Number(membership.student) === Number(student.id) && membership.is_active)?.club || ''),
      talents: studentTalents.filter((entry) => Number(entry.student) === Number(student.id)).map((entry) => String(entry.talent)),
      new_password: '',
      confirm_password: '',
    });
  };
  const closeStudentEditor = () => setSelectedStudent(null);
  const handleSaveResult = async (row) => {
    try {
      const score = resultScores[row.id] === '' ? null : Number(resultScores[row.id] ?? row.score);
      let participationId = row.participation;
      if (row.participation) {
        await apiService.updateParticipation(row.participation, { status: 'finished' });
      } else if (row.competitionId) {
        const participationResponse = await apiService.createParticipation({ competition: row.competitionId, student: row.student, score: null, status: 'finished' });
        participationId = participationResponse.data.id;
      } else {
        setError('No school-level competition is available for this school.');
        return;
      }
      let resultId = row.result;
      if (!resultId) {
        const resultResponse = await apiService.createResult({ participation: participationId, score: null, award: 'none' });
        resultId = resultResponse.data.id;
      }
      if (row.detail) {
        await apiService.updateResultDetail(row.detail.id, {
          raw_score: score ?? 0,
          percentage_score: score,
        });
      } else if (row.talentId) {
        await apiService.createResultDetail({
          result: resultId,
          talent: row.talentId,
          raw_score: score ?? 0,
          percentage_score: score,
        });
      }
      await loadData();
      showSuccess('Result saved successfully');
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Failed to save result');
    }
  };

  const handleSaveStudent = async (event) => {
    event.preventDefault();
    if (studentEditForm.new_password !== studentEditForm.confirm_password) {
      setError('New passwords do not match.');
      return;
    }
    try {
      await apiService.updateStudent(selectedStudent.id, {
        first_name: studentEditForm.first_name,
        last_name: studentEditForm.last_name,
        gender: studentEditForm.gender,
        date_of_birth: studentEditForm.date_of_birth || null,
        education_level_id: studentEditForm.education_level || null,
      });
      const existingMembership = clubMemberships.find((membership) => Number(membership.student) === Number(selectedStudent.id) && membership.is_active);
      if (existingMembership && String(existingMembership.club) !== String(studentEditForm.club)) {
        await apiService.updateClubMembership(existingMembership.id, { is_active: false, left_at: new Date().toISOString() });
      }
      if (studentEditForm.club && (!existingMembership || String(existingMembership.club) !== String(studentEditForm.club))) {
        const previousMembership = clubMemberships.find((membership) => Number(membership.student) === Number(selectedStudent.id) && Number(membership.club) === Number(studentEditForm.club));
        if (previousMembership) {
          await apiService.updateClubMembership(previousMembership.id, { is_active: true, left_at: null });
        } else {
          await apiService.createClubMembership({ student: selectedStudent.id, club: Number(studentEditForm.club), is_active: true });
        }
      }
      const existingTalents = studentTalents.filter((entry) => Number(entry.student) === Number(selectedStudent.id));
      const selectedTalentIds = new Set(studentEditForm.talents.map((id) => Number(id)));
      await Promise.all(existingTalents.filter((entry) => !selectedTalentIds.has(Number(entry.talent))).map((entry) => apiService.deleteStudentTalent(entry.id)));
      const existingTalentIds = new Set(existingTalents.map((entry) => Number(entry.talent)));
      await Promise.all([...selectedTalentIds].filter((talentId) => !existingTalentIds.has(talentId)).map((talentId) => apiService.createStudentTalent({ student: selectedStudent.id, talent: talentId, proficiency_level: 1, notes: '' })));
      if (studentEditForm.new_password || studentEditForm.confirm_password) {
        await apiService.resetStudentPassword(selectedStudent.id, {
          password: studentEditForm.new_password,
          confirm_password: studentEditForm.confirm_password,
        });
      }
      closeStudentEditor();
      setActiveTab('students');
      await loadData();
      showSuccess('Student changes saved successfully');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save student changes');
    }
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;
    if (!window.confirm(`Delete ${selectedStudent.first_name} ${selectedStudent.last_name}? This cannot be undone.`)) return;
    try {
      await apiService.deleteStudent(selectedStudent.id);
      closeStudentEditor();
      await loadData();
      showSuccess('Student deleted successfully');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete student');
    }
  };
  const openStudentRegistration = () => {
    setError(null);
    setStudentForm({
      first_name: '',
      last_name: '',
      gender: 'M',
      date_of_birth: '',
      education_level: '',
      password: '',
      confirm_password: '',
      club: '',
      talents: [],
    });
    openModal('registerStudent');
  };

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 5000);
  };

  const handleCreateAnnouncement = async (event) => {
    event.preventDefault();
    setAnnouncementSubmitting(true);
    setError(null);
    try {
      const announcementData = {
        title: announcementForm.title.trim(),
        content: announcementForm.content.trim(),
        scope: 'school',
        school: schoolId,
        expires_at: announcementForm.expires_at || null,
      };
      if (selectedAnnouncement) {
        await apiService.updateAnnouncement(selectedAnnouncement.id, announcementData);
      } else {
        await apiService.createAnnouncement(announcementData);
      }
      setAnnouncementForm({ title: '', content: '', expires_at: '' });
      setSelectedAnnouncement(null);
      closeModal('createAnnouncement');
      await loadData();
      showSuccess(selectedAnnouncement ? 'Announcement updated successfully' : 'School announcement published successfully');
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.school?.[0] || 'Failed to publish announcement');
    } finally {
      setAnnouncementSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async () => {
    if (!selectedAnnouncement || !window.confirm('Delete this announcement?')) return;
    setAnnouncementSubmitting(true);
    setError(null);
    try {
      await apiService.deleteAnnouncement(selectedAnnouncement.id);
      setAnnouncementForm({ title: '', content: '', expires_at: '' });
      setSelectedAnnouncement(null);
      closeModal('createAnnouncement');
      await loadData();
      showSuccess('Announcement deleted successfully');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete announcement');
    } finally {
      setAnnouncementSubmitting(false);
    }
  };

  const openAnnouncementEditor = (announcement) => {
    setSelectedAnnouncement(announcement);
    setAnnouncementForm({
      title: announcement.title || '',
      content: announcement.content || '',
      expires_at: announcement.expires_at ? announcement.expires_at.slice(0, 10) : '',
    });
    openModal('createAnnouncement');
  };

  const clubLimit = students.length <= 200 ? 3 : students.length < 500 ? 5 : 10;

  // Register Student
  const handleRegisterStudent = async (e) => {
    e.preventDefault();
    if (studentForm.password !== studentForm.confirm_password) {
      setError('Passwords do not match.');
      return;
    }
    try {
      await apiService.registerStudent({
        first_name: studentForm.first_name,
        last_name: studentForm.last_name,
        gender: studentForm.gender,
        education_level_id: studentForm.education_level || null,
        date_of_birth: studentForm.date_of_birth || null,
        school_id: schoolId,
        password: studentForm.password,
        club: studentForm.club ? Number(studentForm.club) : null,
        talents: studentForm.talents.map((talentId) => Number(talentId)),
      });
      setStudentForm({ first_name: '', last_name: '', gender: 'M', date_of_birth: '', education_level: '', password: '', confirm_password: '', club: '', talents: [] });
      closeModal('registerStudent');
      setActiveTab('students');
      await loadData();
      showSuccess('Student registered successfully');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to register student');
    }
  };

  // Assign Talent
  const handleAssignTalent = async (e) => {
    e.preventDefault();
    try {
      await apiService.createStudentTalent({
        student: Number(talentForm.student),
        talent: Number(talentForm.talent),
        proficiency_level: Number(talentForm.proficiency_level),
        notes: talentForm.notes,
      });
      setTalentForm({ student: '', talent: '', proficiency_level: 1, notes: '' });
      closeModal('assignTalent');
      loadData();
      showSuccess('Talent assigned successfully');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to assign talent');
    }
  };

  // Create Club
  const handleCreateClub = async (e) => {
    e.preventDefault();
    try {
      await apiService.createClub({
        name: clubForm.name,
        focus: clubForm.focus,
        description: clubForm.description,
        school: schoolId,
        is_active: true,
      });
      setClubForm({ name: '', focus: '', description: '' });
      closeModal('createClub');
      loadData();
      showSuccess('Club created successfully');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create club');
    }
  };

  const openClubRegistration = () => {
    setError(null);
    setSelectedClubIds([]);
    openModal('registerClubs');
  };

  const handleRegisterClubs = async (event) => {
    event.preventDefault();
    try {
      await apiService.registerClubs({ country_club_ids: selectedClubIds.map(Number) });
      closeModal('registerClubs');
      await loadData();
      showSuccess('Clubs registered successfully');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to register clubs');
    }
  };

  // Assign student to club
  const handleAssignStudentClub = async (e) => {
    e.preventDefault();
    if (!clubMembershipForm.student || !clubMembershipForm.club) {
      setError('Please select a student and a club.');
      return;
    }

    const selectedStudent = students.find((student) => student.id === Number(clubMembershipForm.student));
    const selectedClub = clubs.find((club) => club.id === Number(clubMembershipForm.club));
    const studentSchoolId = selectedStudent?.school ?? selectedStudent?.school_id;
    const clubSchoolId = selectedClub?.school ?? selectedClub?.school_id;

    if (
      studentSchoolId != null &&
      clubSchoolId != null &&
      Number(studentSchoolId) !== Number(clubSchoolId)
    ) {
      setError('A student can only join a club in their school.');
      return;
    }

    try {
      await apiService.createClubMembership({
        student: Number(clubMembershipForm.student),
        club: Number(clubMembershipForm.club),
        is_active: true,
      });
      setClubMembershipForm({ student: '', club: '' });
      closeModal('assignStudentClub');
      loadData();
      showSuccess('Student assigned to club successfully');
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Failed to assign club');
    }
  };

  // Record Result
  const handleRecordResult = async (e) => {
    e.preventDefault();
    try {
      await apiService.createParticipation({
        competition: Number(resultForm.competition),
        student: Number(resultForm.student),
        score: resultForm.score ? Number(resultForm.score) : null,
        status: resultForm.status,
      });
      setResultForm({ student: '', competition: '', score: '', status: 'finished' });
      closeModal('recordResult');
      loadData();
      showSuccess('Result recorded successfully');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to record result');
    }
  };

  // Upload Excel
  const handleUploadExcel = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setError('Please select a file');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      const response = await apiService.uploadBulkResults(formData);
      if (response.data.errors && response.data.errors.length > 0) {
        setError(`Uploaded with errors: ${response.data.errors.join(', ')}`);
      } else {
        showSuccess(`${response.data.created} results uploaded successfully`);
      }
      setUploadFile(null);
      closeModal('uploadExcel');
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  // Promote Students
  const handlePromoteStudents = async () => {
    if (selectedStudents.length === 0) {
      setError('Please select at least one student');
      return;
    }
    setPromoting(true);
    try {
      await apiService.promoteStudents({
        student_ids: selectedStudents,
        competition_id: eligibleStudents[0]?.competition_id,
        to_level: 'district',
      });
      setSelectedStudents([]);
      closeModal('promoteStudents');
      loadData();
      showSuccess(`${selectedStudents.length} students promoted to district level`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to promote students');
    } finally {
      setPromoting(false);
    }
  };

  // Helper functions
  const getStudentName = (id) => {
    const s = students.find(st => st.id === id);
    return s ? `${s.first_name} ${s.last_name}` : 'Unknown';
  };

  const getCompetitionName = (id) => {
    const c = competitions.find(comp => comp.id === id);
    return c?.name || 'Unknown';
  };

  const relevantAnnouncements = announcements.filter((announcement) => {
    if (!announcement.is_active || (announcement.expires_at && new Date(announcement.expires_at) < new Date())) return false;
    const scopeIds = {
      national: true,
      school: Number(announcement.school) === schoolId,
      district: Number(announcement.district) === Number(schoolRecord?.district),
      region: Number(announcement.region) === Number(schoolRecord?.region),
      zone: Number(announcement.zone) === Number(schoolRecord?.zone),
    };
    return scopeIds[announcement.scope] || false;
  });

  const getStudentTalentNames = (studentId) => {
    const talents = studentTalents.filter((entry) => Number(entry.student) === Number(studentId));
    return talents.map(t => t.talent_name || 'Talent').join(', ') || 'None';
  };

  const getStudentClub = (studentId) => {
    const membership = clubMemberships.find(m => m.student === studentId && m.is_active);
    if (membership) {
      const club = clubs.find(c => c.id === membership.club);
      return club?.name || 'Unknown';
    }
    return 'Not assigned';
  };

  const getStudentEducationLevel = (student) => {
    const levelId = student.education_level?.id ?? student.education_level_id ?? student.education_level;
    return educationLevels.find((level) => Number(level.id) === Number(levelId))?.name || '—';
  };

  const uniqueClubs = Array.from(new Map((clubs || []).map((club) => [String(club.id), club])).values());
  const schoolClubs = uniqueClubs.filter((club) => {
    const clubSchoolId = club.school?.id ?? club.school_id ?? club.school;
    return Number(clubSchoolId) === schoolId;
  });
  const selectedClubs = Array.from(new Map(
    schoolClubs
      .filter((club) => club.is_active)
      .map((club) => [
        String(club.country_club ?? club.country_club_id ?? club.name).toLowerCase(),
        club,
      ])
  ).values());
  const registrationClubs = schoolClubs.filter((club) => club.is_active !== false);
  const registeredCountryClubIds = new Set(schoolClubs.map((club) => Number(club.country_club ?? club.country_club_id)));
  const availableCountryClubs = countryClubs.filter(
    (club) => club.is_active !== false && !registeredCountryClubIds.has(Number(club.id))
  );
  const talentsByCategory = talents.reduce((groups, talent) => {
    const category = talent.category_name || 'Uncategorized';
    groups[category] = [...(groups[category] || []), talent];
    return groups;
  }, {});
  const renderTalentCheckboxes = (selectedTalentIds, onChange) => Object.entries(talentsByCategory)
    .sort(([categoryA], [categoryB]) => categoryA.localeCompare(categoryB))
    .map(([category, categoryTalents]) => (
      <section className="sport-teacher-talent-category" key={category}>
        <h3>{category}</h3>
        <div className="sport-teacher-registration-checkbox-grid">
          {categoryTalents
            .sort((talentA, talentB) => talentA.name.localeCompare(talentB.name))
            .map((talent) => (
              <label key={talent.id}>
                <input type="checkbox" checked={selectedTalentIds.includes(String(talent.id))} onChange={(event) => onChange(event.target.checked ? [...selectedTalentIds, String(talent.id)] : selectedTalentIds.filter((id) => id !== String(talent.id)))} />
                <span>{talent.name}</span>
              </label>
            ))}
        </div>
      </section>
    ));
  const selectedTalentStudents = selectedTalent
    ? studentTalents
      .filter((entry) => Number(entry.talent) === Number(selectedTalent.id))
      .map((entry) => students.find((student) => Number(student.id) === Number(entry.student)))
      .filter(Boolean)
      .filter((student) => {
        const query = talentSearchQuery.trim().toLowerCase();
        if (!query) return true;
        const otherTalentNames = studentTalents
          .filter((entry) => Number(entry.student) === Number(student.id) && Number(entry.talent) !== Number(selectedTalent.id))
          .map((entry) => entry.talent_name || '')
          .join(' ');
        return `${student.first_name} ${student.last_name} ${student.student_id || ''} ${otherTalentNames}`.toLowerCase().includes(query);
      })
      .sort((studentA, studentB) => {
        if (talentSortBy === 'class') {
          return getStudentEducationLevel(studentA).localeCompare(getStudentEducationLevel(studentB));
        }
        return `${studentA.first_name} ${studentA.last_name}`.localeCompare(`${studentB.first_name} ${studentB.last_name}`);
      })
    : [];
  const selectedClubStudents = selectedClub
    ? clubMemberships
      .filter((membership) => Number(membership.club) === Number(selectedClub.id) && membership.is_active)
      .map((membership) => students.find((student) => Number(student.id) === Number(membership.student)))
      .filter(Boolean)
      .sort((studentA, studentB) => `${studentA.first_name} ${studentA.last_name}`.localeCompare(`${studentB.first_name} ${studentB.last_name}`))
    : [];

  const getStatusBadge = (status, score, recorded = score !== null && score !== undefined) => {
    if (status === 'disqualified') {
      return <span className="badge badge-danger">Disqualified</span>;
    }
    if (!recorded || score === null || score === undefined) {
      return <span className="badge badge-warning">Not recorded</span>;
    }
    if (score >= 50) {
      return <span className="badge badge-pending">Pending</span>;
    }
    return <span className="badge badge-danger">Failed</span>;
  };

  // Sidebar menu items
  const menuItems = [
    { key: 'dashboard', label: 'Home' },
    { key: 'talents', label: 'Clubs & Talents' },
    { key: 'students', label: 'Students' },
    { key: 'results', label: 'Results' },
    { key: 'announcements', label: 'Announcements' },
  ];
  const [navigationOpen, setNavigationOpen] = useState(false);

  const renderLoadingSkeleton = () => (
    <div className="sport-teacher-loading-skeleton" aria-label="Loading dashboard" aria-busy="true">
      <div className="sport-teacher-skeleton-heading">
        <div className="sport-teacher-skeleton-block sport-teacher-skeleton-title" />
        <div className="sport-teacher-skeleton-block sport-teacher-skeleton-subtitle" />
      </div>
      <div className="sport-teacher-skeleton-stats">
        {[1, 2, 3, 4].map((item) => (
          <div className="sport-teacher-skeleton-card" key={item}>
            <div className="sport-teacher-skeleton-block sport-teacher-skeleton-label" />
            <div className="sport-teacher-skeleton-block sport-teacher-skeleton-number" />
          </div>
        ))}
      </div>
      <div className="sport-teacher-skeleton-card sport-teacher-skeleton-actions">
        <div className="sport-teacher-skeleton-block sport-teacher-skeleton-section-title" />
        <div className="sport-teacher-skeleton-action-row">
          {[1, 2, 3].map((item) => <div className="sport-teacher-skeleton-block sport-teacher-skeleton-action" key={item} />)}
        </div>
      </div>
      <div className="sport-teacher-skeleton-panels">
        {[1, 2].map((panel) => (
          <div className="sport-teacher-skeleton-card sport-teacher-skeleton-panel" key={panel}>
            <div className="sport-teacher-skeleton-panel-heading">
              <div className="sport-teacher-skeleton-block sport-teacher-skeleton-section-title" />
              <div className="sport-teacher-skeleton-block sport-teacher-skeleton-count" />
            </div>
            {[1, 2, 3, 4, 5].map((row) => (
              <div className="sport-teacher-skeleton-table-row" key={row}>
                <div className="sport-teacher-skeleton-block sport-teacher-skeleton-row-main" />
                <div className="sport-teacher-skeleton-block sport-teacher-skeleton-row-secondary" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  // Render content based on active tab
  const renderContent = () => {
    if (loading) {
      return renderLoadingSkeleton();
    }

    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'students':
        return renderStudents();
      case 'talents':
        return renderClubsAndTalents();
      case 'results':
        return renderResults();
      case 'announcements':
        return renderAnnouncements();
      case 'upload':
        return renderUpload();
      default:
        return renderDashboard();
    }
  };

  const renderClubsAndTalents = () => (
    <div className="sport-teacher-prototype-page">
      <div className="sport-teacher-prototype-page-heading">
        <h1>Clubs &amp; Talents</h1>
      </div>
      <div className="sport-teacher-management-grid">
        <section className="sport-teacher-management-card">
          <div className="sport-teacher-card-heading">
            <h2>Clubs</h2>
            <button type="button" className="sport-teacher-card-action" onClick={openClubRegistration}>Register club</button>
          </div>
          {selectedClubs.length ? (
            <div className="sport-teacher-club-list">
              {selectedClubs.map((club) => (
                <button type="button" key={club.id} onClick={() => setSelectedClub(club)}>
                  <strong>{club.name}</strong>
                </button>
              ))}
            </div>
          ) : <p className="sport-teacher-empty-message">No clubs selected for this school yet.</p>}
        </section>
        <section className="sport-teacher-management-card">
          <div className="sport-teacher-card-heading">
            <div><h2>Talents</h2><p>Talent categories in the system</p></div>
            <span className="sport-teacher-read-only-badge">Read only</span>
          </div>
          <div className="sport-teacher-category-list">
            {[...new Set(talents.map((talent) => talent.category_name).filter(Boolean))].sort().map((category) => (
              <button type="button" key={category} onClick={() => setSelectedTalentCategory(category)}>
                <strong>{category}</strong>
                <span>{talents.filter((talent) => talent.category_name === category).length} talents</span>
              </button>
            ))}
            {!talents.some((talent) => talent.category_name) && <p className="sport-teacher-empty-message">No talent categories available.</p>}
          </div>
        </section>
      </div>
    </div>
  );

  // DASHBOARD VIEW
  const renderDashboard = () => {
    const talentParticipation = Object.entries(studentTalents.reduce((counts, entry) => {
      const talentName = entry.talent_name || 'Unassigned talent';
      counts[talentName] = (counts[talentName] || 0) + 1;
      return counts;
    }, {})).sort(([, countA], [, countB]) => countB - countA);
    const totalTalentAssignments = talentParticipation.reduce((total, [, count]) => total + count, 0);
    const talentChartColors = ['#0e1db6', '#4682b4', '#38a169', '#d69e2e', '#c05621', '#805ad5', '#319795', '#b83280'];
    let talentChartOffset = 0;
    const talentChartSegments = talentParticipation.map(([name, count], index) => {
      const percentage = totalTalentAssignments ? (count / totalTalentAssignments) * 100 : 0;
      const segment = { name, count, percentage, color: talentChartColors[index % talentChartColors.length], start: talentChartOffset };
      talentChartOffset += percentage;
      return segment;
    });
    const talentChartGradient = talentChartSegments.length
      ? `conic-gradient(${talentChartSegments.map((segment) => `${segment.color} ${segment.start}% ${segment.start + segment.percentage}%`).join(', ')})`
      : '#e8edf3';
    const resultProgress = {
      scored: schoolResultRows.filter((row) => row.hasScore).length,
      pending: schoolResultRows.filter((row) => !row.hasScore).length,
      passed: schoolResultRows.filter((row) => row.hasScore && Number(row.score) >= 50).length,
      failed: schoolResultRows.filter((row) => row.hasScore && Number(row.score) < 50).length,
    };
    const totalResultRows = schoolResultRows.length;
    const progressPercent = totalResultRows ? Math.round((resultProgress.scored / totalResultRows) * 100) : 0;
    const eligibleTalentCount = schoolResultRows.filter((row) => {
      const score = Number(row.detail?.percentage_score ?? row.detail?.raw_score);
      return row.hasScore && Number.isFinite(score) && score >= 50;
    }).length;
    const involvedCompetitionIds = new Set(participations.map((participation) => Number(participation.competition)));
    const involvedCompetitions = competitions
      .filter((competition) => {
        const competitionSchools = (competition.schools || []).map((id) => Number(id));
        return competitionSchools.includes(schoolId) || involvedCompetitionIds.has(Number(competition.id));
      })
      .sort((competitionA, competitionB) => new Date(competitionA.start_date) - new Date(competitionB.start_date));
    const formatCompetitionDate = (date) => date ? new Date(date).toLocaleDateString('en-GB') : 'Not set';

    return (
    <>
      <div className="sport-teacher-attention-section">
        <div className="sport-teacher-attention-heading">
          <div><h2>Needs attention</h2></div>
        </div>
        <div className="sport-teacher-attention-grid">
          <button type="button" className="sport-teacher-attention-card" onClick={() => setActiveTab('students')}>
            <strong>{students.length}</strong>
            <span className="sport-teacher-attention-label">total students</span>
          </button>
          <button type="button" className="sport-teacher-attention-card" onClick={() => setActiveTab('results')}>
            <strong>{resultProgress.pending}</strong>
            <span className="sport-teacher-attention-label">need scores</span>
          </button>
          <button type="button" className="sport-teacher-attention-card" onClick={() => setActiveTab('students')}>
            <strong>{students.filter((student) => !studentTalents.some((entry) => Number(entry.student) === Number(student.id))).length}</strong>
            <span className="sport-teacher-attention-label">have no talent</span>
          </button>
          <button type="button" className="sport-teacher-attention-card" onClick={() => setActiveTab('students')}>
            <strong>{students.filter((student) => !clubMemberships.some((membership) => Number(membership.student) === Number(student.id) && membership.is_active)).length}</strong>
            <span className="sport-teacher-attention-label">have no club</span>
          </button>
          <button type="button" className="sport-teacher-attention-card" onClick={() => setActiveTab('results')}>
            <strong>{eligibleTalentCount}</strong>
            <span className="sport-teacher-attention-label">eligible for promotion</span>
          </button>
        </div>
      </div>

      <div className="sport-teacher-dashboard-overview">
        <section className="sport-teacher-overview-card">
          <div className="sport-teacher-overview-card-heading">
            <div><h2>Talent participation</h2><p>Where students are participating in your school.</p></div>
            <button type="button" onClick={() => setActiveTab('talents')}>View talents</button>
          </div>
          {talentParticipation.length ? (
            <div className="sport-teacher-talent-donut-layout">
              <div className="sport-teacher-talent-donut" style={{ background: talentChartGradient }} aria-label="Talent participation donut chart">
                <div><strong>{totalTalentAssignments}</strong><span>assigned</span></div>
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
          ) : <p className="sport-teacher-overview-empty">No talents have been assigned yet.</p>}
        </section>
        <section className="sport-teacher-overview-card">
          <div className="sport-teacher-overview-card-heading">
            <div><h2>Results progress</h2><p>{schoolCompetition?.name || 'School competition'}</p></div>
            <button type="button" onClick={() => setActiveTab('results')}>Open results</button>
          </div>
          <div className="sport-teacher-progress-summary"><strong>{progressPercent}%</strong><span>has score</span><div className="sport-teacher-progress-track"><span style={{ width: `${progressPercent}%` }} /></div></div>
          <div className="sport-teacher-result-legend">
            <span><i className="is-scored" />Scored results <strong>{resultProgress.scored}</strong></span>
            <span><i className="is-pending" />Awaiting score <strong>{resultProgress.pending}</strong></span>
            <span><i className="is-passed" />Passed talents (50%+) <strong>{resultProgress.passed}</strong></span>
            <span><i className="is-failed" />Below 50% <strong>{resultProgress.failed}</strong></span>
          </div>
        </section>
      </div>

      {/* Two-column layout */}
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Top students by talent count */}
        <div className="sport-teacher-home-top-students">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>Top 5 students by talents</span>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>Most talents</span>
          </div>
          <div className="sport-teacher-home-top-student-list">
            {[...students]
              .map((student) => ({
                ...student,
                assignedTalents: studentTalents.filter((entry) => Number(entry.student) === Number(student.id)),
              }))
              .sort((studentA, studentB) => studentB.assignedTalents.length - studentA.assignedTalents.length)
              .slice(0, 5)
              .map((student) => (
                <div className="sport-teacher-home-top-student" key={student.id}>
                  <div className="sport-teacher-home-top-student-label">
                    <span>{student.first_name} {student.last_name}</span>
                    <strong>{student.assignedTalents.length}</strong>
                  </div>
                  <div className="sport-teacher-talent-bar-track"><span style={{ width: `${Math.max((student.assignedTalents.length / (studentTalents.length || 1)) * 100, 8)}%` }} /></div>
                  <small>{student.assignedTalents.map((entry) => entry.talent_name || 'Talent').join(', ') || 'No talents assigned'}</small>
                </div>
              ))}
            {!students.length && <p className="sport-teacher-overview-empty">No students registered.</p>}
          </div>
        </div>

        {/* Competitions */}
        <div className="sport-teacher-home-competitions">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>Competitions</span>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>{involvedCompetitions.length} total</span>
          </div>
          <div className="sport-teacher-home-competition-list">
            {involvedCompetitions.map((competition) => (
              <div className="sport-teacher-home-competition-row" key={competition.id}>
                <strong>{competition.name}</strong>
                <span className="sport-teacher-home-competition-level">{competition.level?.replace('_', ' ') || 'Competition'} level</span>
                <span>{formatCompetitionDate(competition.start_date)} - {formatCompetitionDate(competition.end_date)}</span>
              </div>
            ))}
            {!involvedCompetitions.length && <p className="sport-teacher-overview-empty">No competitions involving this school.</p>}
          </div>
        </div>
      </div>
    </>
    );
  };

  // STUDENTS VIEW
  const renderStudents = () => (
    <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>All Students</span>
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            openStudentRegistration();
          }}
          style={{ ...actionBtnStyle, background: '#0E1DB6', color: 'white' }}
        >
          + Register Student
        </button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: '10px 16px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>Student ID</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>Name</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>Class</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>Talents</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>Club</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 16px' }}>
                  <button type="button" className="sport-teacher-student-id-link" onClick={() => openStudentEditor(student)}>{student.student_id || '—'}</button>
                </td>
                <td style={{ padding: '10px 16px', fontWeight: '500' }}>{student.first_name} {student.last_name} ({student.gender || '—'})</td>
                <td style={{ padding: '10px 16px' }}>{getStudentEducationLevel(student)}</td>
                <td style={{ padding: '10px 16px' }}>{getStudentTalentNames(student.id)}</td>
                <td style={{ padding: '10px 16px' }}>
                  <span style={{ display: 'inline-block', padding: '2px 10px', background: '#eef2ff', color: '#0E1DB6', borderRadius: '12px', fontSize: '12px' }}>
                    {getStudentClub(student.id)}
                  </span>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#9ca3af' }}>No students registered</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // TALENTS VIEW
  const renderTalents = () => (
    <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>Student Talents</span>
        <button onClick={() => openModal('assignTalent')} style={{ ...actionBtnStyle, background: '#0E1DB6', color: 'white' }}>+ Assign Talent</button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: '10px 16px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>Student</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>Talent</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>Level</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {studentTalents.map((st) => (
              <tr key={st.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 16px' }}>{getStudentName(st.student)}</td>
                <td style={{ padding: '10px 16px' }}>{st.talent_name || 'Talent'}</td>
                <td style={{ padding: '10px 16px' }}>{['Beginner', 'Intermediate', 'Advanced', 'Expert'][st.proficiency_level - 1] || 'Beginner'}</td>
                <td style={{ padding: '10px 16px', color: '#6b7280' }}>{st.notes || '—'}</td>
              </tr>
            ))}
            {studentTalents.length === 0 && (
              <tr><td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#9ca3af' }}>No talents assigned</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // CLUBS VIEW
  const renderClubs = () => (
    <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>School Clubs</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: '10px 16px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>Club Name</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>Focus</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>Students</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {schoolClubs.map((club) => (
              <tr key={club.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 16px', fontWeight: '500' }}>{club.name}</td>
                <td style={{ padding: '10px 16px' }}>{club.focus || '—'}</td>
                <td style={{ padding: '10px 16px' }}>{clubMemberships.filter(m => Number(m.club) === Number(club.id) && m.is_active).length}</td>
                <td style={{ padding: '10px 16px' }}>
                  <span style={{ display: 'inline-block', padding: '2px 10px', background: club.is_active ? '#dcfce7' : '#f3f4f6', color: club.is_active ? '#15803d' : '#6b7280', borderRadius: '12px', fontSize: '12px' }}>
                    {club.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
            {schoolClubs.length === 0 && (
              <tr><td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#9ca3af' }}>No clubs created</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // TALENTS & CLUBS MANAGEMENT VIEW
  const renderTalentClubManagement = () => (
    <div style={{ display: 'grid', gap: '24px' }}>
      <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>Clubs</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>Club Name</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>Focus</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>Students</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {schoolClubs.map((club) => (
                <tr key={club.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 16px', fontWeight: '500' }}>{club.name}</td>
                  <td style={{ padding: '10px 16px' }}>{club.focus || '—'}</td>
                  <td style={{ padding: '10px 16px' }}>{clubMemberships.filter(m => Number(m.club) === Number(club.id) && m.is_active).length}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ display: 'inline-block', padding: '2px 10px', background: club.is_active ? '#dcfce7' : '#f3f4f6', color: club.is_active ? '#15803d' : '#6b7280', borderRadius: '12px', fontSize: '12px' }}>
                      {club.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
              {schoolClubs.length === 0 && (
                <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#9ca3af' }}>No clubs created</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>Talent Assignments</span>
          <button onClick={() => openModal('assignTalent')} style={{ ...actionBtnStyle, background: '#0E1DB6', color: 'white' }}>+ Assign Talent</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>Student</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>Talent</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>Level</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {studentTalents.map((st) => (
                <tr key={st.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 16px' }}>{getStudentName(st.student)}</td>
                  <td style={{ padding: '10px 16px' }}>{st.talent_name || 'Talent'}</td>
                  <td style={{ padding: '10px 16px' }}>{['Beginner', 'Intermediate', 'Advanced', 'Expert'][st.proficiency_level - 1] || 'Beginner'}</td>
                  <td style={{ padding: '10px 16px', color: '#6b7280' }}>{st.notes || '—'}</td>
                </tr>
              ))}
              {studentTalents.length === 0 && (
                <tr><td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#9ca3af' }}>No talents assigned</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // RESULTS VIEW
  const resultByParticipation = new Map(results.map((result) => [Number(result.participation), result]));
  const competitionById = new Map(competitions.map((competition) => [Number(competition.id), competition]));
  const schoolCompetition = competitions.find((competition) => competition.level === 'school');
  const schoolResultRows = students.flatMap((student) => {
    const participation = participations.find((item) => Number(item.student) === Number(student.id) && competitionById.get(Number(item.competition))?.level === 'school');
    const result = participation ? resultByParticipation.get(Number(participation.id)) : null;
    const studentTalentEntries = studentTalents.filter((entry) => Number(entry.student) === Number(student.id));
    const talentRows = studentTalentEntries.length ? studentTalentEntries : [{ id: `no-talent-${student.id}`, talent_name: 'None' }];
    return talentRows.map((talentEntry) => {
      const detail = resultDetails.find((entry) => Number(entry.talent) === Number(talentEntry.id) && result && Number(entry.result) === Number(result.id));
      return {
        id: `${result?.id || participation?.id || `student-${student.id}`}-${talentEntry.id}`,
        result: result?.id,
        participation: participation?.id,
        competition: result?.competition_name || (participation ? getCompetitionName(participation.competition) : null),
        competitionId: participation?.competition || schoolCompetition?.id,
        student: student.id,
        talentId: talentEntry.talent ? talentEntry.id : null,
        talent: talentEntry.talent_name || 'Talent',
        detail,
        score: detail?.percentage_score ?? detail?.raw_score ?? result?.score ?? participation?.score ?? null,
        hasScore: detail?.percentage_score !== null && detail?.percentage_score !== undefined
          || detail?.raw_score !== null && detail?.raw_score !== undefined
          || result?.score !== null && result?.score !== undefined
          || participation?.score !== null && participation?.score !== undefined,
        status: detail ? (detail.passed ? 'finished' : 'registered') : (participation?.status || 'registered'),
      };
    });
  });

  const higherLevelResults = ['district', 'zone', 'country'].map((level) => ({
    level,
    results: results.filter((result) => result.competition_level === level),
  }));

  const handleSubmitSchoolResults = async () => {
    if (!schoolCompetition) {
      setError('No school-level competition is available.');
      return;
    }
    try {
      const submission = schoolSubmission || (await apiService.createSchoolResultSubmission({ school: schoolId, competition: schoolCompetition.id, status: 'draft' })).data;
      await apiService.submitSchoolResultSubmission(submission.id);
      await loadData();
      showSuccess('School results submitted for district review');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit school results');
    }
  };

  const renderResults = () => (
    <div className="sport-teacher-results-stack">
      <section className="sport-teacher-results-card">
        <div className="sport-teacher-results-card-header">
          <div><h2>School-level competition</h2><p>{schoolSubmission?.status === 'submitted' ? 'Submitted and locked for district review.' : 'Results for all students in your school.'}</p></div>
          {schoolSubmission?.status !== 'submitted' && <button type="button" onClick={handleSubmitSchoolResults} style={{ ...actionBtnStyle, background: '#0E1DB6', color: 'white' }}>Submit results</button>}
        </div>
        <div className="sport-teacher-results-table-wrap">
          <table className="sport-teacher-results-table"><thead><tr><th>Competition</th><th>Student</th><th>Talent</th><th>Score</th><th>Status</th></tr></thead><tbody>
            {schoolResultRows.map((row) => <tr key={row.id}><td>{row.competition || schoolCompetition?.name || 'Not recorded'}</td><td>{getStudentName(row.student)}</td><td>{row.talent}</td><td><span className="sport-teacher-score-editor"><input className="sport-teacher-inline-score" type="number" min="0" max="100" step="0.01" value={resultScores[row.id] ?? row.score} disabled={schoolSubmission?.status === 'submitted' || schoolSubmission?.status === 'approved'} onChange={(event) => setResultScores({ ...resultScores, [row.id]: event.target.value })} aria-label={`Score for ${getStudentName(row.student)} ${row.talent}`} /><button type="button" className="sport-teacher-inline-save" disabled={schoolSubmission?.status === 'submitted' || schoolSubmission?.status === 'approved'} onClick={() => handleSaveResult(row)}>Save</button></span></td><td>{getStatusBadge(row.status, row.score, Boolean(row.participation || row.detail))}</td></tr>)}
            {!schoolResultRows.length && <tr><td colSpan="5" className="sport-teacher-results-empty">No students registered.</td></tr>}
          </tbody></table>
        </div>
      </section>
      {higherLevelResults.map(({ level, results: levelResults }) => (
        <section className="sport-teacher-results-card" key={level}>
          <div className="sport-teacher-results-card-header"><div><h2>{level.charAt(0).toUpperCase() + level.slice(1)}-level competition</h2><p>Read-only results for students promoted from your school.</p></div><span className="sport-teacher-read-only-badge">Read only</span></div>
          <div className="sport-teacher-results-table-wrap"><table className="sport-teacher-results-table"><thead><tr><th>Competition</th><th>Student</th><th>Score</th><th>Rank</th></tr></thead><tbody>
            {levelResults.map((result) => <tr key={result.id}><td>{result.competition_name}</td><td>{result.student_name}</td><td><strong>{result.score ?? 0}%</strong></td><td>{result.rank ?? '—'}</td></tr>)}
            {!levelResults.length && <tr><td colSpan="4" className="sport-teacher-results-empty">No {level}-level results available.</td></tr>}
          </tbody></table></div>
        </section>
      ))}
    </div>
  );

  // ANNOUNCEMENTS VIEW
  const renderAnnouncements = () => (
    <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ display: 'block', fontSize: '18px', fontWeight: '700', color: '#111827' }}>Announcements ({relevantAnnouncements.length})</span>
        </div>
        <button type="button" onClick={() => { setSelectedAnnouncement(null); setAnnouncementForm({ title: '', content: '', expires_at: '' }); openModal('createAnnouncement'); }} style={{ ...actionBtnStyle, background: '#0E1DB6', color: 'white' }}>+ Add announcement</button>
      </div>
      <div style={{ display: 'grid', gap: '16px', padding: '20px' }}>
        {relevantAnnouncements.map((announcement) => (
          <article key={announcement.id} style={{ padding: '0 0 16px', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'baseline' }}>
              <button type="button" className="sport-teacher-announcement-title" onClick={() => openAnnouncementEditor(announcement)}>{announcement.title}</button>
              <span style={{ color: '#6b7280', fontSize: '12px', whiteSpace: 'nowrap' }}>
                {announcement.published_at || announcement.created_at ? new Date(announcement.published_at || announcement.created_at).toLocaleDateString('en-GB') : 'Date unavailable'}
              </span>
            </div>
            <p style={{ margin: '8px 0 0', color: '#4b5563', fontSize: '14px', lineHeight: 1.6 }}>{announcement.content}</p>
          </article>
        ))}
        {relevantAnnouncements.length === 0 && <p style={{ margin: 0, color: '#6b7280' }}>No announcements for your school.</p>}
      </div>
    </div>
  );

  // UPLOAD VIEW
  const renderUpload = () => (
    <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '30px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>Upload Excel Results</h3>
      <p style={{ color: '#6b7280', marginBottom: '20px' }}>Upload an Excel file with competition results. Required columns: student_id, competition_id, score, status</p>
      <form onSubmit={handleUploadExcel}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Select Excel File</label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setUploadFile(e.target.files[0])}
            style={{ padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', width: '100%' }}
            required
          />
        </div>
        <button type="submit" style={{ ...actionBtnStyle, background: '#0E1DB6', color: 'white' }} disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload Results'}
        </button>
      </form>
    </div>
  );

  // PROMOTIONS VIEW
  const renderPromotions = () => (
    <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>Students Eligible for Promotion</span>
        <button
          onClick={handlePromoteStudents}
          style={{ ...actionBtnStyle, background: '#0E1DB6', color: 'white' }}
          disabled={promoting || selectedStudents.length === 0}
        >
          {promoting ? 'Promoting...' : `Promote Selected (${selectedStudents.length})`}
        </button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: '10px 16px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedStudents(eligibleStudents.map(s => s.student_id));
                    } else {
                      setSelectedStudents([]);
                    }
                  }}
                  checked={eligibleStudents.length > 0 && selectedStudents.length === eligibleStudents.length}
                />
              </th>
              <th style={{ padding: '10px 16px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>Student</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>Competition</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>Score</th>
            </tr>
          </thead>
          <tbody>
            {eligibleStudents.map((item) => (
              <tr key={item.student_id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 16px' }}>
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(item.student_id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStudents([...selectedStudents, item.student_id]);
                      } else {
                        setSelectedStudents(selectedStudents.filter(id => id !== item.student_id));
                      }
                    }}
                  />
                </td>
                <td style={{ padding: '10px 16px', fontWeight: '500' }}>{item.student_name}</td>
                <td style={{ padding: '10px 16px' }}>{item.competition_name}</td>
                <td style={{ padding: '10px 16px', fontWeight: '600', color: '#15803d' }}>{item.score}%</td>
              </tr>
            ))}
            {eligibleStudents.length === 0 && (
              <tr><td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#9ca3af' }}>No students eligible for promotion</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Action button style
  const actionBtnStyle = {
    padding: '8px 16px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    background: 'white',
    color: '#111827',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const registrationDrawer = modals.registerStudent ? (
    <>
      <button type="button" className="sport-teacher-drawer-backdrop sport-teacher-registration-backdrop" aria-label="Close student registration" onClick={() => closeModal('registerStudent')} />
      <aside className="sport-teacher-search-drawer sport-teacher-registration-drawer" style={{ '--drawer-width': `${drawerWidth}px` }} aria-label="Register student">
        <div className="sport-teacher-drawer-resize-edge" onPointerDown={(event) => { event.preventDefault(); setIsResizingDrawer(true); }} role="separator" aria-label="Resize slide-over panel" />
        <div className="sport-teacher-search-drawer-header">
          <h2>Register Student</h2>
          <button type="button" onClick={() => closeModal('registerStudent')} aria-label="Close student registration">&times;</button>
        </div>
        <form onSubmit={handleRegisterStudent}>
          <div className="sport-teacher-registration-form-grid">
            <label>First Name *<input type="text" value={studentForm.first_name} onChange={(event) => setStudentForm({ ...studentForm, first_name: event.target.value })} required /></label>
            <label>Last Name *<input type="text" value={studentForm.last_name} onChange={(event) => setStudentForm({ ...studentForm, last_name: event.target.value })} required /></label>
            <label>Gender *<select value={studentForm.gender} onChange={(event) => setStudentForm({ ...studentForm, gender: event.target.value })} required><option value="M">Male</option><option value="F">Female</option></select></label>
            <label>Date of Birth<input type="date" value={studentForm.date_of_birth} onChange={(event) => setStudentForm({ ...studentForm, date_of_birth: event.target.value })} /></label>
          </div>
          <div className="sport-teacher-registration-form-grid sport-teacher-registration-level-club-row">
            <label>Class / Level<select value={studentForm.education_level} onChange={(event) => setStudentForm({ ...studentForm, education_level: event.target.value })}><option value="">Not specified</option>{educationLevels.map((level) => <option key={level.id} value={level.id}>{level.name}</option>)}</select></label>
            <label>Assign school club <select value={studentForm.club} onChange={(event) => setStudentForm({ ...studentForm, club: event.target.value })} disabled={!registrationClubs.length}><option value="">{registrationClubs.length ? 'No club' : 'No club registered for this school'}</option>{registrationClubs.map((club) => <option key={club.id} value={club.id}>{club.name}</option>)}</select></label>
          </div>
          <div className="sport-teacher-registration-form-grid sport-teacher-registration-password-row">
            <label>Password *<span className="sport-teacher-password-control"><input type={showRegistrationPassword ? 'text' : 'password'} value={studentForm.password} onChange={(event) => setStudentForm({ ...studentForm, password: event.target.value })} minLength="8" required /><button type="button" onClick={() => setShowRegistrationPassword((visible) => !visible)} aria-label={showRegistrationPassword ? 'Hide password' : 'Show password'}><EyeIcon visible={showRegistrationPassword} /></button></span></label>
            <label>Confirm Password *<span className="sport-teacher-password-control"><input type={showRegistrationConfirmation ? 'text' : 'password'} value={studentForm.confirm_password} onChange={(event) => setStudentForm({ ...studentForm, confirm_password: event.target.value })} minLength="8" required /><button type="button" onClick={() => setShowRegistrationConfirmation((visible) => !visible)} aria-label={showRegistrationConfirmation ? 'Hide password confirmation' : 'Show password confirmation'}><EyeIcon visible={showRegistrationConfirmation} /></button></span></label>
          </div>
          <fieldset className="sport-teacher-registration-talents">
            <legend>Assign talents <span className="sport-teacher-optional-label">Optional</span></legend>
            {renderTalentCheckboxes(studentForm.talents, (talents) => setStudentForm({ ...studentForm, talents }))}
            {!talents.length && <p className="sport-teacher-empty-message">No talents available.</p>}
          </fieldset>
          <div className="sport-teacher-registration-form-actions">
            <button type="button" onClick={() => closeModal('registerStudent')}>Cancel</button>
            <button type="submit">Register Student</button>
          </div>
        </form>
      </aside>
    </>
  ) : null;

  const clubRegistrationDrawer = modals.registerClubs ? (
    <>
      <button type="button" className="sport-teacher-drawer-backdrop sport-teacher-registration-backdrop" aria-label="Close club registration" onClick={() => closeModal('registerClubs')} />
      <aside className="sport-teacher-search-drawer sport-teacher-registration-drawer" style={{ '--drawer-width': `${drawerWidth}px` }} aria-label="Register clubs">
        <div className="sport-teacher-drawer-resize-edge" onPointerDown={(event) => { event.preventDefault(); setIsResizingDrawer(true); }} role="separator" aria-label="Resize slide-over panel" />
        <div className="sport-teacher-search-drawer-header">
          <h2>Register club</h2>
          <button type="button" onClick={() => closeModal('registerClubs')} aria-label="Close club registration">&times;</button>
        </div>
        <p className="sport-teacher-drawer-kicker">Choose clubs for {schoolName}</p>
        <p className="sport-teacher-club-limit">Maximum active clubs: <strong>{clubLimit}</strong>. Currently registered: <strong>{schoolClubs.filter((club) => club.is_active).length}</strong>.</p>
        <form onSubmit={handleRegisterClubs}>
          <div className="sport-teacher-club-checkbox-list">
            {availableCountryClubs.map((club) => {
              const selected = selectedClubIds.includes(String(club.id));
              const remaining = clubLimit - schoolClubs.filter((item) => item.is_active).length;
              return (
                <label key={club.id}>
                  <input type="checkbox" checked={selected} disabled={!selected && selectedClubIds.length >= remaining} onChange={(event) => setSelectedClubIds(event.target.checked ? [...selectedClubIds, String(club.id)] : selectedClubIds.filter((id) => id !== String(club.id)))} />
                  <span><strong>{club.name}</strong><small>{club.focus}</small></span>
                </label>
              );
            })}
            {!availableCountryClubs.length && <p className="sport-teacher-empty-message">No additional clubs are available for this school.</p>}
          </div>
          <div className="sport-teacher-registration-form-actions">
            <button type="button" onClick={() => closeModal('registerClubs')}>Cancel</button>
            <button type="submit" disabled={!selectedClubIds.length}>Register selected clubs</button>
          </div>
        </form>
      </aside>
    </>
  ) : null;

  const studentEditDrawer = selectedStudent ? (
    <>
      <button type="button" className="sport-teacher-drawer-backdrop sport-teacher-registration-backdrop" aria-label="Close student editor" onClick={closeStudentEditor} />
      <aside className="sport-teacher-search-drawer sport-teacher-registration-drawer" style={{ '--drawer-width': `${drawerWidth}px` }} aria-label="Edit student">
        <div className="sport-teacher-drawer-resize-edge" onPointerDown={(event) => { event.preventDefault(); setIsResizingDrawer(true); }} role="separator" aria-label="Resize slide-over panel" />
        <div className="sport-teacher-search-drawer-header">
          <h2>Edit Student</h2>
          <button type="button" onClick={closeStudentEditor} aria-label="Close student editor">&times;</button>
        </div>
        <p className="sport-teacher-drawer-kicker">{selectedStudent.student_id}</p>
        <form onSubmit={handleSaveStudent}>
          <div className="sport-teacher-registration-form-grid">
            <label>First Name *<input type="text" value={studentEditForm.first_name} onChange={(event) => setStudentEditForm({ ...studentEditForm, first_name: event.target.value })} required /></label>
            <label>Last Name *<input type="text" value={studentEditForm.last_name} onChange={(event) => setStudentEditForm({ ...studentEditForm, last_name: event.target.value })} required /></label>
            <label>Gender *<select value={studentEditForm.gender} onChange={(event) => setStudentEditForm({ ...studentEditForm, gender: event.target.value })} required><option value="M">Male</option><option value="F">Female</option></select></label>
            <label>Date of Birth<input type="date" value={studentEditForm.date_of_birth} onChange={(event) => setStudentEditForm({ ...studentEditForm, date_of_birth: event.target.value })} /></label>
            <label>Class / Level<select value={studentEditForm.education_level} onChange={(event) => setStudentEditForm({ ...studentEditForm, education_level: event.target.value })}><option value="">Not specified</option>{educationLevels.map((level) => <option key={level.id} value={level.id}>{level.name}</option>)}</select></label>
            <label>Assign club<select value={studentEditForm.club} onChange={(event) => setStudentEditForm({ ...studentEditForm, club: event.target.value })} disabled={!registrationClubs.length}><option value="">{registrationClubs.length ? 'No club' : 'No club registered for this school'}</option>{registrationClubs.map((club) => <option key={club.id} value={club.id}>{club.name}</option>)}</select></label>
          </div>
          <div className="sport-teacher-registration-form-grid sport-teacher-registration-password-row">
            <label>New Password<span className="sport-teacher-password-control"><input type={showEditPassword ? 'text' : 'password'} value={studentEditForm.new_password} onChange={(event) => setStudentEditForm({ ...studentEditForm, new_password: event.target.value })} minLength="8" /><button type="button" onClick={() => setShowEditPassword((visible) => !visible)} aria-label={showEditPassword ? 'Hide new password' : 'Show new password'}><EyeIcon visible={showEditPassword} /></button></span></label>
            <label>Confirm Password<span className="sport-teacher-password-control"><input type={showEditConfirmation ? 'text' : 'password'} value={studentEditForm.confirm_password} onChange={(event) => setStudentEditForm({ ...studentEditForm, confirm_password: event.target.value })} minLength="8" /><button type="button" onClick={() => setShowEditConfirmation((visible) => !visible)} aria-label={showEditConfirmation ? 'Hide password confirmation' : 'Show password confirmation'}><EyeIcon visible={showEditConfirmation} /></button></span></label>
          </div>
          <fieldset className="sport-teacher-registration-talents">
            <legend>Assign talents <span className="sport-teacher-optional-label">Optional</span></legend>
            {renderTalentCheckboxes(studentEditForm.talents, (talents) => setStudentEditForm({ ...studentEditForm, talents }))}
            {!talents.length && <p className="sport-teacher-empty-message">No talents available.</p>}
          </fieldset>
          <div className="sport-teacher-registration-form-actions">
            <button type="button" className="sport-teacher-danger-button" onClick={handleDeleteStudent}>Delete Student</button>
            <button type="submit">Save Changes</button>
          </div>
        </form>
      </aside>
    </>
  ) : null;

  const announcementDrawer = modals.createAnnouncement ? (
    <>
      <button type="button" className="sport-teacher-drawer-backdrop sport-teacher-registration-backdrop" aria-label="Close announcement form" onClick={() => closeModal('createAnnouncement')} />
      <aside className="sport-teacher-search-drawer sport-teacher-registration-drawer" style={{ '--drawer-width': `${drawerWidth}px` }} aria-label="Create school announcement">
        <div className="sport-teacher-drawer-resize-edge" onPointerDown={(event) => { event.preventDefault(); setIsResizingDrawer(true); }} role="separator" aria-label="Resize slide-over panel" />
        <div className="sport-teacher-search-drawer-header">
          <h2>{selectedAnnouncement ? 'Edit announcement' : 'New announcement'}</h2>
          <button type="button" onClick={() => closeModal('createAnnouncement')} aria-label="Close announcement form">&times;</button>
        </div>
        <form onSubmit={handleCreateAnnouncement}>
          <div className="sport-teacher-announcement-form">
            <label>Title *<input type="text" value={announcementForm.title} onChange={(event) => setAnnouncementForm({ ...announcementForm, title: event.target.value })} maxLength="200" required /></label>
            <label>Message *<textarea value={announcementForm.content} onChange={(event) => setAnnouncementForm({ ...announcementForm, content: event.target.value })} rows="7" required /></label>
            <div className="sport-teacher-announcement-form-actions">
              <label>Expires on (optional)<input type="date" value={announcementForm.expires_at} onChange={(event) => setAnnouncementForm({ ...announcementForm, expires_at: event.target.value })} /></label>
              {selectedAnnouncement && <button type="button" className="sport-teacher-announcement-delete" onClick={handleDeleteAnnouncement} disabled={announcementSubmitting}>Delete</button>}
              <button type="submit" disabled={announcementSubmitting}>{announcementSubmitting ? 'Publishing...' : 'Publish'}</button>
            </div>
          </div>
        </form>
      </aside>
    </>
  ) : null;

  const profileDrawer = modals.profile ? (
    <>
      <button type="button" className="sport-teacher-drawer-backdrop sport-teacher-registration-backdrop" aria-label="Close profile" onClick={() => closeModal('profile')} />
      <aside className="sport-teacher-search-drawer sport-teacher-registration-drawer" style={{ '--drawer-width': `${drawerWidth}px` }} aria-label="Profile details">
        <div className="sport-teacher-drawer-resize-edge" onPointerDown={(event) => { event.preventDefault(); setIsResizingDrawer(true); }} role="separator" aria-label="Resize slide-over panel" />
        <div className="sport-teacher-search-drawer-header">
          <h2>Profile</h2>
          <button type="button" onClick={() => closeModal('profile')} aria-label="Close profile">&times;</button>
        </div>
        <div className="sport-teacher-profile-details">
          <div><span>Username:</span><strong>{user?.username || '-'}</strong></div>
          <div><span>Firstname:</span><strong>{user?.first_name || '-'}</strong></div>
          <div><span>Lastname:</span><strong>{user?.last_name || '-'}</strong></div>
          <div><span>Email:</span><strong>{user?.email || '-'}</strong></div>
          <div><span>Role:</span><strong>{user?.role || '-'}</strong></div>
          <div><span>School:</span><strong>{schoolName}</strong></div>
        </div>
      </aside>
    </>
  ) : null;

  const changePasswordDrawer = modals.changePassword ? (
    <>
      <button type="button" className="sport-teacher-drawer-backdrop sport-teacher-registration-backdrop" aria-label="Close change password" onClick={() => closeModal('changePassword')} />
      <aside className="sport-teacher-search-drawer sport-teacher-registration-drawer" style={{ '--drawer-width': `${drawerWidth}px` }} aria-label="Change password">
        <div className="sport-teacher-drawer-resize-edge" onPointerDown={(event) => { event.preventDefault(); setIsResizingDrawer(true); }} role="separator" aria-label="Resize slide-over panel" />
        <div className="sport-teacher-search-drawer-header">
          <h2>Change password</h2>
          <button type="button" onClick={() => closeModal('changePassword')} aria-label="Close change password">&times;</button>
        </div>
        <form onSubmit={handleChangePassword} className="sport-teacher-profile-form">
          <label>New password<span className="sport-teacher-password-control"><input type={showProfilePassword ? 'text' : 'password'} value={profilePasswordForm.new_password} onChange={(event) => setProfilePasswordForm({ ...profilePasswordForm, new_password: event.target.value })} minLength="8" required /><button type="button" onClick={() => setShowProfilePassword((visible) => !visible)} aria-label={showProfilePassword ? 'Hide new password' : 'Show new password'}><EyeIcon visible={showProfilePassword} /></button></span></label>
          <label>Confirm password<span className="sport-teacher-password-control"><input type={showProfilePasswordConfirmation ? 'text' : 'password'} value={profilePasswordForm.confirm_password} onChange={(event) => setProfilePasswordForm({ ...profilePasswordForm, confirm_password: event.target.value })} minLength="8" required /><button type="button" onClick={() => setShowProfilePasswordConfirmation((visible) => !visible)} aria-label={showProfilePasswordConfirmation ? 'Hide password confirmation' : 'Show password confirmation'}><EyeIcon visible={showProfilePasswordConfirmation} /></button></span></label>
          <button type="submit" className="sport-teacher-profile-submit" disabled={profileSubmitting}>{profileSubmitting ? 'Saving...' : 'Save password'}</button>
        </form>
      </aside>
    </>
  ) : null;

  const layout = (
    <div className="sport-teacher-page">
      <header className="sport-teacher-app-bar">
        <div className="sport-teacher-brand">
          <img src={logo} alt="Talanta logo" />
          <span>Talanta Management System</span>
        </div>
        <div className="sport-teacher-app-actions">
          <div className="sport-teacher-profile">
          <button
            type="button"
            className="sport-teacher-profile-button"
            onClick={() => setProfileMenuOpen((open) => !open)}
            aria-label="Open profile menu"
            aria-expanded={profileMenuOpen}
            title={user?.username || 'Profile'}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="8" r="3.5" />
              <path d="M4.5 20c.8-3.5 3.5-5.5 7.5-5.5s6.7 2 7.5 5.5" />
            </svg>
          </button>
          {profileMenuOpen && (
            <div className="sport-teacher-profile-menu">
              <button type="button" onClick={openProfileDrawer}>Profile</button>
              <button type="button" onClick={openChangePasswordDrawer}>Change password</button>
              <button type="button" onClick={logout}>Logout</button>
            </div>
          )}
          </div>
          <button
            type="button"
            className="sport-teacher-navigation-toggle"
            onClick={() => setNavigationOpen((open) => !open)}
            aria-label="Open navigation menu"
            aria-expanded={navigationOpen}
            title="Open navigation menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>
      <aside className={`sport-teacher-navigation ${navigationOpen ? 'is-open' : ''}`}>
        <div className="sport-teacher-navigation-heading">{schoolName}</div>
        {menuItems.map((item) => (
          <button
            type="button"
            key={item.key}
            onClick={() => {
              setActiveTab(item.key);
              setNavigationOpen(false);
            }}
          >
            {item.label}
          </button>
        ))}
      </aside>
      <main className="sport-teacher-prototype-content">
        {renderContent()}
      </main>
      {selectedClub && (
        <>
          <button type="button" className="sport-teacher-drawer-backdrop" aria-label="Close club management" onClick={() => setSelectedClub(null)} />
          <aside className="sport-teacher-search-drawer" style={{ '--drawer-width': `${drawerWidth}px` }} aria-label={`${selectedClub.name} club details`}>
            <div className="sport-teacher-drawer-resize-edge" onPointerDown={(event) => { event.preventDefault(); setIsResizingDrawer(true); }} role="separator" aria-label="Resize slide-over panel" />
            <div className="sport-teacher-search-drawer-header">
              <h2>{selectedClub.name}</h2>
              <button type="button" onClick={() => { setSelectedClub(null); setDrawerWidth(380); }} aria-label="Close club management">&times;</button>
            </div>
            <p>{selectedClub.focus || 'This club is selected for the school.'}</p>
            <p className="sport-teacher-drawer-kicker">Students in this club</p>
            {selectedClubStudents.length ? (
              <table className="sport-teacher-drawer-table">
                <thead><tr><th>Name</th><th>Form</th></tr></thead>
                <tbody>
                  {selectedClubStudents.map((student) => (
                    <tr key={student.id}>
                      <td>{student.first_name} {student.last_name} ({student.gender || '—'})</td>
                      <td>{getStudentEducationLevel(student)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="sport-teacher-empty-message">No students assigned to this club.</p>}
          </aside>
        </>
      )}
      {selectedTalentCategory && !selectedTalent && (
        <>
          <button type="button" className="sport-teacher-drawer-backdrop" aria-label="Close talent category" onClick={() => setSelectedTalentCategory(null)} />
          <aside className="sport-teacher-search-drawer" style={{ '--drawer-width': `${drawerWidth}px` }} aria-label={`${selectedTalentCategory} talents`}>
            <div className="sport-teacher-drawer-resize-edge" onPointerDown={(event) => { event.preventDefault(); setIsResizingDrawer(true); }} role="separator" aria-label="Resize slide-over panel" />
            <div className="sport-teacher-search-drawer-header">
              <h2>{selectedTalentCategory.replace(/(^|_)\w/g, (letter) => letter.toUpperCase())}</h2>
              <button type="button" onClick={() => { setSelectedTalentCategory(null); setDrawerWidth(380); setTalentSearchQuery(''); }} aria-label="Close talent category">&times;</button>
            </div>
            <div className="sport-teacher-drawer-controls">
              <input type="text" placeholder="Search talents..." value={talentSearchQuery} onChange={(e) => setTalentSearchQuery(e.target.value)} className="sport-teacher-search-input" aria-label="Search talents" />
              <select value={talentSortBy} onChange={(e) => setTalentSortBy(e.target.value)} className="sport-teacher-sort-select" aria-label="Sort talents">
                <option value="name">Sort by name</option>
                <option value="students">Sort by students</option>
              </select>
            </div>
            <div className="sport-teacher-drawer-list">
              {talents
                .filter((talent) => talent.category_name === selectedTalentCategory && talent.name.toLowerCase().includes(talentSearchQuery.toLowerCase()))
                .sort((a, b) => {
                  if (talentSortBy === 'students') {
                    const aCount = studentTalents.filter((st) => st.talent === a.id).length;
                    const bCount = studentTalents.filter((st) => st.talent === b.id).length;
                    return bCount - aCount;
                  }
                  return a.name.localeCompare(b.name);
                })
                .map((talent) => (
                <button type="button" key={talent.id} onClick={() => setSelectedTalent(talent)} className="sport-teacher-drawer-talent-item">
                  <strong>{talent.name}:</strong>{' '}
                  <span>{talent.description || 'Talent record'} ({studentTalents.filter((entry) => Number(entry.talent) === Number(talent.id)).length})</span>
                </button>
              ))}
            </div>
          </aside>
        </>
      )}
      {selectedTalent && (
        <>
          <button type="button" className="sport-teacher-drawer-backdrop" aria-label="Close talent details" onClick={() => setSelectedTalent(null)} />
          <aside className="sport-teacher-search-drawer" style={{ '--drawer-width': `${drawerWidth}px` }} aria-label={`${selectedTalent.name} students`}>
            <div className="sport-teacher-drawer-resize-edge" onPointerDown={(event) => { event.preventDefault(); setIsResizingDrawer(true); }} role="separator" aria-label="Resize slide-over panel" />
            <div className="sport-teacher-search-drawer-header">
              <h2>{selectedTalent.name}</h2>
              <button type="button" onClick={() => setSelectedTalent(null)} aria-label="Close talent details">&times;</button>
            </div>
            <p className="sport-teacher-drawer-kicker">Students with this talent</p>
            <div className="sport-teacher-drawer-controls">
              <input type="text" placeholder="Search students..." value={talentSearchQuery} onChange={(event) => setTalentSearchQuery(event.target.value)} className="sport-teacher-search-input" aria-label="Search students" />
              <select value={talentSortBy} onChange={(event) => setTalentSortBy(event.target.value)} className="sport-teacher-sort-select" aria-label="Sort students">
                <option value="name">Sort by name</option>
                <option value="class">Sort by class</option>
              </select>
            </div>
            <div className="sport-teacher-drawer-list">
              {selectedTalentStudents.length > 0 && (
                <table className="sport-teacher-drawer-table">
                  <thead>
                    <tr><th>Name</th><th>Form</th><th>Other talents</th></tr>
                  </thead>
                  <tbody>
                    {selectedTalentStudents.map((student) => {
                      const otherTalents = studentTalents
                        .filter((entry) => Number(entry.student) === Number(student.id) && Number(entry.talent) !== Number(selectedTalent.id))
                        .map((entry) => entry.talent_name || 'Talent')
                        .join(', ');
                      return (
                        <tr key={student.id}>
                          <td>{student.first_name} {student.last_name} ({student.gender || '—'})</td>
                          <td>{getStudentEducationLevel(student)}</td>
                          <td>{otherTalents || 'None'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              {selectedTalentStudents.length === 0 && (
                <p className="sport-teacher-empty-message">No student has this talent in your school.</p>
              )}
            </div>
          </aside>
        </>
      )}
      {registrationDrawer}
      {clubRegistrationDrawer}
      {studentEditDrawer}
      {announcementDrawer}
      {profileDrawer}
      {changePasswordDrawer}
    </div>
  );

  // CSS for spinner animation
  const spinnerStyle = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  return layout;
  if (false) return (
    <div className="sport-teacher-page">
      <style>{spinnerStyle}</style>

      <header className="sport-teacher-app-bar">
        <div className="sport-teacher-brand">
          <img src={logo} alt="Talanta logo" />
          <span>Talanta Management System</span>
        </div>
        <div className="sport-teacher-profile">
          <button
            type="button"
            className="sport-teacher-profile-button"
            onClick={() => setProfileMenuOpen((open) => !open)}
            aria-label="Open profile menu"
            aria-expanded={profileMenuOpen}
            title={user?.username || 'Profile'}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="8" r="3.5" />
              <path d="M4.5 20c.8-3.5 3.5-5.5 7.5-5.5s6.7 2 7.5 5.5" />
            </svg>
          </button>
          {profileMenuOpen && (
            <div className="sport-teacher-profile-menu">
              <button type="button" onClick={openProfileDrawer}>Profile</button>
              <button type="button" onClick={openChangePasswordDrawer}>Change password</button>
              <button type="button" onClick={logout}>Logout</button>
            </div>
          )}
        </div>
      </header>

      <div className="sport-teacher-layout">

      {/* ====== SIDEBAR ====== */}
      <div className="sport-teacher-sidebar" style={{
        width: '240px',
        background: '#1a1a2e',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
        overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#f6c90e' }}>Kagoye</div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>Talanta Management System</div>
        </div>

        {/* User Info */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '14px', fontWeight: '500' }}>{user?.username || 'User'}</div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '10px 20px',
                border: 'none',
                background: activeTab === item.key ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: activeTab === item.key ? 'white' : '#9ca3af',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                borderLeft: activeTab === item.key ? '3px solid #f6c90e' : '3px solid transparent',
              }}
              onMouseEnter={(e) => { if (activeTab !== item.key) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={(e) => { if (activeTab !== item.key) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ marginRight: '12px', fontSize: '16px' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={logout}
            style={{
              width: '100%',
              padding: '10px',
              border: 'none',
              borderRadius: '6px',
              background: 'rgba(220, 38, 38, 0.2)',
              color: '#fca5a5',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(220, 38, 38, 0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(220, 38, 38, 0.2)'}
          >
            Logout
          </button>
        </div>
      </div>

      {/* ====== MAIN CONTENT ====== */}
      <div className="sport-teacher-main" style={{ flex: 1, padding: '24px', overflowX: 'hidden' }}>
        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">
            Sport Teacher Dashboard
          </h1>
          <p className="page-subtitle">
            {schoolName} • {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>

        {/* Error / Success */}
        {error && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', borderLeft: '4px solid #dc2626', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#b91c1c', fontSize: '18px', cursor: 'pointer' }}>✕</button>
          </div>
        )}
        {success && (
          <div style={{ background: '#dcfce7', color: '#15803d', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', borderLeft: '4px solid #16a34a' }}>
            ✓ {success}
          </div>
        )}

        {/* Content */}
        {renderContent()}
      </div>
      </div>

      {/* ====== MODALS ====== */}
      {/* Register Student Modal */}
      {modals.registerStudent && (
        <>
          <button type="button" className="sport-teacher-drawer-backdrop sport-teacher-registration-backdrop" aria-label="Close student registration" onClick={() => closeModal('registerStudent')} />
          <aside className="sport-teacher-search-drawer sport-teacher-registration-drawer" style={{ '--drawer-width': `${drawerWidth}px` }} aria-label="Register student">
            <div className="sport-teacher-drawer-resize-edge" onPointerDown={(event) => { event.preventDefault(); setIsResizingDrawer(true); }} role="separator" aria-label="Resize slide-over panel" />
            <div className="sport-teacher-search-drawer-header">
              <h2>Register Student</h2>
              <button type="button" onClick={() => closeModal('registerStudent')} aria-label="Close student registration">&times;</button>
            </div>
            <form onSubmit={handleRegisterStudent}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>First Name *</label>
                  <input type="text" name="first_name" value={studentForm.first_name} onChange={(e) => setStudentForm({ ...studentForm, first_name: e.target.value })} required style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Last Name *</label>
                  <input type="text" name="last_name" value={studentForm.last_name} onChange={(e) => setStudentForm({ ...studentForm, last_name: e.target.value })} required style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Gender *</label>
                  <select name="gender" value={studentForm.gender} onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value })} required style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Date of Birth</label>
                  <input type="date" name="date_of_birth" value={studentForm.date_of_birth} onChange={(e) => setStudentForm({ ...studentForm, date_of_birth: e.target.value })} style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Class / Level</label>
                  <select value={studentForm.education_level} onChange={(e) => setStudentForm({ ...studentForm, education_level: e.target.value })} style={{ minHeight: '42px', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '7px', fontSize: '14px', boxSizing: 'border-box' }}><option value="">Not specified</option>{educationLevels.map((level) => <option key={level.id} value={level.id}>{level.name}</option>)}</select>
                </div>
              </div>
              <div className="sport-teacher-registration-form-grid sport-teacher-registration-password-club-row">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Password *</label>
                  <input type="password" name="password" value={studentForm.password} onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })} required minLength="8" placeholder="Min 8 characters" style={{ padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '7px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Assign school club <span className="sport-teacher-optional-label">Optional</span></label>
                  <select value={studentForm.club} onChange={(e) => setStudentForm({ ...studentForm, club: e.target.value })} disabled={!registrationClubs.length} style={{ minHeight: '42px', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '7px', fontSize: '14px', boxSizing: 'border-box' }}><option value="">{registrationClubs.length ? 'No club' : 'No club registered for this school'}</option>{registrationClubs.map((club) => <option key={club.id} value={club.id}>{club.name}</option>)}</select>
                </div>
              </div>
              <fieldset className="sport-teacher-registration-talents">
                <legend>Assign talents <span className="sport-teacher-optional-label">Optional</span></legend>
                {renderTalentCheckboxes(studentForm.talents, (talents) => setStudentForm({ ...studentForm, talents }))}
                {!talents.length && <p className="sport-teacher-empty-message">No talents available.</p>}
              </fieldset>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                <button type="button" onClick={() => closeModal('registerStudent')} style={{ padding: '8px 20px', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white', color: '#6b7280', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 20px', border: 'none', borderRadius: '6px', background: '#0E1DB6', color: 'white', cursor: 'pointer' }}>Register Student</button>
              </div>
            </form>
          </aside>
        </>
      )}

      {/* Assign Talent Modal */}
      {modals.assignTalent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '28px', maxWidth: '480px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: 0 }}>Assign Talent</h2>
              <button onClick={() => closeModal('assignTalent')} style={{ background: 'none', border: 'none', fontSize: '24px', color: '#6b7280', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleAssignTalent}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Student *</label>
                  <select value={talentForm.student} onChange={(e) => setTalentForm({ ...talentForm, student: e.target.value })} required style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}>
                    <option value="">Select student</option>
                    {students.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Talent *</label>
                  <select value={talentForm.talent} onChange={(e) => setTalentForm({ ...talentForm, talent: e.target.value })} required style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}>
                    <option value="">Select talent</option>
                    {talents.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Proficiency Level</label>
                  <select value={talentForm.proficiency_level} onChange={(e) => setTalentForm({ ...talentForm, proficiency_level: Number(e.target.value) })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}>
                    <option value="1">Beginner</option>
                    <option value="2">Intermediate</option>
                    <option value="3">Advanced</option>
                    <option value="4">Expert</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Notes</label>
                  <input type="text" value={talentForm.notes} onChange={(e) => setTalentForm({ ...talentForm, notes: e.target.value })} placeholder="Optional notes" style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                <button type="button" onClick={() => closeModal('assignTalent')} style={{ padding: '8px 20px', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white', color: '#6b7280', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 20px', border: 'none', borderRadius: '6px', background: '#0E1DB6', color: 'white', cursor: 'pointer' }}>Assign Talent</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Club Modal */}
      {modals.createClub && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '28px', maxWidth: '480px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: 0 }}>Create Club</h2>
              <button onClick={() => closeModal('createClub')} style={{ background: 'none', border: 'none', fontSize: '24px', color: '#6b7280', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleCreateClub}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Club Name *</label>
                  <input type="text" value={clubForm.name} onChange={(e) => setClubForm({ ...clubForm, name: e.target.value })} required placeholder="Enter club name" style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Focus</label>
                  <input type="text" value={clubForm.focus} onChange={(e) => setClubForm({ ...clubForm, focus: e.target.value })} placeholder="e.g., Music, Sports" style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Description</label>
                  <textarea value={clubForm.description} onChange={(e) => setClubForm({ ...clubForm, description: e.target.value })} rows="3" placeholder="Optional description" style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                <button type="button" onClick={() => closeModal('createClub')} style={{ padding: '8px 20px', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white', color: '#6b7280', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 20px', border: 'none', borderRadius: '6px', background: '#0E1DB6', color: 'white', cursor: 'pointer' }}>Create Club</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Result Modal */}
      {modals.recordResult && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '28px', maxWidth: '480px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: 0 }}>Record Result</h2>
              <button onClick={() => closeModal('recordResult')} style={{ background: 'none', border: 'none', fontSize: '24px', color: '#6b7280', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleRecordResult}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Competition *</label>
                  <select value={resultForm.competition} onChange={(e) => setResultForm({ ...resultForm, competition: e.target.value })} required style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}>
                    <option value="">Select competition</option>
                    {competitions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Student *</label>
                  <select value={resultForm.student} onChange={(e) => setResultForm({ ...resultForm, student: e.target.value })} required style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}>
                    <option value="">Select student</option>
                    {students.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Score (0-100)</label>
                  <input type="number" min="0" max="100" value={resultForm.score} onChange={(e) => setResultForm({ ...resultForm, score: e.target.value })} placeholder="e.g., 85" style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Status</label>
                  <select value={resultForm.status} onChange={(e) => setResultForm({ ...resultForm, status: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}>
                    <option value="registered">Registered</option>
                    <option value="finished">Finished</option>
                    <option value="disqualified">Disqualified</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                <button type="button" onClick={() => closeModal('recordResult')} style={{ padding: '8px 20px', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white', color: '#6b7280', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 20px', border: 'none', borderRadius: '6px', background: '#0E1DB6', color: 'white', cursor: 'pointer' }}>Save Result</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Excel Modal */}
      {modals.uploadExcel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '28px', maxWidth: '520px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: 0 }}>Upload Excel Results</h2>
              <button onClick={() => closeModal('uploadExcel')} style={{ background: 'none', border: 'none', fontSize: '24px', color: '#6b7280', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleUploadExcel}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Select Excel File</label>
                <input type="file" accept=".xlsx,.xls" onChange={(e) => setUploadFile(e.target.files[0])} required style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }} />
              </div>
              <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px', color: '#6b7280' }}>
                <strong>Required columns:</strong><br />
                student_id, competition_id, score, status
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                <button type="button" onClick={() => closeModal('uploadExcel')} style={{ padding: '8px 20px', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white', color: '#6b7280', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={uploading} style={{ padding: '8px 20px', border: 'none', borderRadius: '6px', background: '#0E1DB6', color: 'white', cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1 }}>
                  {uploading ? 'Uploading...' : 'Upload Results'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Student Club Modal */}
      {modals.assignStudentClub && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '28px', maxWidth: '480px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: 0 }}>Assign Club</h2>
              <button onClick={() => closeModal('assignStudentClub')} style={{ background: 'none', border: 'none', fontSize: '24px', color: '#6b7280', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleAssignStudentClub}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Student *</label>
                  <select
                    value={clubMembershipForm.student}
                    onChange={(e) => setClubMembershipForm({ ...clubMembershipForm, student: e.target.value, club: '' })}
                    required
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}
                  >
                    <option value="">Select student</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>{student.first_name} {student.last_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Club *</label>
                  <select
                    value={clubMembershipForm.club}
                    onChange={(e) => setClubMembershipForm({ ...clubMembershipForm, club: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}
                  >
                    <option value="">Select club</option>
                    {clubs
                      .filter((club) => {
                        if (!clubMembershipForm.student) return true;
                        const selectedStudent = students.find((student) => student.id === Number(clubMembershipForm.student));
                        const studentSchoolId = selectedStudent?.school ?? selectedStudent?.school_id;
                        const clubSchoolId = club.school ?? club.school_id;
                        if (studentSchoolId == null || clubSchoolId == null) return true;
                        return Number(studentSchoolId) === Number(clubSchoolId);
                      })
                      .map((club) => (
                        <option key={club.id} value={club.id}>{club.name}</option>
                      ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                <button type="button" onClick={() => closeModal('assignStudentClub')} style={{ padding: '8px 20px', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white', color: '#6b7280', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 20px', border: 'none', borderRadius: '6px', background: '#0E1DB6', color: 'white', cursor: 'pointer' }}>Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SportTeacherPage;