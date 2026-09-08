import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import * as apiService from '../services/apiService';
import logo from '../assets/Logo1.png';
import './SportTeacherPage.css';
import '../styles/talentadmin.css';
import DashboardSkeleton from '../components/DashboardSkeleton';

const NAV_ITEMS = [
  ['home', 'Home', 'This is home.'], ['schools', 'Schools', 'Here you will manage schools.'], ['sport-teachers', 'Sport teachers', 'Here you will manage sport teachers.'], ['head-teachers', 'Head teachers', 'Here you will manage head teachers.'], ['students', 'Students', 'Here you will manage students.'], ['parents', 'Parents', 'Here you will manage parents.'], ['ward-managers', 'Ward managers', 'Here you will manage ward managers.'], ['district-managers', 'District managers', 'Here you will manage district managers.'], ['region-managers', 'Region managers', 'Here you will manage region managers.'], ['zone-managers', 'Zone managers', 'Here you will manage zone managers.'], ['admins', 'Admins', 'Here you will manage admins.'],
];

const emptySchool = { registry_number: '', name: '', ownership_type: 'Government', country: '', zone: '', region: '', district: '', ward: '', phone: '', physical_address: '', email: '' };

export default function TalentAdminPage() {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [schools, setSchools] = useState([]);
  const [users, setUsers] = useState([]);
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
  const activeItem = NAV_ITEMS.find(([key]) => key === activeTab) || NAV_ITEMS[0];

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [schoolsRes, usersRes, countriesRes, zonesRes, regionsRes, districtsRes, wardsRes, ownershipRes] = await Promise.all([
          apiService.getAllSchools(), apiService.getUsers(), apiService.getAllCountries(), apiService.getAllZones(), apiService.getAllRegions(), apiService.getAllDistricts(), apiService.getAllWards(), apiService.getSchoolOwnershipTypes(),
        ]);
        setSchools(schoolsRes.data.results || []); setUsers(usersRes.data.results || []); setCountries(countriesRes.data.results || []); setZones(zonesRes.data.results || []); setRegions(regionsRes.data.results || []); setDistricts(districtsRes.data.results || []); setWards(wardsRes.data.results || []); setOwnershipTypes(ownershipRes.data.results || []);
      } catch (requestError) { setError(requestError.response?.data?.detail || 'Failed to load school administration data'); } finally { setLoading(false); }
    };
    loadData();
  }, []);

  const headTeachers = useMemo(() => users.filter((user) => user.role === 'head_teacher'), [users]);
  const getName = (items, id) => items.find((item) => Number(item.id) === Number(id))?.name || '—';
  const getHeadTeacher = (schoolId) => headTeachers.find((user) => Number(user.school) === Number(schoolId));
  const getAddress = (school) => [getName(regions, school.region), getName(districts, school.district), getName(wards, school.ward)].filter((part) => part !== '—').join(' • ') || '—';

  const openSchoolEditor = (school = null) => { setSelectedSchool(school); setSchoolForm(school ? { ...emptySchool, ...school } : emptySchool); setSchoolDrawerOpen(true); };
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
    const schoolFields = Object.fromEntries(Object.entries(schoolForm).filter(([field]) => field !== 'student_count'));
    const payload = { ...schoolFields, country: Number(schoolForm.country), zone: Number(schoolForm.zone), region: Number(schoolForm.region), district: Number(schoolForm.district), ward: Number(schoolForm.ward) };
    try {
      const response = selectedSchool ? await apiService.updateSchool(selectedSchool.id, payload) : await apiService.createSchool(payload);
      setSchools((current) => selectedSchool ? current.map((school) => school.id === selectedSchool.id ? response.data : school) : [...current, response.data]); closeSchoolEditor();
    } catch (requestError) { const details = requestError.response?.data; setError(details?.detail || details?.non_field_errors?.[0] || 'Failed to save school'); } finally { setSchoolSubmitting(false); }
  };

  const deleteSchool = async () => {
    if (!selectedSchool || !window.confirm(`Delete ${selectedSchool.name}?`)) return;
    setSchoolSubmitting(true);
    try { await apiService.deleteSchool(selectedSchool.id); setSchools((current) => current.filter((school) => school.id !== selectedSchool.id)); closeSchoolEditor(); } catch (requestError) { setError(requestError.response?.data?.detail || 'Failed to delete school'); } finally { setSchoolSubmitting(false); }
  };

  const locationField = (label, field, options, disabled = false) => <label>{label}<select required value={schoolForm[field]} disabled={disabled} onChange={(event) => updateField(field, event.target.value)}><option value="">Select {label.toLowerCase()}</option>{options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>;
  const floatingInput = (label, field, props = {}) => <label className="talent-admin-floating-field"><input placeholder=" " value={schoolForm[field] || ''} onChange={(event) => updateField(field, event.target.value)} {...props} /><span>{label}</span></label>;
  const floatingTextarea = (label, field, props = {}) => <label className="talent-admin-floating-field"><textarea placeholder=" " value={schoolForm[field] || ''} onChange={(event) => updateField(field, event.target.value)} {...props} /><span>{label}</span></label>;

  return <div className="sport-teacher-page talent-admin-page">
    <header className="sport-teacher-app-bar"><div className="sport-teacher-brand"><img src={logo} alt="Talanta logo" /><span>Talanta Management System</span></div><button type="button" className="sport-teacher-navigation-toggle" onClick={() => setNavigationOpen((open) => !open)} aria-label="Open navigation menu" aria-expanded={navigationOpen}><span /><span /><span /></button></header>
    <aside className={`sport-teacher-navigation ${navigationOpen ? 'is-open' : ''}`}><div className="sport-teacher-navigation-heading">Talent Administration</div>{NAV_ITEMS.map(([key, label]) => <button type="button" key={key} className={activeTab === key ? 'active' : ''} onClick={() => { setActiveTab(key); setNavigationOpen(false); }}>{label}</button>)}<button type="button" className="sport-teacher-logout-button" onClick={logout}>Logout</button></aside>
    <main className="sport-teacher-prototype-content talent-admin-content">{error && <div className="talent-admin-alert">{error}<button type="button" onClick={() => setError(null)} aria-label="Dismiss error">&times;</button></div>}{loading ? <DashboardSkeleton label="Loading talent administration" /> : activeTab === 'schools' ? <section className="talent-admin-table-card"><div className="talent-admin-table-header"><div><h1>Schools</h1></div><button type="button" className="district-primary-button talent-admin-add-school-button" onClick={() => openSchoolEditor()}>Add school</button></div><div className="talent-admin-table-wrap"><table className="talent-admin-table"><thead><tr><th>School Reg. No</th><th>School Name</th><th>Address</th><th>Region</th><th>District</th><th>Ward</th><th>Phone</th><th>Head teacher</th></tr></thead><tbody>{schools.map((school) => { const headTeacher = getHeadTeacher(school.id); return <tr key={school.id}><td><button type="button" className="talent-admin-link-button" onClick={() => openSchoolEditor(school)}>{school.registry_number}</button></td><td>{school.name}</td><td>{school.physical_address || getAddress(school)}</td><td>{getName(regions, school.region)}</td><td>{getName(districts, school.district)}</td><td>{getName(wards, school.ward)}</td><td>{school.phone || '—'}</td><td>{headTeacher ? `${headTeacher.first_name} ${headTeacher.last_name}` : '—'}</td></tr>; })}{!schools.length && <tr><td colSpan="8" className="talent-admin-empty">No schools found.</td></tr>}</tbody></table></div></section> : <section className="talent-admin-placeholder"><p className="sport-teacher-eyebrow">Talent Administration</p><h1>{activeItem[1]}</h1><p>{activeItem[2]}</p></section>}</main>
    {schoolDrawerOpen && <><button type="button" className="sport-teacher-drawer-backdrop" aria-label="Close school form" onClick={closeSchoolEditor} /><aside className="sport-teacher-search-drawer sport-teacher-registration-drawer talent-admin-school-drawer" aria-label="School editor"><div className="sport-teacher-search-drawer-header"><h2>{selectedSchool ? 'Edit school' : 'Add school'}</h2><button type="button" onClick={closeSchoolEditor} aria-label="Close school form">&times;</button></div><form onSubmit={saveSchool} className="sport-teacher-profile-form">{floatingInput('School Reg. No *', 'registry_number', { required: true, maxLength: '50' })}{floatingInput('School name *', 'name', { required: true, maxLength: '150' })}<label>Ownership type<select required value={schoolForm.ownership_type} onChange={(event) => updateField('ownership_type', event.target.value)}>{ownershipTypes.map((type) => <option key={type.id} value={type.name}>{type.name}</option>)}</select></label>{locationField('Country', 'country', countries)}{locationField('Zone', 'zone', filteredZones, !schoolForm.country)}{locationField('Region', 'region', filteredRegions, !schoolForm.zone)}{locationField('District', 'district', filteredDistricts, !schoolForm.region)}{locationField('Ward', 'ward', filteredWards, !schoolForm.district)}{floatingTextarea('Physical address', 'physical_address', { rows: 3, maxLength: '255' })}{floatingInput('Phone', 'phone', { maxLength: '20' })}<div className="talent-admin-drawer-actions">{selectedSchool && <button type="button" className="talent-admin-delete-button" onClick={deleteSchool} disabled={schoolSubmitting}>Delete</button>}<button type="submit" className="district-primary-button" disabled={schoolSubmitting}>{schoolSubmitting ? 'Saving...' : 'Save school'}</button></div></form></aside></>}
  </div>;
}
