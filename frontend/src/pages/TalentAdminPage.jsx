import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import * as apiService from '../services/apiService';
import logo from '../assets/Logo1.png';
import './SportTeacherPage.css';
import '../styles/talentadmin.css';
import DashboardSkeleton from '../components/DashboardSkeleton';

const NAV_ITEMS = [
  ['home', 'Home', 'This is home.'], ['schools', 'Schools', 'Here you will manage schools.'], ['users', 'Users', 'Here you will manage all system users.'],
];

const emptySchool = { registry_number: '', name: '', ownership_type: 'Government', country: '', zone: '', region: '', district: '', ward: '', phone: '', physical_address: '', email: '' };
const emptyUser = { username: '', first_name: '', last_name: '', email: '', phone: '', role: 'sport_teacher', country: '', zone: '', region: '', district: '', ward: '', school: '', password: '' };
const USER_ROLE_OPTIONS = [
  ['talent_admin', 'Talent Admin'],
  ['region_manager', 'Region Manager'],
  ['zone_manager', 'Zone Manager'],
  ['district_manager', 'District Manager'],
  ['ward_manager', 'Ward Manager'],
  ['head_teacher', 'Head Teacher'],
  ['sport_teacher', 'Sport Teacher'],
  ['student', 'Student'],
  ['parent', 'Parent'],
];
const USER_GEOGRAPHY_LEVELS = {
  talent_admin: ['country'],
  region_manager: ['country', 'zone', 'region'],
  zone_manager: ['country', 'zone'],
  district_manager: ['country', 'zone', 'region', 'district'],
  ward_manager: ['country', 'zone', 'region', 'district', 'ward'],
  head_teacher: ['country', 'zone', 'region', 'district', 'ward', 'school'],
  sport_teacher: ['country', 'zone', 'region', 'district', 'ward', 'school'],
  student: ['country', 'zone', 'region', 'district', 'ward', 'school'],
  parent: ['country', 'zone', 'region', 'district', 'ward', 'school'],
};
const formatRoleLabel = (role = '') => role.split('_').map((part) => part ? part.charAt(0).toUpperCase() + part.slice(1) : '').join(' ');

