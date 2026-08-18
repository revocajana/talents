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
  const [editingTalentId, setEditingTalentId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
  });

  const [talentsData, setTalentsData] = useState([]);
  const [competitionsData, setCompetitionsData] = useState([]);
  const [usersData, setUsersData] = useState([]);
  const [statsData, setStatsData] = useState([
    { label: 'Total Schools', value: '0' },
    { label: 'Total Students', value: '0' },
    { label: 'Active Competitions', value: '0' },
    { label: 'Registered Talents', value: '0' },
  ]);

  const displayedTalents = talentsData.slice(0, 3);

  // Fetch all dashboard data on mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [talentsRes, competitionsRes, usersRes, schoolsRes, studentsRes] = await Promise.all([
          apiService.getTalents(),
          apiService.getCompetitions(),
          apiService.getUsers(),
          apiService.getSchools(),
          apiService.getStudents(),
        ]);

        setTalentsData(talentsRes.data.results || []);
        setCompetitionsData(competitionsRes.data.results || []);
        setUsersData(usersRes.data.results || []);

        const stats = [
          { label: 'Total Schools', value: (schoolsRes.data?.count || 0).toString() },
          { label: 'Total Students', value: (studentsRes.data?.count || 0).toString() },
          { label: 'Active Competitions', value: (competitionsRes.data?.count || 0).toString() },
          { label: 'Registered Talents', value: (talentsRes.data?.count || 0).toString() },
        ];
        setStatsData(stats);
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
          {/* Summary Statistics Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>Overview</h2>
              <p>Dashboard statistics</p>
            </div>
            <div className="stats-overview">
              {statsData.map((stat, idx) => (
                <div key={idx} className="stat-card">
                  <p className="stat-label">{stat.label}</p>
                  <h3 className="stat-value">{stat.value}</h3>
                </div>
              ))}
            </div>
          </section>

          {/* Registered Talents Card */}
          <section className="admin-section" id="talents-list">
            <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <h2>Registered Talents</h2>
                <p>{talentsData.length} talents registered</p>
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
            </div>
          </section>

          {/* Competitions Card */}
          <section className="admin-section" id="competitions">
            <div className="section-header">
              <h2>Competitions</h2>
              <p>Active competitions</p>
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
                  {competitionsData.length > 0 ? (
                    competitionsData.map((comp) => (
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
          </section>

          {/* Users & Staff Card */}
          <section className="admin-section" id="users">
            <div className="section-header">
              <h2>Users & Staff</h2>
              <p>{usersData.length} users</p>
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
                  {usersData.length > 0 ? (
                    usersData.map((user) => (
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
    </div>
  );
}

