import { useState, useEffect } from 'react';
import { Header } from '../components/shared';
import * as apiService from '../services/apiService';
import '../styles/dashboard.css';
import '../styles/talentadmin.css';

export default function TalentAdminPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showAddTalentModal, setShowAddTalentModal] = useState(false);
  const [showTalentListModal, setShowTalentListModal] = useState(false);
  const [showCompetitionListModal, setShowCompetitionListModal] = useState(false);
  const [showUserListModal, setShowUserListModal] = useState(false);
  const [showDemographicModal, setShowDemographicModal] = useState(false);
  const [showDemographicForm, setShowDemographicForm] = useState(false);
  const [demographicType, setDemographicType] = useState('zone');
  const [editingDemographicId, setEditingDemographicId] = useState(null);
  const [demographicForm, setDemographicForm] = useState({});
  const [editingTalentId, setEditingTalentId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
  });

  const [talentsData, setTalentsData] = useState([]);
  const [competitionsData, setCompetitionsData] = useState([]);
  const [usersData, setUsersData] = useState([]);
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

  const demographicConfigs = {
    countries: { label: 'Countries', singular: 'Country', collection: 'countries' },
    zones: { label: 'Zones', singular: 'Zone', collection: 'zones' },
    regions: { label: 'Regions', singular: 'Region', collection: 'regions' },
    districts: { label: 'Districts', singular: 'District', collection: 'districts' },
    wards: { label: 'Wards', singular: 'Ward', collection: 'wards' },
    schools: { label: 'Schools', singular: 'School', collection: 'schools' },
  };

  // Fetch all dashboard data on mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [talentsRes, competitionsRes, usersRes, countriesRes, zonesRes, regionsRes, districtsRes, wardsRes, schoolsRes] = await Promise.all([
          apiService.getTalents(),
          apiService.getCompetitions(),
          apiService.getUsers(),
          apiService.getCountries(),
          apiService.getZones(),
          apiService.getRegions(),
          apiService.getDistricts(),
          apiService.getWards(),
          apiService.getSchools(),
        ]);

        setTalentsData(talentsRes.data.results || []);
        setCompetitionsData(competitionsRes.data.results || []);
        setUsersData(usersRes.data.results || []);
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
      { name: 'ownership_type', label: 'Ownership type', type: 'text' },
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
      category: (talent.category || '').toLowerCase(),
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
      category: formData.category.toLowerCase(),
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

  return (
    <div className="page-container">
      <Header title="Talent Management" />
      {error && <div className="error-message" style={{ padding: '1rem', background: '#fee', color: '#c00', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading dashboard...</div>
      ) : (
      <main className="admin-content">
        <div className="cards-container">
          {/* Demographic Management Card */}
          <section className="admin-section demographic-section">
            <div className="section-header">
              <h2>Demographic Management</h2>
              <p>Manage the geographic hierarchy</p>
            </div>
            <div className="stats-overview">
              {Object.entries(demographicConfigs).map(([type, config]) => (
                <div
                  key={type}
                  className="stat-card demographic-card"
                  onClick={() => openDemographicModal(type)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && openDemographicModal(type)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                    <p className="stat-label">{config.label}</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openAddDemographicForm(type);
                      }}
                      aria-label={`Add ${config.singular}`}
                      style={{
                        border: 'none',
                        background: '#0E1DB6',
                        color: '#fff',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        fontSize: '1.25rem',
                        lineHeight: '1',
                        cursor: 'pointer',
                      }}
                    >
                      +
                    </button>
                  </div>
                  <h3 className="stat-value">{config.label} ({demographicData[type].length})</h3>
                </div>
              ))}
            </div>
          </section>

          {/* Registered Talents Card */}
          <section className="admin-section" id="talents-list">
            <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <h2>Registered Talents ({talentsData.length})</h2>
              </div>
              <button
                type="button"
                onClick={openAddTalentModal}
                style={{
                  border: 'none',
                  background: '#0E1DB6',
                  color: '#fff',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  fontSize: '1.8rem',
                  lineHeight: '1',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 18px rgba(14, 29, 182, 0.25)',
                }}
                aria-label="Add talent"
              >
                +
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
                  {displayedTalents.length > 0 ? (
                    displayedTalents.map((talent) => (
                      <tr key={talent.id}>
                        <td>{talent.name || 'N/A'}</td>
                        <td>{talent.category || 'N/A'}</td>
                        <td>{talent.description || 'N/A'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button className="btn-action" onClick={() => openEditTalentModal(talent)}>
                              Edit
                            </button>
                            <button
                              className="btn-action"
                              onClick={() => handleDeleteTalent(talent.id)}
                              style={{ background: '#fee2e2', color: '#991b1b' }}
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
            {talentsData.length > 3 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowTalentListModal(true)}
                  className="btn-action"
                  style={{ background: '#eef2ff', color: '#1e3a8a', fontSize: '0.8rem' }}
                >
                  View more
                </button>
              </div>
            )}
          </section>

          {/* Competitions Card */}
          <section className="admin-section" id="competitions">
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
                  style={{ background: '#eef2ff', color: '#1e3a8a', fontSize: '0.8rem' }}
                >
                  View more
                </button>
              </div>
            )}
          </section>

          {/* Users & Staff Card */}
          <section className="admin-section" id="users">
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
                        <td>{user.first_name} {user.last_name}</td>
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
                  style={{ background: '#eef2ff', color: '#1e3a8a', fontSize: '0.8rem' }}
                >
                  View more
                </button>
              </div>
            )}
          </section>

          {/* System Reports Card */}
          <section className="admin-section" id="reports">
            <div className="section-header">
              <h2>System Reports</h2>
              <p>Analytics and insights</p>
            </div>
            <div className="reports-grid">
              <div className="report-card">
                <h4>Users by Role</h4>
                <ul className="report-list">
                  <li><span>Region Managers:</span> 5</li>
                  <li><span>Zone Managers:</span> 8</li>
                  <li><span>District Managers:</span> 24</li>
                  <li><span>Head Teachers:</span> 145</li>
                  <li><span>Sport Teachers:</span> 289</li>
                </ul>
              </div>
              
              <div className="report-card">
                <h4>Geographic Coverage</h4>
                <ul className="report-list">
                  <li><span>Zones:</span> 5</li>
                  <li><span>Regions:</span> 18</li>
                  <li><span>Districts:</span> 89</li>
                  <li><span>Wards:</span> 320</li>
                  <li><span>Schools:</span> 145</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </main>
      )}

      {showDemographicModal && (
        <div
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
              <button
                type="button"
                onClick={closeDemographicModal}
                className="btn-action"
                aria-label="Close demographic modal"
              >
                ×
              </button>
            </div>

            {!showDemographicForm ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                  <button type="button" className="btn-primary" onClick={openAddDemographicForm}>
                    + Add {demographicConfigs[demographicType].singular}
                  </button>
                </div>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        {demographicType === 'schools' ? <th>Registry number</th> : <th>Parent</th>}
                        {demographicType === 'schools' && <th>Ownership</th>}
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {demographicData[demographicType].length > 0 ? demographicData[demographicType].map((item) => (
                        <tr key={item.id}>
                          <td>{item.name || 'N/A'}</td>
                          <td>{demographicType === 'schools' ? item.registry_number || 'N/A' : getParentName(demographicType, item)}</td>
                          {demographicType === 'schools' && <td>{item.ownership_type || 'N/A'}</td>}
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <button type="button" className="btn-action" onClick={() => openDemographicModal(demographicType, item)}>
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn-action"
                                onClick={() => handleDeleteDemographic(demographicType, item.id)}
                                style={{ background: '#fee2e2', color: '#991b1b' }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={demographicType === 'schools' ? '4' : '3'}>No {demographicConfigs[demographicType].label.toLowerCase()} found</td></tr>
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
        <div
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
                style={{
                  border: 'none',
                  background: '#f3f4f6',
                  color: '#111827',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                }}
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
                <option value="music">Music</option>
                <option value="sports">Sports</option>
                <option value="technology">Technology</option>
                <option value="arts">Arts</option>
                <option value="academics">Academics</option>
                <option value="other">Other</option>
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
        <div
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
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '90vw',
              maxWidth: '90vw',
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
                style={{
                  border: 'none',
                  background: '#f3f4f6',
                  color: '#111827',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                }}
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
                        <td>{talent.category || 'N/A'}</td>
                        <td>{talent.description || 'N/A'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button
                              className="btn-action"
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
                              style={{ background: '#fee2e2', color: '#991b1b' }}
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
        <div
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
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '90vw',
              maxWidth: '90vw',
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
                className="btn-action"
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
        <div
          onClick={() => setShowUserListModal(false)}
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
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '90vw',
              maxWidth: '90vw',
              maxHeight: '80vh',
              overflowY: 'auto',
              background: '#fff',
              borderRadius: '16px',
              boxShadow: '0 25px 50px rgba(15, 23, 42, 0.25)',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#111827' }}>All Users &amp; Staff ({usersData.length})</h3>
              <button
                type="button"
                onClick={() => setShowUserListModal(false)}
                className="btn-action"
                aria-label="Close users modal"
              >
                ×
              </button>
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
                  {usersData.map((user) => (
                    <tr key={user.id}>
                      <td>{user.first_name} {user.last_name}</td>
                      <td>{user.role || 'N/A'}</td>
                      <td>{user.email || 'N/A'}</td>
                      <td><button className="btn-action">Manage</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