export default function TalentAdminPage() {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [schools, setSchools] = useState([]);
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [parents, setParents] = useState([]);
  const [countries, setCountries] = useState([]);
  const [zones, setZones] = useState([]);
  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [ownershipTypes, setOwnershipTypes] = useState([]);
  const [schoolDrawerOpen, setSchoolDrawerOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [schoolForm, setSchoolForm] = useState(emptySchool);
  const [schoolSubmitting, setSchoolSubmitting] = useState(false);
  const [selectedUserRole, setSelectedUserRole] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [userDrawerOpen, setUserDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userEditorMode, setUserEditorMode] = useState('add');
  const [userForm, setUserForm] = useState(emptyUser);
  const [userSubmitting, setUserSubmitting] = useState(false);
  const activeItem = NAV_ITEMS.find(([key]) => key === activeTab) || NAV_ITEMS[0];

  const userRoleOptions = useMemo(() => USER_ROLE_OPTIONS.map(([value, label]) => ({ value, label })), []);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = userSearch.trim().toLowerCase();
    const baseUsers = selectedUserRole === 'all' ? users : users.filter((user) => user.role === selectedUserRole);

    if (!normalizedSearch) return baseUsers;

    return baseUsers.filter((user) => {
      const searchableValues = [
        getUserDisplayName(user),
        formatRoleLabel(user.role),
        user.email,
        user.phone,
        getSchoolName(user.school),
        getUserLocationDisplay(user, user.role),
        getParentAreaDisplay(user),
        getParentChildrenDisplay(user),
      ].filter(Boolean).join(' ').toLowerCase();
      return searchableValues.includes(normalizedSearch);
    });
  }, [selectedUserRole, userSearch, users, students, parents, schools, countries, zones, regions, districts, wards]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [schoolsRes, usersRes, studentsRes, parentsRes, countriesRes, zonesRes, regionsRes, districtsRes, wardsRes, ownershipRes] = await Promise.all([
          apiService.getAllSchools(), apiService.getUsers(), apiService.getStudents(), apiService.getParents(), apiService.getAllCountries(), apiService.getAllZones(), apiService.getAllRegions(), apiService.getAllDistricts(), apiService.getAllWards(), apiService.getSchoolOwnershipTypes(),
        ]);
        setSchools(schoolsRes.data.results || []); setUsers(usersRes.data.results || []); setStudents(studentsRes.data.results || []); setParents(parentsRes.data.results || []); setCountries(countriesRes.data.results || []); setZones(zonesRes.data.results || []); setRegions(regionsRes.data.results || []); setDistricts(districtsRes.data.results || []); setWards(wardsRes.data.results || []); setOwnershipTypes(ownershipRes.data.results || []);
      } catch (requestError) { setError(requestError.response?.data?.detail || 'Failed to load school administration data'); } finally { setLoading(false); }
    };
    loadData();
  }, []);

  const getName = (items, id) => items.find((item) => Number(item.id) === Number(id))?.name || '—';
  const getLocation = (school) => {
    const country = countries.find((item) => Number(item.id) === Number(school.country));
    return [getName(wards, school.ward), getName(districts, school.district), getName(regions, school.region), country?.code || '—'].filter((part) => part !== '—').join(' - ') || '—';
  };
  const getUserDisplayName = (user) => `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || '—';
  const getSchoolName = (schoolId) => schools.find((school) => Number(school.id) === Number(schoolId))?.name || '—';
  const getCountryName = (countryId) => countries.find((country) => Number(country.id) === Number(countryId))?.name || '—';
  const getZoneName = (zoneId) => zones.find((zone) => Number(zone.id) === Number(zoneId))?.name || '—';
  const getRegionName = (regionId) => regions.find((region) => Number(region.id) === Number(regionId))?.name || '—';
  const getDistrictName = (districtId) => districts.find((district) => Number(district.id) === Number(districtId))?.name || '—';
  const getWardName = (wardId) => wards.find((ward) => Number(ward.id) === Number(wardId))?.name || '—';
  const getUserLocationDisplay = (user, role = user?.role) => {
    if (!user) return '—';
    const roleKey = role || 'talent_admin';
    const entries = {
      talent_admin: [getCountryName(user.country)],
      region_manager: [getRegionName(user.region), getZoneName(user.zone), getCountryName(user.country)],
      zone_manager: [getZoneName(user.zone), getCountryName(user.country)],
      district_manager: [getDistrictName(user.district), getRegionName(user.region), getCountryName(user.country)],
      ward_manager: [getWardName(user.ward), getDistrictName(user.district), getCountryName(user.country)],
      head_teacher: [getSchoolName(user.school), getRegionName(user.region), getCountryName(user.country)],
      sport_teacher: [getSchoolName(user.school), getRegionName(user.region), getCountryName(user.country)],
      student: [getSchoolName(user.school), getRegionName(user.region), getCountryName(user.country)],
    };
    const location = entries[roleKey] || [getCountryName(user.country)];
    return location.filter((part) => part && part !== '—').join(' - ') || '—';
  };
  const getRoleColumnDisplay = (user) => {
    if (!user) return '—';
    const roleLabel = formatRoleLabel(user.role);
    const roleName = roleLabel.replace(/\s+/g, ' ').trim();
    switch (user.role) {
      case 'talent_admin':
        return `${roleName} - ${getCountryName(user.country)}`;
      case 'zone_manager':
        return `${roleName} - ${getZoneName(user.zone)}`;
      case 'region_manager':
        return `${roleName} - ${getRegionName(user.region)}`;
      case 'student':
        return `${roleName} - ${getSchoolName(user.school)}`;
      case 'parent': {
        const childNames = getParentChildrenDisplay(user);
        return `${roleName} - ${childNames === '—' ? 'No children' : childNames}`;
      }
      default:
        return roleLabel;
    }
  };
  const getParentLookup = (userId) => parents.find((parent) => Number(parent.user ?? parent.user_id) === Number(userId)) || null;
  const getParentAreaDisplay = (user) => {
    const parentProfile = getParentLookup(user.id);
    const childStudent = students.find((student) => Number(student.parent?.id ?? student.parent_id) === Number(parentProfile?.id));
    const school = childStudent?.school || schools.find((school) => Number(school.id) === Number(user.school));
    if (!school) return '—';
    const ward = getWardName(school.ward);
    const district = getDistrictName(school.district);
    return [ward, district].filter((part) => part && part !== '—').join(' - ') || '—';
  };
  const getParentChildrenDisplay = (user) => {
    const parentProfile = getParentLookup(user.id);
    if (!parentProfile) return '—';
    const children = students.filter((student) => Number(student.parent?.id ?? student.parent_id) === Number(parentProfile.id));
    const names = children.map((student) => `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unnamed child');
    return names.length ? names.join(', ') : '—';
  };
  const getDefaultCountryValue = () => {
    const tanzania = countries.find((country) => {
      const label = `${country.name || ''} ${country.code || ''}`.toLowerCase();
      return label.includes('tanzania') || country.code?.toLowerCase() === 'tz';
    });
    return String(tanzania?.id || '');
  };
  const buildEmptyUserForm = () => ({
    ...emptyUser,
    country: getDefaultCountryValue(),
  });
  const buildUserFormFromSelection = (user = null) => {
    if (!user) return buildEmptyUserForm();
    return {
      username: user.username || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'sport_teacher',
      country: user.country ? String(user.country) : getDefaultCountryValue(),
      zone: user.zone ? String(user.zone) : '',
      region: user.region ? String(user.region) : '',
      district: user.district ? String(user.district) : '',
      ward: user.ward ? String(user.ward) : '',
      school: user.school ? String(user.school) : '',
      password: '',
    };
  };
  const getUserGeographyLevels = (role) => USER_GEOGRAPHY_LEVELS[role] || ['country'];
  const getVisibleUserGeography = (role) => new Set(getUserGeographyLevels(role));
  const visibleUserGeography = useMemo(() => getVisibleUserGeography(userForm.role), [userForm.role]);
  const updateUserLocation = (field, value) => setUserForm((current) => {
    const next = { ...current, [field]: value };
    if (field === 'country') Object.assign(next, { zone: '', region: '', district: '', ward: '', school: '' });
    if (field === 'zone') Object.assign(next, { region: '', district: '', ward: '', school: '' });
    if (field === 'region') Object.assign(next, { district: '', ward: '', school: '' });
    if (field === 'district') Object.assign(next, { ward: '', school: '' });
    if (field === 'ward') next.school = '';
    return next;
  });
  const handleUserRoleChange = (role) => setUserForm((current) => {
    const next = { ...current, role };
    const allowed = new Set(getUserGeographyLevels(role));
    ['country', 'zone', 'region', 'district', 'ward', 'school'].forEach((field) => {
      if (!allowed.has(field)) next[field] = '';
    });
    return next;
  });
  const filteredUserZones = zones.filter((zone) => !userForm.country || Number(zone.country) === Number(userForm.country));
  const filteredUserRegions = regions.filter((region) => !userForm.zone || Number(region.zone) === Number(userForm.zone));
  const filteredUserDistricts = districts.filter((district) => !userForm.region || Number(district.region) === Number(userForm.region));
  const filteredUserWards = wards.filter((ward) => !userForm.district || Number(ward.district) === Number(userForm.district));
  const filteredUserSchools = schools.filter((school) => {
    if (userForm.country && Number(school.country) !== Number(userForm.country)) return false;
    if (userForm.zone && Number(school.zone) !== Number(userForm.zone)) return false;
    if (userForm.region && Number(school.region) !== Number(userForm.region)) return false;
    if (userForm.district && Number(school.district) !== Number(userForm.district)) return false;
    if (userForm.ward && Number(school.ward) !== Number(userForm.ward)) return false;
    return true;
  });

  const openSchoolEditor = (school = null) => {
    setSelectedSchool(school);
    setSchoolForm(school ? {
      ...emptySchool,
      ...school,
      country: String(school.country || ''),
      zone: String(school.zone || ''),
      region: String(school.region || ''),
      district: String(school.district || ''),
      ward: String(school.ward || ''),
    } : emptySchool);
    setSchoolDrawerOpen(true);
  };
  const closeSchoolEditor = () => { setSchoolDrawerOpen(false); setSelectedSchool(null); setSchoolForm(emptySchool); };
  const updateField = (field, value) => setSchoolForm((current) => {
    const next = { ...current, [field]: value };
    if (field === 'country') Object.assign(next, { zone: '', region: '', district: '', ward: '' });
    if (field === 'zone') Object.assign(next, { region: '', district: '', ward: '' });
    if (field === 'region') Object.assign(next, { district: '', ward: '' });
    if (field === 'district') next.ward = '';
    return next;
  });

  const filteredZones = zones.filter((zone) => !schoolForm.country || Number(zone.country) === Number(schoolForm.country));
  const filteredRegions = regions.filter((region) => !schoolForm.zone || Number(region.zone) === Number(schoolForm.zone));
  const filteredDistricts = districts.filter((district) => !schoolForm.region || Number(district.region) === Number(schoolForm.region));
  const filteredWards = wards.filter((ward) => !schoolForm.district || Number(ward.district) === Number(schoolForm.district));

  const saveSchool = async (event) => {
    event.preventDefault(); setSchoolSubmitting(true); setError(null);
    const editableFields = ['registry_number', 'name', 'country', 'zone', 'region', 'district', 'ward', 'phone', 'physical_address'];
    if (!selectedSchool || schoolForm.ownership_type !== selectedSchool.ownership_type) editableFields.splice(2, 0, 'ownership_type');
    const schoolFields = Object.fromEntries(editableFields.map((field) => [field, schoolForm[field] ?? '']));
    const payload = { ...schoolFields, country: Number(schoolForm.country), zone: Number(schoolForm.zone), region: Number(schoolForm.region), district: Number(schoolForm.district), ward: Number(schoolForm.ward) };
    try {
      const response = selectedSchool ? await apiService.patchSchool(selectedSchool.id, payload) : await apiService.createSchool(payload);
      setSchools((current) => selectedSchool ? current.map((school) => school.id === selectedSchool.id ? response.data : school) : [...current, response.data]); closeSchoolEditor();
    } catch (requestError) { const details = requestError.response?.data; const fieldError = details && Object.values(details).flat?.().find(Boolean); setError(fieldError || details?.detail || details?.non_field_errors?.[0] || 'Failed to save school'); } finally { setSchoolSubmitting(false); }
  };

  const openUserEditor = (user = null) => {
    setSelectedUser(user);
    setUserEditorMode(user ? 'edit' : 'add');
    setUserForm(buildUserFormFromSelection(user));
    setUserDrawerOpen(true);
  };
  const closeUserEditor = () => {
    setUserDrawerOpen(false);
    setSelectedUser(null);
    setUserEditorMode('add');
    setUserForm(buildEmptyUserForm());
  };
  const saveUser = async (event) => {
    event.preventDefault(); setUserSubmitting(true); setError(null);
    const selectedGeography = ['country', 'zone', 'region', 'district', 'ward', 'school'].reduce((result, field) => {
      if (userForm[field] !== '' && userForm[field] !== null && userForm[field] !== undefined) {
        result[field] = Number(userForm[field]);
      }
      return result;
    }, {});
    const payload = {
      username: userForm.username,
      first_name: userForm.first_name,
      last_name: userForm.last_name,
      email: userForm.email || '',
      phone: userForm.phone || '',
      role: userForm.role,
      ...selectedGeography,
    };

    if (!payload.username || !payload.first_name || !payload.last_name || !payload.role) {
      setError('Please complete all required user fields.');
      setUserSubmitting(false);
      return;
    }

    if (userEditorMode === 'add' && !userForm.password) {
      setError('Password is required when creating a user.');
      setUserSubmitting(false);
      return;
    }

    if (userForm.password) {
      payload.password = userForm.password;
    }

    try {
      let response;
      if (userEditorMode === 'edit' && selectedUser) {
        response = await apiService.updateUser(selectedUser.id, payload);
        setUsers((current) => current.map((user) => user.id === selectedUser.id ? response.data : user));
      } else {
        response = await apiService.createUser(payload);
        setUsers((current) => [response.data, ...current]);
      }
      closeUserEditor();
    } catch (requestError) {
      const details = requestError.response?.data;
      const fieldError = details && Object.values(details).flat?.().find(Boolean);
      setError(fieldError || details?.detail || details?.non_field_errors?.[0] || `Failed to ${userEditorMode === 'edit' ? 'update' : 'create'} user`);
    } finally { setUserSubmitting(false); }
  };

  const deleteSchool = async () => {
    if (!selectedSchool || !window.confirm(`Delete ${selectedSchool.name}?`)) return;
    setSchoolSubmitting(true);
    try { await apiService.deleteSchool(selectedSchool.id); setSchools((current) => current.filter((school) => school.id !== selectedSchool.id)); closeSchoolEditor(); } catch (requestError) { setError(requestError.response?.data?.detail || 'Failed to delete school'); } finally { setSchoolSubmitting(false); }
  };

  const locationField = (label, field, options, disabled = false) => <label>{label}<select required value={schoolForm[field]} disabled={disabled} onChange={(event) => updateField(field, event.target.value)}><option value="">Select {label.toLowerCase()}</option>{options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>;
  const userLocationField = (label, field, options, disabled = false) => <label>{label}<select value={userForm[field] || ''} required={visibleUserGeography.has(field)} disabled={disabled || !visibleUserGeography.has(field)} onChange={(event) => updateUserLocation(field, event.target.value)}><option value="">Select {label.toLowerCase()}</option>{options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>;
  const userLocationRows = [
    ['country', 'zone'],
    ['region', 'district'],
    ['ward', 'school'],
  ];
  const floatingInput = (label, field, props = {}) => <label className="talent-admin-floating-field"><input placeholder=" " value={schoolForm[field] || ''} onChange={(event) => updateField(field, event.target.value)} {...props} /><span>{label}</span></label>;
  const floatingTextarea = (label, field, props = {}) => <label className="talent-admin-floating-field"><textarea placeholder=" " value={schoolForm[field] || ''} onChange={(event) => updateField(field, event.target.value)} {...props} /><span>{label}</span></label>;

  return <div className="sport-teacher-page talent-admin-page">
    <header className="sport-teacher-app-bar"><div className="sport-teacher-brand"><img src={logo} alt="Talanta logo" /><span>Talanta Management System</span></div><button type="button" className="sport-teacher-navigation-toggle" onClick={() => setNavigationOpen((open) => !open)} aria-label="Open navigation menu" aria-expanded={navigationOpen}><span /><span /><span /></button></header>
    <aside className={`sport-teacher-navigation ${navigationOpen ? 'is-open' : ''}`}><div className="sport-teacher-navigation-heading">Talent Administration</div>{NAV_ITEMS.map(([key, label]) => <button type="button" key={key} className={activeTab === key ? 'active' : ''} onClick={() => { setActiveTab(key); setNavigationOpen(false); }}>{label}</button>)}<button type="button" className="sport-teacher-logout-button" onClick={logout}>Logout</button></aside>
    <main className="sport-teacher-prototype-content talent-admin-content">{error && <div className="talent-admin-alert">{error}<button type="button" onClick={() => setError(null)} aria-label="Dismiss error">&times;</button></div>}{loading ? <DashboardSkeleton label="Loading talent administration" /> : activeTab === 'schools' ? <section className="talent-admin-table-card"><div className="talent-admin-table-header"><div><h1>Schools</h1></div><button type="button" className="district-primary-button talent-admin-add-school-button" onClick={() => openSchoolEditor()}>Add school</button></div><div className="talent-admin-table-wrap"><table className="talent-admin-table"><thead><tr><th>Reg.No</th><th>School Name</th><th>Location</th><th>Phone</th><th>Physical address</th></tr></thead><tbody>{schools.map((school) => <tr key={school.id}><td><button type="button" className="talent-admin-link-button" onClick={() => openSchoolEditor(school)}>{school.registry_number}</button></td><td>{school.name}</td><td>{getLocation(school)}</td><td>{school.phone || '?'}</td><td>{school.physical_address || '?'}</td></tr>)}{!schools.length && <tr><td colSpan="5" className="talent-admin-empty">No schools found.</td></tr>}</tbody></table></div></section> : activeTab === 'users' ? (
      <>
        <div className="talent-admin-user-tools">
          <div className="talent-admin-role-tabs-scroll">
            <div className="talent-admin-role-tabs" role="tablist" aria-label="User roles">
              <button type="button" className={selectedUserRole === 'all' ? 'talent-admin-role-tab is-active' : 'talent-admin-role-tab'} onClick={() => setSelectedUserRole('all')} role="tab" aria-selected={selectedUserRole === 'all'}>All</button>
              {userRoleOptions.map((role) => (
                <button type="button" key={role.value} className={selectedUserRole === role.value ? 'talent-admin-role-tab is-active' : 'talent-admin-role-tab'} onClick={() => setSelectedUserRole(role.value)} role="tab" aria-selected={selectedUserRole === role.value}>{role.label}</button>
              ))}
            </div>
          </div>
          <div className="talent-admin-user-actions">
            <label className="talent-admin-filter-field talent-admin-search-field">
              <input type="search" value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Search users" />
            </label>
            <button type="button" className="district-primary-button talent-admin-add-user-button" onClick={() => openUserEditor()}>Add user</button>
          </div>
        </div>
        <section className="talent-admin-table-card">
          <div className="talent-admin-table-wrap">
            <table className="talent-admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  {selectedUserRole === 'all' ? <th>Role</th> : selectedUserRole === 'parent' ? <th>Area</th> : <th>Location</th>}
                  {selectedUserRole === 'parent' ? <th>Children</th> : <th>Email</th>}
                  <th>{selectedUserRole === 'parent' ? 'Phone' : 'Phone'}</th>
                </tr>
              </thead>
              <tbody>{filteredUsers.map((user) => {
                const isParentTab = selectedUserRole === 'parent';
                const isAllTab = selectedUserRole === 'all';
                return <tr key={user.id}>
                  <td><button type="button" className="talent-admin-link-button" onClick={() => openUserEditor(user)}>{user.username || getUserDisplayName(user)}</button></td>
                  {isAllTab ? <td>{getRoleColumnDisplay(user)}</td> : isParentTab ? <td>{getParentAreaDisplay(user)}</td> : <td>{getUserLocationDisplay(user, user.role)}</td>}
                  {isParentTab ? <td>{getParentChildrenDisplay(user)}</td> : <td>{user.email || '?'}</td>}
                  <td>{user.phone || '?'}</td>
                </tr>;
              })}{!filteredUsers.length && <tr><td colSpan={selectedUserRole === 'parent' ? 4 : 4} className="talent-admin-empty">No users found.</td></tr>}</tbody>
            </table>
          </div>
        </section>
        {userDrawerOpen && <><button type="button" className="sport-teacher-drawer-backdrop" aria-label="Close user form" onClick={closeUserEditor} /><aside className="sport-teacher-search-drawer sport-teacher-registration-drawer talent-admin-school-drawer" aria-label="User editor"><div className="sport-teacher-search-drawer-header"><h2>{userEditorMode === 'edit' ? 'Edit user' : 'Add user'}</h2><button type="button" onClick={closeUserEditor} aria-label="Close user form">&times;</button></div><form onSubmit={saveUser} className="sport-teacher-profile-form"><div className="sport-teacher-registration-form-grid"><label data-label="Username *"><input required value={userForm.username} onChange={(event) => setUserForm((current) => ({ ...current, username: event.target.value }))} /></label><label data-label="Email"><input type="email" value={userForm.email} onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))} /></label></div><div className="sport-teacher-registration-form-grid"><label data-label="First name *"><input required value={userForm.first_name} onChange={(event) => setUserForm((current) => ({ ...current, first_name: event.target.value }))} /></label><label data-label="Last name *"><input required value={userForm.last_name} onChange={(event) => setUserForm((current) => ({ ...current, last_name: event.target.value }))} /></label></div><div className="sport-teacher-registration-form-grid"><label data-label="Role"><select value={userForm.role} onChange={(event) => handleUserRoleChange(event.target.value)}>{USER_ROLE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label data-label="Phone"><input type="tel" value={userForm.phone || ''} onChange={(event) => setUserForm((current) => ({ ...current, phone: event.target.value }))} /></label></div>{userLocationRows.map(([firstField, secondField]) => {
          const fieldConfig = {
            country: ['Country', countries],
            zone: ['Zone', filteredUserZones],
            region: ['Region', filteredUserRegions],
            district: ['District', filteredUserDistricts],
            ward: ['Ward', filteredUserWards],
            school: ['School', filteredUserSchools],
          };
          const rowFields = [];

          if (visibleUserGeography.has(firstField)) {
            const [label, options] = fieldConfig[firstField];
            rowFields.push(userLocationField(label, firstField, options, !visibleUserGeography.has(firstField)));
          }

          if (visibleUserGeography.has(secondField)) {
            const [label, options] = fieldConfig[secondField];
            rowFields.push(userLocationField(label, secondField, options, !visibleUserGeography.has(secondField)));
          }

          if (!rowFields.length) return null;
          return <div key={`location-row-${firstField}-${secondField}`} className="sport-teacher-registration-form-grid">{rowFields}</div>;
        })}<div className="sport-teacher-registration-form-grid"><label data-label={userEditorMode === 'edit' ? 'Password' : 'Password *'}><input type="password" required={userEditorMode !== 'edit'} value={userForm.password} onChange={(event) => setUserForm((current) => ({ ...current, password: event.target.value }))} /></label><label data-label="Confirm password"><input type="password" value={userForm.confirmPassword || ''} onChange={(event) => setUserForm((current) => ({ ...current, confirmPassword: event.target.value }))} /></label></div><div className="sport-teacher-registration-form-grid"><button type="button" className="sport-teacher-secondary-button" onClick={closeUserEditor}>Cancel</button><button type="submit" className="district-primary-button" disabled={userSubmitting}>{userSubmitting ? 'Saving...' : userEditorMode === 'edit' ? 'Update user' : 'Create user'}</button></div></form></aside></>}</>
    ) : <section className="talent-admin-placeholder"><h1>Talent Administration</h1><p>Welcome to the management dashboard.</p></section>}{schoolDrawerOpen && <><button type="button" className="sport-teacher-drawer-backdrop" aria-label="Close school form" onClick={closeSchoolEditor} /><aside className="sport-teacher-search-drawer sport-teacher-registration-drawer talent-admin-school-drawer" aria-label="School editor"><div className="sport-teacher-search-drawer-header"><h2>{selectedSchool ? 'Edit school' : 'Add school'}</h2><button type="button" onClick={closeSchoolEditor} aria-label="Close school form">&times;</button></div><form onSubmit={saveSchool} className="sport-teacher-profile-form"><div className="sport-teacher-registration-form-grid"><label data-label="Registry number"><input value={schoolForm.registry_number} onChange={(event) => updateField('registry_number', event.target.value)} /></label><label data-label="School name"><input required value={schoolForm.name} onChange={(event) => updateField('name', event.target.value)} /></label></div><div className="sport-teacher-registration-form-grid"><label data-label="Ownership type"><select value={schoolForm.ownership_type} onChange={(event) => updateField('ownership_type', event.target.value)}>{['Government', 'Private', 'Religious'].map((option) => <option key={option} value={option}>{option}</option>)}</select></label><label data-label="Phone"><input type="tel" value={schoolForm.phone || ''} onChange={(event) => updateField('phone', event.target.value)} /></label></div><div className="sport-teacher-registration-form-grid"><label data-label="Country"><select required value={schoolForm.country || ''} onChange={(event) => updateField('country', event.target.value)}><option value="">Select country</option>{countries.map((country) => <option key={country.id} value={country.id}>{country.name}</option>)}</select></label><label data-label="Zone"><select value={schoolForm.zone || ''} disabled={!schoolForm.country} onChange={(event) => updateField('zone', event.target.value)}><option value="">Select zone</option>{filteredZones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}</select></label></div><div className="sport-teacher-registration-form-grid"><label data-label="Region"><select value={schoolForm.region || ''} disabled={!schoolForm.zone} onChange={(event) => updateField('region', event.target.value)}><option value="">Select region</option>{filteredRegions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}</select></label><label data-label="District"><select value={schoolForm.district || ''} disabled={!schoolForm.region} onChange={(event) => updateField('district', event.target.value)}><option value="">Select district</option>{filteredDistricts.map((district) => <option key={district.id} value={district.id}>{district.name}</option>)}</select></label></div><div className="sport-teacher-registration-form-grid"><label data-label="Ward"><select value={schoolForm.ward || ''} disabled={!schoolForm.district} onChange={(event) => updateField('ward', event.target.value)}><option value="">Select ward</option>{filteredWards.map((ward) => <option key={ward.id} value={ward.id}>{ward.name}</option>)}</select></label><label data-label="Physical address"><input value={schoolForm.physical_address || ''} onChange={(event) => updateField('physical_address', event.target.value)} /></label></div><div className="sport-teacher-registration-form-grid"><label data-label="Email"><input type="email" value={schoolForm.email || ''} onChange={(event) => updateField('email', event.target.value)} /></label></div><div className="sport-teacher-registration-form-grid"><button type="button" className="sport-teacher-secondary-button" onClick={closeSchoolEditor}>Cancel</button><button type="submit" className="district-primary-button" disabled={schoolSubmitting}>{schoolSubmitting ? 'Saving...' : selectedSchool ? 'Update school' : 'Create school'}</button>{selectedSchool && <button type="button" className="sport-teacher-danger-button" onClick={deleteSchool}>Delete</button>}</div></form></aside></>}</main>
  </div>;
}
