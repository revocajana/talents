import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as apiService from '../services/apiService';
import logo from '../assets/Logo1.png';
import './SportTeacherPage.css';
import '../styles/talentadmin.css';

export default function TalentAdminPage() {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showAddTalentModal, setShowAddTalentModal] = useState(false);
  const [showTalentListModal, setShowTalentListModal] = useState(false);
  const [showCompetitionListModal, setShowCompetitionListModal] = useState(false);
  const [showUserListModal, setShowUserListModal] = useState(false);
  const [showUserEditModal, setShowUserEditModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userForm, setUserForm] = useState({ username: '', password: '', first_name: '', last_name: '', email: '', role: '', country: null, zone: null, region: null, district: null, ward: null, school: null, student: null });
  const [studentForm, setStudentForm] = useState({ gender: '', date_of_birth: '', school_id: '' });
  const [selectedUserRole, setSelectedUserRole] = useState(null);
  const [showDemographicModal, setShowDemographicModal] = useState(false);
  const [showDemographicForm, setShowDemographicForm] = useState(false);
  const [demographicType, setDemographicType] = useState('zones');
  const [editingDemographicId, setEditingDemographicId] = useState(null);
  const [demographicForm, setDemographicForm] = useState({});
  const [demographicSearch, setDemographicSearch] = useState('');
  const [editingTalentId, setEditingTalentId] = useState(null);
  const [clubsData, setClubsData] = useState([]);
  const [clubTeachersData, setClubTeachersData] = useState([]);
  const [clubMembershipsData, setClubMembershipsData] = useState([]);
  const [selectedClubId, setSelectedClubId] = useState('');
  const [clubForm, setClubForm] = useState({ name: '', focus: '', description: '', school: '' });
  const [clubTeacherForm, setClubTeacherForm] = useState({ teacher: '' });
  const [editingClubId, setEditingClubId] = useState(null);
  const [clubsPage, setClubsPage] = useState(0);
  const [clubSearch, setClubSearch] = useState('');
  const [clubFilters, setClubFilters] = useState({
    country: '',
    zone: '',
    region: '',
    district: '',
    ward: '',
    school: '',
  });
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
  });

  const [talentsData, setTalentsData] = useState([]);
  const [competitionsData, setCompetitionsData] = useState([]);
  const [studentsData, setStudentsData] = useState([]);
  const [usersData, setUsersData] = useState([]);
  const [participationsData, setParticipationsData] = useState([]);
  const [resultsData, setResultsData] = useState([]);
  const [announcementsData, setAnnouncementsData] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [reportStats, setReportStats] = useState({
    region_managers: 0,
    district_managers: 0,
    ward_managers: 0,
    head_teachers: 0,
    sport_teachers: 0,
    students: 0,
    countries: 0,
    zones: 0,
    regions: 0,
    districts: 0,
    wards: 0,
    schools: 0,
  });
  const [demographicData, setDemographicData] = useState({
    countries: [],
    zones: [],
    regions: [],
    districts: [],
    wards: [],
    schools: [],
  });

  const displayedTalents = talentsData.slice(0, 3);
  const displayedCompetitions = competitionsData.slice(0, 3);
  const displayedUsers = usersData.slice(0, 3);
  const usersForModal = selectedUserRole
    ? usersData.filter((user) => user.role === selectedUserRole)
    : usersData;

  const adminNavigation = [
    { key: 'overview', label: 'Overview' },
    { key: 'users', label: 'Users & Staff' },
    { key: 'schools', label: 'Schools & Locations' },
    { key: 'clubs', label: 'Clubs' },
    { key: 'talents', label: 'Talents' },
    { key: 'competitions', label: 'Competitions' },
    { key: 'results', label: 'Results' },
    { key: 'announcements', label: 'Announcements' },
  ];
  const activeNavigationLabel = adminNavigation.find((item) => item.key === activeTab)?.label || 'Overview';

  const getNameById = (collection, id) => {
    if (!id || !Array.isArray(collection)) return '';
    const item = collection.find((entry) => entry.id === id);
    return item?.name || item?.registry_number || '';
  };

  const getSchoolLocationChain = (schoolId) => {
    const school = demographicData.schools.find((entry) => entry.id === schoolId) || null;
    if (!school) return null;

    const ward = demographicData.wards.find((entry) => entry.id === school.ward) || null;
    const district = demographicData.districts.find((entry) => entry.id === (ward?.district ?? school.district)) || null;
    const region = demographicData.regions.find((entry) => entry.id === (district?.region ?? school.region)) || null;
    const zone = demographicData.zones.find((entry) => entry.id === (region?.zone ?? school.zone)) || null;

    return { school, ward, district, region, zone };
  };

  const getUserLocationLabel = (user) => {
    const school = demographicData.schools.find((entry) => entry.id === user.school) || null;
    const schoolLocation = school ? getSchoolLocationChain(school.id) : null;
    const ward = schoolLocation?.ward || demographicData.wards.find((entry) => entry.id === user.ward) || null;
    const district = schoolLocation?.district || demographicData.districts.find((entry) => entry.id === user.district) || null;
    const region = schoolLocation?.region || demographicData.regions.find((entry) => entry.id === user.region) || null;
    const zone = schoolLocation?.zone || demographicData.zones.find((entry) => entry.id === user.zone) || null;

    const schoolName = school?.name || 'School not assigned';
    const wardName = ward?.name || 'Ward not assigned';
    const districtName = district?.name || 'District not assigned';
    const regionName = region?.name || 'Region not assigned';
    const zoneName = zone?.name || 'Zone not assigned';

    switch (user.role) {
      case 'region_manager':
        return regionName;
      case 'district_manager':
        return districtName && regionName ? `${districtName} • ${regionName}` : districtName || regionName;
      case 'ward_manager':
        return wardName && districtName && regionName ? `${wardName} • ${districtName} • ${regionName}` : wardName || districtName || regionName;
      case 'head_teacher':
      case 'sport_teacher':
        return schoolName && wardName && districtName && regionName && zoneName ? `${schoolName} • ${wardName} • ${districtName} • ${regionName} • ${zoneName}` : schoolName || wardName || districtName || regionName || zoneName;
      case 'student':
        return schoolName;
      default:
        return user.email || 'No location';
    }
  };

  const renderUserNameCell = (user) => {
    if (user.role === 'student') {
      const schoolLocation = user.school ? getSchoolLocationChain(user.school) : null;
      const schoolName = schoolLocation?.school?.name || null;

      return (
        <div style={{ display: 'grid', gap: '0.2rem' }}>
          <span style={{ fontWeight: 600 }}>{user.first_name} {user.last_name}</span>
          {schoolName ? (
            <small style={{ color: '#6b7280', fontSize: '0.76rem' }}>{schoolName}</small>
          ) : null}
        </div>
      );
    }

    return <span>{user.first_name} {user.last_name}</span>;
  };

  const demographicConfigs = {
    countries: { label: 'Countries', singular: 'Country', collection: 'countries' },
    zones: { label: 'Zones', singular: 'Zone', collection: 'zones' },
    regions: { label: 'Regions', singular: 'Region', collection: 'regions' },
    districts: { label: 'Districts', singular: 'District', collection: 'districts' },
    wards: { label: 'Wards', singular: 'Ward', collection: 'wards' },
    schools: { label: 'Schools', singular: 'School', collection: 'schools' },
  };

  const filteredDemographicItems = demographicData[demographicType].filter((item) => {
    const searchValue = demographicSearch.trim().toLowerCase();
    if (!searchValue) return true;
    return [item.name, item.code, item.registry_number]
      .filter(Boolean)
      .some((value) => value.toString().toLowerCase().includes(searchValue));
  });

  // Fetch all dashboard data on mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [talentsRes, talentCategoriesRes, competitionsRes, usersRes, userStatsRes, studentsRes, countriesRes, zonesRes, regionsRes, districtsRes, wardsRes, schoolsRes, participationsRes, resultsRes, announcementsRes] = await Promise.all([
          apiService.getTalents(),
          apiService.getTalentCategories({ is_active: true }),
          apiService.getCompetitions(),
          apiService.getUsers(),
          apiService.getUserStats(),
          apiService.getStudents(),
          apiService.getAllCountries(),
          apiService.getAllZones(),
          apiService.getAllRegions(),
          apiService.getAllDistricts(),
          apiService.getAllWards(),
          apiService.getAllSchools(),
          apiService.getParticipations(),
          apiService.getResults(),
          apiService.getAnnouncements({ is_active: true }),
        ]);
        const [clubsRes, clubTeachersRes, clubMembershipsRes] = await Promise.all([
          apiService.getClubs(),
          apiService.getClubTeachers(),
          apiService.getClubMemberships(),
        ]);

        setTalentsData(talentsRes.data.results || []);
        setTalentCategories(talentCategoriesRes.data.results || []);
        setCompetitionsData(competitionsRes.data.results || []);
        setStudentsData(studentsRes.data.results || []);
        setUsersData(usersRes.data.results || []);
        setParticipationsData(participationsRes.data.results || []);
        setResultsData(resultsRes.data.results || []);
        setAnnouncementsData(announcementsRes.data.results || []);
        setClubsData(clubsRes.data.results || []);
        setClubTeachersData(clubTeachersRes.data.results || []);
        setClubMembershipsData(clubMembershipsRes.data.results || []);
        setReportStats({
          ...userStatsRes.data,
          students: studentsRes.data.count ?? (studentsRes.data.results || []).length,
          countries: countriesRes.data.count ?? (countriesRes.data.results || []).length,
          zones: zonesRes.data.count ?? (zonesRes.data.results || []).length,
          regions: regionsRes.data.count ?? (regionsRes.data.results || []).length,
          districts: districtsRes.data.count ?? (districtsRes.data.results || []).length,
          wards: wardsRes.data.count ?? (wardsRes.data.results || []).length,
          schools: schoolsRes.data.count ?? (schoolsRes.data.results || []).length,
        });
        setDemographicData({
          countries: countriesRes.data.results || [],
          zones: zonesRes.data.results || [],
          regions: regionsRes.data.results || [],
          districts: districtsRes.data.results || [],
          wards: wardsRes.data.results || [],
          schools: schoolsRes.data.results || [],
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.response?.data?.detail || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openDemographicModal = (type, item = null) => {
    setDemographicType(type);
    setDemographicSearch('');
    setEditingDemographicId(item?.id || null);
    setDemographicForm(item ? { ...item } : type === 'countries'
      ? { name: '', code: '' }
      : type === 'schools'
        ? { registry_number: '', name: '', ownership_type: '', country: '', zone: '', region: '', district: '', ward: '', phone: '', email: '' }
        : type === 'zones'
        ? { name: '', country: '' }
        : type === 'regions'
          ? { name: '', zone: '' }
          : type === 'districts'
            ? { name: '', region: '' }
            : { name: '', district: '' });
    setShowDemographicModal(true);
    setShowDemographicForm(Boolean(item));
  };

  const openAddDemographicForm = (type = demographicType) => {
    openDemographicModal(type);
    setShowDemographicForm(true);
  };

  const openUserRoleModal = (role) => {
    setSelectedUserRole(role);
    setShowUserListModal(true);
  };

  const closeUserListModal = () => {
    setShowUserListModal(false);
    setSelectedUserRole(null);
  };

  const openUserEditModal = (user = null) => {
    const linkedStudent = studentsData.find((student) => student.id === user?.student);
    setEditingUserId(user?.id || null);
    setUserForm({
      username: user?.username || '',
      password: '',
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      role: user?.role || selectedUserRole || '',
      country: user?.country || null,
      zone: user?.zone || null,
      region: user?.region || null,
      district: user?.district || null,
      ward: user?.ward || null,
      school: user?.school || null,
      student: user?.student || null,
    });
    setStudentForm({
      gender: linkedStudent?.gender || '',
      date_of_birth: linkedStudent?.date_of_birth || '',
      school_id: linkedStudent?.school?.id || '',
    });
    setShowUserEditModal(true);
  };

  const handleUserFormChange = (e) => {
    const { name, value } = e.target;
    const nextValue = value === '' ? null : value;

    if (name === 'role') {
      setUserForm((current) => ({
        ...current,
        role: value,
        country: null,
        zone: null,
        region: null,
        district: null,
        ward: null,
        school: null,
      }));
      setStudentForm((current) => ({
        ...current,
        school_id: '',
      }));
      return;
    }

    setUserForm((current) => {
      const updated = { ...current, [name]: nextValue };

      if (name === 'country') {
        updated.zone = null;
        updated.region = null;
        updated.district = null;
        updated.ward = null;
        updated.school = null;
      }

      if (name === 'zone') {
        updated.region = null;
        updated.district = null;
        updated.ward = null;
        updated.school = null;
      }

      if (name === 'region') {
        updated.district = null;
        updated.ward = null;
        updated.school = null;
      }

      if (name === 'district') {
        updated.ward = null;
        updated.school = null;
      }

      if (name === 'ward') {
        updated.school = null;
      }

      return updated;
    });

    if (name === 'school') {
      setStudentForm((current) => ({
        ...current,
        school_id: nextValue ?? '',
      }));
    }
  };

  const handleStudentFormChange = (e) => {
    setStudentForm({ ...studentForm, [e.target.name]: e.target.value });
  };

  const getUserLocationFields = () => {
    const role = userForm.role;

    if (!role) return [];

    const roleFields = {
      talent_admin: [],
      region_manager: ['region'],
      zone_manager: ['zone'],
      district_manager: ['district'],
      ward_manager: ['ward'],
      head_teacher: ['school'],
      sport_teacher: ['school'],
      student: ['school'],
      parent: [],
    };

    return roleFields[role] || [];
  };

  const handleSaveUser = async () => {
    if (!editingUserId && (!userForm.username || !userForm.password || !userForm.role)) {
      alert('Username, password, and role are required.');
      return;
    }
    if (userForm.role === 'student' && (!studentForm.gender || !studentForm.school_id)) {
      alert('Student gender and school are required.');
      return;
    }

    setSubmitting(true);
    try {
      let studentId = userForm.student;
      if (userForm.role === 'student') {
        const studentPayload = {
          ...studentForm,
          school_id: userForm.school ?? studentForm.school_id,
          first_name: userForm.first_name,
          last_name: userForm.last_name,
        };
        const studentResponse = studentId
          ? await apiService.updateStudent(studentId, studentPayload)
          : await apiService.createStudent(studentPayload);
        studentId = studentResponse.data.id;
      }
      const userPayload = { ...userForm, student: studentId };
      const response = editingUserId
        ? await apiService.updateUser(editingUserId, userPayload)
        : await apiService.createUser(userPayload);
      setUsersData((currentUsers) => editingUserId
        ? currentUsers.map((user) => user.id === editingUserId ? response.data : user)
        : [...currentUsers, response.data]);
      setShowUserEditModal(false);
    } catch (err) {
      console.error('Error updating user:', err);
      const backendError = err.response?.data;
      const errorMessage = backendError
        ? (backendError.detail || Object.values(backendError).flat().join(' ') || JSON.stringify(backendError))
        : err.message;
      alert(`Failed to save user: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user?')) return;

    try {
      await apiService.deleteUser(userId);
      setUsersData((currentUsers) => currentUsers.filter((user) => user.id !== userId));
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user.');
    }
  };

  const closeDemographicModal = () => {
    setShowDemographicModal(false);
    setShowDemographicForm(false);
    setEditingDemographicId(null);
    setDemographicForm({});
  };

  const handleDemographicChange = (e) => {
    setDemographicForm({ ...demographicForm, [e.target.name]: e.target.value });
  };

  const handleSaveDemographic = async () => {
    const config = demographicConfigs[demographicType];
    const collection = config.collection;
    const payload = { ...demographicForm };
    delete payload.id;
    delete payload.created_at;

    if (!payload.name || (demographicType === 'countries' && !payload.code) || (demographicType === 'schools' && (!payload.registry_number || !payload.country || !payload.zone || !payload.region || !payload.district || !payload.ward))) {
      alert(`Please complete the required ${config.singular.toLowerCase()} fields.`);
      return;
    }

    setSubmitting(true);
    try {
      const createMethod = apiService[`create${config.singular}`];
      const updateMethod = apiService[`update${config.singular}`];
      const response = editingDemographicId
        ? await updateMethod(editingDemographicId, payload)
        : await createMethod(payload);
      setDemographicData((current) => ({
        ...current,
        [collection]: editingDemographicId
          ? current[collection].map((item) => item.id === editingDemographicId ? response.data : item)
          : [...current[collection], response.data],
      }));
      closeDemographicModal();
    } catch (err) {
      console.error(`Error saving ${config.singular.toLowerCase()}:`, err);
      alert(`Failed to save ${config.singular.toLowerCase()}.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDemographic = async (type, id) => {
    const config = demographicConfigs[type];
    const item = demographicData[config.collection].find((entry) => entry.id === id);
    if (!window.confirm(`Delete ${item?.name || config.singular.toLowerCase()}?`)) return;

    try {
      await apiService[`delete${config.singular}`](id);
      setDemographicData((current) => ({
        ...current,
        [config.collection]: current[config.collection].filter((entry) => entry.id !== id),
      }));
    } catch (err) {
      console.error(`Error deleting ${config.singular.toLowerCase()}:`, err);
      alert(`Failed to delete ${config.singular.toLowerCase()}.`);
    }
  };

  const getParentName = (type, item) => {
    const parentMap = { zones: ['countries', 'country'], regions: ['zones', 'zone'], districts: ['regions', 'region'], wards: ['districts', 'district'] };
    const parent = parentMap[type];
    if (!parent) return item.code || item.registry_number || '';
    return demographicData[parent[0]].find((entry) => entry.id === item[parent[1]])?.name || 'N/A';
  };

  const demographicFields = {
    countries: [
      { name: 'name', label: 'Country name', type: 'text' },
      { name: 'code', label: 'Country code', type: 'text' },
    ],
    zones: [
      { name: 'name', label: 'Zone name', type: 'text' },
      { name: 'country', label: 'Country', type: 'select', options: demographicData.countries },
    ],
    regions: [
      { name: 'name', label: 'Region name', type: 'text' },
      { name: 'zone', label: 'Zone', type: 'select', options: demographicData.zones },
    ],
    districts: [
      { name: 'name', label: 'District name', type: 'text' },
      { name: 'region', label: 'Region', type: 'select', options: demographicData.regions },
    ],
    wards: [
      { name: 'name', label: 'Ward name', type: 'text' },
      { name: 'district', label: 'District', type: 'select', options: demographicData.districts },
    ],
    schools: [
      { name: 'registry_number', label: 'Registry number', type: 'text' },
      { name: 'name', label: 'School name', type: 'text' },
      { name: 'ownership_type', label: 'Ownership type', type: 'select', options: [
        { id: 'private', name: 'Private' },
        { id: 'government', name: 'Government' },
      ] },
      { name: 'country', label: 'Country', type: 'select', options: demographicData.countries },
      { name: 'zone', label: 'Zone', type: 'select', options: demographicData.zones },
      { name: 'region', label: 'Region', type: 'select', options: demographicData.regions },
      { name: 'district', label: 'District', type: 'select', options: demographicData.districts },
      { name: 'ward', label: 'Ward', type: 'select', options: demographicData.wards },
      { name: 'phone', label: 'Phone', type: 'text' },
      { name: 'email', label: 'Email', type: 'email' },
    ],
  };

  const openAddTalentModal = () => {
    setEditingTalentId(null);
    setFormData({ name: '', category: '', description: '' });
    setShowAddTalentModal(true);
  };

  const openEditTalentModal = (talent) => {
    setEditingTalentId(talent.id);
    setFormData({
      name: talent.name || '',
      category: talent.category ? String(talent.category) : '',
      description: talent.description || '',
    });
    setShowAddTalentModal(true);
  };

  const closeTalentModal = () => {
    setShowAddTalentModal(false);
    setEditingTalentId(null);
    setFormData({ name: '', category: '', description: '' });
  };

  const handleAddTalent = async () => {
    if (!formData.name || !formData.category) {
      alert('Please fill in talent name and category');
      return;
    }

    const payload = {
      ...formData,
      name: formData.name.trim(),
      category: Number(formData.category),
    };

    setSubmitting(true);
    try {
      if (editingTalentId) {
        const response = await apiService.updateTalent(editingTalentId, payload);
        setTalentsData((currentTalents) =>
          currentTalents.map((talent) => (talent.id === editingTalentId ? response.data : talent))
        );
        alert('Talent updated successfully');
      } else {
        const response = await apiService.createTalent(payload);
        setTalentsData((currentTalents) => [...currentTalents, response.data]);
        alert('Talent added successfully');
      }

      closeTalentModal();
    } catch (err) {
      console.error('Error saving talent:', err);
      const backendError = err.response?.data;
      const errorMessage = backendError
        ? (backendError.detail || backendError.non_field_errors?.[0] || JSON.stringify(backendError))
        : err.message;
      alert('Failed to save talent: ' + errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTalent = async (talentId) => {
    const talentToDelete = talentsData.find((talent) => talent.id === talentId);
    const confirmed = window.confirm(
      `Are you sure you want to delete "${talentToDelete?.name || 'this talent'}"?`
    );

    if (!confirmed) return;

    try {
      await apiService.deleteTalent(talentId);
      setTalentsData((currentTalents) => currentTalents.filter((talent) => talent.id !== talentId));

      if (editingTalentId === talentId) {
        closeTalentModal();
      }

      if (showTalentListModal && talentsData.length <= 1) {
        setShowTalentListModal(false);
      }
    } catch (err) {
      console.error('Error deleting talent:', err);
      alert('Failed to delete talent.');
    }
  };

  const handleCreateClub = async (event) => {
    event.preventDefault();
    if (!clubForm.name.trim() || !clubForm.school) {
      alert('Club name and school are required.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiService.createClub({
        ...clubForm,
        name: clubForm.name.trim(),
      });
      setClubsData((current) => [...current, response.data]);
      setClubForm({ name: '', focus: '', description: '', school: '' });
      alert('Club created successfully.');
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || err.message;
      alert(`Failed to create club: ${detail}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClub = async (clubId) => {
    if (!window.confirm('Delete this club and its assignments?')) return;
    try {
      await apiService.deleteClub(clubId);
      setClubsData((current) => current.filter((club) => club.id !== clubId));
      setClubTeachersData((current) => current.filter((assignment) => assignment.club !== clubId));
      setClubMembershipsData((current) => current.filter((membership) => membership.club !== clubId));
      setClubsPage((currentPage) => Math.min(currentPage, Math.max(0, Math.ceil((clubsData.length - 1) / clubsPageSize) - 1)));
      if (selectedClubId === clubId) setSelectedClubId('');
    } catch (err) {
      alert(`Failed to delete club: ${err.response?.data?.detail || err.message}`);
    }
  };

  const openEditClub = (club) => {
    setEditingClubId(club.id);
    setClubForm({
      name: club.name || '',
      focus: club.focus || '',
      description: club.description || '',
      school: club.school || '',
      is_active: club.is_active !== false,
    });
  };

  const handleUpdateClub = async (event) => {
    event.preventDefault();
    if (!editingClubId || !clubForm.name.trim()) return;

    setSubmitting(true);
    try {
      const response = await apiService.updateClub(editingClubId, {
        name: clubForm.name.trim(),
        focus: clubForm.focus,
        description: clubForm.description,
        school: clubForm.school,
        is_active: clubForm.is_active,
      });
      setClubsData((current) => current.map((club) => club.id === editingClubId ? response.data : club));
      setEditingClubId(null);
    } catch (err) {
      alert(`Failed to update club: ${err.response?.data?.detail || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignClubTeacher = async (event) => {
    event.preventDefault();
    if (!selectedClubId || !clubTeacherForm.teacher) return;
    try {
      const response = await apiService.createClubTeacher({ club: selectedClubId, teacher: clubTeacherForm.teacher });
      setClubTeachersData((current) => [...current, response.data]);
      setClubTeacherForm({ teacher: '' });
    } catch (err) {
      alert(`Failed to assign teacher: ${err.response?.data?.detail || err.message}`);
    }
  };

  const selectedClub = clubsData.find((club) => String(club.id) === String(selectedClubId));
  const selectedClubTeachers = clubTeachersData.filter((assignment) => String(assignment.club) === String(selectedClubId));
  const selectedClubMembers = clubMembershipsData.filter((membership) => String(membership.club) === String(selectedClubId) && membership.is_active);
  const clubsPageSize = 4;
  const filterSchools = demographicData.schools.filter((school) => {
    const matchesCountry = !clubFilters.country || String(school.country) === String(clubFilters.country);
    const matchesZone = !clubFilters.zone || String(school.zone) === String(clubFilters.zone);
    const matchesRegion = !clubFilters.region || String(school.region) === String(clubFilters.region);
    const matchesDistrict = !clubFilters.district || String(school.district) === String(clubFilters.district);
    const matchesWard = !clubFilters.ward || String(school.ward) === String(clubFilters.ward);
    return matchesCountry && matchesZone && matchesRegion && matchesDistrict && matchesWard;
  });
  const filterSchoolIds = new Set(filterSchools.map((school) => school.id));
  const filterWards = demographicData.wards.filter((ward) => {
    const district = demographicData.districts.find((item) => item.id === ward.district);
    const region = demographicData.regions.find((item) => item.id === district?.region);
    const zone = demographicData.zones.find((item) => item.id === region?.zone);
    return (!clubFilters.country || String(zone?.country) === String(clubFilters.country))
      && (!clubFilters.zone || String(zone?.id) === String(clubFilters.zone))
      && (!clubFilters.region || String(region?.id) === String(clubFilters.region))
      && (!clubFilters.district || String(district?.id) === String(clubFilters.district));
  });
  const filterDistricts = demographicData.districts.filter((district) => {
    const region = demographicData.regions.find((item) => item.id === district.region);
    const zone = demographicData.zones.find((item) => item.id === region?.zone);
    return (!clubFilters.country || String(zone?.country) === String(clubFilters.country))
      && (!clubFilters.zone || String(zone?.id) === String(clubFilters.zone))
      && (!clubFilters.region || String(region?.id) === String(clubFilters.region));
  });
  const filterRegions = demographicData.regions.filter((region) => {
    const zone = demographicData.zones.find((item) => item.id === region.zone);
    return (!clubFilters.country || String(zone?.country) === String(clubFilters.country))
      && (!clubFilters.zone || String(zone?.id) === String(clubFilters.zone));
  });
  const filterZones = demographicData.zones.filter((zone) => !clubFilters.country || String(zone.country) === String(clubFilters.country));
  const filteredClubs = clubsData.filter((club) => {
    const school = demographicData.schools.find((item) => item.id === club.school);
    const searchValue = clubSearch.trim().toLowerCase();
    const matchesSearch = !searchValue || [club.name, club.focus, school?.name]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(searchValue));
    const matchesLocation = !clubFilters.school || String(club.school) === String(clubFilters.school);
    const hasLocationFilter = Object.values(clubFilters).some(Boolean);
    return matchesSearch && matchesLocation && (!hasLocationFilter || filterSchoolIds.has(club.school));
  });
  const clubsPageCount = Math.max(1, Math.ceil(filteredClubs.length / clubsPageSize));
  const displayedClubs = filteredClubs.slice(clubsPage * clubsPageSize, (clubsPage + 1) * clubsPageSize);

  return (
    <div className="sport-teacher-page talent-admin-page" data-active-tab={activeTab}>
      <header className="sport-teacher-app-bar">
        <div className="sport-teacher-brand">
          <img src={logo} alt="Talanta logo" />
          <span>Talanta Management System</span>
        </div>
        <div className="sport-teacher-app-actions">
          <button type="button" className="sport-teacher-navigation-toggle" onClick={() => setNavigationOpen((open) => !open)} aria-label="Open navigation menu" aria-expanded={navigationOpen} title="Open navigation menu">
            <span /><span /><span />
          </button>
        </div>
      </header>
      <aside className={`sport-teacher-navigation ${navigationOpen ? 'is-open' : ''}`}>
        <div className="sport-teacher-navigation-heading">Talent Administration</div>
        {adminNavigation.map((item) => (
          <button type="button" key={item.key} className={activeTab === item.key ? 'active' : ''} aria-current={activeTab === item.key ? 'page' : undefined} onClick={() => {
            setActiveTab(item.key);
            setNavigationOpen(false);
          }}>
            {item.label}
          </button>
        ))}
        <button type="button" className="sport-teacher-logout-button" onClick={logout}>Logout</button>
      </aside>
      <main className="sport-teacher-prototype-content talent-admin-content">
      {error && <div className="talent-admin-alert">{error}<button type="button" onClick={() => setError(null)} aria-label="Dismiss error">&times;</button></div>}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading dashboard...</div>
      ) : (
        <div className="talent-admin-inner">
        <div className="talent-admin-page-heading" id="overview">
          <div><p className="sport-teacher-eyebrow">Talent Administration</p><h1>{activeNavigationLabel}</h1><p>Manage the network and monitor activity across all locations.</p></div>
          <span className="sport-teacher-date">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        </div>
        <div className="cards-container">
          {/* Registered Talents Card */}
          <section className="admin-section compact-card" id="talents-list">
            <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <h2>Registered Talents ({talentsData.length})</h2>
              </div>
              <button
                type="button"
                onClick={openAddTalentModal}
                style={{
                  border: 'none',
                  background: '#111827',
                  color: '#fff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  fontSize: '1.4rem',
                  lineHeight: '1',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'none',
                }}
                aria-label="Add talent"
              >
                +
              </button>
            </div>
            <div className="report-card talent-summary">
              {displayedTalents.length > 0 ? (
                <ul className="report-list talent-summary-list">
                  {displayedTalents.map((talent) => (
                    <li key={talent.id}>
                      <div className="talent-summary-info">
                        <strong>{talent.name || 'N/A'}</strong>
                        <span>{talent.category_name || 'N/A'}</span>
                      </div>
                      <div className="simple-list-actions">
                        <button className="btn-action btn-edit" onClick={() => openEditTalentModal(talent)}>
                          Edit
                        </button>
                        <button
                          className="btn-action"
                          onClick={() => handleDeleteTalent(talent.id)}
                          style={{ background: '#fff', color: '#b45353' }}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="simple-list-empty">No talents found</div>
              )}
            </div>
            {talentsData.length > 3 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowTalentListModal(true)}
                  className="btn-action"
                  style={{ background: '#f3f4f6', color: '#111827', fontSize: '0.8rem' }}
                >
                  View more
                </button>
              </div>
            )}
          </section>

          <section className="admin-section" id="clubs">
            <div className="section-header">
              <h2>Club Management ({clubsData.length})</h2>
              <p>Clubs registered across schools.</p>
            </div>
            <div className="club-filter-bar">
              <select className="form-input" value={clubFilters.country} onChange={(event) => { setClubFilters({ country: event.target.value, zone: '', region: '', district: '', ward: '', school: '' }); setClubsPage(0); }} aria-label="Filter clubs by country">
                <option value="">Country</option>
                {demographicData.countries.map((country) => <option key={country.id} value={country.id}>{country.name}</option>)}
              </select>
              <select className="form-input" value={clubFilters.zone} onChange={(event) => { setClubFilters({ ...clubFilters, zone: event.target.value, region: '', district: '', ward: '', school: '' }); setClubsPage(0); }} aria-label="Filter clubs by zone">
                <option value="">Zone</option>
                {filterZones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}
              </select>
              <select className="form-input" value={clubFilters.region} onChange={(event) => { setClubFilters({ ...clubFilters, region: event.target.value, district: '', ward: '', school: '' }); setClubsPage(0); }} aria-label="Filter clubs by region">
                <option value="">Region</option>
                {filterRegions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}
              </select>
              <select className="form-input" value={clubFilters.district} onChange={(event) => { setClubFilters({ ...clubFilters, district: event.target.value, ward: '', school: '' }); setClubsPage(0); }} aria-label="Filter clubs by district">
                <option value="">District</option>
                {filterDistricts.map((district) => <option key={district.id} value={district.id}>{district.name}</option>)}
              </select>
              <select className="form-input" value={clubFilters.ward} onChange={(event) => { setClubFilters({ ...clubFilters, ward: event.target.value, school: '' }); setClubsPage(0); }} aria-label="Filter clubs by ward">
                <option value="">Ward</option>
                {filterWards.map((ward) => <option key={ward.id} value={ward.id}>{ward.name}</option>)}
              </select>
              <select className="form-input" value={clubFilters.school} onChange={(event) => { setClubFilters({ ...clubFilters, school: event.target.value }); setClubsPage(0); }} aria-label="Filter clubs by school">
                <option value="">School</option>
                {filterSchools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}
              </select>
              <input type="search" className="form-input" value={clubSearch} onChange={(event) => { setClubSearch(event.target.value); setClubsPage(0); }} placeholder="Search" aria-label="Search clubs" />
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>Club</th><th>School</th><th>Focus</th><th>Actions</th></tr></thead>
                <tbody>
                  {displayedClubs.map((club) => {
                    const school = demographicData.schools.find((item) => item.id === club.school);
                    const members = clubMembershipsData.filter((membership) => membership.club === club.id && membership.is_active).length;
                    return <tr key={club.id} className={!club.is_active ? 'club-row-inactive' : ''}><td>{club.name} ({members})</td><td>{school?.name || club.school_name || 'N/A'}</td><td>{club.focus || 'N/A'}</td><td><button type="button" className="btn-action btn-edit" onClick={() => openEditClub(club)}>Edit</button> <button type="button" className="btn-action" onClick={() => handleDeleteClub(club.id)}>Delete</button></td></tr>;
                  })}
                  {clubsData.length === 0 && <tr><td colSpan="4">No clubs found</td></tr>}
                </tbody>
              </table>
            </div>
            {clubsPageCount > 1 && (
              <div className="club-pagination" aria-label="Club pages">
                <button type="button" className="btn-action" onClick={() => setClubsPage((page) => Math.max(0, page - 1))} disabled={clubsPage === 0}>Previous</button>
                <span>Page {clubsPage + 1} of {clubsPageCount}</span>
                <button type="button" className="btn-action" onClick={() => setClubsPage((page) => Math.min(clubsPageCount - 1, page + 1))} disabled={clubsPage === clubsPageCount - 1}>Next</button>
              </div>
            )}
          </section>

          {/* Competitions Card */}
          <section className="admin-section compact-card" id="competitions">
            <div className="section-header">
              <h2>Competitions ({competitionsData.length})</h2>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Competition Name</th>
                    <th>Level</th>
                    <th>Start Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedCompetitions.length > 0 ? (
                    displayedCompetitions.map((comp) => (
                      <tr key={comp.id}>
                        <td>{comp.name || 'N/A'}</td>
                        <td><span className="badge">{comp.get_level_display || comp.level || 'N/A'}</span></td>
                        <td>{comp.start_date ? new Date(comp.start_date).toLocaleDateString() : 'N/A'}</td>
                        <td><button className="btn-action">View</button></td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4">No competitions found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {competitionsData.length > 3 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCompetitionListModal(true)}
                  className="btn-action"
                  style={{ background: '#f3f4f6', color: '#111827', fontSize: '0.8rem' }}
                >
                  View more
                </button>
              </div>
            )}
          </section>

          <section className="admin-section" id="schools-locations">
            <div className="section-header">
              <h2>Schools &amp; Locations</h2>
              <p>Manage the geographic structures used across the network.</p>
            </div>
            <div className="talent-admin-data-grid">
              {[
                ['Countries', reportStats.countries, 'countries'],
                ['Zones', reportStats.zones, 'zones'],
                ['Regions', reportStats.regions, 'regions'],
                ['Districts', reportStats.districts, 'districts'],
                ['Wards', reportStats.wards, 'wards'],
                ['Schools', reportStats.schools, 'schools'],
              ].map(([label, value, type]) => (
                <button type="button" key={type} onClick={() => openDemographicModal(type)}>
                  <span>{label}</span><strong>{value}</strong>
                </button>
              ))}
            </div>
          </section>

          <section className="admin-section" id="system-results">
            <div className="section-header"><h2>System Results</h2><p>Results and participation activity across all competition levels.</p></div>
            <div className="table-container"><table className="data-table"><thead><tr><th>Participation</th><th>Score</th><th>Grade</th><th>Approval</th></tr></thead><tbody>
              {resultsData.slice(0, 8).map((result) => <tr key={result.id}><td>{result.participation_details || `Participation ${result.participation}`}</td><td>{result.score ?? '—'}</td><td>{result.grade || '—'}</td><td>{result.approval_status || 'Pending'}</td></tr>)}
              {!resultsData.length && <tr><td colSpan="4">No results recorded.</td></tr>}
            </tbody></table></div>
          </section>

          <section className="admin-section" id="system-announcements">
            <div className="section-header"><h2>System Announcements</h2><p>Published notices across the talent network.</p></div>
            <div className="talent-admin-announcement-list">
              {announcementsData.slice(0, 6).map((announcement) => <article key={announcement.id}><div><h3>{announcement.title}</h3><p>{announcement.content || 'No details available.'}</p></div><span>{announcement.scope_display || announcement.scope || 'National'}</span></article>)}
              {!announcementsData.length && <p>No announcements published.</p>}
            </div>
          </section>

          {/* Users & Staff Card */}
          <section className="admin-section compact-card" id="users">
            <div className="section-header">
              <h2>Users &amp; Staff ({usersData.length})</h2>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Email</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedUsers.length > 0 ? (
                    displayedUsers.map((user) => (
                      <tr key={user.id}>
                        <td>{renderUserNameCell(user)}</td>
                        <td>{user.role || 'N/A'}</td>
                        <td>{user.email || 'N/A'}</td>
                        <td><button className="btn-action">Manage</button></td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4">No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {usersData.length > 3 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowUserListModal(true)}
                  className="btn-action"
                  style={{ background: '#f3f4f6', color: '#111827', fontSize: '0.8rem' }}
                >
                  View more
                </button>
              </div>
            )}
          </section>

          {/* Network Overview Card */}
          <section className="admin-section" id="reports">
            <div className="section-header">
              <h2>Network Overview</h2>
              <p>Operational snapshot of the entire talent system</p>
            </div>
            <div className="reports-grid">
              <div className="report-card">
                <h4>Users by Role</h4>
                <ul className="report-list">
                  <li onClick={() => openUserRoleModal('region_manager')} onKeyDown={(e) => e.key === 'Enter' && openUserRoleModal('region_manager')} role="button" tabIndex={0}><span>Region Managers:</span> {reportStats.region_managers}</li>
                  <li onClick={() => openUserRoleModal('district_manager')} onKeyDown={(e) => e.key === 'Enter' && openUserRoleModal('district_manager')} role="button" tabIndex={0}><span>District Managers:</span> {reportStats.district_managers}</li>
                  <li onClick={() => openUserRoleModal('ward_manager')} onKeyDown={(e) => e.key === 'Enter' && openUserRoleModal('ward_manager')} role="button" tabIndex={0}><span>Ward Managers:</span> {reportStats.ward_managers}</li>
                  <li onClick={() => openUserRoleModal('head_teacher')} onKeyDown={(e) => e.key === 'Enter' && openUserRoleModal('head_teacher')} role="button" tabIndex={0}><span>Head Teachers:</span> {reportStats.head_teachers}</li>
                  <li onClick={() => openUserRoleModal('sport_teacher')} onKeyDown={(e) => e.key === 'Enter' && openUserRoleModal('sport_teacher')} role="button" tabIndex={0}><span>Sport Teachers:</span> {reportStats.sport_teachers}</li>
                  <li onClick={() => openUserRoleModal('student')} onKeyDown={(e) => e.key === 'Enter' && openUserRoleModal('student')} role="button" tabIndex={0}><span>Students:</span> {reportStats.students}</li>
                </ul>
              </div>
              
              <div className="report-card">
                <h4>Geographic Coverage</h4>
                <ul className="report-list">
                  <li onClick={() => openDemographicModal('countries')} onKeyDown={(e) => e.key === 'Enter' && openDemographicModal('countries')} role="button" tabIndex={0}><span>Countries:</span> {reportStats.countries}</li>
                  <li onClick={() => openDemographicModal('zones')} onKeyDown={(e) => e.key === 'Enter' && openDemographicModal('zones')} role="button" tabIndex={0}><span>Zones:</span> {reportStats.zones}</li>
                  <li onClick={() => openDemographicModal('regions')} onKeyDown={(e) => e.key === 'Enter' && openDemographicModal('regions')} role="button" tabIndex={0}><span>Regions:</span> {reportStats.regions}</li>
                  <li onClick={() => openDemographicModal('districts')} onKeyDown={(e) => e.key === 'Enter' && openDemographicModal('districts')} role="button" tabIndex={0}><span>Districts:</span> {reportStats.districts}</li>
                  <li onClick={() => openDemographicModal('wards')} onKeyDown={(e) => e.key === 'Enter' && openDemographicModal('wards')} role="button" tabIndex={0}><span>Wards:</span> {reportStats.wards}</li>
                  <li onClick={() => openDemographicModal('schools')} onKeyDown={(e) => e.key === 'Enter' && openDemographicModal('schools')} role="button" tabIndex={0}><span>Schools:</span> {reportStats.schools}</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
        </div>
      )}
      </main>

      {editingClubId && (
        <div className="modal-backdrop talent-admin-slide-over-backdrop" onClick={() => setEditingClubId(null)}>
          <div className="compact-modal club-edit-modal talent-admin-slide-over" onClick={(event) => event.stopPropagation()}>
            <div className="modal-heading">
              <h3>Edit Club</h3>
              <button type="button" className="modal-close-action" onClick={() => setEditingClubId(null)} aria-label="Close club editor">×</button>
            </div>
            <form className="club-edit-form" onSubmit={handleUpdateClub}>
              <input className="form-input" value={clubForm.name} onChange={(event) => setClubForm({ ...clubForm, name: event.target.value })} placeholder="Club name" required />
              <input className="form-input" value={clubForm.focus} onChange={(event) => setClubForm({ ...clubForm, focus: event.target.value })} placeholder="Focus" />
              <textarea className="form-input" value={clubForm.description} onChange={(event) => setClubForm({ ...clubForm, description: event.target.value })} placeholder="Description" />
              <label className="club-active-toggle"><input type="checkbox" checked={clubForm.is_active} onChange={(event) => setClubForm({ ...clubForm, is_active: event.target.checked })} /> Active club</label>
              <div className="modal-actions"><button type="button" className="btn-action" onClick={() => setEditingClubId(null)}>Cancel</button><button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save changes'}</button></div>
            </form>
          </div>
        </div>
      )}

      {showDemographicModal && (
        <div className="talent-admin-slide-over-backdrop"
          onClick={closeDemographicModal}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: '1rem',
          }}
        >
          <div
            className="compact-modal talent-admin-slide-over"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '520px',
              maxHeight: '85vh',
              overflowY: 'auto',
              background: '#fff',
              borderRadius: '16px',
              boxShadow: '0 25px 50px rgba(15, 23, 42, 0.25)',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#111827' }}>
                {showDemographicForm
                  ? `${editingDemographicId ? 'Edit' : 'Add'} ${demographicConfigs[demographicType].singular}`
                  : `${demographicConfigs[demographicType].label} (${demographicData[demographicType].length})`}
              </h3>
              <div className="popup-header-actions">
                {!showDemographicForm && (
                  <button
                    type="button"
                    onClick={openAddDemographicForm}
                    className="modal-add-action user-add-action"
                    aria-label={`Add ${demographicConfigs[demographicType].singular}`}
                  >
                    +
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeDemographicModal}
                  className="modal-close-action"
                  aria-label="Close demographic modal"
                >
                  ×
                </button>
              </div>
            </div>

            {!showDemographicForm ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  {demographicType === 'countries' && (
                    <input
                      type="search"
                      value={demographicSearch}
                      onChange={(e) => setDemographicSearch(e.target.value)}
                      placeholder="Search countries"
                      className="form-input"
                      style={{ flex: '1 1 220px' }}
                    />
                  )}
                </div>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        {demographicType === 'countries' ? <><th>Code</th><th>Zones</th></> : demographicType === 'schools' ? <th>Registry number</th> : demographicType === 'regions' ? <th>Zone</th> : <th>Country</th>}
                        {demographicType === 'schools' && <th>Ownership</th>}
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDemographicItems.length > 0 ? filteredDemographicItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.name || 'N/A'}</td>
                          {demographicType === 'countries' ? (
                            <>
                              <td>{item.code || 'N/A'}</td>
                              <td>{demographicData.zones.filter((zone) => zone.country === item.id).length}</td>
                            </>
                          ) : (
                            <td>{demographicType === 'schools' ? item.registry_number || 'N/A' : getParentName(demographicType, item)}</td>
                          )}
                          {demographicType === 'schools' && <td>{item.ownership_type || 'N/A'}</td>}
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <button type="button" className="report-text-action report-edit-action" onClick={() => openDemographicModal(demographicType, item)}>
                                Edit
                              </button>
                              <button
                                type="button"
                                className="report-text-action report-delete-action"
                                onClick={() => handleDeleteDemographic(demographicType, item.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={demographicType === 'countries' ? '4' : demographicType === 'schools' ? '4' : '3'}>No {demographicConfigs[demographicType].label.toLowerCase()} found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                {demographicFields[demographicType].map((field) => (
                  <label key={field.name} style={{ display: 'grid', gap: '0.4rem', color: '#374151', fontWeight: 600 }}>
                    {field.label}
                    {field.type === 'select' ? (
                      <select
                        name={field.name}
                        value={demographicForm[field.name] || ''}
                        onChange={handleDemographicChange}
                        className="form-input"
                        disabled={submitting}
                      >
                        <option value="">Select {field.label}</option>
                        {field.options.map((option) => (
                          <option key={option.id} value={option.id}>{option.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        name={field.name}
                        value={demographicForm[field.name] || ''}
                        onChange={handleDemographicChange}
                        className="form-input"
                        disabled={submitting}
                      />
                    )}
                  </label>
                ))}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', gridColumn: '1 / -1' }}>
                  <button type="button" className="btn-action" onClick={() => setShowDemographicForm(false)} disabled={submitting}>
                    Cancel
                  </button>
                  <button type="button" className="btn-primary" onClick={handleSaveDemographic} disabled={submitting}>
                    {submitting ? 'Saving...' : editingDemographicId ? 'Save Changes' : 'Add'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showAddTalentModal && (
        <div className="talent-admin-slide-over-backdrop"
          onClick={closeTalentModal}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            className="compact-modal talent-admin-slide-over"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '520px',
              background: '#fff',
              borderRadius: '16px',
              boxShadow: '0 25px 50px rgba(15, 23, 42, 0.25)',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#111827' }}>{editingTalentId ? 'Edit Talent' : 'Add New Talent'}</h3>
              <button
                type="button"
                onClick={closeTalentModal}
                className="modal-close-action"
                aria-label="Close add talent modal"
              >
                ×
              </button>
            </div>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <input
                type="text"
                placeholder="Talent Name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                className="form-input"
                disabled={submitting}
              />
              <select
                name="category"
                value={formData.category}
                onChange={handleFormChange}
                className="form-input"
                disabled={submitting}
              >
                <option value="">Select Category</option>
                {talentCategories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <textarea
                placeholder="Description"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                className="form-input"
                disabled={submitting}
                rows="4"
              ></textarea>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={closeTalentModal}
                  className="btn-action"
                  style={{ background: '#e5e7eb', color: '#111827' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddTalent}
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (editingTalentId ? 'Saving...' : 'Adding...') : (editingTalentId ? 'Save Changes' : 'Add Talent')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTalentListModal && (
        <div className="talent-admin-slide-over-backdrop"
          onClick={() => setShowTalentListModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '1rem',
          }}
        >
          <div
            className="compact-modal talent-admin-slide-over"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '520px',
              maxHeight: '80vh',
              overflowY: 'auto',
              background: '#fff',
              borderRadius: '16px',
              boxShadow: '0 25px 50px rgba(15, 23, 42, 0.25)',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#111827' }}>All Registered Talents</h3>
              <button
                type="button"
                onClick={() => setShowTalentListModal(false)}
                className="modal-close-action"
                aria-label="Close talent list modal"
              >
                ×
              </button>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Talent Name</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {talentsData.length > 0 ? (
                    talentsData.map((talent) => (
                      <tr key={talent.id}>
                        <td>{talent.name || 'N/A'}</td>
                        <td>{talent.category_name || 'N/A'}</td>
                        <td>{talent.description || 'N/A'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button
                              className="btn-action btn-edit"
                              onClick={() => {
                                setShowTalentListModal(false);
                                openEditTalentModal(talent);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="btn-action"
                              onClick={() => handleDeleteTalent(talent.id)}
                              style={{ background: '#fff', color: '#b45353' }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4">No talents found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showCompetitionListModal && (
        <div className="talent-admin-slide-over-backdrop"
          onClick={() => setShowCompetitionListModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '1rem',
          }}
        >
          <div
            className="compact-modal talent-admin-slide-over"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '520px',
              maxHeight: '80vh',
              overflowY: 'auto',
              background: '#fff',
              borderRadius: '16px',
              boxShadow: '0 25px 50px rgba(15, 23, 42, 0.25)',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#111827' }}>All Competitions ({competitionsData.length})</h3>
              <button
                type="button"
                onClick={() => setShowCompetitionListModal(false)}
                className="modal-close-action"
                aria-label="Close competitions modal"
              >
                ×
              </button>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Competition Name</th>
                    <th>Level</th>
                    <th>Start Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {competitionsData.map((comp) => (
                    <tr key={comp.id}>
                      <td>{comp.name || 'N/A'}</td>
                      <td><span className="badge">{comp.get_level_display || comp.level || 'N/A'}</span></td>
                      <td>{comp.start_date ? new Date(comp.start_date).toLocaleDateString() : 'N/A'}</td>
                      <td><button className="btn-action">View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showUserListModal && (
        <div className="talent-admin-slide-over-backdrop"
          onClick={closeUserListModal}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '1rem',
          }}
        >
          <div
            className="compact-modal talent-admin-slide-over"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '520px',
              maxHeight: '80vh',
              overflowY: 'auto',
              background: '#fff',
              borderRadius: '16px',
              boxShadow: '0 25px 50px rgba(15, 23, 42, 0.25)',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#111827' }}>
                {selectedUserRole ? `${selectedUserRole.replace('_', ' ')} users` : 'All Users & Staff'} ({usersForModal.length})
              </h3>
              <div className="popup-header-actions">
                <button
                  type="button"
                  onClick={() => openUserEditModal()}
                  className="modal-add-action user-add-action"
                  aria-label="Add user"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={closeUserListModal}
                  className="modal-close-action"
                  aria-label="Close users modal"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Location</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersForModal.map((user) => {
                    const school = demographicData.schools.find((entry) => entry.id === user.school) || null;
                    const schoolLocation = school ? getSchoolLocationChain(school.id) : null;
                    const displayLocation = (() => {
                      if (user.role === 'region_manager') {
                        return demographicData.regions.find((region) => region.id === (user.region ?? schoolLocation?.region?.id))?.name || 'Region not assigned';
                      }
                      if (user.role === 'district_manager') {
                        return demographicData.districts.find((district) => district.id === (user.district ?? schoolLocation?.district?.id))?.name || 'District not assigned';
                      }
                      if (user.role === 'ward_manager') {
                        return demographicData.wards.find((ward) => ward.id === (user.ward ?? schoolLocation?.ward?.id))?.name || 'Ward not assigned';
                      }
                      if (['student', 'head_teacher', 'sport_teacher'].includes(user.role)) {
                        return school?.name || 'School not assigned';
                      }
                      return getUserLocationLabel(user);
                    })();

                    return (
                      <tr key={user.id}>
                        <td>{renderUserNameCell(user)}</td>
                        <td>{displayLocation}</td>
                        <td>
                          <div className="report-popup-actions">
                            <button type="button" className="report-text-action report-edit-action" onClick={() => openUserEditModal(user)}>
                              Edit
                            </button>
                            <button type="button" className="report-text-action report-delete-action" onClick={() => handleDeleteUser(user.id)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showUserEditModal && (
        <div className="talent-admin-slide-over-backdrop"
          onClick={() => setShowUserEditModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: '1rem',
          }}
        >
          <div className="compact-modal talent-admin-slide-over" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '420px', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#111827' }}>{editingUserId ? 'Edit User' : 'Add User'}</h3>
              <button type="button" className="modal-close-action" onClick={() => setShowUserEditModal(false)} aria-label="Close edit user modal">×</button>
            </div>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <input className="form-input" name="username" value={userForm.username} onChange={handleUserFormChange} placeholder="Username" disabled={submitting} />
              <input className="form-input" type="password" name="password" value={userForm.password} onChange={handleUserFormChange} placeholder={editingUserId ? 'New password (optional)' : 'Password'} disabled={submitting} />
              <input className="form-input" name="first_name" value={userForm.first_name} onChange={handleUserFormChange} placeholder="First name" disabled={submitting} />
              <input className="form-input" name="last_name" value={userForm.last_name} onChange={handleUserFormChange} placeholder="Last name" disabled={submitting} />
              <input className="form-input" type="email" name="email" value={userForm.email} onChange={handleUserFormChange} placeholder="Email" disabled={submitting} />
              <select className="form-input" name="role" value={userForm.role} onChange={handleUserFormChange} disabled={submitting}>
                <option value="">Select role</option>
                <option value="region_manager">Region Manager</option>
                <option value="zone_manager">Zone Manager</option>
                <option value="district_manager">District Manager</option>
                <option value="ward_manager">Ward Manager</option>
                <option value="head_teacher">Head Teacher</option>
                <option value="sport_teacher">Sport Teacher</option>
                <option value="student">Student</option>
              </select>

              {userForm.role && (
                <>
                  {getUserLocationFields().includes('country') && (
                    <select className="form-input" name="country" value={userForm.country || ''} onChange={handleUserFormChange} disabled={submitting}>
                      <option value="">Select country</option>
                      {demographicData.countries.map((country) => (
                        <option key={country.id} value={country.id}>{country.name}</option>
                      ))}
                    </select>
                  )}

                  {getUserLocationFields().includes('zone') && (
                    <select className="form-input" name="zone" value={userForm.zone || ''} onChange={handleUserFormChange} disabled={submitting}>
                      <option value="">Select zone</option>
                      {demographicData.zones.map((zone) => (
                        <option key={zone.id} value={zone.id}>{zone.name}</option>
                      ))}
                    </select>
                  )}

                  {getUserLocationFields().includes('region') && (
                    <select className="form-input" name="region" value={userForm.region || ''} onChange={handleUserFormChange} disabled={submitting}>
                      <option value="">Select region</option>
                      {demographicData.regions.map((region) => (
                        <option key={region.id} value={region.id}>{region.name}</option>
                      ))}
                    </select>
                  )}

                  {getUserLocationFields().includes('district') && (
                    <select className="form-input" name="district" value={userForm.district || ''} onChange={handleUserFormChange} disabled={submitting}>
                      <option value="">Select district</option>
                      {demographicData.districts.map((district) => (
                        <option key={district.id} value={district.id}>{district.name}</option>
                      ))}
                    </select>
                  )}

                  {getUserLocationFields().includes('ward') && (
                    <select className="form-input" name="ward" value={userForm.ward || ''} onChange={handleUserFormChange} disabled={submitting}>
                      <option value="">Select ward</option>
                      {demographicData.wards.map((ward) => (
                        <option key={ward.id} value={ward.id}>{ward.name}</option>
                      ))}
                    </select>
                  )}

                  {getUserLocationFields().includes('school') && (
                    <select className="form-input" name="school" value={userForm.school || ''} onChange={handleUserFormChange} disabled={submitting}>
                      <option value="">Select school</option>
                      {demographicData.schools.map((school) => (
                        <option key={school.id} value={school.id}>{school.name}</option>
                      ))}
                    </select>
                  )}
                </>
              )}
              {userForm.role === 'student' && (
                <>
                  <select className="form-input" name="gender" value={studentForm.gender} onChange={handleStudentFormChange} disabled={submitting}>
                    <option value="">Select gender</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                  <input className="form-input" type="date" name="date_of_birth" value={studentForm.date_of_birth} onChange={handleStudentFormChange} disabled={submitting} />
                </>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="report-text-action" onClick={() => setShowUserEditModal(false)} disabled={submitting}>Cancel</button>
                <button type="button" className="btn-primary" onClick={handleSaveUser} disabled={submitting}>{submitting ? 'Saving...' : editingUserId ? 'Save' : 'Add User'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

